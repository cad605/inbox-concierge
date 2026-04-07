import { Effect, Option } from "effect";

import type { AuthUserId } from "#domain/models/auth-user.ts";
import { LabelId } from "#domain/models/label.ts";
import { DEFAULT_LABELS } from "#domain/shared/default-labels.ts";
import { generateId } from "#lib/uuid.ts";
import { LabelRepository } from "#ports/label-repository.port.ts";
import { enqueueInboxSync } from "#use-cases/enqueue-inbox-sync.use-case.ts";

/** Seeds default labels and enqueues a durable inbox sync job (auto-label jobs enqueue after `syncUserThreads`). */
export const initializeNewUser = Effect.fn("initializeNewUser")(function* (userId: AuthUserId) {
  const labelRepo = yield* LabelRepository;

  const labels = yield* Effect.forEach(DEFAULT_LABELS, (def) =>
    Effect.gen(function* () {
      const existing = yield* labelRepo.findByUserIdAndName(userId, def.name);
      if (Option.isSome(existing)) return existing.value;

      return yield* labelRepo.create({
        id: LabelId.makeUnsafe(generateId()),
        userId,
        name: def.name,
        prompt: def.prompt,
        type: "system",
      });
    }),
  );

  yield* enqueueInboxSync(userId);

  return labels;
});
