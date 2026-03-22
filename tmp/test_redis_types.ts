import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function test() {
  const key = "test:types";
  await redis.hset(key, { f1: "v1", f2: "v2" });
  
  const hmgetRes = await redis.hmget(key, "f1", "f2");
  console.log("hmget result:", hmgetRes, "type:", typeof hmgetRes, "isArray:", Array.isArray(hmgetRes));
  
  const hgetallRes = await redis.hgetall(key);
  console.log("hgetall result:", hgetallRes, "type:", typeof hgetallRes);
  
  await redis.del(key);
}

test().catch(console.error);
