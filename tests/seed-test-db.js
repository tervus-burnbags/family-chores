// tests/seed-test-db.js
// Seeds the test Firebase database with a minimal family config.
// Run once before the first test run:
//   node tests/seed-test-db.js
//
// Safe to re-run — it overwrites with the same data each time.

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

const FAMILY_CODE = process.env.FAMILY_CODE || 'TESTFAM1';

const firebaseConfig = {
  apiKey: "AIzaSyADHbvgo1HAj8aAIIh-gKcYg0Ly5GPkwTE",
  authDomain: "family-hub-test-8f868.firebaseapp.com",
  databaseURL: "https://family-hub-test-8f868-default-rtdb.firebaseio.com",
  projectId: "family-hub-test-8f868",
  storageBucket: "family-hub-test-8f868.firebasestorage.app",
  messagingSenderId: "1035088793252",
  appId: "1:1035088793252:web:153a55fdc8957787526031"
};

async function seed() {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  const familyConfig = {
    familyName: 'Test Family',
    kids: {
      alex: { name: 'Alex', color: 'blue' },
      louisa: { name: 'Louisa', color: 'purple' }
    },
    chores: {
      make_bed:     { label: 'Make bed',       points: 2 },
      brush_teeth:  { label: 'Brush teeth',    points: 1 },
      clean_room:   { label: 'Clean room',     points: 3 },
      take_out_trash: { label: 'Take out trash', points: 2 },
      do_dishes:    { label: 'Do dishes',      points: 2 },
      feed_pet:     { label: 'Feed pet',       points: 1 },
      homework:     { label: 'Homework',       points: 3 },
      set_table:    { label: 'Set table',      points: 1 },
      clear_table:  { label: 'Clear table',    points: 1 },
      vacuum:       { label: 'Vacuum',         points: 3 }
    },
    payTiers: {
      alex:   [{ minPts: 0, pay: 0 }, { minPts: 10, pay: 5 }, { minPts: 20, pay: 10 }],
      louisa: [{ minPts: 0, pay: 0 }, { minPts: 10, pay: 5 }, { minPts: 20, pay: 10 }]
    },
    weeklyBonus: {
      alex:   { extraPts: 30, bonus: 2 },
      louisa: { extraPts: 30, bonus: 2 }
    }
  };

  await set(ref(db, `families/${FAMILY_CODE}/config`), familyConfig);
  await set(ref(db, `families/${FAMILY_CODE}/balances`), {
    alex:   { owed: 0 },
    louisa: { owed: 0 }
  });

  console.log(`✓ Seeded test database for family: ${FAMILY_CODE}`);
  console.log(`  Kids: Alex, Louisa`);
  console.log(`  Chores: ${Object.keys(familyConfig.chores).length} chores`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
