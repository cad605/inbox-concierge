import createClient from "openapi-fetch";

import type { paths } from "./schema.d.ts";

export const api = createClient<paths>({
  baseUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  credentials: "include",
});

export type { paths };
export type ApiClient = typeof api;
