# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff-management.spec.ts >> staff management integration >> handles offline records, attendance, exports, and reconnection sync
- Location: e2e\staff-management.spec.ts:283:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/staff\/students\/.+/
Received string:  ""
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    - waiting for" http://localhost:8082/staff/students/3deddf50-6d04-4f8c-9b2f-f5c0aa2846dd" navigation to finish...

```

# Test source

```ts
  252 |           device: {
  253 |             deviceId: "dev_device_1",
  254 |             deviceName: "Developer Dev-Box",
  255 |             activatedAt: "2026-05-26T08:00:00.000Z",
  256 |           },
  257 |           bootstrapRequired: true,
  258 |         }),
  259 |       });
  260 |     });
  261 |
  262 |     await page.goto("/staff");
  263 |     await activateDevice(page);
  264 |
  265 |     expect(activationPayload).toEqual({
  266 |       deviceId: "dev_device_1",
  267 |       deviceName: "Developer Dev-Box",
  268 |     });
  269 |
  270 |     await expect(page.getByRole("heading", { name: "Day Care Center" })).toBeVisible();
  271 |     await expect(
  272 |       page.getByRole("button", { name: /Sync status: All changes synced/i }).first(),
  273 |     ).toBeVisible();
  274 |
  275 |     await expect
  276 |       .poll(async () => getActivationMeta(page))
  277 |       .toMatchObject({
  278 |         deviceId: "dev_device_1",
  279 |         deviceName: "Developer Dev-Box",
  280 |       });
  281 |   });
  282 |
  283 |   test("handles offline records, attendance, exports, and reconnection sync", async ({
  284 |     page,
  285 |     context,
  286 |     browserName,
  287 |   }) => {
  288 |     test.skip(browserName !== "chromium", "Offline downloads are verified in Chromium only.");
  289 |
  290 |     await mockSession(page, { user: STAFF_USER });
  291 |     await mockBootstrap(page);
  292 |     await page.route("**/api/staff/device/activate", async (route) => {
  293 |       await route.fulfill({
  294 |         status: 200,
  295 |         contentType: "application/json",
  296 |         headers: { "cache-control": "no-store" },
  297 |         body: JSON.stringify({
  298 |           device: {
  299 |             deviceId: "dev_device_1",
  300 |             deviceName: "Developer Dev-Box",
  301 |             activatedAt: "2026-05-26T08:00:00.000Z",
  302 |           },
  303 |           bootstrapRequired: true,
  304 |         }),
  305 |       });
  306 |     });
  307 |
  308 |     const syncRequests: Array<Record<string, unknown>> = [];
  309 |     await page.route("**/api/staff/sync", async (route) => {
  310 |       const payload = (await route.request().postDataJSON()) as Record<string, unknown>;
  311 |       syncRequests.push(payload);
  312 |
  313 |       const operations = Array.isArray(payload.operations)
  314 |         ? (payload.operations as Array<Record<string, unknown>>)
  315 |         : [];
  316 |
  317 |       await route.fulfill({
  318 |         status: 200,
  319 |         contentType: "application/json",
  320 |         headers: { "cache-control": "no-store" },
  321 |         body: JSON.stringify({
  322 |           acknowledgedOperationIds: operations
  323 |             .map((operation) => operation.operationId)
  324 |             .filter((operationId): operationId is string => typeof operationId === "string"),
  325 |           profiles: [],
  326 |           attendanceRecords: [],
  327 |           syncedAt: "2026-05-26T09:45:00.000Z",
  328 |         }),
  329 |       });
  330 |     });
  331 |
  332 |     await page.goto("/staff");
  333 |     await activateDevice(page);
  334 |
  335 |     await page.getByRole("link", { name: "Student Records" }).first().click();
  336 |     await page.getByRole("button", { name: /Add student/i }).click();
  337 |     await expect(page.locator("#childFirstName")).toBeVisible();
  338 |     await context.setOffline(true);
  339 |     await page.locator("#childFirstName").fill("Offline");
  340 |     await page.locator("#childLastName").fill("Learner");
  341 |     await page.locator("#birthDate").fill("2020-10-10");
  342 |     await page.locator("#address").fill("Barangay San Antonio de Padua I");
  343 |     await page.locator("#form-next-tab").click();
  344 |     await page.locator("#guardianFullName").fill("Parent Offline");
  345 |     await page.locator("#guardianRelationship").fill("Mother");
  346 |     await page.locator("#guardianContactNumber").fill("09171234567");
  347 |     await page.locator("#tab-enrollment").click();
  348 |     await expect(page.locator("#enrollmentDate")).toBeVisible();
  349 |     await page.locator("#enrollmentDate").fill("2025-06-16");
  350 |     await page.locator("#form-submit").click();
  351 |
> 352 |     await expect(page).toHaveURL(/\/staff\/students\/.+/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  353 |
  354 |     await page.getByRole("link", { name: "Student Records" }).first().click();
  355 |     await expect(page.getByText("Awaiting sync")).toBeVisible();
  356 |     await expect(page.getByText("1 record is awaiting sync to the server.")).toBeVisible();
  357 |
  358 |     await page.getByRole("link", { name: "Attendance" }).first().click();
  359 |     await page.getByRole("link", { name: "New Sheet" }).click();
  360 |     await expect(page.getByRole("heading", { name: "Attendance Sheet" })).toBeVisible();
  361 |     await expect(page.getByRole("button", { name: /Offline Learner Present/i })).toBeVisible();
  362 |     await expect(page.getByRole("button", { name: /Offline Learner Absent/i })).toBeVisible();
  363 |     await expect(page.getByRole("button", { name: /Offline Learner Excused/i })).toBeVisible();
  364 |     await page.getByRole("button", { name: /Offline Learner Excused/i }).click();
  365 |     await page.getByLabel("Offline Learner Excused Note").fill("Child is sick today.");
  366 |     await page.getByRole("button", { name: "Save Attendance" }).click();
  367 |
  368 |     await expect(page).toHaveURL(/\/staff\/attendance$/);
  369 |     await expect(page.getByText("You're offline")).toBeVisible();
  370 |
  371 |     await page.getByRole("link", { name: "Reports" }).first().click();
  372 |     await expect(page.getByText("Offline Outbox Status")).toBeVisible();
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
```
