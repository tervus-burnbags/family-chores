const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const F = require('../nutrition.js');
const { fingerprint, planReview, applyChanges } = require('../../scripts/fitness/review-meals.cjs');
const near = (actual,expected) => assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const sample = { name:'Test label',calories:200,protein:10,carbs:20,fat:8 };

test('empty input is unknown; confirmed zero stays zero',()=>{
  for(const value of [null,undefined,'','  '])assert.equal(F.number(value),null);
  assert.equal(F.number('0'),0);assert.equal(F.number(0),0);
  for(const value of [-1,NaN,Infinity,'bad',{},true])assert.throws(()=>F.number(value));
});
test('mass conversions are exact; volume is never guessed',()=>{
  near(F.grams(1,'oz'),28.349523125);near(F.grams(1,'lb'),453.59237);near(F.grams(1.5,'kg'),1500);
  for(const unit of ['ml','cup','tsp','banana'])assert.throws(()=>F.grams(1,unit));
  for(const amount of [0,-1,'',Infinity])assert.throws(()=>F.grams(amount));
});
test('measurement units round trip',()=>{
  near(F.pounds(77.56429527,'kg'),171);near(F.inches(93.98,'cm'),37);
  assert.throws(()=>F.pounds(2,'g'));assert.throws(()=>F.inches(3,'ft'));
});
test('per-100g food scaling and per-serving regulars differ explicitly',()=>{
  assert.deepEqual(F.scale(sample,150),{calories:300,protein:15,carbs:30,fat:12});
  assert.deepEqual(F.servings(sample,2),{calories:400,protein:20,carbs:40,fat:16});
  assert.equal(F.scale({calories:0},120).calories,0);assert.equal(F.scale({calories:0},120).protein,null);
});
test('known subtotals cannot masquerade as complete daily totals',()=>{
  const sum=F.totals([{nutrition:{calories:100,protein:2}},{nutrition:{calories:null,protein:0}}]);
  assert.equal(sum.known.calories,100);assert.equal(sum.complete.calories,null);assert.equal(sum.missing.calories,1);
  assert.equal(sum.complete.protein,2);assert.equal(sum.complete.fat,null);
  assert.equal(F.totals([]).complete.calories,0);
});
test('cooked batch weight controls recipe density, with no intermediate rounding',()=>{
  const ingredients=[{food:sample,grams:150},{food:{...sample,calories:100},grams:100}];
  const recipe=F.recipe(ingredients,500);
  near(recipe.calories,80);near(recipe.caloriesPerGram,.8);near(F.scale(recipe,125).calories,100);
  near(F.recipe(ingredients,250).calories,160);
  assert.throws(()=>F.recipe([],100));assert.throws(()=>F.recipe(ingredients,0));
});
test('one unknown ingredient propagates only its missing nutrients',()=>{
  const recipe=F.recipe([{food:sample,grams:100},{food:{calories:100},grams:100}],200);
  assert.equal(recipe.calories,150);assert.equal(recipe.protein,null);assert.equal(recipe.fat,null);
});
test('7-day averages use calendar windows, omit missing weights and exclude future readings',()=>{
  const readings=[{date:'2026-10-18',weight:999},{date:'2026-10-19',weight:170},{date:'2026-10-22',weight:168},{date:'2026-10-24',waist:36},{date:'2026-10-25',weight:166}];
  assert.equal(F.movingAverage(readings,'2026-10-25'),168);
  near(F.movingAverage(readings,'2026-10-24'),(999+170+168)/3);
  assert.equal(F.movingAverage(readings,'2026-10-10'),null);
  assert.equal(F.dateDay('2026-03-09')-F.dateDay('2026-03-08'),1);
  for(const key of ['2026-02-30','2026-13-01','today','2026-1-01'])assert.throws(()=>F.dateDay(key));
});
test('goal progress handles loss, gain, and overshoot',()=>{
  near(F.progress(171,165.5,160),.5);assert.equal(F.progress(171,180,160),0);assert.equal(F.progress(171,155,160),1);
  near(F.progress(150,155,160),.5);assert.equal(F.progress(171,null,160),0);
});
test('USDA adapter accepts documented nutrient IDs and units, never derives missing energy',()=>{
  const food=F.fromUSDA({description:'Sample',fdcId:1,foodNutrients:[{nutrientId:1008,unitName:'KCAL',value:200},{nutrientId:1003,unitName:'G',value:0},{nutrientId:1004,unitName:'g',value:8}]});
  assert.equal(food.calories,200);assert.equal(food.protein,0);assert.equal(food.carbs,null);
  assert.equal(F.fromUSDA({foodNutrients:[{nutrientId:1008,unitName:'kJ',value:100}]}).calories,null);
  assert.equal(F.fromUSDA({foodNutrients:[{nutrientId:2048,unitName:'kcal',value:150}]}).calories,150);
});
test('Open Food Facts handles zero, missing, invalid and explicit kJ conversions',()=>{
  const food=F.fromOFF({product_name:'Sample',nutriments:{'energy-kj_100g':418.4,proteins_100g:0,fat_100g:-1}},'12345678');
  near(food.calories,100);assert.equal(food.protein,0);assert.equal(food.carbs,null);assert.equal(food.fat,null);
  assert.equal(F.fromOFF({nutriments:{fat_100g:3}},'x').calories,null);
});
test('CSV preserves quotes, Unicode, missing values and protects spreadsheet formulas',()=>{
  const csv=F.csv([['Food','Calories'],['a,"b"\nc',null],[' =HYPERLINK("x")',12],[-1,'@formula']]);
  assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"a,""b""\nc",""'));
  assert.ok(csv.includes('"\' =HYPERLINK'));assert.ok(csv.includes('"-1","\'@formula"'));
});
test('full backups round trip and reject bad units/data/keys',()=>{
  const data=F.empty();data.foods.sample={...sample,defaultGrams:120};data.foodLogs.x={name:'Snack',date:'2026-10-26',quantity:1,nutrition:{calories:100}};
  assert.deepEqual(F.validateBackup(data),data);
  assert.throws(()=>F.validateBackup({...data,schemaVersion:2}));
  assert.throws(()=>F.validateBackup({...data,measurements:{x:{date:'2026-02-30',weight:10}}}));
  assert.throws(()=>F.validateBackup(JSON.parse('{"schemaVersion":1,"foods":{"__proto__":{}}}')));
  assert.throws(()=>F.validateBackup({...data,settings:{calories:-1}}));
});
test('disabled reminders tolerate Firebase omitting empty arrays',()=>{
  const data=F.empty();data.reminders.daily={enabled:false,time:'18:00'};
  assert.deepEqual(F.validateBackup(data).reminders.daily.days,[]);
  assert.throws(()=>F.validateBackup({...data,reminders:{daily:{enabled:true,time:'18:00'}}}));
});
test('review updates are scoped, preserve historical snapshots, and divide two coffees correctly',()=>{
  const current=F.empty();current.routines.coffee={name:'Coffee',description:'280 ml coffee + 120 g milk'};
  current.foodLogs.a={name:'Coffee',date:'2026-10-26',quantity:2,nutrition:{},description:'Exact coffee description'};
  current.foodLogs.history={name:'Coffee',date:'2026-10-25',quantity:1,nutrition:{calories:50}};
  current.mealNotes.a={logId:'a',routineId:'coffee',date:'2026-10-26',status:'pending'};
  const entries=[{noteId:'a',expectedLogHash:fingerprint(current.foodLogs.a),nutrition:{calories:120,protein:8},source:'Synthetic test label',updateRoutine:true}];
  const changes=planReview(current,entries),next=applyChanges(current,changes);
  assert.equal(next.routines.coffee.calories,60);assert.equal(next.foodLogs.a.nutrition.calories,120);
  assert.equal(next.routines.coffee.description,'280 ml coffee + 120 g milk');assert.equal(next.mealNotes.a.status,'reviewed');
  assert.deepEqual(next.foodLogs.history,current.foodLogs.history);assert.equal(next.routines.coffee.protein,4);
  assert.equal(next.routines.coffee.carbs,undefined);assert.equal(current.foodLogs.a.nutrition.calories,undefined);
  assert.throws(()=>planReview(next,entries));
  assert.throws(()=>planReview(current,[{...entries[0],expectedLogHash:'old'}]));
  assert.throws(()=>planReview(current,[{...entries[0],source:''}]));
});
test('fitness and hub workers cache only exact public shell paths and preserve sibling caches',async()=>{
  for(const [file,prefix] of [['sw.js','hub-v'],['fitness/sw.js','steady-shell-']]){
    const handlers={}, deleted=[], cached=[];
    const existing=['hub-v1','hub-v64','steady-shell-v0','steady-shell-v1','other-app'];
    const context={URL,Set,Promise,self:{location:{href:'https://example.com/'+file},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}},skipWaiting:()=>{}},
      caches:{keys:async()=>existing,delete:async key=>deleted.push(key),open:async()=>({addAll:async()=>{},put:async req=>cached.push(typeof req==='string'?req:req.url)}),match:async()=>null},fetch:async()=>({ok:true,clone:()=>({})})};
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8'),context);
    await new Promise(resolve=>handlers.activate({waitUntil:promise=>promise.then(resolve)}));
    assert.ok(deleted.length);assert.ok(deleted.every(key=>key.startsWith(prefix)));assert.ok(!deleted.includes('other-app'));
    for(const url of ['https://example.com/api/fitness-foods','https://example.firebaseio.com/families/FAM12345/fitness/travis.json','https://example.com/fitness/?token=private']){
      let responded=false;handlers.fetch({request:{url,method:'GET'},respondWith:()=>responded=true});assert.equal(responded,false);
    }
    let responded=false;handlers.fetch({request:{url:'https://example.com/'+(file==='sw.js'?'index.html':'fitness/index.html'),method:'GET'},respondWith:promise=>{responded=true;promise.catch(()=>{});}});assert.equal(responded,true);
    if(file==='sw.js'){
      let request;
      handlers.fetch({request:{url:'https://example.com/?family=SHARED01',method:'GET'},respondWith:promise=>request=promise});
      await request;assert.ok(cached.includes('https://example.com/'));assert.ok(cached.every(url=>!url.includes('family=')));
      context.fetch=async()=>{throw new Error('Offline');};let fallback;
      context.caches.match=async url=>{fallback=url;return 'cached-shell';};
      handlers.fetch({request:{url:'https://example.com/?family=SHARED01',method:'GET'},respondWith:promise=>request=promise});
      assert.equal(await request,'cached-shell');assert.equal(fallback,'https://example.com/');
    }
  }
});
