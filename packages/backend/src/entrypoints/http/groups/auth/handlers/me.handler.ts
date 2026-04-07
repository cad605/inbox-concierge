import { Effect } from "effect";

import { CurrentUser } from "#entrypoints/http/middleware/auth.middleware.ts";

export const meHandler = () =>
  Effect.gen(function* () {
    return yield* CurrentUser;
  });
