import dotenv from "dotenv";
import { defineConfig, env } from "@prisma/config";

// Prisma natively loads .env, but since we use .env.local per Next.js conventions:
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env just in case
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts"
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
