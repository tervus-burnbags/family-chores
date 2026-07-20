// tests/seed-test-events.js
// Seeds the TEST Firebase database with events for the Around Charlotte section.
// Never touches the real family database.
//
//   node tests/seed-test-events.js
//
// Covers the cases the UI has to survive: a normal event, a going/dismissed
// verdict, an already-expired event, one with only a startDate, one missing
// every optional field, and one with HTML in its title.

const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
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

function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const events = {
  evt_normal01: {
    id: 'evt_normal01',
    title: 'Test Renaissance Festival',
    dateText: 'Weekends only, rain or shine',
    startDate: isoDaysFromNow(30),
    endDate: isoDaysFromNow(60),
    where: 'Huntersville, ~25 min',
    cost: '$36 adult / $22 kids',
    ticketNote: 'Date-specific tickets, buy in advance',
    blurb: 'Outdoor festival with jousting and artisan booths.',
    why: 'Full day outdoors that works for both kids.',
    url: 'https://example.com/renfest',
    tags: ['outdoor', 'festival'],
    addedAt: Date.now(),
    verdict: null,
    verdictAt: null
  },
  evt_going001: {
    id: 'evt_going001',
    title: 'Test Going Event',
    dateText: 'Later than the others on purpose',
    // Deliberately the LAST date, so if it sorts first the "going pins to top" rule works.
    startDate: isoDaysFromNow(90),
    where: 'Uptown',
    cost: 'Free',
    blurb: 'Should appear pinned above everything else.',
    why: 'Verifies going-first sorting.',
    url: 'https://example.com/going',
    tags: ['indoor'],
    addedAt: Date.now(),
    verdict: 'going',
    verdictAt: Date.now()
  },
  evt_dismiss1: {
    id: 'evt_dismiss1',
    title: 'Test Dismissed Event',
    dateText: 'Should be hidden behind the toggle',
    startDate: isoDaysFromNow(20),
    where: 'Somewhere',
    cost: 'Free',
    blurb: 'Should not appear in the main list.',
    why: 'Verifies dismissed filtering.',
    url: 'https://example.com/dismissed',
    tags: ['indoor'],
    addedAt: Date.now(),
    verdict: 'no',
    verdictAt: Date.now()
  },
  evt_expired1: {
    id: 'evt_expired1',
    title: 'Test Expired Event',
    dateText: 'Already over',
    startDate: isoDaysFromNow(-40),
    endDate: isoDaysFromNow(-10),
    where: 'Past',
    cost: 'Free',
    blurb: 'Should be filtered out as expired.',
    why: 'Verifies expiry filtering.',
    url: 'https://example.com/expired',
    tags: ['outdoor'],
    addedAt: Date.now(),
    verdict: null,
    verdictAt: null
  },
  evt_endstoday: {
    id: 'evt_endstoday',
    title: 'Test Ends Today Event',
    dateText: 'Ends today — must still show',
    startDate: isoDaysFromNow(-5),
    endDate: isoDaysFromNow(0),
    where: 'Boundary',
    cost: 'Free',
    blurb: 'Verifies the expiry boundary is inclusive of today.',
    why: 'An event ending today has not expired yet.',
    url: 'https://example.com/today',
    tags: ['outdoor'],
    addedAt: Date.now(),
    verdict: null,
    verdictAt: null
  },
  evt_minimal1: {
    id: 'evt_minimal1',
    title: 'Test Minimal Event',
    startDate: isoDaysFromNow(25),
    addedAt: Date.now()
    // Every optional field missing on purpose: must render without blowing up
    // and without leaving stray separators.
  },
  evt_escape01: {
    id: 'evt_escape01',
    title: '<script>alert("xss")</script> & "quoted"',
    dateText: '<b>not bold</b>',
    startDate: isoDaysFromNow(26),
    where: 'Escaping test',
    cost: 'Free',
    blurb: 'Title and fields must render as literal text.',
    why: 'Verifies escaping.',
    url: 'https://example.com/escape',
    tags: ['indoor'],
    addedAt: Date.now(),
    verdict: null,
    verdictAt: null
  }
};

async function seed() {
  const app = initializeApp(firebaseConfig);
  // Rules require auth != null, so sign in before writing.
  await signInAnonymously(getAuth(app));
  const db = getDatabase(app);
  await set(ref(db, `families/${FAMILY_CODE}/events`), events);
  console.log(`✓ Seeded ${Object.keys(events).length} test events for family: ${FAMILY_CODE}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
