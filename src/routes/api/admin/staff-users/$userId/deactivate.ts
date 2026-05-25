import { createFileRoute } from "@tanstack/react-router";

import { recordAuditEvent } from "@/features/staff/server/audit.server";
import { getDatabase } from "@/features/staff/server/db.server";
import {
  assertSameOriginRequest,
  assertSessionRole,
  readSession,
} from "@/features/staff/server/session.server";
import { deactivateStaffUser } from "@/features/staff/server/users.server";

export async function handleDeactivateStaffUserRequest({
  db,
  request,
  params,
}: {
  db: Awaited<ReturnType<typeof getDatabase>>;
  request: Request;
  params: { userId: string };
}) {
  try {
    assertSameOriginRequest(request);
    const session = await readSession(db, request);
    if (!session) {
      return Response.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    assertSessionRole(session.user, ["administrator"]);
    await deactivateStaffUser(db, { userId: params.userId });
    await recordAuditEvent(db, {
      actorId: session.user.id,
      eventType: "admin.user.deactivated",
      metadata: { userId: params.userId },
    });

    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    throw error;
  }
}

export const Route = createFileRoute("/api/admin/staff-users/$userId/deactivate")({
  server: {
    handlers: {
      POST: async ({ request, params }) =>
        handleDeactivateStaffUserRequest({ db: await getDatabase(), request, params }),
    },
  },
});
