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

export type StoredProfile = {
  id: string;
  recordNumber: string | null;
  childFirstName: string;
  childMiddleName: string | null;
  childLastName: string;
  childSuffix: string | null;
  birthDate: string;
  sex: "Female" | "Male" | "Not specified";
  address: string;
  guardianFullName: string;
  guardianRelationship: string;
  guardianContactNumber: string;
  schoolYear: string;
  enrollmentDate: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type StoredAttendanceRecord = {
  id: string;
  profileId: string;
  attendanceDate: string;
  status: "present" | "absent" | "excused";
  note: string | null;
  recordedByUserId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type StoredSyncOperation = {
  id: string;
  deviceId: string;
  operationId: string;
  kind: string;
  clientRecordedAt: string;
  receivedAt: string;
};

export type StoredDeviceSyncState = {
  deviceId: string;
  revision: number;
  lastSyncedAt: string | null;
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
  public readonly profiles = new Map<string, StoredProfile>();
  public readonly attendanceRecords = new Map<string, StoredAttendanceRecord>();
  public readonly syncOperations: StoredSyncOperation[] = [];
  public readonly deviceSyncStatus = new Map<string, StoredDeviceSyncState>();
  public readonly auditEvents: StoredAuditEvent[] = [];
  private transactionSnapshot: MemorySnapshot | null = null;

  prepare(query: string) {
    return new MemoryD1Statement(this, collapseWhitespace(query));
  }

  async exec(query: string) {
    if (query === "BEGIN IMMEDIATE") {
      this.transactionSnapshot = this.snapshot();
      return;
    }

    if (query === "COMMIT") {
      this.transactionSnapshot = null;
      return;
    }

    if (query === "ROLLBACK") {
      if (this.transactionSnapshot) {
        this.restore(this.transactionSnapshot);
        this.transactionSnapshot = null;
      }
    }
  }

  private snapshot(): MemorySnapshot {
    return {
      users: cloneMap(this.users),
      sessions: cloneMap(this.sessions),
      devices: cloneMap(this.devices),
      authorizedDeviceUsers: cloneMap(this.authorizedDeviceUsers),
      profiles: cloneMap(this.profiles),
      attendanceRecords: cloneMap(this.attendanceRecords),
      syncOperations: this.syncOperations.map((entry) => ({ ...entry })),
      deviceSyncStatus: cloneMap(this.deviceSyncStatus),
      auditEvents: this.auditEvents.map((entry) => ({ ...entry })),
    };
  }

  private restore(snapshot: MemorySnapshot) {
    replaceMap(this.users, snapshot.users);
    replaceMap(this.sessions, snapshot.sessions);
    replaceMap(this.devices, snapshot.devices);
    replaceMap(this.authorizedDeviceUsers, snapshot.authorizedDeviceUsers);
    replaceMap(this.profiles, snapshot.profiles);
    replaceMap(this.attendanceRecords, snapshot.attendanceRecords);
    replaceMap(this.deviceSyncStatus, snapshot.deviceSyncStatus);

    this.syncOperations.length = 0;
    this.syncOperations.push(...snapshot.syncOperations.map((entry) => ({ ...entry })));

    this.auditEvents.length = 0;
    this.auditEvents.push(...snapshot.auditEvents.map((entry) => ({ ...entry })));
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

    if (
      this.query ===
      "INSERT INTO enrollment_profiles (id, record_number, child_first_name, child_middle_name, child_last_name, child_suffix, birth_date, sex, address, guardian_full_name, guardian_relationship, guardian_contact_number, school_year, enrollment_date, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ) {
      const [
        id,
        recordNumber,
        childFirstName,
        childMiddleName,
        childLastName,
        childSuffix,
        birthDate,
        sex,
        address,
        guardianFullName,
        guardianRelationship,
        guardianContactNumber,
        schoolYear,
        enrollmentDate,
        revision,
        createdAt,
        updatedAt,
      ] = this.params as [
        string,
        string | null,
        string,
        string | null,
        string,
        string | null,
        string,
        StoredProfile["sex"],
        string,
        string,
        string,
        string,
        string,
        string,
        number,
        string,
        string,
      ];

      this.database.profiles.set(id, {
        id,
        recordNumber,
        childFirstName,
        childMiddleName,
        childLastName,
        childSuffix,
        birthDate,
        sex,
        address,
        guardianFullName,
        guardianRelationship,
        guardianContactNumber,
        schoolYear,
        enrollmentDate,
        revision,
        createdAt,
        updatedAt,
      });
      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "UPDATE enrollment_profiles SET record_number = ?, child_first_name = ?, child_middle_name = ?, child_last_name = ?, child_suffix = ?, birth_date = ?, sex = ?, address = ?, guardian_full_name = ?, guardian_relationship = ?, guardian_contact_number = ?, school_year = ?, enrollment_date = ?, revision = ?, updated_at = ? WHERE id = ?"
    ) {
      const [
        recordNumber,
        childFirstName,
        childMiddleName,
        childLastName,
        childSuffix,
        birthDate,
        sex,
        address,
        guardianFullName,
        guardianRelationship,
        guardianContactNumber,
        schoolYear,
        enrollmentDate,
        revision,
        updatedAt,
        id,
      ] = this.params as [
        string | null,
        string,
        string | null,
        string,
        string | null,
        string,
        StoredProfile["sex"],
        string,
        string,
        string,
        string,
        string,
        string,
        number,
        string,
        string,
      ];
      const profile = this.database.profiles.get(id);
      if (!profile) {
        return { meta: { changes: 0 } };
      }

      Object.assign(profile, {
        recordNumber,
        childFirstName,
        childMiddleName,
        childLastName,
        childSuffix,
        birthDate,
        sex,
        address,
        guardianFullName,
        guardianRelationship,
        guardianContactNumber,
        schoolYear,
        enrollmentDate,
        revision,
        updatedAt,
      });
      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "INSERT INTO attendance_records (id, profile_id, attendance_date, status, note, recorded_by_user_id, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ) {
      const [
        id,
        profileId,
        attendanceDate,
        status,
        note,
        recordedByUserId,
        revision,
        createdAt,
        updatedAt,
      ] = this.params as [
        string,
        string,
        string,
        StoredAttendanceRecord["status"],
        string | null,
        string,
        number,
        string,
        string,
      ];

      this.database.attendanceRecords.set(id, {
        id,
        profileId,
        attendanceDate,
        status,
        note,
        recordedByUserId,
        revision,
        createdAt,
        updatedAt,
      });
      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "UPDATE attendance_records SET profile_id = ?, attendance_date = ?, status = ?, note = ?, recorded_by_user_id = ?, revision = ?, updated_at = ? WHERE id = ?"
    ) {
      const [profileId, attendanceDate, status, note, recordedByUserId, revision, updatedAt, id] =
        this.params as [
          string,
          string,
          StoredAttendanceRecord["status"],
          string | null,
          string,
          number,
          string,
          string,
        ];
      const record = this.database.attendanceRecords.get(id);
      if (!record) {
        return { meta: { changes: 0 } };
      }

      Object.assign(record, {
        profileId,
        attendanceDate,
        status,
        note,
        recordedByUserId,
        revision,
        updatedAt,
      });
      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "INSERT INTO sync_operations (id, device_id, operation_id, kind, client_recorded_at, received_at) VALUES (?, ?, ?, ?, ?, ?)"
    ) {
      const [id, deviceId, operationId, kind, clientRecordedAt, receivedAt] = this.params as [
        string,
        string,
        string,
        string,
        string,
        string,
      ];
      this.database.syncOperations.push({
        id,
        deviceId,
        operationId,
        kind,
        clientRecordedAt,
        receivedAt,
      });
      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "INSERT INTO device_sync_state (device_id, revision, last_synced_at) VALUES (?, ?, ?)"
    ) {
      const [deviceId, revision, lastSyncedAt] = this.params as [string, number, string | null];
      this.database.deviceSyncStatus.set(deviceId, {
        deviceId,
        revision,
        lastSyncedAt,
      });
      return { meta: { changes: 1 } };
    }

    if (
      this.query ===
      "UPDATE device_sync_state SET revision = ?, last_synced_at = ? WHERE device_id = ?"
    ) {
      const [revision, lastSyncedAt, deviceId] = this.params as [number, string | null, string];
      const state = this.database.deviceSyncStatus.get(deviceId);
      if (!state) {
        return { meta: { changes: 0 } };
      }

      state.revision = revision;
      state.lastSyncedAt = lastSyncedAt;
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

    if (
      this.query ===
      "SELECT id, record_number AS recordNumber, child_first_name AS childFirstName, child_middle_name AS childMiddleName, child_last_name AS childLastName, child_suffix AS childSuffix, birth_date AS birthDate, sex, address, guardian_full_name AS guardianFullName, guardian_relationship AS guardianRelationship, guardian_contact_number AS guardianContactNumber, school_year AS schoolYear, enrollment_date AS enrollmentDate, revision, created_at AS createdAt, updated_at AS updatedAt FROM enrollment_profiles WHERE id = ? LIMIT 1"
    ) {
      const [profileId] = this.params as [string];
      return ((this.database.profiles.get(profileId) ?? null) as T) ?? null;
    }

    if (
      this.query ===
      "SELECT record_number AS recordNumber FROM enrollment_profiles WHERE record_number IS NOT NULL ORDER BY record_number DESC LIMIT 1"
    ) {
      const profile =
        [...this.database.profiles.values()]
          .filter((entry) => entry.recordNumber !== null)
          .sort((left, right) =>
            (right.recordNumber ?? "").localeCompare(left.recordNumber ?? ""),
          )[0] ?? null;

      return (profile ? ({ recordNumber: profile.recordNumber } as T) : null) ?? null;
    }

    if (
      this.query ===
      "SELECT id, profile_id AS profileId, attendance_date AS attendanceDate, status, note, recorded_by_user_id AS recordedByUserId, revision, created_at AS createdAt, updated_at AS updatedAt FROM attendance_records WHERE id = ? LIMIT 1"
    ) {
      const [attendanceId] = this.params as [string];
      return ((this.database.attendanceRecords.get(attendanceId) ?? null) as T) ?? null;
    }

    if (
      this.query ===
      "SELECT id, profile_id AS profileId, attendance_date AS attendanceDate, status, note, recorded_by_user_id AS recordedByUserId, revision, created_at AS createdAt, updated_at AS updatedAt FROM attendance_records WHERE profile_id = ? AND attendance_date = ? LIMIT 1"
    ) {
      const [profileId, attendanceDate] = this.params as [string, string];
      const record =
        [...this.database.attendanceRecords.values()].find(
          (entry) => entry.profileId === profileId && entry.attendanceDate === attendanceDate,
        ) ?? null;
      return (record as T) ?? null;
    }

    if (
      this.query ===
      "SELECT device_id AS deviceId, revision, last_synced_at AS lastSyncedAt FROM device_sync_state WHERE device_id = ? LIMIT 1"
    ) {
      const [deviceId] = this.params as [string];
      return ((this.database.deviceSyncStatus.get(deviceId) ?? null) as T) ?? null;
    }

    if (
      this.query ===
      "SELECT operation_id AS operationId FROM sync_operations WHERE device_id = ? AND operation_id = ? LIMIT 1"
    ) {
      const [deviceId, operationId] = this.params as [string, string];
      const row =
        this.database.syncOperations.find(
          (entry) => entry.deviceId === deviceId && entry.operationId === operationId,
        ) ?? null;
      return (row ? ({ operationId: row.operationId } as T) : null) ?? null;
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

    if (
      this.query ===
      "SELECT id, record_number AS recordNumber, child_first_name AS childFirstName, child_middle_name AS childMiddleName, child_last_name AS childLastName, child_suffix AS childSuffix, birth_date AS birthDate, sex, address, guardian_full_name AS guardianFullName, guardian_relationship AS guardianRelationship, guardian_contact_number AS guardianContactNumber, school_year AS schoolYear, enrollment_date AS enrollmentDate, revision, created_at AS createdAt, updated_at AS updatedAt FROM enrollment_profiles ORDER BY created_at ASC"
    ) {
      const results = [...this.database.profiles.values()]
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((entry) => ({ ...entry }));
      return { results: results as T[] };
    }

    if (
      this.query ===
      "SELECT id, profile_id AS profileId, attendance_date AS attendanceDate, status, note, recorded_by_user_id AS recordedByUserId, revision, created_at AS createdAt, updated_at AS updatedAt FROM attendance_records ORDER BY attendance_date ASC, created_at ASC"
    ) {
      const results = [...this.database.attendanceRecords.values()]
        .sort((left, right) => {
          const dateOrder = left.attendanceDate.localeCompare(right.attendanceDate);
          return dateOrder !== 0 ? dateOrder : left.createdAt.localeCompare(right.createdAt);
        })
        .map((entry) => ({ ...entry }));
      return { results: results as T[] };
    }

    throw new Error(`Unsupported all query: ${this.query}`);
  }
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

type MemorySnapshot = {
  users: Map<string, StoredUser>;
  sessions: Map<string, StoredSession>;
  devices: Map<string, StoredDevice>;
  authorizedDeviceUsers: Map<string, StoredAuthorizedDeviceUser>;
  profiles: Map<string, StoredProfile>;
  attendanceRecords: Map<string, StoredAttendanceRecord>;
  syncOperations: StoredSyncOperation[];
  deviceSyncStatus: Map<string, StoredDeviceSyncState>;
  auditEvents: StoredAuditEvent[];
};

function cloneMap<T>(source: Map<string, T>) {
  return new Map<string, T>([...source.entries()].map(([key, value]) => [key, { ...value }]));
}

function replaceMap<T>(target: Map<string, T>, next: Map<string, T>) {
  target.clear();
  for (const [key, value] of next.entries()) {
    target.set(key, { ...value });
  }
}
