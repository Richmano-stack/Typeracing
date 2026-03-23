import { testApiHandler } from "next-test-api-route-handler";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import * as initiateRoute from "@/app/api/race/initiate/route";
import * as startRoute from "@/app/api/race/start/route";
import * as finishRoute from "@/app/api/race/finish/route";
import * as authRoute from "@/app/api/auth/[...auth]/route";

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

    beforeEach(async () => {
        await redis.flushdb();
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
                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
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
                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
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

                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
                expect(res.status).toBe(200);
                const data = await res.json();

                expect(typeof data.wpm).toBe("number");
                expect(typeof data.accuracy).toBe("number");
                // Expected `saved` behavior (false for guests)
                expect(data.saved).toBe(false);
                expect(data.authenticated).toBe(false);
            }
        });

        // Database Check: Verify NO new row was created
        const finalRaceCount = await prisma.raceResult.count();
        expect(finalRaceCount).toBe(initialRaceCount);

        // Verify no orphaned record was created with null userId
        const latestResult = await prisma.raceResult.findFirst({
            where: { userId: null },
            orderBy: { completedAt: "desc" }
        });

        // Ensure the latest null-user result is either non-existent or older than our test window
        if (latestResult) {
            const now = new Date();
            const timeDiff = now.getTime() - latestResult.completedAt.getTime();
            expect(timeDiff).toBeGreaterThan(5000); // 5 seconds old, not from this test
        }

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
                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
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
        const authUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
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
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ raceId: currentRaceId })
                });
                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
                expect(res.status).toBe(200);
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

                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
                expect(res.status).toBe(200);
                const data = await res.json();
                expect(data.saved).toBe(true); // Verification
                expect(data.authenticated).toBe(true);

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

        // --- STATS SYNC VERIFICATION ---
        const updatedUser = await prisma.user.findUnique({ where: { id: authUser!.id } });
        expect(updatedUser!.total_races).toBe(1);
        expect(updatedUser!.best_wpm).toBeCloseTo(finalWpm, 2);

        // Redis cleanup
        const existsAfterFinish = await redis.exists(`race:${currentRaceId}`);
        expect(existsAfterFinish).toBe(0);
    });

    describe("Solo Race Edge Cases & Robustness", () => {
        it("should reject races that are too fast (bot detection)", async () => {
            let raceId = "";
            let expectedLength = 0;

            await testApiHandler({
                appHandler: initiateRoute,
                url: "/api/race/initiate",
                async test({ fetch }) {
                    const res = await fetch({ method: "POST" });
                    const data = await res.json();
                    raceId = data.raceId;
                    expectedLength = data.content.length;
                    activeRaceIds.push(raceId);
                }
            });

            await testApiHandler({
                appHandler: startRoute,
                url: "/api/race/start",
                async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ raceId })
                });
                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
                expect(res.status).toBe(200);
                }
            });

            // NO WAIT - Should be too fast
            await testApiHandler({
                appHandler: finishRoute,
                url: "/api/race/finish",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            raceId,
                            totalCharactersInserted: expectedLength
                        })
                    });

                    expect(res.status).toBe(400);
                    const data = await res.json();
                    expect(data.error).toBe("Impossible speed/Bot detection");
                }
            });
        });

        it("should reject if the user didn't finish the text", async () => {
            let raceId = "";
            let expectedLength = 0;

            await testApiHandler({
                appHandler: initiateRoute,
                url: "/api/race/initiate",
                async test({ fetch }) {
                    const res = await fetch({ method: "POST" });
                    const data = await res.json();
                    raceId = data.raceId;
                    expectedLength = data.content.length;
                    activeRaceIds.push(raceId);
                }
            });

            await testApiHandler({
                appHandler: startRoute,
                url: "/api/race/start",
                async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ raceId })
                });
                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
                expect(res.status).toBe(200);
                }
            });

            await new Promise(resolve => setTimeout(resolve, 600));

            await testApiHandler({
                appHandler: finishRoute,
                url: "/api/race/finish",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            raceId,
                            totalCharactersInserted: expectedLength - 1 // One char missing
                        })
                    });

                    expect(res.status).toBe(400);
                    const data = await res.json();
                    expect(data.error).toBe("User didn't finish the text");
                }
            });
        });

        it("should reject finishing a race that was never started", async () => {
            let raceId = "";
            let expectedLength = 0;

            await testApiHandler({
                appHandler: initiateRoute,
                url: "/api/race/initiate",
                async test({ fetch }) {
                    const res = await fetch({ method: "POST" });
                    const data = await res.json();
                    raceId = data.raceId;
                    expectedLength = data.content.length;
                    activeRaceIds.push(raceId);
                }
            });

            // SKIP START

            await testApiHandler({
                appHandler: finishRoute,
                url: "/api/race/finish",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            raceId,
                            totalCharactersInserted: expectedLength
                        })
                    });

                    expect(res.status).toBe(400);
                    expect((await res.json()).error).toBe("Race was never started");
                }
            });
        });

        it("should prevent finishing the same race twice", async () => {
            let raceId = "";
            let expectedLength = 0;

            await testApiHandler({
                appHandler: initiateRoute,
                url: "/api/race/initiate",
                async test({ fetch }) {
                    const res = await fetch({ method: "POST" });
                    const data = await res.json();
                    raceId = data.raceId;
                    expectedLength = data.content.length;
                    activeRaceIds.push(raceId);
                }
            });

            await testApiHandler({
                appHandler: startRoute,
                url: "/api/race/start",
                async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ raceId })
                });
                if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
                expect(res.status).toBe(200);
                }
            });

            await new Promise(resolve => setTimeout(resolve, 600));

            // First finish
            await testApiHandler({
                appHandler: finishRoute,
                url: "/api/race/finish",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            raceId,
                            totalCharactersInserted: expectedLength
                        })
                    });
                    if (res.status !== 200) {
                    console.error("API Error Response Body:", await res.json());
                }
                expect(res.status).toBe(200);
                }
            });

            // Second finish attempt
            await testApiHandler({
                appHandler: finishRoute,
                url: "/api/race/finish",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            raceId,
                            totalCharactersInserted: expectedLength
                        })
                    });
                    expect(res.status).toBe(404); // Already deleted from Redis
                }
            });
        });

        it("should not overwrite startTime if start is called twice", async () => {
            let raceId = "";
            let time1 = 0;

            await testApiHandler({
                appHandler: initiateRoute,
                url: "/api/race/initiate",
                async test({ fetch }) {
                    const res = await fetch({ method: "POST" });
                    const data = await res.json();
                    raceId = data.raceId;
                    activeRaceIds.push(raceId);
                }
            });

            // First Start
            await testApiHandler({
                appHandler: startRoute,
                url: "/api/race/start",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ raceId })
                    });
                    if (res.status !== 200) {
                        console.error("API Error Response Body:", await res.json());
                    }
                    expect(res.status).toBe(200);
                    time1 = (await res.json()).startTime;
                }
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            // Second Start
            await testApiHandler({
                appHandler: startRoute,
                url: "/api/race/start",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ raceId })
                    });
                    if (res.status !== 200) {
                        console.error("API Error Response Body:", await res.json());
                    }
                    expect(res.status).toBe(200);
                    const time2 = (await res.json()).startTime;
                    expect(time1).toBe(time2);
                }
            });
        });

        it("should return 404 for non-existent race session", async () => {
            const fakeRaceId = "00000000-0000-0000-0000-000000000000";

            await testApiHandler({
                appHandler: startRoute,
                url: "/api/race/start",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ raceId: fakeRaceId })
                    });
                    expect(res.status).toBe(404);
                }
            });

            await testApiHandler({
                appHandler: finishRoute,
                url: "/api/race/finish",
                async test({ fetch }) {
                    const res = await fetch({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            raceId: fakeRaceId,
                            totalCharactersInserted: 10
                        })
                    });
                    expect(res.status).toBe(404);
                }
            });
        });
    });
});
