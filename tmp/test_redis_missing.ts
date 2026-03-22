import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function test() {
  const key = "non-existent-key-" + Date.now();
  const res = await redis.hgetall(key);
  console.log("hgetall non-existent:", res, "type:", typeof res);
}

test().catch(console.error);
