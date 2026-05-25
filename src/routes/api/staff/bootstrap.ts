import { createFileRoute } from "@tanstack/react-router";

import { getDatabase } from "@/features/staff/server/db.server";
import { readSession } from "@/features/staff/server/session.server";
import { buildBootstrapSnapshot, DeviceNotActiveError } from "@/features/staff/server/sync.server";

export async function handleStaffBootstrapRequest({
  db,
  request,
}: {
  db: Awaited<ReturnType<typeof getDatabase>>;
  request: Request;
}) {
  const session = await readSession(db, request);
  if (!session) {
    return Response.json({ code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const deviceId = url.searchParams.get("deviceId");
  if (!deviceId) {
    return Response.json({ code: "VALIDATION_ERROR" }, { status: 400 });
  }

  try {
    const snapshot = await buildBootstrapSnapshot(db, deviceId);
    return Response.json(snapshot, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof DeviceNotActiveError) {
      return Response.json({ code: "DEVICE_NOT_ACTIVE" }, { status: 403 });
    }

    throw error;
  }
}

export const Route = createFileRoute("/api/staff/bootstrap")({
  server: {
    handlers: {
      GET: async ({ request }) => handleStaffBootstrapRequest({ db: await getDatabase(), request }),
    },
  },
});
