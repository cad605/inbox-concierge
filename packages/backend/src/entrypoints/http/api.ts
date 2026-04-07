import { Effect } from "effect";
import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { AuthApi } from "#entrypoints/http/groups/auth/auth-api.ts";
import { AuthSessionApi } from "#entrypoints/http/groups/auth/auth-session-api.ts";
import { HealthApi } from "#entrypoints/http/groups/health/health-api.ts";
import { LabelApi } from "#entrypoints/http/groups/labels/label-api.ts";
import { ThreadApi } from "#entrypoints/http/groups/threads/thread-api.ts";

export class AppApi extends HttpApi.make("app")
  .add(AuthApi)
  .add(AuthSessionApi)
  .add(HealthApi)
  .add(LabelApi)
  .add(ThreadApi)
  .annotateMerge(OpenApi.annotations({ title: "Inbox Concierge API" })) {}

export const getOpenApiSpec = () => Effect.sync(() => OpenApi.fromApi(AppApi));
