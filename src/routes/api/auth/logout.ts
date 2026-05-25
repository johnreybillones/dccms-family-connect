import { createFileRoute } from "@tanstack/react-router";

import { recordAuditEvent } from "@/features/staff/server/audit.server";
import { getDatabase } from "@/features/staff/server/db.server";
import {
  assertSameOriginRequest,
  clearSessionCookie,
  invalidateSession,
  readSession,
} from "@/features/staff/server/session.server";

export async function handleLogoutRequest({
  db,
  request,
}: {
  db: Awaited<ReturnType<typeof getDatabase>>;
  request: Request;
}) {
  try {
    assertSameOriginRequest(request);
    const session = await readSession(db, request);
    await invalidateSession(db, request);

    await recordAuditEvent(db, {
      actorId: session?.user.id ?? null,
      eventType: "auth.logout",
      metadata: { userId: session?.user.id ?? null },
    });

    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": clearSessionCookie(),
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    throw error;
  }
}

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => handleLogoutRequest({ db: await getDatabase(), request }),
    },
  },
});
