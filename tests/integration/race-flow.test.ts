import { testApiHandler } from "next-test-api-route-handler";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import * as initiateRoute from "@/api/race/initiate/route";
import * as startRoute from "@/api/race/start/route";
import * as finishRoute from "@/api/race/finish/route";

describe("Solo Race Lifecycle", () => {
    let currentRaceId = "";
    let expectedLength = 0;
    let testTextId = "";
    
    beforeAll(async () => {
        // Ensure the test points to the postgres_test database
        expect(process.env.DATABASE_URL).toContain("test");
        
        // Ensure Redis connection is ready
        await redis.ping();

        // Seed a TextPassage so /api/race/initiate doesn't fail with 500 (empty database)
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
        // Clean up seeded text and any dependent race results
        if (testTextId) {
            await prisma.raceResult.deleteMany({ where: { text_id: testTextId } });
            await prisma.textPassage.deleteMany({ where: { id: testTextId } });
        }

        // Clear any test keys from Redis (pattern race:test-*)
        const testKeys = await redis.keys("race:test-*");
        if (testKeys.length > 0) {
            await redis.del(...testKeys);
        }
        
        // Ensure the actual race key created in this test is cleaned up if it failed mid-way
        if (currentRaceId) {
            await redis.del(`race:${currentRaceId}`);
        }

        // Disconnect Prisma
        await prisma.$disconnect();
    });

    it("successfully runs through a complete solo race sequence", async () => {
        // PRE-CONDITION
        const initialRaceCount = await prisma.raceResult.count();

        // 1. Initiate Race
        await testApiHandler({
            appHandler: initiateRoute,
            url: "/api/race/initiate",
            async test({ fetch }) {
                const res = await fetch({ method: "POST" });
                expect(res.status).toBe(200);
                
                const data = await res.json();
                expect(data.raceId).toBeDefined();
                expect(data.content).toBeDefined();
                
                currentRaceId = data.raceId;
                expectedLength = data.content.length;
            }
        });

        // Verify via redis.exists that the key race:{raceId} was created
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
                const data = await res.json();
                expect(typeof data.startTime).toBe("number");
            }
        });

        // Verify via redis.hget that startTime is now stored in the Redis Hash
        const startTimeStr = await redis.hget(`race:${currentRaceId}`, "startTime");
        expect(startTimeStr).toBeTruthy();

        // 3. Finish Race (Validation Error)
        await testApiHandler({
            appHandler: finishRoute,
            url: "/api/race/finish",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        raceId: currentRaceId,
                        totalCharactersInserted: expectedLength - 5 // User didn't finish the text
                    })
                });
                
                expect(res.status).toBe(400); // Bad Request expected
            }
        });

        // Verify that NO record was created in the Postgres races table
        const intermediateRaceCount = await prisma.raceResult.count();
        expect(intermediateRaceCount).toBe(initialRaceCount);

        // 4. Finish Race (Success)
        // Simulate a delay (e.g., a small setTimeout) since duration must be >= 500ms
        await new Promise(resolve => setTimeout(resolve, 600));

        let finalWpm = 0;

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
                
                finalWpm = data.wpm;
            }
        });

        // Database Check: Verify a new row exists in the races table with the correct wpm
        const finalRaceCount = await prisma.raceResult.count();
        expect(finalRaceCount).toBe(initialRaceCount + 1);

        const latestResult = await prisma.raceResult.findFirst({
            orderBy: { completedAt: "desc" }
        });
        expect(latestResult).toBeDefined();
        // Since sqlite/pg float precision sometimes gets messy, we can check a close approximation 
        // or just ensure it matches. Since we pass the wpm directly to Prisma, let's verify it matches the API response
        // Prisma float will match the Javascript number representation closely.
        expect(latestResult?.wpm).toBeCloseTo(finalWpm, 2); 

        // Redis Check: Verify that the key race:{raceId} has been deleted
        const existsAfterFinish = await redis.exists(`race:${currentRaceId}`);
        expect(existsAfterFinish).toBe(0);
    });
});
