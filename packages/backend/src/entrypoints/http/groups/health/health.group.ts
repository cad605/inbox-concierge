import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { AppApi } from "#entrypoints/http/api.ts";

const HEALTH_OK = { status: "ok" as const };

export const HealthHandlers = HttpApiBuilder.group(AppApi, "health", (handlers) =>
  handlers.handle("health", () => Effect.succeed(HEALTH_OK)),
);
