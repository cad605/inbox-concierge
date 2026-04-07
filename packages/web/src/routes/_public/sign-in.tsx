import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";

import { SignInPage } from "#features/auth/sign-in-page.tsx";

export const Route = createFileRoute("/_public/sign-in")({
  component: SignInPage,

  validateSearch: Schema.toStandardSchemaV1(
    Schema.Struct({
      redirect: Schema.optional(Schema.String),
      error: Schema.optional(
        Schema.Literals(["oauth_state", "access_denied", "provider", "inbox", "sync", "server"]),
      ),
    }),
  ),
});
