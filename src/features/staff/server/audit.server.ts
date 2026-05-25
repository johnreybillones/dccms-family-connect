import type { D1DatabaseLike } from "./db.server";

type AuditEventRow = {
  id: string;
  timestamp: string;
  actorId: string | null;
  eventType: string;
  metadata: string;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actorId: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
};

export async function recordAuditEvent(
  database: D1DatabaseLike,
  options: {
    actorId: string | null;
    eventType: string;
    metadata?: Record<string, unknown>;
    now?: Date;
  },
) {
  const timestamp = (options.now ?? new Date()).toISOString();
  await database
    .prepare(
      "INSERT INTO audit_events (id, timestamp, actor_id, event_type, metadata) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(
      crypto.randomUUID(),
      timestamp,
      options.actorId,
      options.eventType,
      JSON.stringify(options.metadata ?? {}),
    )
    .run();
}

export async function listAuditEvents(database: D1DatabaseLike): Promise<AuditEvent[]> {
  const result = await database
    .prepare(
      "SELECT id, timestamp, actor_id AS actorId, event_type AS eventType, metadata FROM audit_events ORDER BY timestamp DESC",
    )
    .all<AuditEventRow>();

  return result.results.map((row) => ({
    ...row,
    metadata: safeParseJson(row.metadata),
  }));
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore malformed audit metadata
  }

  return {};
}
