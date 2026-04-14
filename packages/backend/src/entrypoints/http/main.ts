import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import type { Effect } from "effect";
import { ConfigProvider, Effect as Eff, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";

import { AdaptersLive } from "#adapters/layers.ts";
import { config } from "#entrypoints/http/http.config.ts";
import { AllRoutesLive, withInfrastructure } from "#entrypoints/http/http.container.ts";
import { AuthorizationLive } from "#entrypoints/http/middleware/auth.middleware.ts";
import { requestIdMiddleware } from "#entrypoints/http/middleware/request-id.middleware.ts";
import { AutoLabelWorkerLive } from "#entrypoints/worker/auto-label-worker.ts";
import { InboxSyncWorkerLive } from "#entrypoints/worker/inbox-sync-worker.ts";

const program = Eff.gen(function* () {
  const cfg = yield* config;
  const ServerLive = BunHttpServer.layer({
    port: cfg.port,
    hostname: cfg.host,
  });

  const HttpServerLive = HttpRouter.serve(AllRoutesLive, {
    middleware: requestIdMiddleware,
  }).pipe(Layer.provide(AuthorizationLive), Layer.provide(ServerLive));

  const App = withInfrastructure(
    Layer.mergeAll(HttpServerLive, AutoLabelWorkerLive, InboxSyncWorkerLive).pipe(
      Layer.provide(AdaptersLive),
    ),
    cfg.openRouterModel,
  );

  yield* Layer.launch(App);
}).pipe(Eff.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromEnv()));

BunRuntime.runMain(program as Effect.Effect<void, unknown, never>);
