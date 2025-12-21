import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { TYPING_TEXTS } from "../app/lib/texts";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Use DIRECT_URL if available (better for migrations/seeding), otherwise fall back to DATABASE_URL
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL or DIRECT_URL environment variable is not set");
  console.error("Please set DATABASE_URL in your environment or .env file");
  console.error("Example: postgresql://typeracer:motsDepass@localhost:5433/typeracer_db");
  process.exit(1);
}

// Show connection info (without password for security)
const connectionInfo = connectionString.replace(/:[^:@]+@/, ":****@");
const connectionType = process.env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL";
console.log(`🔌 Connecting to database (using ${connectionType}): ${connectionInfo}`);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Test connection before proceeding
async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful");
  } catch (error: any) {
    console.error("❌ Failed to connect to database");
    console.error("Error:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Troubleshooting:");
      console.error("1. Make sure your database is running:");
      console.error("   docker-compose up -d");
      console.error("2. Verify DATABASE_URL in your .env file matches your database:");
      console.error("   For local Docker: postgresql://typeracer:motsDepass@localhost:5433/typeracer_db");
      console.error("3. Check if the port is correct (5433 for Docker, 5432 for direct connection)");
    }
    throw error;
  }
}

// Simple hash function for textHash (matching the pattern used in the app)
function generateTextHash(text: string): string {
  return text.substring(0, 20).replace(/\s+/g, "_");
}

// Generate random race data
function generateRaceData(userId: string, index: number) {
  // Random WPM between 30-120
  const wpm = Math.random() * 90 + 30;
  
  // Random accuracy between 70-100%
  const accuracy = Math.random() * 30 + 70;
  
  // Pick a random text
  const text = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
  const textHash = generateTextHash(text);
  
  // Calculate time taken based on text length and WPM
  // WPM = (characters / 5) / (minutes)
  // minutes = (characters / 5) / WPM
  // timeTakenMs = minutes * 60 * 1000
  const characters = text.length;
  const minutes = (characters / 5) / wpm;
  const timeTakenMs = Math.round(minutes * 60 * 1000);
  
  // Calculate errors based on accuracy
  // accuracy = (correct / total) * 100
  // errors = total - correct
  const totalChars = characters;
  const correctChars = Math.round((accuracy / 100) * totalChars);
  const errors = Math.max(0, totalChars - correctChars);
  
  // Random date in the past 90 days
  const daysAgo = Math.random() * 90;
  const completedAt = new Date();
  completedAt.setDate(completedAt.getDate() - daysAgo);
  
  return {
    userId,
    wpm: new Decimal(wpm.toFixed(2)),
    accuracy: new Decimal(accuracy.toFixed(2)),
    timeTakenMs,
    errors,
    textHash,
    completedAt,
  };
}

async function main() {
  console.log("🌱 Starting seed...");

  // Test database connection first
  await testConnection();

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.race.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data cleared");

  // Create 10 users with no races
  console.log("👥 Creating 10 users...");
  const users = [];
  const defaultPassword = "password123";
  // Use the same salt rounds (12) as the registration logic
  // Hash each password individually to ensure each user gets a unique hash with its own salt

  for (let i = 1; i <= 10; i++) {
    // Hash password individually for each user (same as registration logic)
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        hashedPassword,
        // User stats will default to 0 (no races played)
      },
    });
    users.push(user);
    if (i % 5 === 0) {
      console.log(`  Created ${i}/10 users`);
    }
  }
  console.log("✅ All 10 users created (no races)");
  
  // Verify that password authentication works for a sample user
  console.log("\n🔐 Verifying password authentication...");
  const testUser = users[0];
  const testPassword = "password123";
  const testUserFromDb = await prisma.user.findUnique({
    where: { email: testUser.email },
  });
  
  if (testUserFromDb?.hashedPassword) {
    const isValid = await bcrypt.compare(testPassword, testUserFromDb.hashedPassword);
    if (isValid) {
      console.log(`✅ Password verification successful for ${testUser.email}`);
    } else {
      console.error(`❌ Password verification failed for ${testUser.email}`);
      throw new Error("Password verification failed - seed data may be incorrect");
    }
  } else {
    console.error(`❌ No hashed password found for ${testUser.email}`);
    throw new Error("User missing hashed password");
  }
  
  console.log("🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - Users: 10`);
  console.log(`   - Races: 0 (no races created)`);
  console.log(`   - Default password for all users: password123`);
  console.log(`   - Test login: ${testUser.email} / password123`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
