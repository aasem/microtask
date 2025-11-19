/**
 * Test script to verify that external database modifications are detected
 * and the backend reloads data correctly.
 *
 * This simulates the scenario where:
 * 1. Backend is running
 * 2. Seed script modifies the database
 * 3. Backend detects the change and reloads
 */

const { getConnection } = require("./src/config/database");

async function testConcurrentAccess() {
  console.log("\n=== Testing Database External Modification Detection ===\n");

  try {
    // Step 1: Connect to database
    console.log("Step 1: Connecting to database...");
    const pool1 = await getConnection();

    // Check initial user count
    const result1 = await pool1
      .request()
      .query("SELECT COUNT(*) as count FROM Users");
    console.log(`Initial user count: ${result1.recordset[0].count}`);

    // Step 2: Simulate external modification
    console.log(
      "\nStep 2: Simulating external modification (like seed script)..."
    );
    console.log("⚠️  Now run: npm run seed");
    console.log("⚠️  Then press Enter to continue...");

    // Wait for user input
    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve());
    });

    // Step 3: Try to access database again - should detect modification
    console.log(
      "\nStep 3: Accessing database again (should detect external changes)..."
    );
    const pool2 = await getConnection();

    const result2 = await pool2
      .request()
      .query("SELECT COUNT(*) as count FROM Users");
    console.log(`User count after reload: ${result2.recordset[0].count}`);

    if (result2.recordset[0].count > result1.recordset[0].count) {
      console.log(
        "\n✅ SUCCESS: Database was reloaded and new data is visible!"
      );
    } else {
      console.log(
        "\n❌ FAILURE: Database was not reloaded or no new data was added."
      );
    }

    // List all users
    const users = await pool2
      .request()
      .query("SELECT id, name, email, role FROM Users");
    console.log("\nCurrent users in database:");
    users.recordset.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

testConcurrentAccess();
