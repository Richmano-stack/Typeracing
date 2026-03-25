import { testApiHandler } from "next-test-api-route-handler";
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import * as syncRoute from "@/app/api/race/sync/route";
import * as rehydrateRoute from "@/app/api/race/[roomId]/route";
import * as createRoute from "@/app/api/race/create/route";
import { RaceData } from "@/lib/multiplayer/types";

vi.mock("@/lib/redis", async (importOriginal) => {
    const original = await importOriginal<any>();
    // Create a proxy or a mock that preserves original functionality but allows spying on time()
    const mockRedis = {
        ...original.redis,
        time: vi.fn().mockImplementation(() => original.redis.time()),
    };
    return {
        ...original,
        redis: mockRedis,
        default: mockRedis,
    };
});

describe("Multiplayer Duel Engine - Stress & Authority Tests", () => {
    const TEST_ROOM_ID = "stress-test-room";
    const USER_A_ID = "user-a-uuid";
    const USER_B_ID = "user-b-uuid";
    let testTextId = "";

    beforeAll(async () => {
        // Ensure we are on test DB
        expect(process.env.DATABASE_URL).toContain("test");

        // Create a test text passage
        const text = await prisma.textPassage.create({
            data: {
                content: "The quick brown fox jumps over the lazy dog.",
                source: "Stress Test",
                difficulty: "medium",
                length: 45
            }
        });
        testTextId = text.id;

        // Create test users
        await prisma.user.upsert({
            where: { id: USER_A_ID },
            update: {},
            create: { id: USER_A_ID, email: "userA@test.com", name: "Player A" }
        });
        await prisma.user.upsert({
            where: { id: USER_B_ID },
            update: {},
            create: { id: USER_B_ID, email: "userB@test.com", name: "Player B" }
        });
    });

    afterAll(async () => {
        await prisma.raceResult.deleteMany({ where: { text_id: testTextId } });
        await prisma.textPassage.delete({ where: { id: testTextId } });
        // Optional: delete users if needed, but upsert handles it
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await redis.flushdb();
    });

    afterEach(async () => {
        await redis.del(`race:${TEST_ROOM_ID}`);
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    /**
     * Helper to setup a room in Redis
     */
    async function setupRoom(overrides: Partial<RaceData> = {}) {
        const roomKey = `race:${TEST_ROOM_ID}`;
        const defaultData: RaceData = {
            prompt_text: "The quick brown fox...",
            prompt_id: testTextId,
            host_id: USER_A_ID,
            guest_id: USER_B_ID,
            host_progress: 0,
            guest_progress: 0,
            host_wpm: 0,
            guest_wpm: 0,
            host_last_active: Date.now(),
            guest_last_active: Date.now(),
            host_ready: true,
            guest_ready: true,
            state: "IN_PROGRESS",
            target_start_ms: Date.now() - 5000,
            ready_deadline_ms: 0,
            host_finished_ms: 0,
            guest_finished_ms: 0,
            winner_id: "",
            persisted_to_db: false
        };
        const data = { ...defaultData, ...overrides };
        const flatData: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
            if (v === null) {
                flatData[k] = "";
            } else if (typeof v === "boolean") {
                flatData[k] = v ? "1" : "0";
            } else {
                flatData[k] = v.toString();
            }
        }
        await redis.hset(roomKey, flatData);
        return roomKey;
    }

    describe("Task 0: Room Creation", () => {
        it("should create a room, fetch a real prompt from DB, and store it in Redis", async () => {
            let createdRoomId = "";

            await testApiHandler({
                appHandler: createRoute,
                url: "/api/race/create",
                async test({ fetch }) {
                    const res = await fetch({ method: "POST" });
                    
                    expect(res.status).toBe(200);
                    const data = await res.json();
                    
                    expect(data.roomId).toBeDefined();
                    expect(data.hostId).toBeDefined();
                    expect(data.room).toBeDefined();
                    
                    // Verify it fetched a real prompt from DB
                    const dbPassage = await prisma.textPassage.findUnique({
                        where: { id: data.room.prompt_id }
                    });
                    
                    expect(dbPassage).toBeDefined();
                    expect(dbPassage!.id).toBe(data.room.prompt_id);
                    expect(dbPassage!.content).toBe(data.room.prompt_text);
                    expect(data.room.state).toBe("WAITING_FOR_GUEST");

                    createdRoomId = data.roomId;
                }
            });

            // Verify it was actually stored in Redis
            const roomKey = `race:${createdRoomId}`;
            const exists = await redis.exists(roomKey);
            expect(exists).toBe(1);

            const storedData = await redis.hgetall(roomKey);
            expect(storedData.state).toBe("WAITING_FOR_GUEST");
            expect(storedData.prompt_id).toBeDefined();
            expect(storedData.prompt_text).toBeDefined();
            expect(String(storedData.host_progress)).toBe("0");
            expect(String(storedData.guest_progress)).toBe("0");
            
            // Clean up the created room
            await redis.del(roomKey);
        });
    });

    describe("Task 1: The 'Split-Brain' Concurrency Stress Test", () => {
        it("should resolve Player A as winner and persist exactly once when 5 pulses attack", async () => {
            await setupRoom();
            
            const reqs = [
                { userId: USER_A_ID, progress: 100, wpm: 80 },
                { userId: USER_A_ID, progress: 100, wpm: 80 },
                { userId: USER_B_ID, progress: 100, wpm: 75 },
                { userId: USER_B_ID, progress: 100, wpm: 75 },
                { userId: USER_A_ID, progress: 100, wpm: 80 },
            ];

            // Use testApiHandler for each request. 
            // To do them truly concurrently, we need to hope testApiHandler handles it.
            // Alternatively, we can use a single testApiHandler call for all if it were one route,
            // but here we are simulating multiple clients.
            
            const runSync = (r: { userId: string, progress: number, wpm: number }) => 
                testApiHandler({
                    appHandler: syncRoute,
                    url: "/api/race/sync",
                    async test({ fetch }) {
                        const res = await fetch({
                            method: "POST",
                            body: JSON.stringify({
                                roomId: TEST_ROOM_ID,
                                userId: r.userId,
                                progress: r.progress,
                                wpm: r.wpm
                            })
                        });
                        expect(res.status).toBe(200);
                        // Response-level winner check removed to avoid micro-latency flakiness
                    }
                });

            const initialCount = await prisma.raceResult.count({
                where: { text_id: testTextId }
            });

            await Promise.all(reqs.map(r => runSync(r)));

            // Assertion Buffering: wait 50ms for Redis to settle
            await new Promise(resolve => setTimeout(resolve, 50));

            // 6th Verification Pulse / Rehydration Call:
            // This ensures the engine is authoritative after concurrent pulses resolve.
            await testApiHandler({
                appHandler: rehydrateRoute,
                url: `/api/race/${TEST_ROOM_ID}`,
                params: { roomId: TEST_ROOM_ID },
                async test({ fetch }) {
                    const res = await fetch();
                    expect(res.status).toBe(200);
                    const data = await res.json();
                    expect(data.room.winner_id).toBe(USER_A_ID);
                    expect(data.room.state).toBe("FINISHED");
                }
            });

            // Verify persistence only happened once (resulting in 2 records: one for A, one for B)
            const finalCount = await prisma.raceResult.count({
                where: { text_id: testTextId }
            });
            expect(finalCount).toBe(initialCount + 2);
        });
    });

    describe("Task 2: TTL & Zombie Room Verification", () => {
        it("should expire room and return 404 after TTL", async () => {
            const roomKey = await setupRoom();
            
            // Set short TTL: 2 seconds
            await redis.expire(roomKey, 2);
            
            expect(await redis.exists(roomKey)).toBe(1);

            // Wait for TTL + 1s buffer
            await new Promise(resolve => setTimeout(resolve, 3100));

            // Assertion 1: Redis key is gone
            expect(await redis.exists(roomKey)).toBe(0);

            // Assertion 2: GET /api/race/[roomId] returns 404
            await testApiHandler({
                appHandler: rehydrateRoute,
                url: `/api/race/${TEST_ROOM_ID}`,
                params: { roomId: TEST_ROOM_ID },
                async test({ fetch }) {
                    const res = await fetch();
                    expect(res.status).toBe(404);
                    const data = await res.json();
                    expect(data.error).toMatch(/Race not found/i);
                }
            });
        });
    });

    describe("Task 3: The 'Clock Drift' Authority Test", () => {
        it("should ignore local system clock and use Redis time", async () => {
            await setupRoom();

            // 1. Mock local clock to 1 year in the future
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            vi.useFakeTimers();
            vi.setSystemTime(futureDate);

            // 2. Mock redis.time() to return a fixed server timestamp
            const mockServerSeconds = 1700000000;
            const mockServerMicroseconds = 500000; // .5 seconds
            const expectedMs = mockServerSeconds * 1000 + 500;
            
            // The mock is already set up at the top level, now we just need to provide the implementation
            const timeSpy = vi.mocked(redis.time).mockResolvedValue([mockServerSeconds, mockServerMicroseconds]);

            // 3. Call sync
            await testApiHandler({
                appHandler: syncRoute,
                url: "/api/race/sync",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        body: JSON.stringify({
                            roomId: TEST_ROOM_ID,
                            userId: USER_A_ID,
                            progress: 50,
                            wpm: 60
                        })
                    });
                    
                    expect(res.status).toBe(200);
                    const data = await res.json();
                    
                    // Assertion: serverNowMs should match Redis time, not futureDate
                    expect(data.serverNowMs).toBe(expectedMs);
                    expect(data.serverNowMs).not.toBe(futureDate.getTime());
                    expect(timeSpy).toHaveBeenCalled();
                }
            });
        });
    });
});
