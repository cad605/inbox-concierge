import { Effect } from "effect";

import type { LabelId } from "#domain/models/label.ts";
import { CurrentUser } from "#entrypoints/http/middleware/auth.middleware.ts";
import { updateLabel } from "#use-cases/update-label.use-case.ts";

export const updateLabelHandler = ({
  params,
  payload,
}: {
  readonly params: { readonly id: LabelId };
  readonly payload: { readonly isActive: boolean };
}) =>
  Effect.gen(function* () {
    const user = yield* CurrentUser;

    return yield* updateLabel(user.id, params.id, payload);
  });
