import { Schema } from "effect";

export const UserAgent = Schema.String.pipe(Schema.brand("UserAgent"));
export type UserAgent = typeof UserAgent.Type;
