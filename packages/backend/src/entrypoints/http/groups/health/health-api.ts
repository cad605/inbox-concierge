import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi";

const HealthStatusOk = Schema.Struct({
  status: Schema.Literal("ok"),
});

const health = HttpApiEndpoint.get("health", "/health", {
  success: HealthStatusOk,
});

export class HealthApi extends HttpApiGroup.make("health", { topLevel: true })
  .add(health)
  .annotateMerge(
    OpenApi.annotations({
      title: "Health",
      description: "Liveness checks for service monitoring",
    }),
  ) {}
