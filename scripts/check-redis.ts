/**
 * Redis Health Check
 *
 * Run with:   dotenv -e .env -- tsx scripts/check-redis.ts
 * (requires the upstash-proxy Docker service to be up)
 */

import { Redis } from "@upstash/redis";

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error(
      "❌  Missing env vars: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN"
    );
    process.exit(1);
  }

  const redis = new Redis({ url, token });

  try {
    const pong = await redis.ping();
    if (pong === "PONG") {
      console.log("✅  Redis Connection: OK");
      console.log(`    URL   → ${url}`);
    } else {
      console.error(`❌  Unexpected ping response: ${pong}`);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌  Redis Connection: FAILED");
    console.error(err);
    process.exit(1);
  }
}

main();
