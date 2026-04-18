import { testApiHandler } from "next-test-api-route-handler";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import * as lobbyRoute from "@/app/api/race/(multiplayer)/lobby/[id]/route";
import * as joinRoute from "@/app/api/race/(multiplayer)/join/route";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";

describe("Lobby Housekeeping (Heartbeat & Timeouts)", () => {
    const HOST_ID = "host-123";
    const GUEST_ID = "guest-456";
    let ROOM_ID = "";

    beforeEach(async () => {
        await redis.flushdb();
        ROOM_ID = `hk-room-${Math.random().toString(36).substring(7)}`;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("should update last_active and detect disconnects via guestId query param", async () => {
        const now = Date.now();
        await RedisRoomService.initialize({
            roomId: ROOM_ID,
            hostId: HOST_ID,
            promptId: "p",
            promptText: "t",
            nowMs: now
        });

        // 1. Heartbeat as Host
        await testApiHandler({
            appHandler: lobbyRoute,
            params: { id: ROOM_ID },
            url: `/api/race/lobby/${ROOM_ID}?guestId=${HOST_ID}`,
            async test({ fetch }) {
                const res = await fetch();
                expect(res.status).toBe(200);
                const data = await res.json();
                expect(data.room.is_opponent_disconnected).toBe(false);
            }
        });

        const hostLA = await redis.hget(`race:${ROOM_ID}`, "host_last_active");
        expect(hostLA).not.toBeNull();
        expect(parseInt(hostLA as string)).toBeGreaterThanOrEqual(now);

        // 2. Simulate Guest joining but then "dying" (old last_active)
        await redis.hset(`race:${ROOM_ID}`, {
            guest_id: GUEST_ID,
            guest_last_active: (Date.now() - 6000).toString() // 6s ago
        });

        // 3. Heartbeat as Host again
        await testApiHandler({
            appHandler: lobbyRoute,
            params: { id: ROOM_ID },
            url: `/api/race/lobby/${ROOM_ID}?guestId=${HOST_ID}`,
            async test({ fetch }) {
                const res = await fetch();
                const data = await res.json();
                expect(data.room.is_opponent_disconnected).toBe(true);
            }
        });
    });

    it("should reject joins if the room is older than 5 minutes", async () => {
        const now = Date.now();
        const oldTime = now - (301 * 1000); // 5m 1s ago
        
        await RedisRoomService.initialize({
            roomId: ROOM_ID,
            hostId: HOST_ID,
            promptId: "p",
            promptText: "t",
            nowMs: oldTime
        });

        await testApiHandler({
            appHandler: joinRoute,
            url: "/api/race/join",
            async test({ fetch }) {
                const res = await fetch({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: ROOM_ID, guestId: GUEST_ID })
                });
                expect(res.status).toBe(410);
                const data = await res.json();
                expect(data.error).toContain("expired");
            }
        });
    });
});
