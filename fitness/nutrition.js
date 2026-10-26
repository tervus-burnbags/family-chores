/* Shared by the static PWA, the food proxy and dependency-free Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Fitness = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const nutrients = ['calories', 'protein', 'carbs', 'fat'];
  const defaults = Object.freeze({ calories: 1600, protein: 120, startWeight: 171, startWaist: 37, goalWeight: 160, goalWaist: 35 });
  function number(value, allowNull = true) {
    if (value == null || (typeof value === 'string' && !value.trim())) {
      if (allowNull) return null;
      throw new Error('Enter a number.');
    }
    if (!['number', 'string'].includes(typeof value)) throw new Error('Enter a valid number.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw new Error('Use a finite, nonnegative number.');
    return n;
  }
  function positive(value) {
    const n = number(value, false);
    if (n <= 0) throw new Error('Amount must be greater than zero.');
    return n;
  }
  function grams(value, unit = 'g') {
    const factor = { g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 }[unit];
    if (!factor) throw new Error('Use a mass unit (g, kg, oz or lb). Volume needs a measured gram weight.');
    return positive(value) * factor;
  }
  function pounds(value, unit = 'lb') {
    if (!['lb', 'kg'].includes(unit)) throw new Error('Use lb or kg.');
    return positive(value) * (unit === 'kg' ? 2.2046226218487757 : 1);
  }
  function inches(value, unit = 'in') {
    if (!['in', 'cm'].includes(unit)) throw new Error('Use in or cm.');
    return positive(value) / (unit === 'cm' ? 2.54 : 1);
  }
  function nutrition(input = {}) {
    return Object.fromEntries(nutrients.map(key => [key, number(input[key])]));
  }
  function scale(food, mass) {
    const factor = positive(mass) / 100;
    const values = nutrition(food);
    return Object.fromEntries(nutrients.map(key => [key, values[key] == null ? null : values[key] * factor]));
  }
  function servings(food, quantity) {
    const factor = positive(quantity);
    const values = nutrition(food);
    return Object.fromEntries(nutrients.map(key => [key, values[key] == null ? null : values[key] * factor]));
  }
  function totals(entries) {
    const known = Object.fromEntries(nutrients.map(key => [key, 0]));
    const missing = Object.fromEntries(nutrients.map(key => [key, 0]));
    entries.forEach(entry => nutrients.forEach(key => {
      const value = number((entry.nutrition || entry)[key]);
      if (value == null) missing[key]++;
      else known[key] += value;
    }));
    return { known, missing, complete: Object.fromEntries(nutrients.map(key => [key, missing[key] ? null : known[key]])) };
  }
  function recipe(ingredients, batchGrams) {
    if (!Array.isArray(ingredients) || !ingredients.length) throw new Error('Add at least one ingredient.');
    const batch = positive(batchGrams);
    const sum = totals(ingredients.map(item => ({ nutrition: scale(item.food, item.grams) })));
    const per100 = Object.fromEntries(nutrients.map(key => [key, sum.complete[key] == null ? null : sum.complete[key] / batch * 100]));
    return { ...per100, batchGrams: batch, caloriesPerGram: sum.complete.calories == null ? null : sum.complete.calories / batch };
  }
  function dateKey(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }
  function dateDay(key) {
    if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error('Use a valid date.');
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) throw new Error('Use a valid date.');
    return dt.getTime() / 86400000;
  }
  function movingAverage(readings, endDate) {
    const end = dateDay(endDate);
    const values = readings.filter(r => {
      const day = dateDay(r.date);
      return day <= end && day > end - 7 && r.weight != null;
    }).map(r => positive(r.weight));
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  }
  function progress(start, current, goal) {
    if (current == null) return 0;
    if (start === goal) return current === goal ? 1 : 0;
    return Math.max(0, Math.min(1, (current - start) / (goal - start)));
  }
  function importedNumber(value) {
    try { return number(value); } catch { return null; }
  }
  function fromUSDA(food) {
    const items = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
    function nutrient(ids, unit) {
      for (const id of ids) {
        const match = items.find(n => Number(n.nutrientId ?? n.nutrient?.id) === id && String(n.unitName ?? n.nutrient?.unitName).toLowerCase() === unit);
        const value = match && importedNumber(match.value ?? match.amount);
        if (value != null) return value;
      }
      return null;
    }
    return { name: String(food.description || 'Unnamed USDA food'), source: 'USDA FoodData Central', sourceId: String(food.fdcId || ''),
      basis: food.dataType === 'Branded' ? '100 g / 100 ml (check package)' : '100 g', requiresBasisConfirmation: food.dataType === 'Branded',
      calories: nutrient([1008, 2048, 2047], 'kcal'), protein: nutrient([1003], 'g'), carbs: nutrient([1005], 'g'), fat: nutrient([1004], 'g') };
  }
  function fromOFF(product, barcode) {
    const n = product.nutriments || {};
    // Explicit unit conversion is permitted; deriving calories from macros is not.
    const kcal = importedNumber(n['energy-kcal_100g']);
    const kj = importedNumber(n['energy-kj_100g'] ?? (n.energy_unit === 'kJ' ? n.energy_100g : null));
    return { name: String(product.product_name || product.product_name_en || 'Unnamed packaged food'), source: 'Open Food Facts', sourceId: String(barcode),
      basis: '100 g / 100 ml (check package)', requiresBasisConfirmation: true,
      calories: kcal ?? (kj == null ? null : kj / 4.184), protein: importedNumber(n.proteins_100g), carbs: importedNumber(n.carbohydrates_100g), fat: importedNumber(n.fat_100g) };
  }
  function csvCell(value) {
    let text = value == null ? '' : String(value);
    if (typeof value === 'string' && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function csv(rows) { return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n'); }
  function empty() { return { schemaVersion: 1, settings: { ...defaults }, foods: {}, meals: {}, recipes: {}, routines: {}, mealNotes: {}, reminders: {}, foodLogs: {}, workouts: {}, exerciseLogs: {}, measurements: {} }; }
  function validateBackup(data) {
    if (!data || data.schemaVersion !== 1 || typeof data !== 'object' || Array.isArray(data)) throw new Error('Unsupported backup format.');
    const safe = JSON.parse(JSON.stringify(data));
    const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
    let count = 0;
    function walk(item, depth = 0) {
      if (depth > 15) throw new Error('Backup is too deeply nested.');
      if (!item || typeof item !== 'object') return;
      for (const [key, value] of Object.entries(item)) {
        if (forbidden.has(key) || /[.#$\[\]\/]/.test(key)) throw new Error('Backup contains invalid keys.');
        if (++count > 200000) throw new Error('Backup is too large.');
        walk(value, depth + 1);
      }
    }
    walk(safe);
    const out = empty();
    for (const key of Object.keys(defaults)) out.settings[key] = positive(safe.settings?.[key] ?? defaults[key]);
    function name(record) { if (typeof record.name !== 'string' || !record.name.trim() || record.name.length > 300) throw new Error('Backup contains an invalid name.'); }
    function portion(record) { name(record); if (record.grams != null) positive(record.grams); else positive(record.quantity); nutrition(record.nutrition); }
    function parts(items) {
      if (!Array.isArray(items) || !items.length || items.length > 200) throw new Error('Backup contains invalid ingredients.');
      items.forEach(item => { positive(item.grams); name(item.food); nutrition(item.food); });
    }
    for (const map of Object.keys(out).filter(k => !['schemaVersion', 'settings'].includes(k))) {
      const records = safe[map] || {};
      if (typeof records !== 'object' || Array.isArray(records) || Object.keys(records).length > 10000) throw new Error('Invalid record collection.');
      for (const record of Object.values(records)) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid record.');
        if (map === 'foods') { name(record); nutrition(record); positive(record.defaultGrams || 100); }
        if (map === 'routines') { name(record); nutrition(record); if (typeof record.description !== 'string') throw new Error('Invalid routine description.'); }
        if (map === 'mealNotes') { dateDay(record.date); if (!['pending', 'reviewed'].includes(record.status) || typeof record.text !== 'string' || !record.text.trim()) throw new Error('Invalid meal note.'); }
        if (map === 'reminders') { record.days ||= []; if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time) || !Array.isArray(record.days) || record.days.some(day => !Number.isInteger(day) || day < 0 || day > 6) || (record.enabled && !record.days.length)) throw new Error('Invalid reminder.'); }
        if (['recipes', 'meals', 'workouts'].includes(map)) name(record);
        if (['recipes', 'meals'].includes(map)) { parts(record.ingredients); if (map === 'recipes') { positive(record.batchGrams); nutrition(record); } }
        if (map === 'foodLogs') { portion(record); dateDay(record.date); }
        if (map === 'measurements') { dateDay(record.date); if (record.weight != null) positive(record.weight); if (record.waist != null) positive(record.waist); }
        if (map === 'exerciseLogs') { name(record); dateDay(record.date); if (!Array.isArray(record.sets) || !record.sets.length) throw new Error('Invalid exercise sets.'); record.sets.forEach(set => { positive(set.reps || set.seconds); number(set.weight); }); }
        if (map === 'workouts') {
          if (!Array.isArray(record.exercises) || !record.exercises.length) throw new Error('Invalid workout.');
          record.exercises.forEach(ex => { name(ex); if (!['reps', 'seconds'].includes(ex.kind)) throw new Error('Invalid exercise kind.'); positive(ex.sets); positive(ex.target); });
        }
      }
      out[map] = records;
    }
    return out;
  }
  return { nutrients, defaults, number, positive, grams, pounds, inches, nutrition, scale, servings, totals, recipe, dateKey, dateDay, movingAverage, progress, fromUSDA, fromOFF, csv, empty, validateBackup };
}));
