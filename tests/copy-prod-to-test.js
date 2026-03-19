// tests/copy-prod-to-test.js
// Copies the family config from your real Firebase to the test database.
// Copies config, chores, payTiers, weeklyBonus, and balances.
// Does NOT copy log entries or payments (keeps test DB clean).
//
// Usage:
//   FAMILY_CODE=YOURREALFAMILYCODE node tests/copy-prod-to-test.js
//
// Run once to seed the test DB. Re-run whenever your real config changes.

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');

const FAMILY_CODE = process.env.FAMILY_CODE;
if (!FAMILY_CODE) {
  console.error('Error: FAMILY_CODE env var is required (your real family code).');
  process.exit(1);
}

// Production Firebase
const prodConfig = {
  apiKey: "AIzaSyAw9wKpzo40N5fQ-PHlWn5X8lyfZ9gQ4bE",
  authDomain: "family-chores-2e3f4.firebaseapp.com",
  databaseURL: "https://family-chores-2e3f4-default-rtdb.firebaseio.com",
  projectId: "family-chores-2e3f4",
};

// Test Firebase
const testConfig = {
  apiKey: "AIzaSyADHbvgo1HAj8aAIIh-gKcYg0Ly5GPkwTE",
  authDomain: "family-hub-test-8f868.firebaseapp.com",
  databaseURL: "https://family-hub-test-8f868-default-rtdb.firebaseio.com",
  projectId: "family-hub-test-8f868",
};

// Use same family code in test DB so tests don't need a different code
const TEST_FAMILY_CODE = 'TESTFAM1';

async function copy() {
  const prodApp = initializeApp(prodConfig, 'prod');
  const testApp = initializeApp(testConfig, 'test');
  const prodDb = getDatabase(prodApp);
  const testDb = getDatabase(testApp);

  const sections = ['config', 'balances'];
  let copied = 0;

  for (const section of sections) {
    const snap = await get(ref(prodDb, `families/${FAMILY_CODE}/${section}`));
    if (snap.exists()) {
      await set(ref(testDb, `families/${TEST_FAMILY_CODE}/${section}`), snap.val());
      console.log(`✓ Copied ${section}`);
      copied++;
    } else {
      console.log(`  - ${section}: not found in prod, skipping`);
    }
  }

  // Reset balances to zero in test so we start clean
  await set(ref(testDb, `families/${TEST_FAMILY_CODE}/balances`), {
    alex:   { owed: 0 },
    louisa: { owed: 0 }
  });
  console.log(`✓ Reset balances to $0 in test DB`);

  console.log(`\n✓ Done. Test family code: TESTFAM1`);
  console.log(`  Run tests with: FAMILY_CODE=TESTFAM1 npx playwright test`);
  process.exit(0);
}

copy().catch((err) => {
  console.error('Copy failed:', err);
  process.exit(1);
});
