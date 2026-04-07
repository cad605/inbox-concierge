import { Schema } from "effect";

export const UserRole = Schema.Literals(["admin", "user"]);
export type UserRole = typeof UserRole.Type;
