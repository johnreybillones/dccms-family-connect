import { createFileRoute } from "@tanstack/react-router";

import { deviceDeactivateRequestSchema } from "@/features/staff/contracts/auth";
import { recordAuditEvent } from "@/features/staff/server/audit.server";
import { getDatabase } from "@/features/staff/server/db.server";
import { deactivateDevice } from "@/features/staff/server/device.server";
import {
  assertSameOriginRequest,
  assertSessionRole,
  readSession,
} from "@/features/staff/server/session.server";

export async function handleDeviceDeactivateRequest({
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
    const payload = deviceDeactivateRequestSchema.parse(await request.json());
    await deactivateDevice(db, {
      deviceId: payload.deviceId,
      deactivatedByUserId: session.user.id,
    });

    await recordAuditEvent(db, {
      actorId: session.user.id,
      eventType: "device.deactivation",
      metadata: { deviceId: payload.deviceId },
    });

    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ code: "VALIDATION_ERROR" }, { status: 400 });
    }

    throw error;
  }
}

export const Route = createFileRoute("/api/staff/device/deactivate")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleDeviceDeactivateRequest({ db: await getDatabase(), request }),
    },
  },
});
