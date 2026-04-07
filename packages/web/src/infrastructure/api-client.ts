import type { paths } from "@workspace/http/schema";
import createClient from "openapi-fetch";

import { envPublic } from "#infrastructure/env.ts";

export const api = createClient<paths>({
  baseUrl: envPublic.VITE_API_URL,
  credentials: "include",
});

export type { paths };
