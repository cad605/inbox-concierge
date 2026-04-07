import { Effect } from "effect";

import type { AuthUserId } from "#domain/models/auth-user.ts";
import { LabelRepository } from "#ports/label-repository.port.ts";

export const listLabels = Effect.fn("listLabels")(function* (userId: AuthUserId) {
  const labelRepo = yield* LabelRepository;
  return yield* labelRepo.findByUserId(userId);
});
