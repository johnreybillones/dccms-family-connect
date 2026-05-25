import type { AttendanceRecord } from "../contracts/attendance-record";
import type { EnrollmentProfile } from "../contracts/enrollment-profile";
import type { ExportAuditRecord } from "../contracts/reports";
import type { SyncOperation, SyncPayload } from "../contracts/sync";
import { recordAuditEvent } from "./audit.server";
import {
  findAttendanceRecordById,
  findAttendanceRecordByProfileAndDate,
  insertAttendanceRecord,
  listAttendanceRecords,
  updateAttendanceRecord,
} from "./attendance.server";
import type { D1DatabaseLike } from "./db.server";
import { runInTransaction } from "./db.server";
import { getActiveDevice } from "./device.server";
import {
  findEnrollmentProfileById,
  getNextProfileRecordNumber,
  insertEnrollmentProfile,
  listEnrollmentProfiles,
  updateEnrollmentProfile,
} from "./profiles.server";

type DeviceSyncStateRow = {
  deviceId: string;
  revision: number;
  lastSyncedAt: string | null;
};

type StoredSyncOperationRow = {
  operationId: string;
};

export type BootstrapSnapshot = {
  profiles: EnrollmentProfile[];
  attendanceRecords: AttendanceRecord[];
  syncedAt: string | null;
};

export type SyncSuccessResult = BootstrapSnapshot & {
  acknowledgedOperationIds: string[];
};

export type SyncConflictResult = BootstrapSnapshot & {
  code: "REFRESH_REQUIRED";
  acknowledgedOperationIds: string[];
};

export class DeviceNotActiveError extends Error {
  constructor() {
    super("DEVICE_NOT_ACTIVE");
  }
}

export class SyncConflictError extends Error {
  constructor(
    readonly snapshot: BootstrapSnapshot,
    readonly conflictOperationId: string,
  ) {
    super("REFRESH_REQUIRED");
  }
}

export async function assertActiveDevice(
  database: D1DatabaseLike,
  deviceId: string,
): Promise<void> {
  const activeDevice = await getActiveDevice(database);
  if (!activeDevice || activeDevice.deviceId !== deviceId) {
    throw new DeviceNotActiveError();
  }
}

export async function buildBootstrapSnapshot(
  database: D1DatabaseLike,
  deviceId: string,
): Promise<BootstrapSnapshot> {
  await assertActiveDevice(database, deviceId);

  const [profiles, attendanceRecords, deviceSyncState] = await Promise.all([
    listEnrollmentProfiles(database),
    listAttendanceRecords(database),
    readDeviceSyncState(database, deviceId),
  ]);

  return {
    profiles,
    attendanceRecords,
    syncedAt: deviceSyncState?.lastSyncedAt ?? null,
  };
}

export async function processSyncRequest(
  database: D1DatabaseLike,
  options: {
    deviceId: string;
    userId: string;
    payload: SyncPayload;
    receivedAt?: Date;
  },
): Promise<SyncSuccessResult> {
  const receivedAt = options.receivedAt ?? new Date();

  return runInTransaction(database, async (tx) => {
    await assertActiveDevice(tx, options.deviceId);

    const acknowledgedOperationIds: string[] = [];
    const deviceSyncState = (await readDeviceSyncState(tx, options.deviceId)) ?? {
      deviceId: options.deviceId,
      revision: 0,
      lastSyncedAt: options.payload.lastSyncedAt,
    };
    let nextDeviceRevision = deviceSyncState.revision;

    for (const operation of options.payload.operations) {
      const existingOperation = await findSyncOperation(
        tx,
        options.deviceId,
        operation.operationId,
      );
      if (existingOperation) {
        acknowledgedOperationIds.push(operation.operationId);
        continue;
      }

      nextDeviceRevision += 1;
      await applyOperation(tx, {
        operation,
        deviceId: options.deviceId,
        userId: options.userId,
        receivedAt,
      });
      await insertSyncOperation(tx, {
        deviceId: options.deviceId,
        operationId: operation.operationId,
        kind: operation.kind,
        clientRecordedAt: operation.clientRecordedAt,
        receivedAt: receivedAt.toISOString(),
      });
      acknowledgedOperationIds.push(operation.operationId);
    }

    await upsertDeviceSyncState(tx, {
      deviceId: options.deviceId,
      revision: nextDeviceRevision,
      lastSyncedAt: receivedAt.toISOString(),
    });

    await recordAuditEvent(tx, {
      actorId: options.userId,
      eventType: "staff.sync.succeeded",
      metadata: {
        deviceId: options.deviceId,
        acknowledgedOperationIds,
        requestLastSyncedAt: options.payload.lastSyncedAt,
        receivedAt: receivedAt.toISOString(),
      },
      now: receivedAt,
    });

    const snapshot = await buildBootstrapSnapshot(tx, options.deviceId);
    return {
      acknowledgedOperationIds,
      ...snapshot,
    };
  });
}

async function applyOperation(
  database: D1DatabaseLike,
  options: {
    operation: SyncOperation;
    deviceId: string;
    userId: string;
    receivedAt: Date;
  },
) {
  const { operation } = options;

  if (operation.kind === "createProfile") {
    const profile = {
      ...operation.profile,
      recordNumber: await getNextProfileRecordNumber(database),
      revision: 1,
      updatedAt: options.receivedAt.toISOString(),
    };
    await insertEnrollmentProfile(database, profile);
    await recordAuditEvent(database, {
      actorId: options.userId,
      eventType: "staff.profile.created",
      metadata: buildMutationMetadata(operation, profile.id, {
        revision: profile.revision,
        recordNumber: profile.recordNumber,
      }),
      now: options.receivedAt,
    });
    return;
  }

  if (operation.kind === "updateProfile") {
    const current = await findEnrollmentProfileById(database, operation.profile.id);
    if (!current || current.revision !== operation.baseRevision) {
      throw new SyncConflictError(
        await buildBootstrapSnapshot(database, options.deviceId),
        operation.operationId,
      );
    }

    const updatedProfile = {
      ...operation.profile,
      recordNumber: current.recordNumber,
      revision: current.revision + 1,
      updatedAt: options.receivedAt.toISOString(),
    };
    await updateEnrollmentProfile(database, updatedProfile);
    await recordAuditEvent(database, {
      actorId: options.userId,
      eventType: "staff.profile.updated",
      metadata: buildMutationMetadata(operation, updatedProfile.id, {
        previousRevision: current.revision,
        revision: updatedProfile.revision,
      }),
      now: options.receivedAt,
    });
    return;
  }

  if (operation.kind === "upsertAttendance") {
    const existingById = await findAttendanceRecordById(database, operation.attendance.id);
    const existingByCanonical = await findAttendanceRecordByProfileAndDate(
      database,
      operation.attendance.profileId,
      operation.attendance.attendanceDate,
    );
    const current = existingById ?? existingByCanonical;

    if (current) {
      if (operation.baseRevision === null || current.revision !== operation.baseRevision) {
        throw new SyncConflictError(
          await buildBootstrapSnapshot(database, options.deviceId),
          operation.operationId,
        );
      }

      const updatedRecord = {
        ...current,
        ...operation.attendance,
        revision: current.revision + 1,
        updatedAt: options.receivedAt.toISOString(),
      };
      await updateAttendanceRecord(database, updatedRecord);
      await recordAuditEvent(database, {
        actorId: options.userId,
        eventType: "staff.attendance.upserted",
        metadata: buildMutationMetadata(operation, updatedRecord.id, {
          previousRevision: current.revision,
          revision: updatedRecord.revision,
        }),
        now: options.receivedAt,
      });
      return;
    }

    const createdRecord = {
      ...operation.attendance,
      revision: 1,
      updatedAt: options.receivedAt.toISOString(),
    };
    await insertAttendanceRecord(database, createdRecord);
    await recordAuditEvent(database, {
      actorId: options.userId,
      eventType: "staff.attendance.upserted",
      metadata: buildMutationMetadata(operation, createdRecord.id, {
        revision: createdRecord.revision,
      }),
      now: options.receivedAt,
    });
    return;
  }

  await recordExportAudit(database, {
    exportAudit: operation.exportAudit,
    operation,
    userId: options.userId,
    receivedAt: options.receivedAt,
  });
}

async function recordExportAudit(
  database: D1DatabaseLike,
  options: {
    exportAudit: ExportAuditRecord;
    operation: SyncOperation;
    userId: string;
    receivedAt: Date;
  },
) {
  await recordAuditEvent(database, {
    actorId: options.userId,
    eventType: "staff.export-audit.recorded",
    metadata: {
      ...buildMutationMetadata(options.operation, options.exportAudit.id, {}),
      reportType: options.exportAudit.reportType,
      reportFormat: options.exportAudit.reportFormat,
      generatedAt: options.exportAudit.generatedAt,
      includedUnsyncedChanges: options.exportAudit.includedUnsyncedChanges,
    },
    now: options.receivedAt,
  });
}

async function readDeviceSyncState(
  database: D1DatabaseLike,
  deviceId: string,
): Promise<DeviceSyncStateRow | null> {
  return database
    .prepare(
      "SELECT device_id AS deviceId, revision, last_synced_at AS lastSyncedAt FROM device_sync_state WHERE device_id = ? LIMIT 1",
    )
    .bind(deviceId)
    .first<DeviceSyncStateRow>();
}

async function upsertDeviceSyncState(
  database: D1DatabaseLike,
  state: DeviceSyncStateRow,
): Promise<void> {
  const existing = await readDeviceSyncState(database, state.deviceId);
  if (existing) {
    await database
      .prepare("UPDATE device_sync_state SET revision = ?, last_synced_at = ? WHERE device_id = ?")
      .bind(state.revision, state.lastSyncedAt, state.deviceId)
      .run();
    return;
  }

  await database
    .prepare("INSERT INTO device_sync_state (device_id, revision, last_synced_at) VALUES (?, ?, ?)")
    .bind(state.deviceId, state.revision, state.lastSyncedAt)
    .run();
}

async function findSyncOperation(
  database: D1DatabaseLike,
  deviceId: string,
  operationId: string,
): Promise<StoredSyncOperationRow | null> {
  return database
    .prepare(
      "SELECT operation_id AS operationId FROM sync_operations WHERE device_id = ? AND operation_id = ? LIMIT 1",
    )
    .bind(deviceId, operationId)
    .first<StoredSyncOperationRow>();
}

async function insertSyncOperation(
  database: D1DatabaseLike,
  operation: {
    deviceId: string;
    operationId: string;
    kind: SyncOperation["kind"];
    clientRecordedAt: string;
    receivedAt: string;
  },
): Promise<void> {
  await database
    .prepare(
      "INSERT INTO sync_operations (id, device_id, operation_id, kind, client_recorded_at, received_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(
      crypto.randomUUID(),
      operation.deviceId,
      operation.operationId,
      operation.kind,
      operation.clientRecordedAt,
      operation.receivedAt,
    )
    .run();
}

function buildMutationMetadata(
  operation: SyncOperation,
  entityId: string,
  extra: Record<string, unknown>,
) {
  return {
    entityId,
    operationId: operation.operationId,
    operationKind: operation.kind,
    clientRecordedAt: operation.clientRecordedAt,
    ...extra,
  };
}
