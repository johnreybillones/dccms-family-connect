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
};

export async function getDatabase(): Promise<D1DatabaseLike> {
  const workers = await import("cloudflare:workers");
  return workers.env.DB as D1DatabaseLike;
}
