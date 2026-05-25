# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff-management.spec.ts >> staff management integration >> handles offline records, attendance, exports, and reconnection sync
- Location: e2e\staff-management.spec.ts:283:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: /Add student/i }) resolved to 2 elements:
    1) <button id="add-student-record" class="inline-flex items-center justify-center text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow px-4 py-2 h-11 rounded-2xl bg-brand hover:bg-brand/90 gap-2 whitespace-nowrap shrink-0">…</button> aka getByRole('button', { name: 'Add student', exact: true })
    2) <button id="empty-state-add-student" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow h-9 px-4 py-2 mt-2 rounded-2xl bg-brand hover:bg-brand/90 gap-2">…</button> aka getByRole('button', { name: 'Add Student Record' })

Call log:
  - waiting for getByRole('button', { name: /Add student/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary "Staff navigation" [ref=e3]:
    - generic [ref=e5]:
      - paragraph [ref=e6]: Day Care Center
      - paragraph [ref=e7]: Brgy. San Antonio de Padua I
    - navigation "Main navigation" [ref=e8]:
      - link "Home" [ref=e9] [cursor=pointer]:
        - /url: /staff
        - img [ref=e10]
        - generic [ref=e13]: Home
      - link "Student Records" [active] [ref=e14] [cursor=pointer]:
        - /url: /staff/students
        - img [ref=e15]
        - generic [ref=e17]: Student Records
      - link "Attendance" [ref=e18] [cursor=pointer]:
        - /url: /staff/attendance
        - img [ref=e19]
        - generic [ref=e22]: Attendance
      - link "Reports" [ref=e23] [cursor=pointer]:
        - /url: /staff/reports
        - img [ref=e24]
        - generic [ref=e27]: Reports
      - paragraph [ref=e29]: Coming Soon
      - generic [ref=e30]:
        - img [ref=e31]
        - generic [ref=e34]: ActivitiesSoon
      - generic [ref=e35]:
        - img [ref=e36]
        - generic [ref=e39]: NotificationsSoon
    - generic [ref=e40]:
      - generic [ref=e41]:
        - paragraph [ref=e42]: Teacher E2E
        - paragraph [ref=e43]: staff
      - button "Sign out" [ref=e44]:
        - img [ref=e45]
        - text: Sign out
  - main [ref=e49]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - generic [ref=e53]:
          - heading "Student Records" [level=1] [ref=e54]
          - paragraph [ref=e55]: Find, add, or update enrolled children
        - button "Refresh records" [ref=e56] [cursor=pointer]:
          - img
      - generic [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e59]:
            - img [ref=e60]
            - searchbox "Search students" [ref=e63]
          - button "Add student" [ref=e64] [cursor=pointer]:
            - img
            - generic [ref=e65]: Add student
        - generic [ref=e66]:
          - img [ref=e68]
          - paragraph [ref=e70]: No students enrolled yet
          - paragraph [ref=e71]: Add the first student record to get started.
          - button "Add Student Record" [ref=e72] [cursor=pointer]:
            - img
            - text: Add Student Record
```

# Test source

```ts
  236 |   });
  237 | 
  238 |   test("activates the device and persists activation metadata for offline use", async ({
  239 |     page,
  240 |   }) => {
  241 |     await mockSession(page, { user: ADMIN_USER });
  242 |     await mockBootstrap(page);
  243 | 
  244 |     let activationPayload: Record<string, string> | null = null;
  245 |     await page.route("**/api/staff/device/activate", async (route) => {
  246 |       activationPayload = (await route.request().postDataJSON()) as Record<string, string>;
  247 |       await route.fulfill({
  248 |         status: 200,
  249 |         contentType: "application/json",
  250 |         headers: { "cache-control": "no-store" },
  251 |         body: JSON.stringify({
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
> 336 |     await page.getByRole("button", { name: /Add student/i }).click();
      |                                                              ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: /Add student/i }) resolved to 2 elements:
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
  352 |     await expect(page).toHaveURL(/\/staff\/students\/.+/);
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
```