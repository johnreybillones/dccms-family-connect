import { describe, expect, it } from "vitest";

import {
  authDetailsSchema,
  deviceActivationSchema,
  sessionRoleSchema,
  sessionUserSchema,
} from "./auth";

describe("auth contracts", () => {
  it("parses the supported session roles", () => {
    expect(sessionRoleSchema.parse("administrator")).toBe("administrator");
    expect(sessionRoleSchema.parse("staff")).toBe("staff");
    expect(() => sessionRoleSchema.parse("viewer")).toThrow(/invalid enum/i);
  });

  it("accepts session and device metadata for login and session payloads", () => {
    const parsed = authDetailsSchema.parse({
      user: sessionUserSchema.parse({
        id: "user-001",
        username: "admin",
        role: "administrator",
        displayName: "Admin User",
      }),
      device: deviceActivationSchema.parse({
        deviceId: "device-001",
        deviceName: "Office Desktop",
        activatedAt: "2025-05-25T08:00:00.000Z",
      }),
      hasActiveDevice: true,
      offlinePinEnrolled: false,
    });

    expect(parsed.hasActiveDevice).toBe(true);
    expect(parsed.device?.deviceName).toBe("Office Desktop");
  });
});
