import { type Effect, ServiceMap } from "effect";

import type { DatabaseUnavailableError } from "#domain/errors/database-unavailable-error.ts";
import type { PermissionDeniedError } from "#domain/errors/permission-denied-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { LabelId } from "#domain/models/label.ts";
import type { MessageId } from "#domain/models/message.ts";
import type { ThreadId } from "#domain/models/thread.ts";
export type PermissionAction = "read" | "write" | "delete";

export type BaseCheck<R extends string, Id> = {
  readonly actorId: AuthUserId;
  readonly action: PermissionAction;
  readonly resource: R;
  readonly resourceId: Id;
};

export type PermissionCheck =
  | BaseCheck<"label", LabelId>
  | BaseCheck<"message", MessageId>
  | BaseCheck<"pendingJobs", AuthUserId>
  | BaseCheck<"thread", ThreadId>;

export type PermissionResource = PermissionCheck["resource"];

export class CheckPermission extends ServiceMap.Service<
  CheckPermission,
  (input: PermissionCheck) => Effect.Effect<void, PermissionDeniedError | DatabaseUnavailableError>
>()("app/ports/CheckPermission") {}
