import type { Redacted } from "effect";

/** Gmail API v1 base URL for the authenticated user (`users/me`). */
export const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me" as const;

export interface GmailClientConfig {
  clientId: string;
  clientSecret: Redacted.Redacted<string>;
}
