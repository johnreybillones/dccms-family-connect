import { createFileRoute } from "@tanstack/react-router";

import { syncPayloadSchema } from "@/features/staff/contracts/sync";
import { recordAuditEvent } from "@/features/staff/server/audit.server";
import { getDatabase } from "@/features/staff/server/db.server";
import { assertSameOriginRequest, readSession } from "@/features/staff/server/session.server";
import {
  DeviceNotActiveError,
  processSyncRequest,
  SyncConflictError,
} from "@/features/staff/server/sync.server";

export async function handleStaffSyncRequest({
  db,
  request,
}: {
  db: Awaited<ReturnType<typeof getDatabase>>;
  request: Request;
}) {
  let actorId: string | null = null;

  try {
    assertSameOriginRequest(request);
    const session = await readSession(db, request);
    if (!session) {
      return Response.json({ code: "REAUTH_REQUIRED" }, { status: 401 });
    }
    actorId = session.user.id;

    const payload = syncPayloadSchema.parse(await request.json());
    const result = await processSyncRequest(db, {
      deviceId: payload.deviceId,
      userId: actorId,
      payload,
    });

    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof DeviceNotActiveError) {
      return Response.json({ code: "DEVICE_NOT_ACTIVE" }, { status: 403 });
    }

    if (error instanceof SyncConflictError) {
      await recordAuditEvent(db, {
        actorId,
        eventType: "staff.sync.conflict",
        metadata: {
          conflictOperationId: error.conflictOperationId,
        },
      });
      return Response.json(
        {
          code: "REFRESH_REQUIRED",
          acknowledgedOperationIds: [],
          ...error.snapshot,
        },
        { status: 409, headers: { "cache-control": "no-store" } },
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ code: "VALIDATION_ERROR" }, { status: 400 });
    }

    throw error;
  }
}

export const Route = createFileRoute("/api/staff/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => handleStaffSyncRequest({ db: await getDatabase(), request }),
    },
  },
});
