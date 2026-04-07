import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi";

import { MAX_LABEL_EXAMPLES_PER_LABEL } from "#domain/constants/label-examples.ts";
import { DatabaseUnavailableError } from "#domain/errors/database-unavailable-error.ts";
import { InboxPersistenceError } from "#domain/errors/inbox-persistence-error.ts";
import { LabelAlreadyExistsError } from "#domain/errors/label-already-exists-error.ts";
import { LabelNotFoundError } from "#domain/errors/label-not-found-error.ts";
import { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import { PermissionDeniedError } from "#domain/errors/permission-denied-error.ts";
import { Label, LabelId } from "#domain/models/label.ts";
import { MessageId } from "#domain/models/message.ts";
import { Authorization } from "#entrypoints/http/middleware/auth.middleware.ts";

const labelCreateExamples = Schema.Array(MessageId).pipe(
  Schema.check(Schema.isMaxLength(MAX_LABEL_EXAMPLES_PER_LABEL)),
);

const list = HttpApiEndpoint.get("listLabels", "/", {
  success: Schema.Array(Label),
  error: [LabelPersistenceError],
});

const create = HttpApiEndpoint.post("createLabel", "/", {
  payload: Schema.Struct({
    name: Schema.Trimmed.check(Schema.isNonEmpty()),
    prompt: Schema.optional(Schema.String),
    examples: Schema.optional(labelCreateExamples),
  }),
  success: Label,
  error: [
    LabelAlreadyExistsError,
    PermissionDeniedError,
    LabelPersistenceError,
    DatabaseUnavailableError,
    InboxPersistenceError,
  ],
});

const update = HttpApiEndpoint.put("updateLabel", "/:id", {
  params: { id: LabelId },
  payload: Schema.Struct({
    isActive: Schema.Boolean,
  }),
  success: Label,
  error: [
    LabelNotFoundError,
    PermissionDeniedError,
    LabelPersistenceError,
    DatabaseUnavailableError,
    InboxPersistenceError,
  ],
});

export class LabelApi extends HttpApiGroup.make("labels")
  .add(list, create, update)
  .prefix("/api/labels")
  .middleware(Authorization)
  .annotateMerge(
    OpenApi.annotations({
      title: "Labels",
      description: "Label management endpoints",
    }),
  ) {}
