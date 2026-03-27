import { testApiHandler } from "next-test-api-route-handler";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import * as multiplayerStartRoute from "@/app/api/race/(multiplayer)/multiplayer-start/route";
import * as authRoute from "@/app/api/auth/[...auth]/route";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";

describe("Multiplayer Start API", () => {
  const HOST_EMAIL = `host+${Date.now()}@typeracing.test`;
  const GUEST_EMAIL = `guest+${Date.now()}@typeracing.test`;
  const TEST_PASSWORD = "TestPassword123!";

  let hostCookie = "";
  let guestCookie = "";
  let hostId = "";
  let guestId = "";

  beforeAll(async () => {
    // 1. Create Host and Guest
    await testApiHandler({
      appHandler: authRoute,
      url: "/api/auth/sign-up/email",
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: HOST_EMAIL, password: TEST_PASSWORD, name: "Host" }),
        });
        hostCookie = (res.headers.get("set-cookie") ?? "").split(",").map(c => c.split(";")[0].trim()).join("; ");
      },
    });

    await testApiHandler({
      appHandler: authRoute,
      url: "/api/auth/sign-up/email",
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: GUEST_EMAIL, password: TEST_PASSWORD, name: "Guest" }),
        });
        guestCookie = (res.headers.get("set-cookie") ?? "").split(",").map(c => c.split(";")[0].trim()).join("; ");
      },
    });

    const host = await prisma.user.findUnique({ where: { email: HOST_EMAIL } });
    const guest = await prisma.user.findUnique({ where: { email: GUEST_EMAIL } });
    hostId = host!.id;
    guestId = guest!.id;
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [HOST_EMAIL, GUEST_EMAIL] } } });
    await prisma.$disconnect();
  });

  it("should transition state from READY_CHECK to COUNTDOWN for valid requests", async () => {
    const roomId = "test-multi-room";
    
    // Setup room state manually for precision
    await RedisRoomService.initialize({
      roomId,
      hostId,
      promptId: "test-prompt",
      promptText: "Test text",
      nowMs: Date.now()
    });

    // Join guest and make both ready
    const roomKey = `race:${roomId}`;
    await redis.hset(roomKey, {
      guest_id: guestId,
      state: "READY_CHECK", // READY_LOCKED in spec
      guest_ready: "1",
      host_ready: "1"
    });

    // Call start as Host
    await testApiHandler({
      appHandler: multiplayerStartRoute,
      url: "/api/race/multiplayer-start",
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json", "Cookie": hostCookie },
          body: JSON.stringify({ roomId })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("STARTING");
        expect(data.targetStartMs).toBeGreaterThan(data.serverNowMs);
        
        // Verify Redis
        const state = await redis.hget(roomKey, "state");
        expect(state).toBe("COUNTDOWN");
      }
    });
  });

  it("should return ALREADY_STARTING if called twice", async () => {
    const roomId = "test-idempotent-room";
    await RedisRoomService.initialize({ roomId, hostId, promptId: "p", promptText: "t", nowMs: Date.now() });
    const roomKey = `race:${roomId}`;
    await redis.hset(roomKey, { guest_id: guestId, state: "READY_CHECK", guest_ready: "1", host_ready: "1" });

    let firstTarget = 0;

    // First call
    await testApiHandler({
      appHandler: multiplayerStartRoute,
      url: "/api/race/multiplayer-start",
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json", "Cookie": hostCookie },
          body: JSON.stringify({ roomId })
        });
        const data = await res.json();
        firstTarget = data.targetStartMs;
      }
    });

    // Second call
    await testApiHandler({
      appHandler: multiplayerStartRoute,
      url: "/api/race/multiplayer-start",
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json", "Cookie": guestCookie }, // Call by guest this time
          body: JSON.stringify({ roomId })
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("ALREADY_STARTING");
        expect(data.targetStartMs).toBe(firstTarget); // Must be identical
      }
    });
  });

  it("should forbid unauthorized users", async () => {
    const roomId = "test-forbid-room";
    await RedisRoomService.initialize({ roomId, hostId: "something-else", promptId: "p", promptText: "t", nowMs: Date.now() });
    
    await testApiHandler({
      appHandler: multiplayerStartRoute,
      url: "/api/race/multiplayer-start",
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json", "Cookie": hostCookie },
          body: JSON.stringify({ roomId })
        });
        expect(res.status).toBe(403);
      }
    });
  });

  it("should fail if guest is not ready", async () => {
    const roomId = "test-not-ready-room";
    await RedisRoomService.initialize({ roomId, hostId, promptId: "p", promptText: "t", nowMs: Date.now() });
    await redis.hset(`race:${roomId}`, { guest_id: guestId, state: "LOBBY_FULL", guest_ready: "0" });

    await testApiHandler({
      appHandler: multiplayerStartRoute,
      url: "/api/race/multiplayer-start",
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json", "Cookie": hostCookie },
          body: JSON.stringify({ roomId })
        });
        expect(res.status).toBe(400);
        expect((await res.json()).error).toContain("ready");
      }
    });
  });

  it("should allow an anonymous guest to start the race using guestId UUID", async () => {
    const roomId = "test-anon-guest-room";
    const anonGuestId = "anon-uuid-123";
    
    await RedisRoomService.initialize({
      roomId,
      hostId,
      promptId: "test-prompt",
      promptText: "Test text",
      nowMs: Date.now()
    });

    await redis.hset(`race:${roomId}`, {
      guest_id: anonGuestId,
      state: "READY_CHECK",
      guest_ready: "1",
      host_ready: "1"
    });

    await testApiHandler({
      appHandler: multiplayerStartRoute,
      url: "/api/race/multiplayer-start",
      async test({ fetch }) {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" }, // NO COOKIE
          body: JSON.stringify({ roomId, guestId: anonGuestId })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("STARTING");
        
        const state = await redis.hget(`race:${roomId}`, "state");
        expect(state).toBe("COUNTDOWN");
      }
    });
  });
});
