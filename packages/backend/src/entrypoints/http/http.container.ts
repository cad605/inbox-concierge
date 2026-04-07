import { OpenRouterClient, OpenRouterLanguageModel } from "@effect/ai-openrouter";
import { Config, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { PersistedQueue } from "effect/unstable/persistence";

import { AutoLabelQueueLive } from "#adapters/auto-label-queue.adapter.ts";
import { InboxSyncQueueLive } from "#adapters/inbox-sync-queue.adapter.ts";
import { TokenEncryptionLive } from "#adapters/token-encryption.adapter.ts";
import { AppApi } from "#entrypoints/http/api.ts";
import { AuthSessionHandlers } from "#entrypoints/http/groups/auth/auth-session.group.ts";
import { AuthHandlers } from "#entrypoints/http/groups/auth/auth.group.ts";
import { HealthHandlers } from "#entrypoints/http/groups/health/health.group.ts";
import { LabelHandlers } from "#entrypoints/http/groups/labels/label.group.ts";
import { ThreadHandlers } from "#entrypoints/http/groups/threads/thread.group.ts";
import { HttpConfig } from "#entrypoints/http/http.config.ts";
import { CorsMiddlewareLive } from "#entrypoints/http/middleware/cors.middleware.ts";
import { DatabaseLive } from "#infrastructure/database/client.ts";
import { type LoggerConfig, makeLoggerLayer } from "#infrastructure/logger.ts";

export { CorsMiddlewareLive };

export const OpenRouterClientLive = OpenRouterClient.layerConfig({
  apiKey: Config.redacted("OPENROUTER_API_KEY"),
});

export const makeAiModelLive = (modelId: string) =>
  OpenRouterLanguageModel.layer({ model: modelId }).pipe(Layer.provide(OpenRouterClientLive));

export const QueueStoreLive = PersistedQueue.layerStoreSql();

export const QueueFactoryLive = PersistedQueue.layer.pipe(Layer.provide(QueueStoreLive));

const loggerConfig = HttpConfig.pipe(
  Config.map(
    (c): LoggerConfig => ({
      logLevel: c.logLevel,
      logFormat: c.logFormat === "pretty" ? "pretty" : "logfmt",
    }),
  ),
);

export const LoggerLayerLive = makeLoggerLayer(loggerConfig);

/**
 * Leaf dependencies shared by the HTTP server and background workers.
 * Uses the same `Layer.provide` chain order as the previous `main.ts` so nested
 * requirements (e.g. `QueueStoreLive` needing `SqlClient`) resolve correctly.
 */
export const withInfrastructure = <A, E, R>(layer: Layer.Layer<A, E, R>, openRouterModel: string) =>
  layer.pipe(
    Layer.provide(makeAiModelLive(openRouterModel)),
    Layer.provide(AutoLabelQueueLive),
    Layer.provide(InboxSyncQueueLive),
    Layer.provide(QueueFactoryLive),
    Layer.provide(TokenEncryptionLive),
    Layer.provide(DatabaseLive),
    Layer.provide(LoggerLayerLive),
    Layer.provide(FetchHttpClient.layer),
  );

const HttpHandlersLive = Layer.mergeAll(
  AuthHandlers,
  AuthSessionHandlers,
  LabelHandlers,
  ThreadHandlers,
  HealthHandlers,
);

const ApiRoutesLive = HttpApiBuilder.layer(AppApi, {
  openapiPath: "/openapi.json",
}).pipe(Layer.provide(HttpHandlersLive));

const DocsRouteLive = HttpApiScalar.layer(AppApi, { path: "/docs" });

/**
 * API routes, OpenAPI docs, and global CORS. CORS must merge here so `HttpRouter.middleware(..., { global: true })`
 * receives `HttpRouter` from the same app layer (see Effect `HttpRouter.middleware` environment).
 */
export const AllRoutesLive = Layer.mergeAll(ApiRoutesLive, DocsRouteLive, CorsMiddlewareLive);
