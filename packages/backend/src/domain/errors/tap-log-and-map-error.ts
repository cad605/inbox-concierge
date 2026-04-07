import { Effect } from "effect";

/** Log the failing cause (server-side only), then map to a client-safe domain error. */
export const tapLogAndMapError =
  <E>(context: string, map: (cause: unknown) => E) =>
  <A, Err, R>(effect: Effect.Effect<A, Err, R>): Effect.Effect<A, E, R> =>
    effect.pipe(
      Effect.tapError((cause) => Effect.logError(`[${context}]`, cause)),
      Effect.mapError(map),
    );

/** For `catchTags` / handlers: log the cause, then fail with a mapped domain error. */
export const logAndFailWith =
  <E>(context: string, map: (cause: unknown) => E) =>
  (cause: unknown) =>
    Effect.flatMap(Effect.logError(`[${context}]`, cause), () => Effect.fail(map(cause)));
