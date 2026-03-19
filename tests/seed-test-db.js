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

  // Chores must include keywords so the rule-based intent parser can match them.
  // Mirror a subset of the app's hardcoded CHORES constant with the same keyword format.
  const familyConfig = {
    familyName: 'Test Family',
    kids: {
      alex: { name: 'Alex', color: 'blue' },
      louisa: { name: 'Louisa', color: 'purple' }
    },
    chores: {
      make_bed:       { label: 'Make bed',            points: 1, kids: ['alex', 'louisa'], keywords: ['made bed', 'make bed', 'made their bed', 'beds'] },
      brush_teeth:    { label: 'Brush teeth',         points: 1, kids: ['alex', 'louisa'], keywords: ['brushed teeth', 'brush teeth', 'brushed'] },
      clean_room:     { label: 'Clean room',          points: 2, kids: ['alex', 'louisa'], keywords: ['cleaned room', 'clean room', 'tidied room'] },
      feed_dog_am:    { label: 'Feed dog (AM)',        points: 1, kids: ['alex', 'louisa'], keywords: ['fed the dog this morning', 'fed dog', 'dog food morning'] },
      feed_dog_pm:    { label: 'Feed dog (PM)',        points: 1, kids: ['alex', 'louisa'], keywords: ['fed the dog tonight', 'fed dog pm', 'dog food evening'] },
      homework:       { label: 'Homework',             points: 2, kids: ['alex', 'louisa'], keywords: ['did homework', 'homework done', 'finished homework'] }
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
  console.log(`  Chores: ${Object.keys(familyConfig.chores).length} chores with keywords`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
