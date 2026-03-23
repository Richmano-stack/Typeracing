import { Redis } from "@upstash/redis";

/**
 * Singleton Upstash Redis client.
 *
 * Environment-agnostic: reads UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN from the current environment.
 *
 * - Development / Test → http://localhost:8080 (upstash-proxy Docker service)
 * - Production (Vercel) → your real Upstash REST endpoint
 *
 * Do NOT import from "ioredis" — all Redis traffic must go through the
 * HTTP client so the code behaves identically on Vercel edge/serverless.
 */

const globalForRedis = globalThis as unknown as { redis?: Redis };

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url) throw new Error("Missing Environment Variable: UPSTASH_REDIS_REST_URL");
if (!token) throw new Error("Missing Environment Variable: UPSTASH_REDIS_REST_TOKEN");

export const redis =
  globalForRedis.redis ??
  new Redis({
    url,
    token,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export default redis;