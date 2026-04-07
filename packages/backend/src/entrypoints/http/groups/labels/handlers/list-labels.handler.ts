import { Effect } from "effect";

import { CurrentUser } from "#entrypoints/http/middleware/auth.middleware.ts";
import { listLabels } from "#use-cases/list-labels.use-case.ts";

export const listLabelsHandler = () =>
  Effect.gen(function* () {
    const user = yield* CurrentUser;
    return yield* listLabels(user.id);
  });
