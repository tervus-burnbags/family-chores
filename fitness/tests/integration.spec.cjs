const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const F=require('../nutrition.js');

const FAMILY='FAM12345',PERSON_PATH='families/'+FAMILY+'/fitness/travis';
async function mockFirebase(page,{denied=false,family=FAMILY,familyExists=true,person=null,signedIn=true}={}){
  await page.addInitScript(({denied,family,familyExists,person,signedIn})=>{
    // Seed storage only once so reloads keep whatever the app changed.
    if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');if(family)localStorage.setItem('familyChores.familyId',family);if(person)localStorage.setItem('steady.person',person);}
    const mock=window.fitnessMock={paths:[],root:null,callbacks:[],apps:[],offCalls:0,anonSignIns:0};
    const snap=()=>({exists:()=>!!mock.root,val:()=>JSON.parse(JSON.stringify(mock.root))});
    function stripNull(value){if(Array.isArray(value))return value.map(stripNull);if(value && typeof value==='object'){const out={};for(const [k,v]of Object.entries(value)){if(v!=null)out[k]=stripNull(v);}return out;}return value;}
    const user={uid:'anon-device',isAnonymous:true,getIdToken:async()=>'test.token'};
    const auth={currentUser:signedIn?user:null,onAuthStateChanged(fn){queueMicrotask(()=>fn(auth.currentUser));return()=>{};},signInAnonymously:async()=>{mock.anonSignIns++;auth.currentUser=user;}};
    const database={ref(path){mock.paths.push(path);return{
      async get(){return{exists:()=>familyExists};},
      on(event,fn,onError){if(path==='.info/connected'){queueMicrotask(()=>fn({val:()=>true}));return fn;}if(denied){queueMicrotask(()=>onError(new Error('PERMISSION_DENIED')));return fn;}mock.callbacks.push(fn);queueMicrotask(()=>fn(snap()));return fn;},
      off(event,fn){mock.offCalls++;mock.callbacks=mock.callbacks.filter(cb=>cb!==fn);},
      async update(changes){mock.root ||= {};for(const [path,value]of Object.entries(changes)){const keys=path.split('/');let cursor=mock.root;for(const key of keys.slice(0,-1))cursor=cursor[key] ||= {};if(value==null)delete cursor[keys.at(-1)];else cursor[keys.at(-1)]=stripNull(value);}for(const fn of mock.callbacks)fn(snap());}
    };}};
    mock.publish=(changes)=>{mock.root={...mock.root,...changes};for(const fn of mock.callbacks)fn(snap());};
    const app={name:'[DEFAULT]',auth:()=>auth,database:()=>database};auth.app=app;
    window.firebase={apps:[],auth(){},database(){},initializeApp(config,name){mock.apps.push(name || '[DEFAULT]');window.firebase.apps.push(app);return app;}};
  },{denied,family,familyExists,person,signedIn});
}
async function chooseTravis(page){await page.getByRole('button',{name:'Travis',exact:true}).click();}
test('picking Travis syncs only his family path, live updates, and switching user returns to the picker',async({page})=>{
  await mockFirebase(page);await page.goto('/fitness/');await chooseTravis(page);await expect(page.getByTestId('remaining')).toHaveText('1,600');
  await expect(page.locator('#connection')).toContainText('Travis · synced');
  await page.getByRole('button',{name:'Log calories',exact:true}).click();await page.getByLabel('Food or meal',{exact:true}).fill('Cloud fixture');await page.getByLabel('Calories (kcal)',{exact:true}).fill('300');await page.getByRole('button',{name:'Add to diary'}).click();
  await expect(page.getByTestId('remaining')).toHaveText('1,300');
  expect(await page.evaluate(()=>window.fitnessMock.apps)).toEqual(['[DEFAULT]']);
  expect(new Set(await page.evaluate(()=>window.fitnessMock.paths))).toEqual(new Set(['families/FAM12345/config',PERSON_PATH,'.info/connected']));
  await page.evaluate(()=>window.fitnessMock.publish({settings:{...window.fitnessMock.root.settings,calories:1800}}));await expect(page.getByTestId('remaining')).toHaveText('1,500');
  await page.getByRole('link',{name:'More',exact:true}).click();await page.getByRole('button',{name:'Switch user',exact:true}).click();await expect(page.getByRole('button',{name:'Travis',exact:true})).toBeVisible();expect(await page.evaluate(()=>window.fitnessMock.offCalls)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>localStorage.getItem('steady.person'))).toBeNull();
});
test('a remembered person reopens on load, reusing the existing anonymous session',async({page})=>{
  await mockFirebase(page,{person:'travis'});await page.goto('/fitness/');await expect(page.getByTestId('remaining')).toHaveText('1,600');
  expect(await page.evaluate(()=>window.fitnessMock.anonSignIns)).toBe(0);
});
test('a device with no Hub session signs in anonymously before syncing',async({page})=>{
  await mockFirebase(page,{signedIn:false});await page.goto('/fitness/');await chooseTravis(page);await expect(page.getByTestId('remaining')).toHaveText('1,600');
  expect(await page.evaluate(()=>window.fitnessMock.anonSignIns)).toBe(1);
});
test('without a Hub family code Steady points to Family Hub and touches no data',async({page})=>{
  await mockFirebase(page,{family:null});await page.goto('/fitness/');await expect(page.locator('#setupInfo')).toContainText('join your family first');
  await chooseTravis(page);await expect(page.locator('#workspace')).toBeHidden();expect(await page.evaluate(()=>window.fitnessMock.paths)).toEqual([]);
});
test('an unknown family code is refused before any fitness data is read',async({page})=>{
  await mockFirebase(page,{familyExists:false});await page.goto('/fitness/');await chooseTravis(page);await expect(page.getByRole('alert')).toContainText('family code was not found');
  expect(await page.evaluate(()=>window.fitnessMock.paths)).toEqual(['families/FAM12345/config']);expect(await page.evaluate(()=>localStorage.getItem('steady.person'))).toBeNull();
});
test('denied database access does not expose a diary or initialize data',async({page})=>{
  await mockFirebase(page,{denied:true});await page.goto('/fitness/');await chooseTravis(page);await expect(page.getByRole('alert')).toContainText('Firebase denied access');await expect(page.locator('#workspace')).toBeHidden();expect(await page.evaluate(()=>window.fitnessMock.root)).toBeNull();
});
test('authenticated search sends the family code and requires a liquid gram basis',async({page})=>{
  await mockFirebase(page,{person:'travis'});await page.route('**/api/fitness-foods',async route=>{
    expect(route.request().headers().authorization).toBe('Bearer test.token');
    expect(route.request().postDataJSON().familyId).toBe('FAM12345');
    await route.fulfill({json:{foods:[{name:'Liquid test label',calories:50,protein:3,carbs:null,fat:null,source:'Open Food Facts',sourceId:'12345678',requiresBasisConfirmation:true,basis:'100 g / 100 ml (check package)'}]}});
  });
  await page.goto('/fitness/');await page.getByRole('link',{name:'Food',exact:true}).click();await page.getByRole('button',{name:'Scan / barcode'}).click();await page.getByLabel('Barcode',{exact:true}).fill('12345678');await page.getByRole('button',{name:'Look up food'}).click();await page.getByRole('button',{name:'Review',exact:true}).click();
  await expect(page.getByLabel('These nutrition values are for (g)')).toHaveValue('');await page.getByRole('button',{name:'Save to my foods'}).click();await expect(page.locator('#editor')).toBeVisible();
  await page.getByLabel('These nutrition values are for (g)').fill('104');await page.getByLabel('Calories (kcal)',{exact:true}).fill('52');await page.getByRole('button',{name:'Save to my foods'}).click();
  const food=await page.evaluate(()=>Object.values(window.fitnessMock.root.foods)[0]);expect(food.calories).toBe(50);expect(food.carbs).toBeUndefined();
});
test('a disconnected cloud form stays open and does not queue a hidden write',async({page,context})=>{
  await mockFirebase(page,{person:'travis'});await page.goto('/fitness/');await page.getByRole('button',{name:'Log calories',exact:true}).click();await page.getByLabel('Food or meal',{exact:true}).fill('Offline draft');await page.getByLabel('Calories (kcal)',{exact:true}).fill('100');await context.setOffline(true);await page.getByRole('button',{name:'Add to diary'}).click();await expect(page.locator('#dialogError')).toContainText('Reconnect to save');expect(await page.evaluate(()=>Object.values(window.fitnessMock.root.foodLogs || {}).length)).toBe(0);await expect(page.getByLabel('Food or meal',{exact:true})).toHaveValue('Offline draft');
});
test('camera tracks stop if permission resolves after the scanner was closed',async({page})=>{
  await page.addInitScript(()=>{
    window.cameraStops=0;
    window.BarcodeDetector=class {static async getSupportedFormats(){return ['ean_13'];}async detect(){return [];}};
    const stream={getTracks:()=>[{stop(){window.cameraStops++;}}]};
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise(resolve=>window.resolveCamera=()=>resolve(stream))}});
  });
  await demo(page);await page.getByRole('link',{name:'Food',exact:true}).click();await page.getByRole('button',{name:'Scan / barcode'}).click();await page.getByRole('button',{name:'Open camera'}).click();await page.waitForFunction(()=>window.resolveCamera);
  await page.getByRole('button',{name:'Close dialog'}).click();await page.evaluate(()=>window.resolveCamera());await expect.poll(()=>page.evaluate(()=>window.cameraStops)).toBe(1);await expect(page.locator('#editor')).toBeHidden();
});
test('a camera playback error releases the stream and preserves manual barcode lookup',async({page})=>{
  await page.addInitScript(()=>{
    window.cameraStops=0;
    window.BarcodeDetector=class {static async getSupportedFormats(){return ['ean_13'];}async detect(){return [];}};
    const stream={getTracks:()=>[{stop(){window.cameraStops++;}}]};
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>stream}});
    Object.defineProperty(HTMLMediaElement.prototype,'srcObject',{configurable:true,set(value){this.testStream=value;},get(){return this.testStream;}});
    HTMLMediaElement.prototype.play=async()=>{throw new Error('Playback denied');};
  });
  await demo(page);await page.getByRole('link',{name:'Food',exact:true}).click();await page.getByRole('button',{name:'Scan / barcode'}).click();await page.getByRole('button',{name:'Open camera'}).click();await expect(page.locator('#dialogError')).toContainText('Camera playback could not start');expect(await page.evaluate(()=>window.cameraStops)).toBe(1);await expect(page.getByLabel('Barcode',{exact:true})).toBeEditable();
});
async function demo(page){await page.route('https://**',route=>route.abort());await page.goto('/fitness/');await page.getByRole('button',{name:'Try a session-only demo'}).click();}
test('backup restores reusable meals, favorites and targets, with a working repeat',async({page})=>{
  await demo(page);const data=F.empty();data.settings.calories=1700;data.foods.test={name:'Fixture food',calories:100,protein:4,carbs:null,fat:null,defaultGrams:100,favorite:true};data.meals.lunch={name:'Fixture lunch',ingredients:[{food:data.foods.test,grams:250}]};
  await page.getByRole('link',{name:'More',exact:true}).click();await page.getByRole('button',{name:'Restore backup'}).click();await page.getByLabel('Steady JSON backup').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.getByLabel('I have a backup').check();await page.getByRole('button',{name:'Validate & restore'}).click();
  await page.getByRole('link',{name:'Food',exact:true}).click();await expect(page.getByRole('button',{name:'Unfavorite Fixture food'})).toBeVisible();await page.getByRole('button',{name:'Meals',exact:true}).click();await page.getByRole('button',{name:'Log',exact:true}).click();await page.getByRole('link',{name:'Today',exact:true}).click();await expect(page.getByTestId('remaining')).toHaveText('1,450');
  await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Calories (kcal)',{exact:true}).fill('300');await page.getByRole('button',{name:'Save reviewed nutrition'}).click();await expect(page.getByTestId('remaining')).toHaveText('1,400');
});
test('timed plank records elapsed seconds rather than planned seconds',async({page})=>{
  await demo(page);await page.clock.install();await page.getByRole('link',{name:'Move',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();await page.getByRole('button',{name:'Plank · 2 × 30 seconds'}).click();await page.getByRole('button',{name:'Start timer'}).click();await page.clock.fastForward(5500);await page.getByRole('button',{name:'Use time for last set'}).click();await expect(page.getByLabel('Completed seconds').last()).toHaveValue('5');await page.getByRole('button',{name:'Save completed sets'}).click();await expect(page.getByText(/30 sec \/ 5 sec/).first()).toBeVisible();
});
test.describe('PWA public shell',()=>{
  test.use({serviceWorkers:'allow'});
  test('installs its own scope and never caches API responses',async({page})=>{
    await demo(page);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/fitness/sw.js'));
    await page.evaluate(()=>fetch('/api/fitness-foods',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'usda',query:'test'})}));
    const cached=await page.evaluate(async()=>{const cache=await caches.open('steady-shell-v1');return(await cache.keys()).map(req=>new URL(req.url).pathname);});expect(cached).toContain('/fitness/index.html');expect(cached.every(path=>path.startsWith('/fitness/')&&!path.includes('api'))).toBe(true);
  });
  test('opens a fresh session-only shell offline',async({page,context,browserName})=>{
    test.skip(browserName==='webkit','Windows Playwright WebKit fails offline service-worker navigations with an internal engine error; verify on a physical iPhone. Android/Chromium exercise this flow.');
    await demo(page);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/fitness/sw.js'));
    await context.setOffline(true);await page.reload();await expect(page.getByRole('button',{name:'Try a session-only demo'})).toBeVisible();await page.getByRole('button',{name:'Try a session-only demo'}).click();await expect(page.getByTestId('remaining')).toHaveText('1,600');
  });
});
