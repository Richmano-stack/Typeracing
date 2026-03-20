/* import Redis from "ioredis";

const redisClientSingleton = () => {
    return new Redis(process.env.REDIS_URL || "redis://localhost:6379");
};

declare global {
    var redis: undefined | ReturnType<typeof redisClientSingleton>;
}

const redis = globalThis.redis ?? redisClientSingleton();

export default redis;

if (process.env.NODE_ENV !== "production") globalThis.redis = redis;

 */

import { Redis } from '@upstash/redis'

const globalForRedis = globalThis as unknown as {
    redis?: Redis;
};

export const redis = globalForRedis.redis ?? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
}

export default redis;