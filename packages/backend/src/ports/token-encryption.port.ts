import { type Effect, ServiceMap } from "effect";

import type { TokenEncryptionError } from "#domain/errors/token-encryption-error.ts";

export class TokenEncryption extends ServiceMap.Service<
  TokenEncryption,
  {
    readonly encrypt: (plaintext: string) => Effect.Effect<string, TokenEncryptionError>;
    readonly decrypt: (ciphertext: string) => Effect.Effect<string, TokenEncryptionError>;
  }
>()("app/ports/TokenEncryption") {}
