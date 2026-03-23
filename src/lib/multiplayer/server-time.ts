import { redis } from "@/lib/redis";


export async function getServerTimeMs(): Promise<number> {
  const [seconds, microseconds] = await redis.time();
  return seconds * 1000 + Math.floor(microseconds / 1000);
}

