import { HttpApiBuilder } from "effect/unstable/httpapi";

import { AppApi } from "#entrypoints/http/api.ts";
import { authorizeGoogleHandler } from "#entrypoints/http/groups/auth/handlers/authorize-google.handler.ts";
import { callbackGoogleHandler } from "#entrypoints/http/groups/auth/handlers/callback-google.handler.ts";

export const AuthHandlers = HttpApiBuilder.group(AppApi, "auth", (handlers) =>
  handlers
    .handle("authorizeGoogle", authorizeGoogleHandler)
    .handle("callbackGoogle", callbackGoogleHandler),
);
