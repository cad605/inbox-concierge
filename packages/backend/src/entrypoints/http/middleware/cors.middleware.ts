import { Effect, Layer } from "effect";
import { HttpMiddleware, HttpRouter } from "effect/unstable/http";

import { HttpConfig } from "#entrypoints/http/http.config.ts";

/**
 * Escapes regex special characters. Asterisk (*) is NOT escaped (wildcard).
 */
const escapeRegexSpecialChars = (str: string): string =>
  str.replace(/(?<specialChar>[.+?^${}()|[\]\\])/g, "\\$<specialChar>");

const convertWildcardToRegex = (str: string): string => {
  let index = 0;
  return str.replace(/\*/g, () => `(?<w${index++}>.*)`);
};

const patternToPredicate = (pattern: string): ((origin: string) => boolean) => {
  const escapedPattern = escapeRegexSpecialChars(pattern);
  const regexPattern = convertWildcardToRegex(escapedPattern);
  const regex = new RegExp(`^${regexPattern}$`);
  return (origin: string) => regex.test(origin);
};

const createOriginPredicate = (patterns: ReadonlyArray<string>): ((origin: string) => boolean) => {
  const predicates = patterns.map(patternToPredicate);
  return (origin: string) => predicates.some((predicate) => predicate(origin));
};

export const CorsMiddlewareLive = Layer.unwrap(
  Effect.gen(function* () {
    const { corsAllowedOrigins } = yield* HttpConfig;
    const originPredicate = createOriginPredicate(corsAllowedOrigins);

    return HttpRouter.middleware(
      HttpMiddleware.cors({
        allowedOrigins: originPredicate,
        allowedMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
        exposedHeaders: ["X-Request-Id"],
        credentials: true,
        maxAge: 86400,
      }),
      { global: true },
    );
  }),
);
