import { Redis } from "@upstash/redis";

// Ensure environment variables are loaded if running outside Next.js
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const redis = Redis.fromEnv();
const API_BASE = "http://localhost:3000/api/race";

async function runQATests() {
  console.log("🚀 Starting QA Automation Audit for Room Lifecycle...\n");
  
  let roomId = "";
  let hostPromptText = "";

  // ==========================================
  // Test A: The Initialization Audit
  // ==========================================
  console.log("▶ Test A: The Initialization Audit");
  try {
    const createRes = await fetch(`${API_BASE}/create`, {
      method: "POST"
    });
    
    const createData = await createRes.json();
    roomId = createData.roomId;

    let testAPast = true;

    if (!roomId) {
      console.log("  ❌ FAIL: Does it return a valid roomId? (Got undefined)");
      testAPast = false;
    } else {
      console.log(`  ✅ PASS: Returns valid roomId: ${roomId}`);
    }

    if (typeof createData.room.host_progress !== "number") {
      console.log(`  ❌ FAIL: Are fields correctly typed? host_progress is ${typeof createData.room.host_progress} instead of number.`);
      testAPast = false;
    } else {
      console.log(`  ✅ PASS: Fields correctly typed. host_progress is a number (Value: ${createData.room.host_progress})`);
    }

    if (typeof createData.room.prompt_text !== "string" || createData.room.prompt_text.length === 0) {
      console.log(`  ❌ FAIL: Prompt text is missing or invalid. Got: ${createData.room.prompt_text}`);
      testAPast = false;
    } else {
      console.log("  ✅ PASS: Prompt text is present and valid.");
      // Save it for Test B
      hostPromptText = createData.room.prompt_text;
    }

  } catch (err: any) {
    console.log(`  ❌ FAIL: Test A threw an error: ${err.message}`);
  }
  console.log("");

  if (!roomId) {
    console.log("🛑 FATAL: Cannot proceed to subsequent tests without a roomId. Exiting.");
    process.exit(1);
  }

  // ==========================================
  // Test B: The Atomic Join
  // ==========================================
  console.log("▶ Test B: The Atomic Join");
  const guest1Id = "guest-qa-123";
  try {
    const joinRes = await fetch(`${API_BASE}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        guestId: guest1Id
      })
    });

    const joinData = await joinRes.json();

    if (joinData.room.state !== "READY_WAIT") {
      console.log(`  ❌ FAIL: State did not move to READY_WAIT. Got: ${joinData.room.state}`);
    } else {
      console.log("  ✅ PASS: State successfully moved from WAITING_FOR_GUEST to READY_WAIT.");
    }

    if (joinData.room.prompt_text !== hostPromptText) {
      console.log("  ❌ FAIL: Did not return the correct prompt_text to the guest.");
    } else {
      console.log("  ✅ PASS: Returned the prompt_text to the Guest for immediate rendering.");
    }
  } catch (err: any) {
    console.log(`  ❌ FAIL: Test B threw an error: ${err.message}`);
  }
  console.log("");

  // ==========================================
  // Test C: The "Ghost Guest" Prevention
  // ==========================================
  console.log("▶ Test C: The 'Ghost Guest' Prevention (Concurrency)");
  const guest2Id = "ghost-guest-999";
  try {
    const ghostRes = await fetch(`${API_BASE}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        guestId: guest2Id
      })
    });

    const ghostData = await ghostRes.json();
    const status = ghostRes.status;

    if ([409, 400].includes(status) || ghostData.error === "Room is already full" || ghostData.error === "Room is not in a joinable state") {
      console.log(`  ✅ PASS: API rejected the 3rd player with correct error. (Status: ${status})`);
    } else {
      console.log(`  ❌ FAIL: API did not reject the 3rd player correctly. Status: ${status}, Response:`, ghostData);
    }

    // Check Redis raw state to ensure guest_id wasn't overwritten
    const rawRedisData = await redis.hgetall(`race:${roomId}`) as Record<string, string>;
    if (rawRedisData.guest_id === guest1Id) {
      console.log("  ✅ PASS: Redis guest_id remained intact. Lua script successfully guarded the room.");
    } else {
      console.log(`  ❌ FAIL: Redis guest_id was overwritten! Expected ${guest1Id}, found ${rawRedisData.guest_id}`);
    }
  } catch (err: any) {
    console.log(`  ❌ FAIL: Test C threw an error: ${err.message}`);
  }
  console.log("");

  // ==========================================
  // Test D: The TTL Check
  // ==========================================
  console.log("▶ Test D: The TTL Check");
  try {
    const ttl = await redis.ttl(`race:${roomId}`);
    
    // TTL should be around 3600. Allow a small buffer for execution time (e.g., > 3500)
    if (ttl > 3500 && ttl <= 3600) {
      console.log(`  ✅ PASS: Redis TTL is properly set. (Current TTL: ${ttl} seconds)`);
    } else {
      console.log(`  ❌ FAIL: Redis TTL is incorrect. Expected ~3600, got ${ttl} seconds.`);
    }
  } catch (err: any) {
    console.log(`  ❌ FAIL: Test D threw an error: ${err.message}`);
  }
  
  console.log("\n🏁 QA Automation Audit Complete.");
}

runQATests();
