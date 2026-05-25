import { createFileRoute } from "@tanstack/react-router";

import { createStaffUserRequestSchema } from "@/features/staff/contracts/auth";
import { recordAuditEvent } from "@/features/staff/server/audit.server";
import { getDatabase } from "@/features/staff/server/db.server";
import {
  assertSameOriginRequest,
  assertSessionRole,
  readSession,
} from "@/features/staff/server/session.server";
import { createStaffUser } from "@/features/staff/server/users.server";

export async function handleCreateStaffUserRequest({
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
    const payload = createStaffUserRequestSchema.parse(await request.json());
    const user = await createStaffUser(db, payload);

    await recordAuditEvent(db, {
      actorId: session.user.id,
      eventType: "admin.user.provisioned",
      metadata: { userId: user.id, role: user.role },
    });

    return Response.json({ user }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return handleAdminError(error);
  }
}

export const Route = createFileRoute("/api/admin/staff-users")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleCreateStaffUserRequest({ db: await getDatabase(), request }),
    },
  },
});

function handleAdminError(error: unknown) {
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return Response.json({ code: "FORBIDDEN" }, { status: 403 });
  }

  if (error instanceof Error && error.name === "ZodError") {
    return Response.json({ code: "VALIDATION_ERROR" }, { status: 400 });
  }

  throw error;
}
