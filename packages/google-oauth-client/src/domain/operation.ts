import { Schema } from "effect";

export const GoogleOAuthOperation = Schema.Literals([
  "token_exchange",
  "token_refresh",
  "token_revoke",
  "userinfo",
]);

export type GoogleOAuthOperation = typeof GoogleOAuthOperation.Type;
