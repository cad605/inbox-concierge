import { describe, expect, it, layer } from "@effect/vitest";
import { Cause, ConfigProvider, Effect, Exit, Layer } from "effect";
import { afterEach, beforeEach } from "vitest";

import { TokenEncryptionLive } from "#adapters/token-encryption.adapter.ts";
import { isTokenEncryptionError } from "#domain/errors/token-encryption-error.ts";
import { TokenEncryption } from "#ports/token-encryption.port.ts";

const validHexKey = "a".repeat(64);

const encryptionLayer = Layer.provideMerge(
  TokenEncryptionLive,
  ConfigProvider.layer(ConfigProvider.fromUnknown({ ENCRYPTION_KEY: validHexKey })),
);

describe("TokenEncryptionLive", () => {
  layer(encryptionLayer)((it) => {
    it.effect("encrypt then decrypt round-trips plaintext", () =>
      Effect.gen(function* () {
        const enc = yield* TokenEncryption;
        const cipher = yield* enc.encrypt("hello-世界");
        expect(cipher.split(".")).toHaveLength(3);
        const plain = yield* enc.decrypt(cipher);
        expect(plain).toBe("hello-世界");
      }),
    );
  });

  describe("invalid ENCRYPTION_KEY", () => {
    let previousEnv: string | undefined;

    beforeEach(() => {
      previousEnv = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;
    });

    afterEach(() => {
      if (previousEnv !== undefined) {
        process.env.ENCRYPTION_KEY = previousEnv;
      } else {
        delete process.env.ENCRYPTION_KEY;
      }
    });

    it.effect("fails at acquisition when key decodes to wrong byte length", () =>
      Effect.gen(function* () {
        const shortKeyLayer = Layer.provideMerge(
          TokenEncryptionLive,
          ConfigProvider.layer(ConfigProvider.fromUnknown({ ENCRYPTION_KEY: "a".repeat(62) })),
        );
        const exit = yield* Effect.exit(
          Effect.provide(
            Effect.gen(function* () {
              yield* TokenEncryption;
            }),
            shortKeyLayer,
            { local: true },
          ),
        );
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          expect(isTokenEncryptionError(Cause.squash(exit.cause))).toBe(true);
        }
      }),
    );
  });
});
