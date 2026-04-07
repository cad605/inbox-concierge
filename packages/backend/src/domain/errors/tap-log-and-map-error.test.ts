import { describe, expect, it } from "@effect/vitest";
import { Cause, Effect, Exit, Logger } from "effect";

import { logAndFailWith, tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";

const silentLogs = Logger.layer([]);

describe("tapLogAndMapError", () => {
  it.effect("returns success when inner effect succeeds", () =>
    Effect.gen(function* () {
      const mapped = tapLogAndMapError("ctx", (cause: unknown) =>
        typeof cause === "string" ? cause : "bad",
      )(Effect.succeed(42)).pipe(Effect.provide(silentLogs));

      expect(yield* mapped).toBe(42);
    }),
  );

  it.effect("maps failures using the mapper", () =>
    Effect.gen(function* () {
      const program = tapLogAndMapError(
        "ctx",
        () => "mapped",
      )(Effect.fail("orig")).pipe(Effect.provide(silentLogs));
      const result = yield* Effect.exit(program);
      expect(result).toStrictEqual(Exit.fail("mapped"));
    }),
  );
});

describe("logAndFailWith", () => {
  it.effect("fails with mapped error for the given cause", () =>
    Effect.gen(function* () {
      const program = logAndFailWith(
        "ctx",
        (cause: unknown) => new Error(`mapped:${String(cause)}`),
      )("boom").pipe(Effect.provide(silentLogs));
      const result = yield* Effect.exit(program);
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const squashed = Cause.squash(result.cause);
        expect(squashed).toBeInstanceOf(Error);
        expect((squashed as Error).message).toContain("mapped:boom");
      }
    }),
  );
});
