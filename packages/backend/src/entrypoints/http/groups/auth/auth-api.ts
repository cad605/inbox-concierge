import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";

const authorizeGoogle = HttpApiEndpoint.get("authorizeGoogle", "/authorize/google", {
  success: Schema.Struct({
    redirectUrl: Schema.String,
    state: Schema.String,
  }),
});

/**
 * Google OAuth callback query: either `error`+`state` (failure) or `code`+`state` (success).
 * The error branch is listed first so if both `error` and `code` appear, we decode as an OAuth error.
 */
const GoogleOAuthCallbackQueryError = Schema.Struct({
  state: Schema.String,
  error: Schema.String,
  error_description: Schema.optional(Schema.String),
});

const GoogleOAuthCallbackQuerySuccess = Schema.Struct({
  state: Schema.String,
  code: Schema.String,
  error_description: Schema.optional(Schema.String),
});

export const GoogleOAuthCallbackQuery = Schema.Union([
  GoogleOAuthCallbackQueryError,
  GoogleOAuthCallbackQuerySuccess,
]);

export type GoogleOAuthCallbackQuery = Schema.Schema.Type<typeof GoogleOAuthCallbackQuery>;

const callbackGoogle = HttpApiEndpoint.get("callbackGoogle", "/callback/google", {
  query: GoogleOAuthCallbackQuery,
  success: HttpApiSchema.Empty(302),
});

export class AuthApi extends HttpApiGroup.make("auth")
  .add(authorizeGoogle, callbackGoogle)
  .prefix("/api/auth")
  .annotateMerge(
    OpenApi.annotations({
      title: "Auth",
      description: "Public authentication endpoints",
    }),
  ) {}
