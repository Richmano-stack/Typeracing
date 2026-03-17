import { testApiHandler } from "next-test-api-route-handler";
import { afterAll, describe, expect, it } from "vitest";
import * as authRoute from "@/api/auth/[...auth]/route";
import { prisma } from "@/lib/prisma";

const TEST_EMAIL = `test+integration+${Date.now()}@typeracing.test`;
const TEST_PASSWORD = "TestPassword123!";
const TEST_NAME = "Integration TestUser";

afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
});

describe("BetterAuth + Prisma Data Glue", () => {
    it("populates custom stat columns with 0 on registration", async () => {
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
            },
        });

        // ── Direct DB assertion — not trusting the HTTP response ──
        const user = await prisma.user.findUnique({
            where: { email: TEST_EMAIL },
        });

        expect(user, "User record must exist in DB after sign-up").not.toBeNull();
        expect(user!.total_races).toBe(0);
        expect(user!.average_wpm).toBe(0);
        expect(user!.best_wpm).toBe(0);
    });

    it("exposes custom stat fields in the session response", async () => {
        let sessionCookie = "";

        await testApiHandler({
            appHandler: authRoute,
            url: "/api/auth/sign-in/email",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: TEST_EMAIL,
                        password: TEST_PASSWORD,
                    }),
                });

                expect(res.status).toBe(200);

                const raw = res.headers.get("set-cookie") ?? "";
                // Grab only the name=value part of each cookie
                sessionCookie = raw
                    .split(",")
                    .map((c) => c.split(";")[0].trim())
                    .join("; ");

                expect(sessionCookie).not.toBe("");
            },
        });

        // Step B: hit get-session and inspect session.user
        await testApiHandler({
            appHandler: authRoute,
            url: "/api/auth/get-session",
            async test({ fetch }) {
                const res = await fetch({
                    method: "GET",
                    headers: { Cookie: sessionCookie },
                });

                expect(res.status).toBe(200);

                const body = await res.json();

                // BetterAuth wraps the user inside { session, user }
                const user = body?.user ?? body?.session?.user;

                expect(user, "session.user must be present in response").toBeTruthy();
                expect(user.total_races, "total_races must be visible in session").toBe(0);
                expect(user.average_wpm, "average_wpm must be visible in session").toBe(0);
                expect(user.best_wpm, "best_wpm must be visible in session").toBe(0);
            },
        });
    });
});
