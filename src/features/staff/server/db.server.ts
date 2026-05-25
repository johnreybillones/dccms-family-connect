export type D1RunResult = {
  meta?: {
    changes?: number;
  };
};

export type D1PreparedStatementLike = {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results: T[] }>;
  run: () => Promise<D1RunResult>;
};

export type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatementLike;
  exec?: (query: string) => Promise<unknown>;
};

export async function getDatabase(): Promise<D1DatabaseLike> {
  const workers = await import("cloudflare:workers");
  return workers.env.DB as D1DatabaseLike;
}

export async function runInTransaction<T>(
  database: D1DatabaseLike,
  operation: (tx: D1DatabaseLike) => Promise<T>,
): Promise<T> {
  if (!database.exec) {
    return operation(database);
  }

  await database.exec("BEGIN IMMEDIATE");

  try {
    const result = await operation(database);
    await database.exec("COMMIT");
    return result;
  } catch (error) {
    await database.exec("ROLLBACK");
    throw error;
  }
}
