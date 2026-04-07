import { Effect } from "effect";

import { InboxThreadListPage } from "#domain/dtos/inbox-thread-list-page.ts";
import { CurrentUser } from "#entrypoints/http/middleware/auth.middleware.ts";
import { listInboxThreads } from "#use-cases/list-inbox-threads.use-case.ts";

const defaultLimit = 100;
const defaultOffset = 0;

export const listThreadsHandler = ({
  query,
}: {
  readonly query: {
    readonly limit?: number;
    readonly offset?: number;
  };
}) =>
  Effect.gen(function* () {
    const user = yield* CurrentUser;
    const limit = query.limit ?? defaultLimit;
    const offset = query.offset ?? defaultOffset;
    const { items, total } = yield* listInboxThreads(user.id, { limit, offset });
    return InboxThreadListPage.makeUnsafe({ items, total });
  });
