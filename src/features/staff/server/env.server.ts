import type { D1DatabaseLike } from "./db.server";

export type StaffWorkerEnv = {
  DB: D1DatabaseLike;
};

export async function getWorkerEnv(): Promise<StaffWorkerEnv> {
  const workers = await import("cloudflare:workers");
  return workers.env as StaffWorkerEnv;
}
