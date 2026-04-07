import { Effect } from "effect";

import type { MessageId } from "#domain/models/message.ts";
import { CurrentUser } from "#entrypoints/http/middleware/auth.middleware.ts";
import { createLabel } from "#use-cases/create-label.use-case.ts";

export const createLabelHandler = ({
  payload,
}: {
  readonly payload: {
    readonly name: string;
    readonly prompt?: string | undefined;
    readonly examples?: ReadonlyArray<MessageId> | undefined;
  };
}) =>
  Effect.gen(function* () {
    const user = yield* CurrentUser;

    return yield* createLabel({
      userId: user.id,
      name: payload.name,
      prompt: payload.prompt,
      type: "custom",
      examples: payload.examples,
    });
  });
