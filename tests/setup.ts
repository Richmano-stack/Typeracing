import { config } from "dotenv";

// Load test environment variables before Prisma initialises
config({ path: ".env.test", override: true });
