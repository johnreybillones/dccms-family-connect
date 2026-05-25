// @vitest-environment node

import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password.server";

describe("password.server", () => {
  it("hashes with a random salt and verifies the original password", async () => {
    const password = "CorrectHorseBatteryStaple!2026";

    const firstHash = await hashPassword(password);
    const secondHash = await hashPassword(password);

    expect(firstHash).not.toBe(secondHash);
    await expect(verifyPassword(password, firstHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", firstHash)).resolves.toBe(false);
  });
});
