import { createFileRoute } from "@tanstack/react-router";

import { listAuditEvents } from "@/features/staff/server/audit.server";
import { getDatabase } from "@/features/staff/server/db.server";
import { assertSessionRole, readSession } from "@/features/staff/server/session.server";

export async function handleAuditEventsRequest({
  db,
  request,
}: {
  db: Awaited<ReturnType<typeof getDatabase>>;
  request: Request;
}) {
  try {
    const session = await readSession(db, request);
    if (!session) {
      return Response.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    assertSessionRole(session.user, ["administrator"]);
    const events = await listAuditEvents(db);
    return Response.json({ events }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    throw error;
  }
}

export const Route = createFileRoute("/api/admin/audit-events")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAuditEventsRequest({ db: await getDatabase(), request }),
    },
  },
});
