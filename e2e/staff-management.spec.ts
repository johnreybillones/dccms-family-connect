import { expect, test, type Page } from "@playwright/test";

const STAFF_USER = {
  id: "usr_staff_e2e",
  username: "staff_e2e",
  displayName: "Teacher E2E",
  role: "staff" as const,
};

const ADMIN_USER = {
  id: "usr_admin_e2e",
  username: "admin_e2e",
  displayName: "Admin E2E",
  role: "administrator" as const,
};

type SessionMockOptions = {
  user?: typeof STAFF_USER | typeof ADMIN_USER;
  status?: number;
  hasActiveDevice?: boolean;
  offlinePinEnrolled?: boolean;
};

async function clearClientState(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();

    await Promise.all(
      (await caches.keys()).map(async (cacheName) => {
        await caches.delete(cacheName);
      }),
    );

    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("dccms-staff");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });
}

async function mockSession(page: Page, options: SessionMockOptions = {}) {
  const {
    user = STAFF_USER,
    status = 200,
    hasActiveDevice = false,
    offlinePinEnrolled = false,
  } = options;

  await page.route("**/api/auth/session", async (route) => {
    if (status !== 200) {
      await route.fulfill({
        status,
        contentType: "application/json",
        headers: { "cache-control": "no-store" },
        body: JSON.stringify({ code: "UNAUTHENTICATED" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify({
        user,
        device: hasActiveDevice
          ? {
              deviceId: "dev_device_1",
              deviceName: "Developer Dev-Box",
              activatedAt: "2026-05-26T08:00:00.000Z",
            }
          : null,
        hasActiveDevice,
        offlinePinEnrolled,
      }),
    });
  });
}

async function mockLogin(page: Page, user = STAFF_USER) {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify({
        user,
        device: null,
        hasActiveDevice: false,
        offlinePinEnrolled: false,
      }),
    });
  });
}

async function mockBootstrap(page: Page) {
  await page.route("**/api/staff/bootstrap?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify({
        profiles: [],
        attendanceRecords: [],
        syncedAt: "2026-05-26T08:05:00.000Z",
      }),
    });
  });
}

async function activateDevice(page: Page) {
  const activationHeading = page.getByRole("heading", { name: "Activate Device Vault" });
  const dashboardHeading = page.getByRole("heading", { name: "Day Care Center" });
  await expect
    .poll(async () => {
      if (await dashboardHeading.isVisible().catch(() => false)) return "dashboard";
      if (await activationHeading.isVisible().catch(() => false)) return "activation";
      return "loading";
    })
    .not.toBe("loading");

  const activationRequired = await activationHeading.isVisible().catch(() => false);

  if (activationRequired) {
    await page.getByRole("button", { name: "Activate & Unlock Vault" }).click();
  }

  await expect(page.getByRole("heading", { name: "Day Care Center" })).toBeVisible();
}

async function getStoreRecordCount(page: Page, storeName: string) {
  return page.evaluate(async (targetStoreName) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("dccms-staff");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(targetStoreName, "readonly");
      const request = tx.objectStore(targetStoreName).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return count;
  }, storeName);
}

async function getActivationMeta(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("dccms-staff");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const value = await new Promise<Record<string, string> | null>((resolve, reject) => {
      const tx = db.transaction("activation_metadata", "readonly");
      const request = tx.objectStore("activation_metadata").get("activation");
      request.onsuccess = () => resolve((request.result as Record<string, string>) ?? null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return value;
  });
}

async function getCachedUrls(page: Page) {
  return page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const urls: string[] = [];

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      urls.push(...requests.map((request) => request.url));
    }

    return urls;
  });
}

test.describe("staff management integration", () => {
  test.use({ serviceWorkers: "block" });

  test.beforeEach(async ({ page }) => {
    await clearClientState(page);
  });

  test("redirects unauthorized users away from /staff", async ({ page }) => {
    await mockSession(page, { status: 401 });

    await page.goto("/staff");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Staff Login" })).toBeVisible();
  });

  test("logs in online and redirects authenticated users away from /login", async ({ page }) => {
    await mockLogin(page, ADMIN_USER);
    await mockSession(page, { user: ADMIN_USER });
    await mockBootstrap(page);
    await page.route("**/api/staff/device/activate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "cache-control": "no-store" },
        body: JSON.stringify({
          device: {
            deviceId: "dev_device_1",
            deviceName: "Developer Dev-Box",
            activatedAt: "2026-05-26T08:00:00.000Z",
          },
          bootstrapRequired: true,
        }),
      });
    });

    await page.goto("/login");
    await page.locator("#login-username").fill(ADMIN_USER.username);
    await page.locator("#login-password").fill("CorrectPassword!2026");
    await page.locator("#login-submit").click();

    await activateDevice(page);
    await expect(page.getByText("Administrator Tools")).toBeVisible();

    await page.goto("/login");
    await expect(page).toHaveURL(/\/staff$/);
  });

  test("activates the device and persists activation metadata for offline use", async ({
    page,
  }) => {
    await mockSession(page, { user: ADMIN_USER });
    await mockBootstrap(page);

    let activationPayload: Record<string, string> | null = null;
    await page.route("**/api/staff/device/activate", async (route) => {
      activationPayload = (await route.request().postDataJSON()) as Record<string, string>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "cache-control": "no-store" },
        body: JSON.stringify({
          device: {
            deviceId: "dev_device_1",
            deviceName: "Developer Dev-Box",
            activatedAt: "2026-05-26T08:00:00.000Z",
          },
          bootstrapRequired: true,
        }),
      });
    });

    await page.goto("/staff");
    await activateDevice(page);

    expect(activationPayload).toEqual({
      deviceId: "dev_device_1",
      deviceName: "Developer Dev-Box",
    });

    await expect(page.getByRole("heading", { name: "Day Care Center" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sync status: All changes synced/i }).first(),
    ).toBeVisible();

    await expect
      .poll(async () => getActivationMeta(page))
      .toMatchObject({
        deviceId: "dev_device_1",
        deviceName: "Developer Dev-Box",
      });
  });

  test("handles offline records, attendance, exports, and reconnection sync", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Offline downloads are verified in Chromium only.");

    await mockSession(page, { user: STAFF_USER });
    await mockBootstrap(page);
    await page.route("**/api/staff/device/activate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "cache-control": "no-store" },
        body: JSON.stringify({
          device: {
            deviceId: "dev_device_1",
            deviceName: "Developer Dev-Box",
            activatedAt: "2026-05-26T08:00:00.000Z",
          },
          bootstrapRequired: true,
        }),
      });
    });

    const syncRequests: Array<Record<string, unknown>> = [];
    await page.route("**/api/staff/sync", async (route) => {
      const payload = (await route.request().postDataJSON()) as Record<string, unknown>;
      syncRequests.push(payload);

      const operations = Array.isArray(payload.operations)
        ? (payload.operations as Array<Record<string, unknown>>)
        : [];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "cache-control": "no-store" },
        body: JSON.stringify({
          acknowledgedOperationIds: operations
            .map((operation) => operation.operationId)
            .filter((operationId): operationId is string => typeof operationId === "string"),
          profiles: [],
          attendanceRecords: [],
          syncedAt: "2026-05-26T09:45:00.000Z",
        }),
      });
    });

    await page.goto("/staff");
    await activateDevice(page);

    await page.getByRole("link", { name: "Student Records" }).first().click();
    await page.getByRole("button", { name: /Add student/i }).click();
    await expect(page.locator("#childFirstName")).toBeVisible();
    await context.setOffline(true);
    await page.locator("#childFirstName").fill("Offline");
    await page.locator("#childLastName").fill("Learner");
    await page.locator("#birthDate").fill("2020-10-10");
    await page.locator("#address").fill("Barangay San Antonio de Padua I");
    await page.locator("#form-next-tab").click();
    await page.locator("#guardianFullName").fill("Parent Offline");
    await page.locator("#guardianRelationship").fill("Mother");
    await page.locator("#guardianContactNumber").fill("09171234567");
    await page.locator("#tab-enrollment").click();
    await expect(page.locator("#enrollmentDate")).toBeVisible();
    await page.locator("#enrollmentDate").fill("2025-06-16");
    await page.locator("#form-submit").click();

    await expect(page).toHaveURL(/\/staff\/students\/.+/);

    await page.getByRole("link", { name: "Student Records" }).first().click();
    await expect(page.getByText("Awaiting sync")).toBeVisible();
    await expect(page.getByText("1 record is awaiting sync to the server.")).toBeVisible();

    await page.getByRole("link", { name: "Attendance" }).first().click();
    await page.getByRole("link", { name: "New Sheet" }).click();
    await expect(page.getByRole("heading", { name: "Attendance Sheet" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Offline Learner Present/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Offline Learner Absent/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Offline Learner Excused/i })).toBeVisible();
    await page.getByRole("button", { name: /Offline Learner Excused/i }).click();
    await page.getByLabel("Offline Learner Excused Note").fill("Child is sick today.");
    await page.getByRole("button", { name: "Save Attendance" }).click();

    await expect(page).toHaveURL(/\/staff\/attendance$/);
    await expect(page.getByText("You're offline")).toBeVisible();

    await page.getByRole("link", { name: "Reports" }).first().click();
    await expect(page.getByText("Offline Outbox Status")).toBeVisible();

    const [pdfDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export PDF Document" }).click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
    await expect(page.getByText(/Successfully generated .*\.pdf/i)).toBeVisible();

    const [xlsxDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export XLSX Spreadsheet" }).click(),
    ]);
    expect(xlsxDownload.suggestedFilename()).toMatch(/\.xlsx$/);
    await expect(page.getByText(/Successfully generated .*\.xlsx/i)).toBeVisible();

    await expect.poll(async () => getStoreRecordCount(page, "operation_queue")).toBeGreaterThan(0);

    await context.setOffline(false);
    await expect
      .poll(async () => syncRequests.length, {
        timeout: 15000,
      })
      .toBeGreaterThan(0);

    const lastSyncRequest = syncRequests.at(-1);
    const operations = Array.isArray(lastSyncRequest?.operations)
      ? (lastSyncRequest.operations as Array<Record<string, unknown>>)
      : [];
    expect(operations.map((operation) => operation.kind)).toEqual(
      expect.arrayContaining(["createProfile", "upsertAttendance", "recordExportAudit"]),
    );

    await expect.poll(async () => getStoreRecordCount(page, "operation_queue")).toBe(0);
    await expect(
      page.getByRole("button", { name: /Sync status: All changes synced/i }).first(),
    ).toBeVisible();
  });

  test.describe("service worker cache guard", () => {
    test.use({ serviceWorkers: "allow" });

    test("keeps api responses and generated report files out of service worker caches", async ({
      page,
    }) => {
      let authenticated = false;
      await page.route("**/api/auth/session", async (route) => {
        if (!authenticated) {
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            headers: { "cache-control": "no-store" },
            body: JSON.stringify({ code: "UNAUTHENTICATED" }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "cache-control": "no-store" },
          body: JSON.stringify({
            user: STAFF_USER,
            device: null,
            hasActiveDevice: false,
            offlinePinEnrolled: false,
          }),
        });
      });
      await page.route("**/api/auth/login", async (route) => {
        authenticated = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "cache-control": "no-store" },
          body: JSON.stringify({
            user: STAFF_USER,
            device: null,
            hasActiveDevice: false,
            offlinePinEnrolled: false,
          }),
        });
      });
      await mockBootstrap(page);
      await page.route("**/api/staff/device/activate", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "cache-control": "no-store" },
          body: JSON.stringify({
            device: {
              deviceId: "dev_device_1",
              deviceName: "Developer Dev-Box",
              activatedAt: "2026-05-26T08:00:00.000Z",
            },
            bootstrapRequired: true,
          }),
        });
      });

      await page.goto("/").catch(() => {});
      await expect(page.getByRole("link", { name: "Staff Login" }).first()).toBeVisible();
      await page.getByRole("link", { name: "Staff Login" }).first().click();
      await page.locator("#login-username").fill(STAFF_USER.username);
      await page.locator("#login-password").fill("CorrectPassword!2026");
      await page.locator("#login-submit").click();
      await activateDevice(page);
      await expect
        .poll(async () => page.evaluate(() => navigator.serviceWorker.ready.then(() => true)))
        .toBe(true);

      await page.getByRole("link", { name: "Student Records" }).first().click();
      await page.getByRole("button", { name: /Add student/i }).click();
      await page.locator("#childFirstName").fill("Cache");
      await page.locator("#childLastName").fill("Guard");
      await page.locator("#birthDate").fill("2020-09-09");
      await page.locator("#address").fill("Barangay San Antonio de Padua I");
      await page.locator("#form-next-tab").click();
      await page.locator("#guardianFullName").fill("Guardian Cache");
      await page.locator("#guardianRelationship").fill("Father");
      await page.locator("#guardianContactNumber").fill("09170000000");
      await page.locator("#tab-enrollment").click();
      await expect(page.locator("#enrollmentDate")).toBeVisible();
      await page.locator("#form-submit").click();

      await page.goto("/staff/reports");
      const [pdfDownload] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Export PDF Document" }).click(),
      ]);
      const pdfFileName = pdfDownload.suggestedFilename();

      const cachedUrls = await getCachedUrls(page);
      expect(cachedUrls.some((url) => url.includes("/api/"))).toBe(false);
      expect(cachedUrls.some((url) => url.includes(pdfFileName))).toBe(false);
      expect(cachedUrls.some((url) => url.endsWith(".pdf") || url.endsWith(".xlsx"))).toBe(false);
    });
  });
});
