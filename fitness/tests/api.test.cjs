const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHandler}=require('../../api/fitness-foods.js');
const env={FIREBASE_WEB_API_KEY:'public-project-key',FIREBASE_DATABASE_URL:'https://example-default-rtdb.firebaseio.com',USDA_API_KEY:'server-secret-key'};
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
const member={localId:'anon-device'};
// Routes each upstream: identity lookup, family config check, then the food provider.
function upstreams({account=member,family={familyName:true},food=response({foods:[]})}={}){
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url,options});
    if(url.includes('accounts:lookup'))return account instanceof Object&&'ok' in account?account:response({users:account?[account]:[]});
    if(url.includes('firebaseio.com'))return family instanceof Object&&'ok' in family?family:response(family);
    if(typeof food==='function')return food(url,options);
    return food;
  };
  return{calls,fetchImpl};
}
async function call(handler,{method='POST',token='valid.token',body={provider:'usda',query:'banana',familyId:'FAM12345'}}={}){
  const headers={};let result;
  const res={setHeader:(k,v)=>headers[k]=v,end:text=>result=JSON.parse(text),statusCode:200};
  await handler({method,headers:{authorization:token?'Bearer '+token:undefined},body},res);
  return{status:res.statusCode,body:result,headers};
}
test('food endpoint fails closed for missing environment and tokens',async()=>{
  assert.equal((await call(createHandler({env:{}}))).status,503);
  assert.equal((await call(createHandler({env:{...env,FIREBASE_DATABASE_URL:'https://evil.example.com'}}))).status,503);
  const handler=createHandler({env,fetchImpl:()=>{throw new Error('must not fetch');}});
  assert.equal((await call(handler,{token:''})).status,401);
  assert.equal((await call(handler,{method:'GET'})).status,405);
  assert.equal((await call(handler,{body:{provider:'other',familyId:'FAM12345'}})).status,400);
  for(const familyId of [undefined,'','fam12345','TOOLONG123','../ROOT'])assert.equal((await call(handler,{body:{provider:'usda',query:'banana',familyId}})).status,400);
});
test('only signed-in holders of an existing family code reach food providers',async()=>{
  for(const account of [null,{localId:''},{...member,disabled:true}]){
    const {calls,fetchImpl}=upstreams({account});
    assert.equal((await call(createHandler({env,fetchImpl}))).status,401);assert.equal(calls.length,1);
  }
  for(const family of [null,response({error:'Permission denied'},401)]){
    const {calls,fetchImpl}=upstreams({family});
    assert.equal((await call(createHandler({env,fetchImpl}))).status,403);assert.equal(calls.length,2);
  }
});
test('family check reads only the shallow config with the caller token',async()=>{
  const {calls,fetchImpl}=upstreams();
  assert.equal((await call(createHandler({env,fetchImpl}))).status,200);
  assert.equal(calls[1].url,'https://example-default-rtdb.firebaseio.com/families/FAM12345/config.json?shallow=true&auth=valid.token');
});
test('expired/foreign project token is rejected before upstream calls',async()=>{
  const {calls,fetchImpl}=upstreams({account:response({error:'bad'},400)});
  assert.equal((await call(createHandler({env,fetchImpl}))).status,401);assert.equal(calls.length,1);
});
test('USDA proxy authenticates, normalizes nulls and never returns its secret',async()=>{
  const {calls,fetchImpl}=upstreams({food:response({foods:[{fdcId:123,description:'Test food',foodNutrients:[{nutrientId:1008,unitName:'KCAL',value:100}]}]})});
  const result=await call(createHandler({env,fetchImpl}));assert.equal(result.status,200);assert.equal(result.body.foods[0].calories,100);assert.equal(result.body.foods[0].protein,null);
  assert.equal(result.headers['Cache-Control'],'private, no-store');assert.ok(calls[2].url.includes('server-secret-key'));assert.ok(!JSON.stringify(result).includes('server-secret-key'));
  assert.deepEqual(JSON.parse(calls[0].options.body),{idToken:'valid.token'});
});
test('barcode lookup validates digits and returns a clear not-found result',async()=>{
  const {calls,fetchImpl}=upstreams({food:response({},404)});const handler=createHandler({env,fetchImpl});
  assert.equal((await call(handler,{body:{provider:'barcode',query:'../secrets',familyId:'FAM12345'}})).status,400);assert.equal(calls.length,0);
  const result=await call(handler,{body:{provider:'barcode',query:'12345678',familyId:'FAM12345'}});assert.equal(result.status,200);assert.deepEqual(result.body.foods,[]);
});
test('Open Food Facts barcode nutrients retain confirmed zero and unknown values',async()=>{
  const {fetchImpl}=upstreams({food:response({status:1,product:{product_name:'Label',nutriments:{'energy-kcal_100g':0}}})});
  const result=await call(createHandler({env,fetchImpl}),{body:{provider:'barcode',query:'12345678',familyId:'FAM12345'}});assert.equal(result.body.foods[0].calories,0);assert.equal(result.body.foods[0].protein,null);
});
test('missing USDA key leaves barcode lookup available; upstream errors do not leak secrets',async()=>{
  assert.equal((await call(createHandler({env:{...env,USDA_API_KEY:''},fetchImpl:upstreams().fetchImpl}))).status,503);
  const {fetchImpl}=upstreams({food:()=>{throw new Error('secret '+env.USDA_API_KEY);}});
  const failure=await call(createHandler({env,fetchImpl}));
  assert.equal(failure.status,502);assert.ok(!JSON.stringify(failure).includes(env.USDA_API_KEY));
});
test('server applies a bounded per-instance search throttle',async()=>{
  const handler=createHandler({env,fetchImpl:upstreams().fetchImpl});
  for(let i=0;i<30;i++)assert.equal((await call(handler)).status,200);
  const limited=await call(handler);assert.equal(limited.status,429);assert.equal(limited.headers['Retry-After'],'60');
});
