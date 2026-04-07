import { ServiceMap } from "effect";
import type { PersistedQueue } from "effect/unstable/persistence";

import type { AutoLabelJobPayload } from "#domain/dtos/auto-label-job-payload.ts";

export class AutoLabelQueue extends ServiceMap.Service<
  AutoLabelQueue,
  PersistedQueue.PersistedQueue<typeof AutoLabelJobPayload.Type>
>()("app/ports/AutoLabelQueue") {}
