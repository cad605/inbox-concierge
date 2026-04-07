import { Schema } from "effect";

import { Email } from "#domain/shared/email.ts";

export class InboxParticipant extends Schema.Class<InboxParticipant>("InboxParticipant")({
  name: Schema.Option(Schema.String),
  email: Email,
}) {}
