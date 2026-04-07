import { Schema } from "effect";

export const AuthProviderType = Schema.Literals(["google"]);
export type AuthProviderType = typeof AuthProviderType.Type;
