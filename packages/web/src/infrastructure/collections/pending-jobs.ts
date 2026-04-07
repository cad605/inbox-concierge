import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { Schema } from "effect";

import { api } from "#infrastructure/api-client.ts";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { queryClient } from "#infrastructure/query-client.ts";
import { authKeys } from "#infrastructure/query-keys.ts";

/** Stable row id for the singleton pending-jobs snapshot in TanStack DB. */
export const PENDING_JOBS_ROW_ID = "pending-jobs" as const;

const PendingJobsRowSchema = Schema.Struct({
  id: Schema.Literal(PENDING_JOBS_ROW_ID),
  userInboxSyncCount: Schema.Int,
  messageAutoLabelCount: Schema.Int,
});

const pendingJobsRowStandardSchema = Schema.toStandardSchemaV1(PendingJobsRowSchema);

export type PendingJobsRow = Schema.Schema.Type<typeof PendingJobsRowSchema>;

const pendingJobsRefetchIntervalMs = 5_000;

export const pendingJobsCollection = createCollection(
  queryCollectionOptions({
    id: "pending-jobs",
    queryKey: authKeys.pendingJobs,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/auth/pending-jobs");

      if (!response.ok) {
        throw new Error(getErrorMessage(error));
      }

      const counts = data ?? { userInboxSyncCount: 0, messageAutoLabelCount: 0 };

      const row: PendingJobsRow = {
        id: PENDING_JOBS_ROW_ID,
        userInboxSyncCount: counts.userInboxSyncCount,
        messageAutoLabelCount: counts.messageAutoLabelCount,
      };

      return [row];
    },
    queryClient,
    getKey: (item) => item.id,
    schema: pendingJobsRowStandardSchema,
    refetchInterval: pendingJobsRefetchIntervalMs,
  }),
);
