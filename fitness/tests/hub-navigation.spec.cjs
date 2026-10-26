const {test,expect}=require('@playwright/test');

test.beforeEach(async({page})=>{await page.route('https://**',route=>route.abort());});
test('Family Hub opens Steady and Steady returns to the same hub',async({page})=>{
  await page.goto('/');
  const link=page.getByRole('link',{name:'Open my fitness corner'});
  await expect(link).toHaveAttribute('href','./fitness/');
  await link.click();await expect(page).toHaveURL(/\/fitness\/$/);
  await page.getByRole('button',{name:'Try a session-only demo'}).click();
  await page.getByRole('link',{name:'More',exact:true}).click();
  await page.getByRole('link',{name:'Back to Family Hub'}).click();
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect(page.getByRole('link',{name:'Open my fitness corner'})).toBeVisible();
});
test('Home settings also have a labeled fitness entry point',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open settings',exact:true}).click();
  await expect(page.locator('#headerSettingsPanel').getByRole('link',{name:'Open Steady'})).toHaveAttribute('href','./fitness/');
});
test('preview serves the public app but never serves private admin files',async({request})=>{
  for(const path of ['/','/fitness/','/firebase-config.js','/icons/icon-192.png'])expect((await request.get(path)).status()).toBe(200);
  for(const path of ['/scripts/recipes/service-account.json','/.git/config','/fitness-inbox/current-rules.json','/debug.log'])expect((await request.get(path)).status()).toBe(404);
});
