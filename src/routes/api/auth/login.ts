import { createFileRoute } from "@tanstack/react-router";

import { loginRequestSchema } from "@/features/staff/contracts/auth";
import { recordAuditEvent } from "@/features/staff/server/audit.server";
import { getDatabase } from "@/features/staff/server/db.server";
import { verifyPassword } from "@/features/staff/server/password.server";
import {
  assertSameOriginRequest,
  createSessionCookie,
  issueSession,
} from "@/features/staff/server/session.server";
import { getDeviceAuthDetails } from "@/features/staff/server/device.server";
import { findUserByUsername, toSessionUser } from "@/features/staff/server/users.server";

export async function handleLoginRequest({
  db,
  request,
}: {
  db: Awaited<ReturnType<typeof getDatabase>>;
  request: Request;
}) {
  try {
    assertSameOriginRequest(request);
    const payload = loginRequestSchema.parse(await request.json());
    const user = await findUserByUsername(db, payload.username);

    if (
      !user ||
      user.isActive !== 1 ||
      !(await verifyPassword(payload.password, user.passwordHash))
    ) {
      await recordAuditEvent(db, {
        actorId: user?.id ?? null,
        eventType: "auth.login.failed",
        metadata: { username: payload.username.trim() },
      });
      return json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const issued = await issueSession(db, { userId: user.id });
    const deviceDetails = await getDeviceAuthDetails(db, user.id);

    await recordAuditEvent(db, {
      actorId: user.id,
      eventType: "auth.login.succeeded",
      metadata: { userId: user.id },
    });

    return json(
      {
        user: toSessionUser(user),
        device: deviceDetails.device,
        hasActiveDevice: deviceDetails.hasActiveDevice,
        offlinePinEnrolled: deviceDetails.offlinePinEnrolled,
      },
      {
        headers: {
          "set-cookie": createSessionCookie(issued.token),
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => handleLoginRequest({ db: await getDatabase(), request }),
    },
  },
});

function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

function handleRouteError(error: unknown) {
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return json({ code: "FORBIDDEN" }, { status: 403 });
  }

  if (error instanceof Error && error.name === "ZodError") {
    return json({ code: "VALIDATION_ERROR" }, { status: 400 });
  }

  throw error;
}
