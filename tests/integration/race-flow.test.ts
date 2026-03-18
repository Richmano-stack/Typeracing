import { testApiHandler } from "next-test-api-route-handler";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import * as initiateRoute from "@/api/race/initiate/route";
import * as startRoute from "@/api/race/start/route";
import * as finishRoute from "@/api/race/finish/route";
import * as authRoute from "@/api/auth/[...auth]/route";

describe("Solo Race Lifecycle", () => {
    let testTextId = "";
    const activeRaceIds: string[] = [];
    
    const TEST_EMAIL = `test+raceflow+${Date.now()}@typeracing.test`;
    const TEST_PASSWORD = "TestPassword123!";
    const TEST_NAME = "RaceFlow Tester";
    
    beforeAll(async () => {
        expect(process.env.DATABASE_URL).toContain("test");
        await redis.ping();

        const testText = await prisma.textPassage.create({
            data: {
                content: "This is a test.",
                source: "Integration Test",
                difficulty: "easy",
                length: 15
            }
        });
        testTextId = testText.id;
    });

    afterAll(async () => {
        if (testTextId) {
            await prisma.raceResult.deleteMany({ where: { text_id: testTextId } });
            await prisma.textPassage.deleteMany({ where: { id: testTextId } });
        }

        // Cleanup the test user
        await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

        const testKeys = await redis.keys("race:test-*");
        if (testKeys.length > 0) {
            await redis.del(...testKeys);
        }
        
        for (const raceId of activeRaceIds) {
            await redis.del(`race:${raceId}`);
        }

        await prisma.$disconnect();
    });

    it("should return stats and NOT save to DB for guest users", async () => {
        const initialRaceCount = await prisma.raceResult.count();
        let currentRaceId = "";
        let expectedLength = 0;

        // 1. Initiate Race
        await testApiHandler({
            appHandler: initiateRoute,
            url: "/api/race/initiate",
            async test({ fetch }) {
                const res = await fetch({ method: "POST" });
                expect(res.status).toBe(200);
                const data = await res.json();
                currentRaceId = data.raceId;
                expectedLength = data.content.length;
                activeRaceIds.push(currentRaceId);
            }
        });

        const existsAfterInit = await redis.exists(`race:${currentRaceId}`);
        expect(existsAfterInit).toBe(1);

        // 2. Start Race
        await testApiHandler({
            appHandler: startRoute,
            url: "/api/race/start",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ raceId: currentRaceId })
                });
                expect(res.status).toBe(200);
            }
        });

        // 3. Finish Race (Valid Logic, Guest)
        await new Promise(resolve => setTimeout(resolve, 600));

        await testApiHandler({
            appHandler: finishRoute,
            url: "/api/race/finish",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        raceId: currentRaceId,
                        totalCharactersInserted: expectedLength
                    })
                });
                
                expect(res.status).toBe(200);
                const data = await res.json();
                
                expect(typeof data.wpm).toBe("number");
                expect(typeof data.accuracy).toBe("number");
                // Expected `saved` behavior
                expect(data.saved).toBe(false);
            }
        });

        // Database Check: Verify NO new row was created
        const finalRaceCount = await prisma.raceResult.count();
        expect(finalRaceCount).toBe(initialRaceCount);

        // Redis Check: Verify deletion happens even for guests
        const existsAfterFinish = await redis.exists(`race:${currentRaceId}`);
        expect(existsAfterFinish).toBe(0);
    });

    it("should return stats and save to DB for authenticated users", async () => {
        // --- PREPARATION: Crate logged in session ---
        let sessionCookie = "";

        await testApiHandler({
            appHandler: authRoute,
            url: "/api/auth/sign-up/email",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: TEST_EMAIL,
                        password: TEST_PASSWORD,
                        name: TEST_NAME,
                    }),
                });
                expect(res.status).toBe(200);
                
                const raw = res.headers.get("set-cookie") ?? "";
                sessionCookie = raw
                    .split(",")
                    .map((c) => c.split(";")[0].trim())
                    .join("; ");
            },
        });
        expect(sessionCookie).not.toBe("");

        // Find the created user
        const authUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL }});
        expect(authUser).not.toBeNull();

        // --- EXECUTING RACE LIFECYCLE ---
        const initialRaceCount = await prisma.raceResult.count();
        let currentRaceId = "";
        let expectedLength = 0;

        await testApiHandler({
            appHandler: initiateRoute,
            url: "/api/race/initiate",
            async test({ fetch }) {
                const res = await fetch({ method: "POST" });
                const data = await res.json();
                currentRaceId = data.raceId;
                expectedLength = data.content.length;
                activeRaceIds.push(currentRaceId);
            }
        });

        await testApiHandler({
            appHandler: startRoute,
            url: "/api/race/start",
            async test({ fetch }) {
                await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ raceId: currentRaceId })
                });
            }
        });

        await new Promise(resolve => setTimeout(resolve, 600));

        let finalWpm = 0;

        await testApiHandler({
            appHandler: finishRoute,
            url: "/api/race/finish",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    // Crucial: Injecting the cookie header!
                    headers: { 
                        "Content-Type": "application/json",
                        "Cookie": sessionCookie 
                    },
                    body: JSON.stringify({
                        raceId: currentRaceId,
                        totalCharactersInserted: expectedLength
                    })
                });
                
                expect(res.status).toBe(200);
                const data = await res.json();
                expect(data.saved).toBe(true); // Verification
                
                finalWpm = data.wpm;
            }
        });

        // Database Check: Verify table has new record attached to User
        const finalRaceCount = await prisma.raceResult.count();
        expect(finalRaceCount).toBe(initialRaceCount + 1);

        const latestResult = await prisma.raceResult.findFirst({
            orderBy: { completedAt: "desc" }
        });
        
        expect(latestResult).toBeDefined();
        expect(latestResult?.userId).toBe(authUser!.id);
        expect(latestResult?.wpm).toBeCloseTo(finalWpm, 2); 

        // Redis cleanup
        const existsAfterFinish = await redis.exists(`race:${currentRaceId}`);
        expect(existsAfterFinish).toBe(0);
    });
});
