'use strict';
const { fromUSDA, fromOFF } = require('../fitness/nutrition.js');

// No Admin SDK or service-account key needed. accounts:lookup validates the token
// in the project selected by the existing Firebase web API key; reading the
// family config with that same token proves the caller holds a real family code.
function createHandler({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const requests = new Map();
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { error: 'Use POST.' }); }
    const databaseUrl = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)$/.test(env.FIREBASE_DATABASE_URL || '') ? env.FIREBASE_DATABASE_URL : '';
    if (!env.FIREBASE_WEB_API_KEY || !databaseUrl) return send(503, { error: 'Food search needs server setup. Manual foods still work.' });
    const token = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token || token.length > 10000) return send(401, { error: 'Sign in to search.' });
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return send(400, { error: 'Invalid request.' }); }
    if (!body || !['usda', 'barcode'].includes(body.provider)) return send(400, { error: 'Choose a food source.' });
    const query = String(body.query || '').trim();
    if (body.provider === 'barcode' ? !/^\d{8,14}$/.test(query) : query.length < 2 || query.length > 120) return send(400, { error: 'Enter a food name or an 8–14 digit barcode.' });
    const familyId = String(body.familyId || '');
    if (!/^[A-Z0-9]{1,8}$/.test(familyId)) return send(400, { error: 'Join your family in Family Hub first.' });
    try {
      const identity = await fetchImpl('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(env.FIREBASE_WEB_API_KEY), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(8000)
      });
      if (!identity.ok) return send(401, { error: 'Your session expired. Sign in again.' });
      const account = (await identity.json()).users?.[0];
      if (!account || !account.localId || account.disabled === true) return send(401, { error: 'Your session expired. Reopen Steady.' });
      const family = await fetchImpl(databaseUrl + '/families/' + familyId + '/config.json?shallow=true&auth=' + encodeURIComponent(token), { signal: AbortSignal.timeout(8000) });
      if (!family.ok || (await family.json()) == null) return send(403, { error: 'This family code was not found.' });
      const now = Date.now();
      const recent = (requests.get(account.localId) || []).filter(t => now - t < 60000);
      if (recent.length >= 30) { res.setHeader('Retry-After', '60'); return send(429, { error: 'Please wait a minute before searching again.' }); }
      recent.push(now); requests.set(account.localId, recent);
      let upstream;
      if (body.provider === 'usda') {
        if (!env.USDA_API_KEY) return send(503, { error: 'USDA search needs a server API key. Manual foods and barcode lookup are available.' });
        upstream = await fetchImpl('https://api.nal.usda.gov/fdc/v1/foods/search?api_key=' + encodeURIComponent(env.USDA_API_KEY), {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, pageSize: 15, pageNumber: 1 }), signal: AbortSignal.timeout(10000)
        });
      } else {
        upstream = await fetchImpl('https://world.openfoodfacts.org/api/v2/product/' + query + '.json?fields=code,product_name,product_name_en,nutriments', {
          headers: { 'User-Agent': 'FamilyHubFitness/1.0 (https://github.com/tervus-burnbags/family-chores)' }, signal: AbortSignal.timeout(10000)
        });
      }
      if (upstream.status === 404 && body.provider === 'barcode') return send(200, { foods: [] });
      if (!upstream.ok) return send(502, { error: 'The food source is unavailable. Try again or enter the label manually.' });
      const data = await upstream.json();
      const foods = body.provider === 'usda' ? (Array.isArray(data.foods) ? data.foods.filter(f => f && typeof f === 'object').map(fromUSDA) : []) : data.status === 1 && data.product ? [fromOFF(data.product, query)] : [];
      return send(200, { foods });
    } catch {
      // Do not echo upstream URLs, API keys, tokens or upstream error bodies.
      return send(502, { error: 'Food lookup timed out or could not connect. Try again or enter the label manually.' });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
