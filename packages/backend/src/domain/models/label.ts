import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { AuthUserId } from "#domain/models/auth-user.ts";
import { LabelType } from "#domain/shared/label-type.ts";

export const LabelId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("LabelId"));
export type LabelId = typeof LabelId.Type;

export class Label extends Model.Class<Label>("Label")({
  id: Model.GeneratedByApp(LabelId),
  userId: AuthUserId,
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  prompt: Model.FieldOption(Schema.String),
  type: LabelType,
  isActive: Schema.Boolean,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate,
}) {}
