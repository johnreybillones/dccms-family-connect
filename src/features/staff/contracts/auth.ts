import { z } from "zod";

import { isoTimestampSchema } from "./enrollment-profile";

const trimmedRequiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

export const sessionRoleSchema = z.enum(["administrator", "staff"]);

export const sessionUserSchema = z.object({
  id: trimmedRequiredText("User ID"),
  username: trimmedRequiredText("Username"),
  role: sessionRoleSchema,
  displayName: trimmedRequiredText("Display name"),
});

export const deviceActivationSchema = z.object({
  deviceId: trimmedRequiredText("Device ID"),
  deviceName: trimmedRequiredText("Device name"),
  activatedAt: isoTimestampSchema,
});

export const authDetailsSchema = z.object({
  user: sessionUserSchema,
  device: deviceActivationSchema.nullable(),
  hasActiveDevice: z.boolean(),
  offlinePinEnrolled: z.boolean(),
});

export type SessionRole = z.infer<typeof sessionRoleSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type DeviceActivation = z.infer<typeof deviceActivationSchema>;
export type AuthDetails = z.infer<typeof authDetailsSchema>;
