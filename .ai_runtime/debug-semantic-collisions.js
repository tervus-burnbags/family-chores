const currentConfig = {
  kids: { alex: { name: 'Alex' }, louisa: { name: 'Louisa' } },
  chores: {
    feed_dog: { label: 'Feed dog', points: 1, keywords: ['feed', 'dog'] }
  }
};

function normalizeText(text) { return String(text || '').toLowerCase().trim(); }
function extractKidIds(text) {
  const n = normalizeText(text);
  if (n.includes('alex')) return ['alex'];
  if (n.includes('louisa')) return ['louisa'];
  return [];
}
function parsePoints(text) {
  const match = normalizeText(text).match(/(\d+)\s*points?/);
  return match ? Number(match[1]) : null;
}
function parseAmount(text) {
  const match = normalizeText(text).match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : null;
}

// Current Parser Snippets
function parseBankIntent(n, t, k) { 
  if (n.includes('spent') && k.length) return { intent: 'kid_spent' }; 
  if (/\b(paid|gave|pay)\b/.test(n) && k.length) return { intent: 'record_payment' };
  return null; 
}
function parseListIntent(n, t) { 
  if (n.match(/\b(?:add|put)\s+(.+?)\s+(?:to|on)\s+(.+?)(?:\s+list)?$/i)) return { intent: 'add_to_list' };
  return null; 
}

function parseIntent(text, currentTab) {
  const normalized = normalizeText(text);
  const kids = extractKidIds(text);
  
  // Simulation of the fallback chain in index.html
  let res = parseListIntent(normalized, text) || parseBankIntent(normalized, text, kids);
  if (res) return res;

  if (kids.length && parsePoints(text) !== null) {
    if (normalized.includes('spent') || normalized.includes('lost')) return { intent: 'remove_points' };
    return { intent: 'freepoints' };
  }
  
  return { intent: 'no_match' };
}

const collisions = [
  { input: "Alex spent 5 points", expected: "remove_points", actual: "", label: "Points-based spending (Bank vs Chore)" },
  { input: "Add $5 to Alex", expected: "record_payment", actual: "", label: "Dollar-based addition (List vs Bank)" },
  { input: "Add 5 points to grocery", expected: "add_to_list", actual: "", label: "Points-labeled list item (Chore vs List)" },
  { input: "Alex paid 10 points", expected: "remove_points", actual: "", label: "Payment verb with points (Bank vs Chore)" }
];

console.log('--- Semantic Collision Audit ---');
collisions.forEach(c => {
  const res = parseIntent(c.input, 'chores');
  const passed = res.intent === c.expected;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${c.label}`);
  console.log(`      Input: "${c.input}"`);
  console.log(`      Result: ${res.intent} (Expected: ${c.expected})`);
});
