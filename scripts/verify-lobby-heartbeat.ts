import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const API_BASE = "http://localhost:3000/api/race";

async function testLobbyHeartbeat() {
  console.log("🚀 Testing Lobby Heartbeat Endpoint...\n");

  try {
    // 1. Create a room
    console.log("1. Creating a room...");
    const createRes = await fetch(`${API_BASE}/create`, { method: "POST" });
    const createData = await createRes.json();
    const roomId = createData.roomId;
    console.log(`   ✅ Room created: ${roomId}\n`);

    // 2. Test Heartbeat (Initial State)
    console.log("2. Testing Heartbeat (Initial)...");
    const heartbeatRes1 = await fetch(`${API_BASE}/lobby/${roomId}`);
    const heartbeatData1 = await heartbeatRes1.json();

    if (heartbeatRes1.status !== 200) {
      console.log(`   ❌ FAIL: Status was ${heartbeatRes1.status}`);
    } else {
      console.log("   ✅ Status: 200 OK");
      console.log("   ✅ Structure check:");
      console.log(`      - roomId: ${heartbeatData1.roomId === roomId ? "match" : "MISMATCH"}`);
      console.log(`      - serverNowMs: ${typeof heartbeatData1.serverNowMs === "number" ? "ok" : "MISSING"}`);
      console.log(`      - status: ${heartbeatData1.room.status}`);
      console.log(`      - is_guest_ready: ${heartbeatData1.room.is_guest_ready}`);
    }
    console.log("");

    // 3. Join the room
    console.log("3. Joining as a guest...");
    await fetch(`${API_BASE}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, guestId: "test-guest-1" })
    });
    console.log("   ✅ Joined\n");

    // 4. Test Heartbeat (Updated State)
    console.log("4. Testing Heartbeat (After Join)...");
    const heartbeatRes2 = await fetch(`${API_BASE}/lobby/${roomId}`);
    const heartbeatData2 = await heartbeatRes2.json();

    if (heartbeatData2.room.status === "LOBBY_FULL") {
      console.log("   ✅ PASS: status updated to LOBBY_FULL");
    } else {
      console.log(`   ❌ FAIL: status is ${heartbeatData2.room.status}`);
    }
    
    if (heartbeatData2.room.guest_id === "test-guest-1") {
       console.log("   ✅ PASS: guest_id is present");
    } else {
       console.log(`   ❌ FAIL: guest_id is ${heartbeatData2.room.guest_id}`);
    }
    console.log("");

    // 5. Test Non-existent Room
    console.log("5. Testing Non-existent Room...");
    const heartbeatRes3 = await fetch(`${API_BASE}/lobby/non-existent-room`);
    if (heartbeatRes3.status === 404) {
      console.log("   ✅ PASS: Returns 404 for non-existent room");
    } else {
      const errorBody = await heartbeatRes3.json();
      console.log(`   ❌ FAIL: Returns ${heartbeatRes3.status} instead of 404`);
      console.log(`      Error: ${errorBody.error}`);
      console.log(`      Message: ${errorBody.message}`);
    }

  } catch (err: any) {
    console.error("❌ Test failed with error:", err.message);
  }

  console.log("\n🏁 Lobby Heartbeat Verification Complete.");
}

testLobbyHeartbeat();
