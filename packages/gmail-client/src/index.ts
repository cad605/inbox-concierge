/**
 * Effect-native Gmail API v1 client (`users/me` threads) as a {@link GmailClient} service.
 *
 * Uses `effect/unstable/http` {@link HttpClient} with structured errors (`filterStatusOk`
 * plus Gmail error JSON mapping). Pass the OAuth access token on each client method.
 *
 * @example
 * ```ts
 * import { Effect, Layer, Redacted } from "effect"
 * import { FetchHttpClient } from "effect/unstable/http"
 * import { GmailClient, GmailClientLive } from "@workspace/gmail-client"
 *
 * const program = Effect.gen(function* () {
 *   const gmail = yield* GmailClient
 *   const threads = yield* gmail.listThreads({
 *     accessToken: Redacted.make("..."),
 *     maxResults: 10,
 *   })
 *   return yield* gmail.getThread({
 *     accessToken: Redacted.make("..."),
 *     threadId: threads[0].threadId,
 *   })
 * })
 *
 * program.pipe(
 *   Effect.provide(Layer.mergeAll(GmailClientLive, FetchHttpClient.layer)),
 *   Effect.runPromise,
 * )
 * ```
 *
 * @module
 */
// -----------------------------------------------------------------------------
// Client (service + default layer)
// -----------------------------------------------------------------------------

export { GmailClientLive } from "./adapters/gmail-client.adapter.ts";
export { GmailClient } from "./ports/gmail-client.port.ts";
