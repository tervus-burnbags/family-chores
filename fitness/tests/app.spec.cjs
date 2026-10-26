const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
async function demo(page){
  await page.route('https://**',route=>route.abort());
  await page.goto('/fitness/');await page.getByRole('button',{name:'Try a session-only demo'}).click();
}
async function manual(page,name='Lunch',calories='450'){
  await page.getByRole('button',{name:'Log calories',exact:true}).click();
  await page.getByLabel('Food or meal',{exact:true}).fill(name);await page.getByLabel('Calories (kcal)',{exact:true}).fill(calories);
  await page.getByRole('button',{name:'Add to diary',exact:true}).click();
}
async function backup(page){
  await page.getByRole('link',{name:'More',exact:true}).click();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Full JSON backup'}).click();
  const download=await pending;return JSON.parse(fs.readFileSync(await download.path(),'utf8'));
}
test('direct calories need no food library or protein; exercise does not change the budget',async({page})=>{
  await demo(page);await expect(page.getByTestId('remaining')).toHaveText('1,600');
  await manual(page);await expect(page.getByTestId('remaining')).toHaveText('1,150');
  await page.getByRole('link',{name:'Move',exact:true}).click();await page.getByRole('button',{name:'+ Log movement'}).click();
  await page.getByLabel('Exercise',{exact:true}).fill('Squats');await page.getByRole('button',{name:'Save completed sets'}).click();
  await page.getByRole('link',{name:'Today',exact:true}).click();await expect(page.getByTestId('remaining')).toHaveText('1,150');
  const data=await backup(page);expect(Object.values(data.exerciseLogs)).toHaveLength(1);expect(Object.values(data.foodLogs)[0].nutrition.protein).toBeNull();
});
test('two coffees stay unknown until review, and a regular update affects future logs',async({page})=>{
  await demo(page);const coffee=page.locator('.quick-card').filter({hasText:'My coffee'});
  await coffee.getByRole('button',{name:'+ Two'}).click();await expect(page.getByTestId('remaining')).toHaveText('—');
  await expect(page.getByText('280 ml coffee + 120 g of 2% milk. Usually twice a day.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'See notes'}).click();await page.getByRole('button',{name:'Enter reviewed nutrition'}).click();
  await page.getByLabel('Calories (kcal)',{exact:true}).fill('120');await page.getByLabel('Nutrition source / assumptions').fill('Synthetic test fixture, not a real milk label');
  await page.getByLabel('Also update this regular').check();await page.getByRole('button',{name:'Save reviewed values'}).click();
  await expect(page.getByTestId('remaining')).toHaveText('1,480');
  await page.locator('.quick-card').filter({hasText:'My coffee'}).getByRole('button',{name:'+ One'}).click();
  await expect(page.getByTestId('remaining')).toHaveText('1,420');const data=await backup(page);expect(data.routines.coffee.calories).toBe(60);expect(Object.values(data.foodLogs).map(l=>l.nutrition.calories).sort((a,b)=>a-b)).toEqual([60,120]);
});
test('plain-language notes enter the review queue without invented nutrition',async({page})=>{
  await demo(page);await page.getByRole('button',{name:'Describe a meal'}).click();
  await page.getByLabel('What did you have?').fill('A bowl of curry. Unsure how much rice or oil.');
  await page.getByRole('button',{name:/Save for/}).click();await expect(page.getByTestId('remaining')).toHaveText('—');
  const data=await backup(page),note=Object.values(data.mealNotes)[0];expect(note.status).toBe('pending');expect(note.text).toContain('Unsure');expect(Object.values(data.foodLogs)[0].nutrition.calories).toBeNull();
});
test('repeat creates a new log on the selected date; CSV is downloadable',async({page})=>{
  await demo(page);await manual(page,'=untrusted formula','250');
  await page.getByLabel('Logging date').fill('2026-10-20');
  await page.getByRole('link',{name:'Food',exact:true}).click();await page.getByText('Repeat a recent meal',{exact:true}).click();
  await page.getByRole('button',{name:'Again',exact:true}).click();
  const data=await backup(page);expect(Object.values(data.foodLogs)).toHaveLength(2);expect(Object.values(data.foodLogs).some(l=>l.date==='2026-10-20')).toBe(true);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Food diary CSV'}).click();const download=await pending;const content=fs.readFileSync(await download.path(),'utf8');expect(content).toContain("'=untrusted formula");
});
test('manual foods and cooked recipes calculate grams correctly',async({page})=>{
  await demo(page);await page.getByRole('link',{name:'Food',exact:true}).click();await page.getByRole('button',{name:'+ Manual food'}).click();
  await page.getByLabel('Food name',{exact:true}).fill('Synthetic label');await page.getByLabel('Calories (kcal)',{exact:true}).fill('100');
  await page.getByLabel('Protein (g)',{exact:true}).fill('10');await page.getByRole('button',{name:'Save to my foods'}).click();
  await page.getByRole('button',{name:'+ Batch recipe'}).click();await page.getByLabel('Name',{exact:true}).fill('Test batch');
  await page.getByLabel('Ingredient amount (g)').fill('200');await page.getByRole('button',{name:'+ Ingredient'}).click();await page.getByLabel('Total cooked batch weight (g)').fill('400');await page.getByRole('button',{name:'Save recipe',exact:true}).click();
  await page.getByRole('button',{name:'Recipes',exact:true}).click();await page.getByRole('button',{name:'Log',exact:true}).click();await page.getByLabel('Amount',{exact:true}).fill('100');await page.getByRole('button',{name:/Add to \d/}).click();
  const data=await backup(page);expect(Object.values(data.foodLogs)[0].nutrition.calories).toBe(50);expect(Object.values(data.recipes)[0].caloriesPerGram).toBe(.5);expect(Object.values(data.recipes)[0].fat).toBeNull();
});
test('weight and waist accept metric units and display a real 7-day average',async({page})=>{
  await demo(page);await page.getByRole('link',{name:'Progress',exact:true}).click();await page.getByRole('button',{name:'+ Weight / waist'}).click();
  await page.getByLabel('Weight',{exact:true}).fill('77.56429527');await page.getByLabel('Weight unit').selectOption('kg');await page.getByLabel('Waist',{exact:true}).fill('93.98');await page.getByLabel('Waist unit').selectOption('cm');
  await page.getByRole('button',{name:'Save measurement'}).click();await expect(page.getByText(/7-day average: 171 lb/)).toBeVisible();
  const data=await backup(page);expect(Object.values(data.measurements)[0].weight).toBeCloseTo(171);expect(Object.values(data.measurements)[0].waist).toBeCloseTo(37);
});
test('reminder exports a real recurring calendar event',async({page})=>{
  await demo(page);await page.getByRole('link',{name:'Move',exact:true}).click();await page.getByRole('button',{name:'Set reminder',exact:true}).click();await page.getByLabel('Time on your phone').fill('19:30');await page.getByRole('button',{name:'Save reminder'}).click();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Add to phone calendar'}).click();const download=await pending;const content=fs.readFileSync(await download.path(),'utf8');expect(content).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');expect(content).toContain('BEGIN:VALARM');expect(content).toMatch(/DTSTART:\d{8}T193000/);
});
test('saved names and meal descriptions are rendered as text',async({page})=>{
  await demo(page);await manual(page,'<img src=x onerror="window.injected=true">','100');await expect(page.getByTestId('remaining')).toHaveText('1,500');expect(await page.evaluate(()=>window.injected)).toBeUndefined();await expect(page.locator('#main img')).toHaveCount(0);
});
test('the session-only demo disappears on reload and does not write personal data to browser storage',async({page})=>{
  await demo(page);await manual(page,'Private entry','100');expect(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)}))).toEqual({local:[],session:[]});
  await page.reload();await expect(page.getByRole('button',{name:'Try a session-only demo'})).toBeVisible();await page.getByRole('button',{name:'Try a session-only demo'}).click();await expect(page.getByTestId('remaining')).toHaveText('1,600');
});
test('mobile navigation fits, and core controls have thumb-sized targets',async({page})=>{
  await demo(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  for(const button of await page.locator('.quick-card button,.nav a').all()){const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(48);}
  await page.screenshot({path:'test-results/fitness/'+test.info().project.name+'-today.png',fullPage:true});
});
