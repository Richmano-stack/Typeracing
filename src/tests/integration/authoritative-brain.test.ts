import { testApiHandler } from "next-test-api-route-handler";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import * as syncRoute from "@/app/api/race/(multiplayer)/sync/route";
import * as saveRoute from "@/app/api/race/(multiplayer)/save/route";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";

describe("Authoritative Brain (Sync Service)", () => {
    const ROOM_ID = "brain-test-room";
    const HOST_ID = "550e8400-e29b-41d4-a716-446655440000";
    const GUEST_ID = "550e8400-e29b-41d4-a716-446655440001";
    let testPromptId = "";

    beforeAll(async () => {
        const text = await prisma.textPassage.create({
            data: {
                content: "Authoritative brain test content.",
                source: "Test",
                difficulty: "easy",
                length: 30
            }
        });
        testPromptId = text.id;
    });

    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        if (testPromptId) {
            await prisma.raceResult.deleteMany({ where: { text_id: testPromptId } });
            await prisma.textPassage.deleteMany({ where: { id: testPromptId } });
        }
        await prisma.$disconnect();
    });

    it("should prevent jump-starting (reject progress > 0 during COUNTDOWN)", async () => {
        await RedisRoomService.initialize({
            roomId: ROOM_ID,
            hostId: HOST_ID,
            promptId: testPromptId,
            promptText: "t",
            nowMs: Date.now()
        });

        // Set state to COUNTDOWN with a future start time
        await redis.hset(`race:${ROOM_ID}`, {
            guest_id: GUEST_ID,
            state: "COUNTDOWN",
            target_start_ms: (Date.now() + 5000).toString()
        });

        await testApiHandler({
            appHandler: syncRoute,
            url: "/api/race/sync",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: ROOM_ID, guestId: HOST_ID, progress: 10, wpm: 50 })
                });
                expect(res.status).toBe(400);
                const data = await res.json();
                expect(data.error).toBe("Jump-start prevented");
            }
        });
    });

    it("should transition to IN_PROGRESS automatically after target_start_ms", async () => {
        const pastTime = Date.now() - 1000;
        await RedisRoomService.initialize({ roomId: ROOM_ID, hostId: HOST_ID, promptId: "p", promptText: "t", nowMs: pastTime - 10000 });
        
        await redis.hset(`race:${ROOM_ID}`, {
            guest_id: GUEST_ID,
            state: "COUNTDOWN",
            target_start_ms: pastTime.toString()
        });

        await testApiHandler({
            appHandler: syncRoute,
            url: "/api/race/sync",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: ROOM_ID, guestId: HOST_ID, progress: 5, wpm: 50 })
                });
                expect(res.status).toBe(200);
                const data = await res.json();
                expect(data.state).toBe("IN_PROGRESS");
            }
        });
    });

    it("should detect impossible speed (Anti-Cheat)", async () => {
        const startTime = Date.now() - 100; // Only 100ms elapsed
        await RedisRoomService.initialize({ roomId: ROOM_ID, hostId: HOST_ID, promptId: "p", promptText: "t", nowMs: startTime });
        await redis.hset(`race:${ROOM_ID}`, {
            guest_id: GUEST_ID,
            state: "IN_PROGRESS",
            target_start_ms: startTime.toString()
        });

        await testApiHandler({
            appHandler: syncRoute,
            url: "/api/race/sync",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: ROOM_ID, guestId: HOST_ID, progress: 50, wpm: 50 }) // 50% in 100ms
                });
                expect(res.status).toBe(403);
                expect((await res.json()).error).toContain("Impossible speed");
            }
        });
    });

    it("should resolve the first finisher as the winner", async () => {
        const startTime = Date.now() - 10000;
        await RedisRoomService.initialize({ roomId: ROOM_ID, hostId: HOST_ID, promptId: "p", promptText: "t", nowMs: startTime });
        await redis.hset(`race:${ROOM_ID}`, {
            guest_id: GUEST_ID,
            state: "IN_PROGRESS",
            target_start_ms: startTime.toString()
        });

        // 1. Host finishes
        await testApiHandler({
            appHandler: syncRoute,
            url: "/api/race/sync",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: ROOM_ID, guestId: HOST_ID, progress: 100, wpm: 80 })
                });
                const data = await res.json();
                expect(data.state).toBe("FINISHED");
                expect(data.winnerId).toBe(HOST_ID);
            }
        });

        // 2. Guest finishes later
        await testApiHandler({
            appHandler: syncRoute,
            url: "/api/race/sync",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: ROOM_ID, guestId: GUEST_ID, progress: 100, wpm: 75 })
                });
                const data = await res.json();
                expect(data.state).toBe("FINISHED");
                expect(data.winnerId).toBe(HOST_ID); // Host still winner
            }
        });
    });

    it("should allow persistence only after race is FINISHED", async () => {
        await RedisRoomService.initialize({ roomId: ROOM_ID, hostId: HOST_ID, promptId: "p", promptText: "t", nowMs: Date.now() });
        await redis.hset(`race:${ROOM_ID}`, { guest_id: GUEST_ID, state: "IN_PROGRESS" });

        // 1. Attempt to save while IN_PROGRESS
        await testApiHandler({
            appHandler: saveRoute,
            url: "/api/race/multiplayer/save",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: ROOM_ID, guestId: HOST_ID })
                });
                expect(res.status).toBe(400);
            }
        });

        // 2. Mark as FINISHED manually
        const now = Date.now();
        await redis.hset(`race:${ROOM_ID}`, { 
            state: "FINISHED", 
            winner_id: HOST_ID, 
            prompt_id: testPromptId,
            target_start_ms: (now - 10000).toString(),
            host_finished_ms: now.toString(), 
            guest_finished_ms: (now - 500).toString(),
            host_wpm: "100", 
            guest_wpm: "90" 
        });

        // 3. Attempt to save
        await testApiHandler({
            appHandler: saveRoute,
            url: "/api/race/multiplayer/save",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: ROOM_ID, guestId: HOST_ID })
                });
                if (res.status === 500) {
                    const json = await res.json();
                    throw new Error(`API_500_ERROR: ${JSON.stringify(json)}`);
                }
                expect(res.status).toBe(200);
                expect((await res.json()).status).toBe("SAVED");
            }
        });
    });
});
