import { createFileRoute } from "@tanstack/react-router";

import { getDatabase } from "@/features/staff/server/db.server";
import { getDeviceAuthDetails } from "@/features/staff/server/device.server";
import { readSession } from "@/features/staff/server/session.server";

export async function handleSessionRequest({
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

  const deviceDetails = await getDeviceAuthDetails(db, session.user.id);
  return Response.json(
    {
      user: session.user,
      device: deviceDetails.device,
      hasActiveDevice: deviceDetails.hasActiveDevice,
      offlinePinEnrolled: deviceDetails.offlinePinEnrolled,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

export const Route = createFileRoute("/api/auth/session")({
  server: {
    handlers: {
      GET: async ({ request }) => handleSessionRequest({ db: await getDatabase(), request }),
    },
  },
});
