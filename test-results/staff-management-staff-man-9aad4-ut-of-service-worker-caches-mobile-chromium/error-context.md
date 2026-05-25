# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff-management.spec.ts >> staff management integration >> service worker cache guard >> keeps api responses and generated report files out of service worker caches
- Location: e2e\staff-management.spec.ts:414:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'Staff Login' }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: 'Staff Login' }).first()

```

```yaml
- banner:
    - link "Day Care Center Home":
        - /url: /
        - img "Barangay San Antonio de Padua I seal"
        - text: Day Care Center Brgy. San Antonio de Padua I
    - button "Toggle menu"
- main:
    - img "Children playing happily at the Day Care Center"
    - heading "Welcome to Barangay San Antonio de Padua I Day Care Center" [level=1]
    - paragraph: Dasmariñas City, Cavite
    - paragraph: A safe, fun, and nurturing place dedicated to early childhood education and the holistic development of every child in our community.
    - link "Reach Out to Us":
        - /url: /contact
    - link "Learn More":
        - /url: /about
    - paragraph: Who We Are
    - heading "About Our Day Care Center" [level=2]
    - paragraph: The Day Care Center of Barangay San Antonio de Padua I provides quality early childhood education and care for children in our community. Our dedicated team creates a nurturing environment where children learn, play, and grow — building strong foundations for their future.
    - link "Read more about us":
        - /url: /about
    - img "Teacher with children doing arts and crafts at the Day Care Center"
    - paragraph: What We Offer
    - heading "Our Programs" [level=2]
    - heading "Early Childhood Education" [level=3]
    - paragraph: Age-appropriate learning activities that prepare children for primary school through play, creativity, and exploration.
    - heading "Child Nutrition & Health" [level=3]
    - paragraph: Regular weight monitoring and health tracking to support every child's well-being and healthy development.
    - heading "Community Engagement" [level=3]
    - paragraph: Bringing parents, guardians, and the barangay together for our children's holistic growth and development.
    - heading "Have questions about enrollment?" [level=2]
    - paragraph: Reach out to us directly or visit the center during office hours. We're here to help.
    - link "Contact Us":
        - /url: /contact
- contentinfo:
    - img "Barangay San Antonio de Padua I seal"
    - link "Facebook":
        - /url: "#"
    - link "X / Twitter":
        - /url: "#"
    - link "Instagram":
        - /url: "#"
    - link "YouTube":
        - /url: "#"
    - heading "Quick Links" [level=3]
    - link "Home":
        - /url: /
    - link "About Us":
        - /url: /about
    - link "Announcements":
        - /url: /announcements
    - link "Contact Us":
        - /url: /contact
    - heading "Day Care Center" [level=3]
    - link "Our Mission":
        - /url: /about
    - link "Our Programs":
        - /url: /about
    - link "Meet Our Team":
        - /url: /about
    - link "Announcements":
        - /url: /announcements
    - heading "Community" [level=3]
    - text: Day Care Personnel Barangay San Antonio de Padua I Parents & Guardians CSWD Office © 2026 Barangay San Antonio de Padua I Day Care Center · Dasmariñas City, Cavite
```

# Test source

```ts
  373 |
  374 |     const [pdfDownload] = await Promise.all([
  375 |       page.waitForEvent("download"),
  376 |       page.getByRole("button", { name: "Export PDF Document" }).click(),
  377 |     ]);
  378 |     expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
  379 |     await expect(page.getByText(/Successfully generated .*\.pdf/i)).toBeVisible();
  380 |
  381 |     const [xlsxDownload] = await Promise.all([
  382 |       page.waitForEvent("download"),
  383 |       page.getByRole("button", { name: "Export XLSX Spreadsheet" }).click(),
  384 |     ]);
  385 |     expect(xlsxDownload.suggestedFilename()).toMatch(/\.xlsx$/);
  386 |     await expect(page.getByText(/Successfully generated .*\.xlsx/i)).toBeVisible();
  387 |
  388 |     await expect.poll(async () => getStoreRecordCount(page, "operation_queue")).toBeGreaterThan(0);
  389 |
  390 |     await context.setOffline(false);
  391 |     await expect
  392 |       .poll(async () => syncRequests.length, {
  393 |         timeout: 15000,
  394 |       })
  395 |       .toBeGreaterThan(0);
  396 |
  397 |     const lastSyncRequest = syncRequests.at(-1);
  398 |     const operations = Array.isArray(lastSyncRequest?.operations)
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
> 473 |       await expect(page.getByRole("link", { name: "Staff Login" }).first()).toBeVisible();
      |                                                                             ^ Error: expect(locator).toBeVisible() failed
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
  499 |         page.waitForEvent("download"),
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
