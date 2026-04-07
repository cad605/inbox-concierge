import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { Config, Effect, Layer, Redacted } from "effect";

import { TokenEncryptionError } from "#domain/errors/token-encryption-error.ts";
import { TokenEncryption } from "#ports/token-encryption.port.ts";

const ALGORITHM = "aes-256-gcm" as const;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

const make = Effect.gen(function* () {
  const keyHex = yield* Config.redacted("ENCRYPTION_KEY");
  const key = Buffer.from(Redacted.value(keyHex), "hex");

  if (key.length !== 32) {
    return yield* Effect.fail(
      new TokenEncryptionError({
        message: "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)",
        cause: { reason: "invalid_encryption_key_length" },
      }),
    );
  }

  const encrypt = Effect.fn("TokenEncryption.encrypt")(function* (
    plaintext: string,
  ): Effect.fn.Return<string, TokenEncryptionError> {
    return yield* Effect.try({
      try: () => {
        const iv = randomBytes(IV_BYTES);
        const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
        const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
      },
      catch: (error) =>
        new TokenEncryptionError({ message: "Failed to encrypt token", cause: error }),
    });
  });

  const decrypt = Effect.fn("TokenEncryption.decrypt")(function* (
    ciphertext: string,
  ): Effect.fn.Return<string, TokenEncryptionError> {
    const parts = ciphertext.split(".");
    const ivB64 = parts[0];
    const authTagB64 = parts[1];
    const dataB64 = parts[2];
    if (parts.length !== 3 || !ivB64 || !authTagB64 || !dataB64) {
      return yield* Effect.fail(
        new TokenEncryptionError({
          message: "Invalid ciphertext format: expected iv.authTag.data",
          cause: { reason: "invalid_ciphertext_format" },
        }),
      );
    }
    return yield* Effect.try({
      try: () => {
        const iv = Buffer.from(ivB64, "base64");
        const authTag = Buffer.from(authTagB64, "base64");
        const encrypted = Buffer.from(dataB64, "base64");
        const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
      },
      catch: (error) =>
        new TokenEncryptionError({ message: "Failed to decrypt token", cause: error }),
    });
  });

  return TokenEncryption.of({ encrypt, decrypt });
});

export const TokenEncryptionLive = Layer.effect(TokenEncryption, make);
