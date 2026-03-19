import { vi, describe, it, expect, beforeEach } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";
import * as statsRoute from "@/api/user/stats/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mock the auth library
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the prisma library
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    raceResult: {
      findMany: vi.fn(),
    },
  },
}));

describe("GET /api/user/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 Unauthorized when the session is null", async () => {
    (auth.api.getSession as any).mockResolvedValue(null);

    await testApiHandler({
      appHandler: statsRoute,
      async test({ fetch }) {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toBe("Unauthorized");
      },
    });
  });

  describe("Case A: New User", () => {
    it("returns stats as 0 when user has no races", async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: "new-user-id" } });
      (prisma.user.findUnique as any).mockResolvedValue({
        total_races: 0,
        best_wpm: 0,
      });
      (prisma.raceResult.findMany as any).mockResolvedValue([]);

      await testApiHandler({
        appHandler: statsRoute,
        async test({ fetch }) {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data).toEqual({
            bestWpm: 0,
            totalRaces: 0,
            recentAvgWpm: 0,
            recentAvgAccuracy: 0,
          });
        },
      });
    });
  });

  describe("Case B: Active User (Avg logic check)", () => {
    it("only calculates the average for the first 10 if 11 are returned", async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: "active-user-id" } });
      (prisma.user.findUnique as any).mockResolvedValue({
        total_races: 100,
        best_wpm: 95,
      });

      // Mock 11 races. First 10 with 100 WPM, 11th with 0 WPM.
      // If the API uses all 11, the average will be ~90.9.
      // If the API uses only the first 10, the average will be 100.
      const elevenRaces = Array.from({ length: 11 }, (_, i) => ({
        wpm: i < 10 ? 100 : 0,
        accuracy: 100,
      }));

      // NOTE: In the actual implementation, prisma.raceResult.findMany has { take: 10 }.
      // If the user wants to verify the "logic" only calculates the first 10,
      // we mock findMany to return all 11 and check the result.
      (prisma.raceResult.findMany as any).mockResolvedValue(elevenRaces);

      await testApiHandler({
        appHandler: statsRoute,
        async test({ fetch }) {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(200);
          const data = await res.json();
          
          // If the logic correctly limits to 10, recentAvgWpm should be 100.
          // If it doesn't limit (and relies only on the 'take: 10' in prisma call),
          // then since we mocked it to return 11, it will be (10*100 + 0) / 11 = 90.9.
          // We assert 100 to verify the logic.
          expect(data.recentAvgWpm).toBe(100);
        },
      });
    });
  });

  describe("Math Validation & Data Types", () => {
    it("returns correct average for 3 targeted races (50, 60, 70)", async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: "math-user-id" } });
      (prisma.user.findUnique as any).mockResolvedValue({
        total_races: 3,
        best_wpm: 70,
      });

      const controlledRaces = [
        { wpm: 50, accuracy: 80 },
        { wpm: 60, accuracy: 90 },
        { wpm: 70, accuracy: 100 },
      ];
      (prisma.raceResult.findMany as any).mockResolvedValue(controlledRaces);

      await testApiHandler({
        appHandler: statsRoute,
        async test({ fetch }) {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(200);
          const data = await res.json();

          // Math: (50+60+70)/3 = 180/3 = 60
          expect(data.recentAvgWpm).toBe(60);
          // Accuracy: (80+90+100)/3 = 270/3 = 90
          expect(data.recentAvgAccuracy).toBe(90);

          // Data Type check
          expect(typeof data.recentAvgWpm).toBe("number");
          expect(typeof data.recentAvgAccuracy).toBe("number");
        },
      });
    });
  });

  describe("Error Handling", () => {
    it("returns 500 status when prisma throws an error", async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: "error-user-id" } });
      (prisma.user.findUnique as any).mockRejectedValue(new Error("Database connection failure"));

      await testApiHandler({
        appHandler: statsRoute,
        async test({ fetch }) {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(500);
          const data = await res.json();
          expect(data.error).toBe("Internal Server Error");
        },
      });
    });
  });
});
