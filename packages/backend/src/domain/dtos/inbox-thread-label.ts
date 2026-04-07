import { Schema } from "effect";

import { LabelId } from "#domain/models/label.ts";

export class InboxThreadLabel extends Schema.Class<InboxThreadLabel>("InboxThreadLabel")({
  labelId: LabelId,
  labelName: Schema.String,
}) {}
