# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff-management.spec.ts >> staff management integration >> logs in online and redirects authenticated users away from /login
- Location: e2e\staff-management.spec.ts:206:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#login-username')

```

# Page snapshot

```yaml
- generic [ref=e3]:
    - img [ref=e5]
    - generic [ref=e7]:
        - heading "Activate Device Vault" [level=1] [ref=e8]
        - paragraph [ref=e9]: This browser device is not activated yet. To support offline student records, please set up a 6-digit PIN to encrypt your local database.
    - generic [ref=e10]:
        - generic [ref=e11]:
            - generic [ref=e12]: Choose a 6-Digit PIN
            - textbox "Choose a 6-Digit PIN" [ref=e13]:
                - /placeholder: "123456"
                - text: "123456"
            - paragraph [ref=e14]: Defaulting to 123456 for easy developer preview.
        - button "Activate & Unlock Vault" [ref=e15] [cursor=pointer]
    - button "Sign out of this session" [ref=e16]
```

# Test source

```ts
  127 |
  128 |   if (activationRequired) {
  129 |     await page.getByRole("button", { name: "Activate & Unlock Vault" }).click();
  130 |   }
  131 |
  132 |   await expect(page.getByRole("heading", { name: "Day Care Center" })).toBeVisible();
  133 | }
  134 |
  135 | async function getStoreRecordCount(page: Page, storeName: string) {
  136 |   return page.evaluate(async (targetStoreName) => {
  137 |     const db = await new Promise<IDBDatabase>((resolve, reject) => {
  138 |       const request = indexedDB.open("dccms-staff");
  139 |       request.onsuccess = () => resolve(request.result);
  140 |       request.onerror = () => reject(request.error);
  141 |     });
  142 |
  143 |     const count = await new Promise<number>((resolve, reject) => {
  144 |       const tx = db.transaction(targetStoreName, "readonly");
  145 |       const request = tx.objectStore(targetStoreName).count();
  146 |       request.onsuccess = () => resolve(request.result);
  147 |       request.onerror = () => reject(request.error);
  148 |     });
  149 |
  150 |     db.close();
  151 |     return count;
  152 |   }, storeName);
  153 | }
  154 |
  155 | async function getActivationMeta(page: Page) {
  156 |   return page.evaluate(async () => {
  157 |     const db = await new Promise<IDBDatabase>((resolve, reject) => {
  158 |       const request = indexedDB.open("dccms-staff");
  159 |       request.onsuccess = () => resolve(request.result);
  160 |       request.onerror = () => reject(request.error);
  161 |     });
  162 |
  163 |     const value = await new Promise<Record<string, string> | null>((resolve, reject) => {
  164 |       const tx = db.transaction("activation_metadata", "readonly");
  165 |       const request = tx.objectStore("activation_metadata").get("activation");
  166 |       request.onsuccess = () => resolve((request.result as Record<string, string>) ?? null);
  167 |       request.onerror = () => reject(request.error);
  168 |     });
  169 |
  170 |     db.close();
  171 |     return value;
  172 |   });
  173 | }
  174 |
  175 | async function getCachedUrls(page: Page) {
  176 |   return page.evaluate(async () => {
  177 |     const cacheNames = await caches.keys();
  178 |     const urls: string[] = [];
  179 |
  180 |     for (const cacheName of cacheNames) {
  181 |       const cache = await caches.open(cacheName);
  182 |       const requests = await cache.keys();
  183 |       urls.push(...requests.map((request) => request.url));
  184 |     }
  185 |
  186 |     return urls;
  187 |   });
  188 | }
  189 |
  190 | test.describe("staff management integration", () => {
  191 |   test.use({ serviceWorkers: "block" });
  192 |
  193 |   test.beforeEach(async ({ page }) => {
  194 |     await clearClientState(page);
  195 |   });
  196 |
  197 |   test("redirects unauthorized users away from /staff", async ({ page }) => {
  198 |     await mockSession(page, { status: 401 });
  199 |
  200 |     await page.goto("/staff");
  201 |
  202 |     await expect(page).toHaveURL(/\/login$/);
  203 |     await expect(page.getByRole("heading", { name: "Staff Login" })).toBeVisible();
  204 |   });
  205 |
  206 |   test("logs in online and redirects authenticated users away from /login", async ({ page }) => {
  207 |     await mockLogin(page, ADMIN_USER);
  208 |     await mockSession(page, { user: ADMIN_USER });
  209 |     await mockBootstrap(page);
  210 |     await page.route("**/api/staff/device/activate", async (route) => {
  211 |       await route.fulfill({
  212 |         status: 200,
  213 |         contentType: "application/json",
  214 |         headers: { "cache-control": "no-store" },
  215 |         body: JSON.stringify({
  216 |           device: {
  217 |             deviceId: "dev_device_1",
  218 |             deviceName: "Developer Dev-Box",
  219 |             activatedAt: "2026-05-26T08:00:00.000Z",
  220 |           },
  221 |           bootstrapRequired: true,
  222 |         }),
  223 |       });
  224 |     });
  225 |
  226 |     await page.goto("/login");
> 227 |     await page.locator("#login-username").fill(ADMIN_USER.username);
      |                                           ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  228 |     await page.locator("#login-password").fill("CorrectPassword!2026");
  229 |     await page.locator("#login-submit").click();
  230 |
  231 |     await activateDevice(page);
  232 |     await expect(page.getByText("Administrator Tools")).toBeVisible();
  233 |
  234 |     await page.goto("/login");
  235 |     await expect(page).toHaveURL(/\/staff$/);
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
```
