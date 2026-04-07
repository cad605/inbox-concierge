export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
  pendingJobs: ["auth", "pending-jobs"] as const,
};

export const labelKeys = {
  all: ["labels"] as const,
  list: ["labels", "list"] as const,
};

import type { LoadSubsetOptions } from "@tanstack/db";

const defaultThreadListLimit = 100;

export const threadKeys = {
  all: ["threads"] as const,
};

/**
 * Query key for a threads list subset; must match `threadCollection` (on-demand) keys.
 * `queryKey({})` is the QueryCollection base prefix — only `["threads","list"]` so variant keys
 * with different limit/offset still extend that prefix (see @tanstack/query-db-collection).
 */
export function threadListQueryKey(opts: LoadSubsetOptions): ReadonlyArray<unknown> {
  const root = [...threadKeys.all, "list"];
  if (opts.limit === undefined && opts.offset === undefined) {
    return root;
  }
  return [...root, opts.limit ?? defaultThreadListLimit, opts.offset ?? 0];
}
