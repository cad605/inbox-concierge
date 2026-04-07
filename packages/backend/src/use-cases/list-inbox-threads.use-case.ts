import { Effect } from "effect";

import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { ListInboxThreadsPagination } from "#ports/thread-repository.port.ts";
import { ThreadRepository } from "#ports/thread-repository.port.ts";

export const listInboxThreads = Effect.fn("listInboxThreads")(function* (
  userId: AuthUserId,
  pagination: ListInboxThreadsPagination,
) {
  const threadRepo = yield* ThreadRepository;
  return yield* threadRepo.findInboxThreadsByUserId(userId, pagination);
});
