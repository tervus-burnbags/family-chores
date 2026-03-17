const currentConfig = {
  kids: { alex: { name: 'Alex' }, louisa: { name: 'Louisa' } },
  chores: {
    feed_dog_am: { label: 'Feed dog (AM)', points: 1, keywords: ['feed', 'dog', 'morning'] },
    brush_teeth: { label: 'Brush teeth', points: 1, keywords: ['brush', 'teeth'] },
    unload_dishwasher: { label: 'Unload dishwasher', points: 2, keywords: ['unload', 'dishwasher', 'dishes'] }
  }
};

function normalizeText(text) { return String(text || '').toLowerCase().trim(); }
function extractKidIds(text) {
  const normalized = normalizeText(text);
  let ids = [];
  if (normalized.includes('alex')) ids.push('alex');
  if (normalized.includes('louisa')) ids.push('louisa');
  if (normalized.includes('both')) ids = ['alex', 'louisa'];
  return ids;
}
function parsePoints(text) {
  const match = normalizeText(text).match(/(\d+)\s*points?/);
  return match ? Number(match[1]) : null;
}
function parseAmount(text) {
  const match = normalizeText(text).match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : null;
}
function scoreChore(text, chore) {
  const tokens = new Set(normalizeText(text).split(' ').filter(Boolean));
  let best = 0;
  (chore.keywords || []).forEach((phrase) => {
    const phraseTokens = normalizeText(phrase).split(' ').filter(Boolean);
    let matched = 0;
    phraseTokens.forEach((token) => { if (tokens.has(token)) matched += 1; });
    best = Math.max(best, matched / (phraseTokens.length || 1));
  });
  return best;
}
function inferChore(text) {
  let best = null;
  Object.keys(currentConfig.chores).forEach(choreId => {
    let chore = currentConfig.chores[choreId];
    let score = scoreChore(text, chore);
    if (!best || score > (best ? best.score : -1)) best = { choreId, chore, score };
  });
  return best;
}

// Current Parser Logic
function parseListIntent(n, t) { 
  if (n.match(/\b(?:create|make|start)\s+(?:a\s+|new\s+)?list(?:\s+(?:called|named))?\s+(.+)$/i)) return { intent: 'create_list' };
  if (n.match(/\b(?:add|put)\s+(.+?)\s+(?:to|on)\s+(.+?)(?:\s+list)?$/i)) return { intent: 'add_to_list' };
  return null; 
}
function parseBankIntent(n, t, k) { 
  if (n.includes('spent') && k.length) return { intent: 'kid_spent' }; 
  if (/\b(paid|gave|pay)\b/.test(n) && k.length) return { intent: 'record_payment' };
  return null; 
}
function parseNoteIntent(n, t) { if (n.startsWith('pin:')) return { intent: 'log_note' }; return null; }

function parseIntent(text, currentTab) {
  const normalized = normalizeText(text);
  const kids = extractKidIds(text);
  var activeTab = currentTab || 'bulletin';

  if (activeTab === 'lists') { var res = parseListIntent(normalized, text); if (res) return res; }
  if (activeTab === 'bank') { var res = parseBankIntent(normalized, text, kids); if (res) return res; }
  if (activeTab === 'bulletin') { var res = parseNoteIntent(normalized, text); if (res) return res; }

  // Fallbacks
  var fList = activeTab !== 'lists' ? parseListIntent(normalized, text) : null; if (fList) return fList;
  var fBank = activeTab !== 'bank' ? parseBankIntent(normalized, text, kids) : null; if (fBank) return fBank;
  var fNote = activeTab !== 'bulletin' ? parseNoteIntent(normalized, text) : null; if (fNote) return fNote;

  if (kids.length && parsePoints(text) !== null) return { intent: 'freepoints' };
  
  var choreMatch = inferChore(text);
  if (kids.length && choreMatch && choreMatch.score >= 0.5) return { intent: 'log_chore' };
  
  return { intent: 'no_match' };
}

const scenarios = [
  { tab: 'chores', input: 'Alex finished the dishes', expected: 'log_chore', label: 'Natural chore completion' },
  { tab: 'lists', input: 'milk', expected: 'add_to_list', label: 'Implicit add (missing add/to)' },
  { tab: 'lists', input: 'buy eggs', expected: 'add_to_list', label: 'Missing target list name' },
  { tab: 'bank', input: 'Alex got $5', expected: 'record_payment', label: 'Informal payment verb' },
  { tab: 'bulletin', input: 'Remember picture day Tuesday', expected: 'log_note', label: 'Implicit note (missing pin:)' },
  { tab: 'bank', input: 'how much does alex have', expected: 'check_status', label: 'Natural question' }
];

console.log('--- Natural Language Usability Audit ---');
scenarios.forEach(s => {
  const res = parseIntent(s.input, s.tab);
  const passed = res.intent === s.expected;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${s.label}`);
  console.log(`      Input: \"${s.input}\" on ${s.tab} tab`);
  console.log(`      Result: ${res.intent} (Expected: ${s.expected})`);
});
