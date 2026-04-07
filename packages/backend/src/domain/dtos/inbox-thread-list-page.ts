import { Schema } from "effect";

import { InboxThread } from "#domain/dtos/inbox-thread.ts";

export class InboxThreadListPage extends Schema.Class<InboxThreadListPage>("InboxThreadListPage")({
  items: Schema.Array(InboxThread),
  total: Schema.Int,
}) {}
