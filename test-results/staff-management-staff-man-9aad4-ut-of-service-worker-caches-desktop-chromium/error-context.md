# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff-management.spec.ts >> staff management integration >> service worker cache guard >> keeps api responses and generated report files out of service worker caches
- Location: e2e\staff-management.spec.ts:414:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForEvent: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for event "download"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
    - generic [ref=e4]:
        - img "Barangay seal" [ref=e5]
        - heading "Staff Login" [level=1] [ref=e6]
        - paragraph [ref=e7]: Barangay San Antonio de Padua I Day Care Center — for authorized personnel only
    - generic [ref=e8]: Authorized use only. Do not share your credentials. All activity may be logged.
    - generic [ref=e9]:
        - generic [ref=e10]:
            - generic [ref=e11]: Username
            - textbox "Username" [ref=e12]
        - generic [ref=e13]:
            - generic [ref=e14]: Password
            - generic [ref=e15]:
                - textbox "Password" [ref=e16]
                - button "Show password" [ref=e17]:
                    - img [ref=e18]
        - button "Log In" [ref=e21]
    - link "Back to Home" [ref=e22] [cursor=pointer]:
        - /url: /
        - img [ref=e23]
        - text: Back to Home
```

# Test source

```ts
  399 |       ? (lastSyncRequest.operations as Array<Record<string, unknown>>)
  400 |       : [];
  401 |     expect(operations.map((operation) => operation.kind)).toEqual(
  402 |       expect.arrayContaining(["createProfile", "upsertAttendance", "recordExportAudit"]),
  403 |     );
  404 |
  405 |     await expect.poll(async () => getStoreRecordCount(page, "operation_queue")).toBe(0);
  406 |     await expect(
  407 |       page.getByRole("button", { name: /Sync status: All changes synced/i }).first(),
  408 |     ).toBeVisible();
  409 |   });
  410 |
  411 |   test.describe("service worker cache guard", () => {
  412 |     test.use({ serviceWorkers: "allow" });
  413 |
  414 |     test("keeps api responses and generated report files out of service worker caches", async ({
  415 |       page,
  416 |     }) => {
  417 |       let authenticated = false;
  418 |       await page.route("**/api/auth/session", async (route) => {
  419 |         if (!authenticated) {
  420 |           await route.fulfill({
  421 |             status: 401,
  422 |             contentType: "application/json",
  423 |             headers: { "cache-control": "no-store" },
  424 |             body: JSON.stringify({ code: "UNAUTHENTICATED" }),
  425 |           });
  426 |           return;
  427 |         }
  428 |
  429 |         await route.fulfill({
  430 |           status: 200,
  431 |           contentType: "application/json",
  432 |           headers: { "cache-control": "no-store" },
  433 |           body: JSON.stringify({
  434 |             user: STAFF_USER,
  435 |             device: null,
  436 |             hasActiveDevice: false,
  437 |             offlinePinEnrolled: false,
  438 |           }),
  439 |         });
  440 |       });
  441 |       await page.route("**/api/auth/login", async (route) => {
  442 |         authenticated = true;
  443 |         await route.fulfill({
  444 |           status: 200,
  445 |           contentType: "application/json",
  446 |           headers: { "cache-control": "no-store" },
  447 |           body: JSON.stringify({
  448 |             user: STAFF_USER,
  449 |             device: null,
  450 |             hasActiveDevice: false,
  451 |             offlinePinEnrolled: false,
  452 |           }),
  453 |         });
  454 |       });
  455 |       await mockBootstrap(page);
  456 |       await page.route("**/api/staff/device/activate", async (route) => {
  457 |         await route.fulfill({
  458 |           status: 200,
  459 |           contentType: "application/json",
  460 |           headers: { "cache-control": "no-store" },
  461 |           body: JSON.stringify({
  462 |             device: {
  463 |               deviceId: "dev_device_1",
  464 |               deviceName: "Developer Dev-Box",
  465 |               activatedAt: "2026-05-26T08:00:00.000Z",
  466 |             },
  467 |             bootstrapRequired: true,
  468 |           }),
  469 |         });
  470 |       });
  471 |
  472 |       await page.goto("/").catch(() => {});
  473 |       await expect(page.getByRole("link", { name: "Staff Login" }).first()).toBeVisible();
  474 |       await page.getByRole("link", { name: "Staff Login" }).first().click();
  475 |       await page.locator("#login-username").fill(STAFF_USER.username);
  476 |       await page.locator("#login-password").fill("CorrectPassword!2026");
  477 |       await page.locator("#login-submit").click();
  478 |       await activateDevice(page);
  479 |       await expect
  480 |         .poll(async () => page.evaluate(() => navigator.serviceWorker.ready.then(() => true)))
  481 |         .toBe(true);
  482 |
  483 |       await page.getByRole("link", { name: "Student Records" }).first().click();
  484 |       await page.getByRole("button", { name: /Add student/i }).click();
  485 |       await page.locator("#childFirstName").fill("Cache");
  486 |       await page.locator("#childLastName").fill("Guard");
  487 |       await page.locator("#birthDate").fill("2020-09-09");
  488 |       await page.locator("#address").fill("Barangay San Antonio de Padua I");
  489 |       await page.locator("#form-next-tab").click();
  490 |       await page.locator("#guardianFullName").fill("Guardian Cache");
  491 |       await page.locator("#guardianRelationship").fill("Father");
  492 |       await page.locator("#guardianContactNumber").fill("09170000000");
  493 |       await page.locator("#tab-enrollment").click();
  494 |       await expect(page.locator("#enrollmentDate")).toBeVisible();
  495 |       await page.locator("#form-submit").click();
  496 |
  497 |       await page.goto("/staff/reports");
  498 |       const [pdfDownload] = await Promise.all([
> 499 |         page.waitForEvent("download"),
      |              ^ Error: page.waitForEvent: Test timeout of 30000ms exceeded.
  500 |         page.getByRole("button", { name: "Export PDF Document" }).click(),
  501 |       ]);
  502 |       const pdfFileName = pdfDownload.suggestedFilename();
  503 |
  504 |       const cachedUrls = await getCachedUrls(page);
  505 |       expect(cachedUrls.some((url) => url.includes("/api/"))).toBe(false);
  506 |       expect(cachedUrls.some((url) => url.includes(pdfFileName))).toBe(false);
  507 |       expect(cachedUrls.some((url) => url.endsWith(".pdf") || url.endsWith(".xlsx"))).toBe(false);
  508 |     });
  509 |   });
  510 | });
  511 |
```
