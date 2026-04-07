/** PersistedQueue name for `InboxSyncQueue` / `enqueueInboxSync`. */
export const USER_INBOX_SYNC_QUEUE_NAME = "user-inbox-sync" as const;

/** PersistedQueue name for `AutoLabelQueue` / auto-label job offers. */
export const MESSAGE_AUTO_LABEL_QUEUE_NAME = "message-auto-label" as const;

/**
 * Must match `maxAttempts` passed to `queue.take(...)` in workers; also used when
 * counting rows that are still eligible for processing (excludes dead-letter-like rows).
 */
export const PERSISTED_QUEUE_WORKER_MAX_ATTEMPTS = 3 as const;
