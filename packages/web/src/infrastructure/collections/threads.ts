import type { QueryFunctionContext } from "@tanstack/query-core";
import { parseLoadSubsetOptions, queryCollectionOptions } from "@tanstack/query-db-collection";
import type { LoadSubsetOptions } from "@tanstack/react-db";
import { BasicIndex, createCollection } from "@tanstack/react-db";
import type { components } from "@workspace/http/schema";
import { Schema } from "effect";

import { api } from "#infrastructure/api-client.ts";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { queryClient } from "#infrastructure/query-client.ts";
import { threadListQueryKey } from "#infrastructure/query-keys.ts";

export type InboxThread = components["schemas"]["InboxThread"];
export type InboxThreadListPage = components["schemas"]["InboxThreadListPage"];

const participantNameSchema = Schema.Union([
  Schema.Struct({ _tag: Schema.Literal("Some"), value: Schema.String }),
  Schema.Struct({ _tag: Schema.Literal("None") }),
]);

const inboxParticipantSchema = Schema.Struct({
  name: participantNameSchema,
  email: Schema.String,
});

const inboxThreadLabelSchema = Schema.Struct({
  labelId: Schema.String.pipe(Schema.check(Schema.isUUID())),
  labelName: Schema.String,
});

const inboxThreadSchema = Schema.Struct({
  id: Schema.String.pipe(Schema.check(Schema.isUUID())),
  subject: Schema.String,
  snippet: Schema.String,
  lastMessageAt: Schema.String,
  messageCount: Schema.Int,
  isUnread: Schema.Boolean,
  lastMessageId: Schema.String.pipe(Schema.check(Schema.isUUID())),
  participants: Schema.Array(inboxParticipantSchema),
  labels: Schema.Array(inboxThreadLabelSchema),
});

const inboxThreadStandardSchema = Schema.toStandardSchemaV1(inboxThreadSchema);

const defaultThreadListLimit = 100;

export async function fetchInboxThreadsPage(
  limit: number,
  offset: number,
): Promise<InboxThreadListPage> {
  const { data, error, response } = await api.GET("/api/threads", {
    params: { query: { limit: String(limit), offset: String(offset) } },
  });

  if (!response.ok) {
    throw new Error(getErrorMessage(error));
  }

  if (data === undefined) {
    throw new Error("Threads list response was empty");
  }

  return data;
}

export const threadCollection = createCollection(
  queryCollectionOptions({
    id: "threads",
    /** Needed for `orderBy(lastMessageAt)` + `useLiveInfiniteQuery`: without a range index, the first load uses `requestSnapshot` but load-more calls `requestLimitedSnapshot`, which requires `setOrderByIndex`. */
    autoIndex: "eager",
    defaultIndexType: BasicIndex,
    syncMode: "on-demand",
    queryKey: threadListQueryKey,
    queryFn: async (context: QueryFunctionContext<ReadonlyArray<unknown>>) => {
      const loadSubsetOptions = context.meta?.loadSubsetOptions as LoadSubsetOptions | undefined;
      const parsed = parseLoadSubsetOptions(loadSubsetOptions);
      const limit = parsed.limit ?? defaultThreadListLimit;
      const offset = loadSubsetOptions?.offset ?? 0;
      return fetchInboxThreadsPage(limit, offset);
    },
    select: (data) => data.items,
    queryClient,
    getKey: (item) => item.id,
    schema: inboxThreadStandardSchema,
  }),
);
