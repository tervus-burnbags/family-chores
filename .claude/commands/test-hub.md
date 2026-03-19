Run the Family Hub Playwright test suite against the live Vercel deployment.

Steps:
1. Re-seed the test Firebase database so it's in a clean known state:
   Run: `node tests/seed-test-db.js`

2. Run the full Playwright test suite (chromium only for speed, or all browsers if the user wants full coverage):
   Run: `FAMILY_CODE=TESTFAM1 npx playwright test --project=chromium`

3. Report the results back to the user:
   - How many tests passed / failed
   - The name and error message of any failing tests
   - Suggest the HTML report command if there were failures: `npx playwright show-report`

If the user passes `--all` as an argument, run all three browser projects (chromium, mobile-android, mobile-ios) by omitting the `--project` flag.

If the user passes `--headed` as an argument, add `--headed` to the playwright command so they can watch tests run.

Always run from the `chores/` project directory.
