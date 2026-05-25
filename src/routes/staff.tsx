/**
 * src/routes/staff.tsx — Protected layout route for all /staff/* pages.
 *
 * Before rendering children, this route checks whether a session user is
 * present in the client-side store. If not, it redirects to /login.
 *
 * NOTE: The server enforces authentication on all /api/staff/* endpoints.
 * This client-side guard is a UX convenience only — it prevents a flash of
 * protected UI and redirects unauthenticated visitors immediately.
 *
 * The actual session is populated when login.tsx calls setSession() after a
 * successful /api/auth/login response. On hard reload the session store is
 * empty; the staff/index loader re-validates with /api/auth/session.
 */

import { createFileRoute } from "@tanstack/react-router";

import { StaffLayout } from "@/components/staff/StaffLayout";

export const Route = createFileRoute("/staff")({
  component: StaffLayout,
});
