export type StoredUser = {
  id: string;
  username: string;
  usernameNormalized: string;
  displayName: string;
  role: "administrator" | "staff";
  passwordHash: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
};

export type StoredSession = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  invalidatedAt: string | null;
};

export type StoredDevice = {
  deviceId: string;
  deviceName: string;
  activatedByUserId: string;
  activatedAt: string;
  deactivatedAt: string | null;
  deactivatedByUserId: string | null;
};

export type StoredAuthorizedDeviceUser = {
  deviceId: string;
  userId: string;
  offlinePinHash: string | null;
  enrolledAt: string | null;
};

export type StoredAuditEvent = {
  id: string;
  timestamp: string;
  actorId: string | null;
  eventType: string;
  metadata: string;
};

type RunResult = {
  meta?: {
    changes?: number;
  };
};

export class MemoryD1Database {
  public readonly users = new Map<string, StoredUser>();
  public readonly sessions = new Map<string, StoredSession>();
  public readonly devices = new Map<string, StoredDevice>();
  public readonly authorizedDeviceUsers = new Map<string, StoredAuthorizedDeviceUser>();
  public readonly auditEvents: StoredAuditEvent[] = [];

  prepare(query: string) {
    return new MemoryD1Statement(this, collapseWhitespace(query));
  }
}

class MemoryD1Statement {
  private params: unknown[] = [];

  constructor(
    private readonly database: MemoryD1Database,
    private readonly query: string,
  ) {}

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async run(): Promise<RunResult> {
    if (this.query.startsWith("INSERT INTO staff_users")) {
      const [
        id,
        username,
        usernameNormalized,
        displayName,
        role,
        passwordHash,
        createdAt,
        updatedAt,
      ] = this.params as [
        string,
        string,
        string,
        string,
        StoredUser["role"],
        string,
        string,
        string,
      ];

      if (
        [...this.database.users.values()].some(
          (user) => user.usernameNormalized === usernameNormalized,
        )
      ) {
        throw new Error("D1_ERROR: UNIQUE constraint failed: staff_users.username_normalized");
      }

      this.database.users.set(id, {
        id,
        username,
        usernameNormalized,
        displayName,
        role,
        passwordHash,
        isActive: 1,
        createdAt,
        updatedAt,
        deactivatedAt: null,
      });

      return { meta: { changes: 1 } };
    }

    if (this.query.startsWith("UPDATE staff_users SET is_active = 0")) {
      const [updatedAt, deactivatedAt, userId] = this.params as [string, string, string];
      const user = this.database.users.get(userId);
      if (!user || user.isActive !== 1) {
        return { meta: { changes: 0 } };
      }

      user.isActive = 0;
      user.updatedAt = updatedAt;
      user.deactivatedAt = deactivatedAt;
      return { meta: { changes: 1 } };
    }

    if (this.query.startsWith("INSERT INTO sessions")) {
      const [id, userId, tokenHash, createdAt, expiresAt] = this.params as [
        string,
        string,
        string,
        string,
        string,
      ];

      this.database.sessions.set(tokenHash, {
        id,
        userId,
        tokenHash,
        createdAt,
        expiresAt,
        invalidatedAt: null,
      });

      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "UPDATE sessions SET invalidated_at = ? WHERE token_hash = ? AND invalidated_at IS NULL"
    ) {
      const [invalidatedAt, tokenHash] = this.params as [string, string];
      const session = this.database.sessions.get(tokenHash);
      if (!session || session.invalidatedAt !== null) {
        return { meta: { changes: 0 } };
      }

      session.invalidatedAt = invalidatedAt;
      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "UPDATE sessions SET invalidated_at = ? WHERE user_id = ? AND invalidated_at IS NULL"
    ) {
      const [invalidatedAt, userId] = this.params as [string, string];
      let changes = 0;
      for (const session of this.database.sessions.values()) {
        if (session.userId === userId && session.invalidatedAt === null) {
          session.invalidatedAt = invalidatedAt;
          changes += 1;
        }
      }

      return { meta: { changes } };
    }

    if (
      this.query.startsWith(
        "INSERT INTO activated_devices (device_id, device_name, activated_by_user_id, activated_at, deactivated_at, deactivated_by_user_id)",
      )
    ) {
      const [
        deviceId,
        deviceName,
        activatedByUserId,
        activatedAt,
        deactivatedAt,
        deactivatedByUserId,
      ] = this.params as [string, string, string, string, string | null, string | null];

      this.database.devices.set(deviceId, {
        deviceId,
        deviceName,
        activatedByUserId,
        activatedAt,
        deactivatedAt,
        deactivatedByUserId,
      });

      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "UPDATE activated_devices SET deactivated_at = ?, deactivated_by_user_id = ? WHERE device_id = ? AND deactivated_at IS NULL"
    ) {
      const [deactivatedAt, deactivatedByUserId, deviceId] = this.params as [
        string,
        string,
        string,
      ];
      const device = this.database.devices.get(deviceId);
      if (!device || device.deactivatedAt !== null) {
        return { meta: { changes: 0 } };
      }

      device.deactivatedAt = deactivatedAt;
      device.deactivatedByUserId = deactivatedByUserId;
      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "INSERT INTO audit_events (id, timestamp, actor_id, event_type, metadata) VALUES (?, ?, ?, ?, ?)"
    ) {
      const [id, timestamp, actorId, eventType, metadata] = this.params as [
        string,
        string,
        string | null,
        string,
        string,
      ];

      this.database.auditEvents.push({ id, timestamp, actorId, eventType, metadata });
      return { meta: { changes: 1 } };
    }

    throw new Error(`Unsupported run query: ${this.query}`);
  }

  async first<T>(): Promise<T | null> {
    if (
      this.query ===
      "SELECT id, username, username_normalized AS usernameNormalized, display_name AS displayName, role, password_hash AS passwordHash, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt, deactivated_at AS deactivatedAt FROM staff_users WHERE username_normalized = ? LIMIT 1"
    ) {
      const [usernameNormalized] = this.params as [string];
      const user = [...this.database.users.values()].find(
        (entry) => entry.usernameNormalized === usernameNormalized,
      );
      return (user ?? null) as T | null;
    }

    if (
      this.query ===
      "SELECT id, username, username_normalized AS usernameNormalized, display_name AS displayName, role, password_hash AS passwordHash, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt, deactivated_at AS deactivatedAt FROM staff_users WHERE id = ? LIMIT 1"
    ) {
      const [userId] = this.params as [string];
      return (this.database.users.get(userId) ?? null) as T | null;
    }

    if (
      this.query ===
      "SELECT sessions.id AS sessionId, staff_users.id AS userId, staff_users.username AS username, staff_users.display_name AS displayName, staff_users.role AS role, sessions.expires_at AS expiresAt FROM sessions JOIN staff_users ON staff_users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.invalidated_at IS NULL AND sessions.expires_at > ? AND staff_users.is_active = 1 LIMIT 1"
    ) {
      const [tokenHash, nowIso] = this.params as [string, string];
      const session = this.database.sessions.get(tokenHash);
      if (!session || session.invalidatedAt !== null || session.expiresAt <= nowIso) {
        return null;
      }

      const user = this.database.users.get(session.userId);
      if (!user || user.isActive !== 1) {
        return null;
      }

      return {
        sessionId: session.id,
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        expiresAt: session.expiresAt,
      } as T;
    }

    if (
      this.query ===
      "SELECT device_id AS deviceId, device_name AS deviceName, activated_by_user_id AS activatedByUserId, activated_at AS activatedAt FROM activated_devices WHERE deactivated_at IS NULL ORDER BY activated_at DESC LIMIT 1"
    ) {
      const device =
        [...this.database.devices.values()]
          .filter((entry) => entry.deactivatedAt === null)
          .sort((left, right) => right.activatedAt.localeCompare(left.activatedAt))[0] ?? null;

      if (!device) {
        return null;
      }

      return {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        activatedByUserId: device.activatedByUserId,
        activatedAt: device.activatedAt,
      } as T;
    }

    if (
      this.query ===
      "SELECT offline_pin_hash AS offlinePinHash FROM authorized_device_users WHERE device_id = ? AND user_id = ? LIMIT 1"
    ) {
      const [deviceId, userId] = this.params as [string, string];
      const row = this.database.authorizedDeviceUsers.get(`${deviceId}::${userId}`);
      if (!row) {
        return null;
      }

      return { offlinePinHash: row.offlinePinHash } as T;
    }

    throw new Error(`Unsupported first query: ${this.query}`);
  }

  async all<T>(): Promise<{ results: T[] }> {
    if (
      this.query ===
      "SELECT id, timestamp, actor_id AS actorId, event_type AS eventType, metadata FROM audit_events ORDER BY timestamp DESC"
    ) {
      const results = [...this.database.auditEvents]
        .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
        .map((event) => ({ ...event }));
      return { results: results as T[] };
    }

    throw new Error(`Unsupported all query: ${this.query}`);
  }
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
