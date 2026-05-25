import type { SessionRole, SessionUser } from "../contracts/auth";
import type { D1DatabaseLike } from "./db.server";
import { hashPassword } from "./password.server";

export type StaffUserRecord = {
  id: string;
  username: string;
  usernameNormalized: string;
  displayName: string;
  role: SessionRole;
  passwordHash: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
};

type CreateStaffUserOptions = {
  username: string;
  displayName: string;
  role: SessionRole;
  password: string;
  now?: Date;
};

export async function createStaffUser(
  database: D1DatabaseLike,
  options: CreateStaffUserOptions,
): Promise<SessionUser> {
  const now = options.now ?? new Date();
  const id = crypto.randomUUID();
  const username = options.username.trim();
  const usernameNormalized = normalizeUsername(username);
  const passwordHash = await hashPassword(options.password);

  await database
    .prepare(
      "INSERT INTO staff_users (id, username, username_normalized, display_name, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      username,
      usernameNormalized,
      options.displayName.trim(),
      options.role,
      passwordHash,
      now.toISOString(),
      now.toISOString(),
    )
    .run();

  return {
    id,
    username,
    displayName: options.displayName.trim(),
    role: options.role,
  };
}

export async function findUserByUsername(
  database: D1DatabaseLike,
  username: string,
): Promise<StaffUserRecord | null> {
  return database
    .prepare(
      "SELECT id, username, username_normalized AS usernameNormalized, display_name AS displayName, role, password_hash AS passwordHash, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt, deactivated_at AS deactivatedAt FROM staff_users WHERE username_normalized = ? LIMIT 1",
    )
    .bind(normalizeUsername(username))
    .first<StaffUserRecord>();
}

export async function findUserById(
  database: D1DatabaseLike,
  userId: string,
): Promise<StaffUserRecord | null> {
  return database
    .prepare(
      "SELECT id, username, username_normalized AS usernameNormalized, display_name AS displayName, role, password_hash AS passwordHash, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt, deactivated_at AS deactivatedAt FROM staff_users WHERE id = ? LIMIT 1",
    )
    .bind(userId)
    .first<StaffUserRecord>();
}

export async function deactivateStaffUser(
  database: D1DatabaseLike,
  options: { userId: string; now?: Date },
): Promise<boolean> {
  const now = options.now ?? new Date();
  const result = await database
    .prepare(
      "UPDATE staff_users SET is_active = 0, updated_at = ?, deactivated_at = ? WHERE id = ? AND is_active = 1",
    )
    .bind(now.toISOString(), now.toISOString(), options.userId)
    .run();

  if ((result.meta?.changes ?? 0) === 0) {
    return false;
  }

  await database
    .prepare("UPDATE sessions SET invalidated_at = ? WHERE user_id = ? AND invalidated_at IS NULL")
    .bind(now.toISOString(), options.userId)
    .run();

  return true;
}

export function toSessionUser(
  user: Pick<StaffUserRecord, "id" | "username" | "displayName" | "role">,
): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}
