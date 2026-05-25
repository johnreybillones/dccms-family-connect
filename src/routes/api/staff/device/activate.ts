import { createFileRoute } from "@tanstack/react-router";

import { deviceActivateRequestSchema } from "@/features/staff/contracts/auth";
import { recordAuditEvent } from "@/features/staff/server/audit.server";
import { getDatabase } from "@/features/staff/server/db.server";
import { activateDevice } from "@/features/staff/server/device.server";
import {
  assertSameOriginRequest,
  assertSessionRole,
  readSession,
} from "@/features/staff/server/session.server";

export async function handleDeviceActivateRequest({
  db,
  request,
}: {
  db: Awaited<ReturnType<typeof getDatabase>>;
  request: Request;
}) {
  try {
    assertSameOriginRequest(request);
    const session = await readSession(db, request);
    if (!session) {
      return Response.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    assertSessionRole(session.user, ["administrator"]);
    const payload = deviceActivateRequestSchema.parse(await request.json());
    const device = await activateDevice(db, {
      ...payload,
      activatedByUserId: session.user.id,
    });

    await recordAuditEvent(db, {
      actorId: session.user.id,
      eventType: "device.activation",
      metadata: { deviceId: device.deviceId },
    });

    return Response.json(
      {
        device,
        bootstrapRequired: true,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "DEVICE_ALREADY_ACTIVE") {
      return Response.json({ code: "DEVICE_ALREADY_ACTIVE" }, { status: 409 });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ code: "VALIDATION_ERROR" }, { status: 400 });
    }

    throw error;
  }
}

export const Route = createFileRoute("/api/staff/device/activate")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleDeviceActivateRequest({ db: await getDatabase(), request }),
    },
  },
});
