import { Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

import { PendingPersistedJobCounts } from "#domain/dtos/pending-persisted-job-counts.ts";
import { makeDatabaseUnavailableError } from "#domain/errors/database-unavailable-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import {
  MESSAGE_AUTO_LABEL_QUEUE_NAME,
  PERSISTED_QUEUE_WORKER_MAX_ATTEMPTS,
  USER_INBOX_SYNC_QUEUE_NAME,
} from "#domain/shared/persisted-queue-constants.ts";
import { PendingPersistedJobsRepository } from "#ports/pending-persisted-jobs-repository.port.ts";

/** Default table name for `PersistedQueue.layerStoreSql()` (Effect persistence). */
const EFFECT_QUEUE_TABLE = "effect_queue";

const QueueCountRow = Schema.Struct({
  queueName: Schema.String,
  count: Schema.Int,
});

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const countsForUser = Effect.fn("PendingPersistedJobsRepository.countsForUser")(
    function* (userId: AuthUserId) {
      const rows = yield* sql`
        SELECT queue_name, COUNT(*)::int AS count
        FROM ${sql(EFFECT_QUEUE_TABLE)}
        WHERE completed = false
          AND attempts < ${PERSISTED_QUEUE_WORKER_MAX_ATTEMPTS}
          AND (element::jsonb->>'userId') = ${userId}
          AND queue_name IN (${USER_INBOX_SYNC_QUEUE_NAME}, ${MESSAGE_AUTO_LABEL_QUEUE_NAME})
        GROUP BY queue_name
      `;
      const decoded = yield* Schema.decodeUnknownEffect(Schema.Array(QueueCountRow))(rows);

      let userInboxSyncCount = 0;
      let messageAutoLabelCount = 0;
      for (const row of decoded) {
        if (row.queueName === USER_INBOX_SYNC_QUEUE_NAME) {
          userInboxSyncCount = row.count;
        } else if (row.queueName === MESSAGE_AUTO_LABEL_QUEUE_NAME) {
          messageAutoLabelCount = row.count;
        }
      }

      return PendingPersistedJobCounts.makeUnsafe({
        userInboxSyncCount,
        messageAutoLabelCount,
      });
    },
    tapLogAndMapError("PendingPersistedJobsRepository.countsForUser", () =>
      makeDatabaseUnavailableError(),
    ),
  );

  return PendingPersistedJobsRepository.of({
    countsForUser,
  });
});

export const PendingPersistedJobsRepositoryLive = Layer.effect(
  PendingPersistedJobsRepository,
  make,
);
