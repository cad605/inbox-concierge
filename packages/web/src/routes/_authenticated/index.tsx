import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";

import { InboxPage } from "#features/inbox/inbox-page.tsx";
import { threadCollection } from "#infrastructure/collections/threads.ts";

/** URL params are strings; programmatic `navigate({ search })` may pass numbers from validated `prev`. */
const pageSizeFromSearch = Schema.Union([
  Schema.NumberFromString.pipe(
    Schema.check(Schema.isInt()),
    Schema.check(Schema.isGreaterThanOrEqualTo(1)),
    Schema.check(Schema.isLessThanOrEqualTo(500)),
  ),
  Schema.Number.pipe(
    Schema.check(Schema.isInt()),
    Schema.check(Schema.isGreaterThanOrEqualTo(1)),
    Schema.check(Schema.isLessThanOrEqualTo(500)),
  ),
]);

const inboxSearchSchema = Schema.Struct({
  pageSize: Schema.optional(pageSizeFromSearch),
});

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: Schema.toStandardSchemaV1(inboxSearchSchema),
  component: InboxPage,
  loader: async () => {
    await threadCollection.preload();
  },
  ssr: false,
});
