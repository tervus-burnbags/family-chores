const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests',testMatch:'*.spec.cjs',timeout:20000,retries:0,reporter:'list',
  outputDir:'../test-results/fitness',
  use:{baseURL:'http://127.0.0.1:4174',screenshot:'only-on-failure',trace:'retain-on-failure',serviceWorkers:'block'},
  webServer:{command:'node scripts/fitness/serve.cjs',url:'http://127.0.0.1:4174/fitness/',reuseExistingServer:true,cwd:require('node:path').resolve(__dirname,'..')},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'android',use:{...devices['Pixel 7']}},{name:'ios',use:{...devices['iPhone 14']}}]
});
