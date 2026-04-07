import { Schema } from "effect";
import { SqlError, UnknownError } from "effect/unstable/sql/SqlError";
import { describe, expect, it } from "vitest";

import { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import { AutoLabelError } from "#domain/errors/auto-label-error.ts";
import {
  DatabaseUnavailableError,
  makeDatabaseUnavailableError,
} from "#domain/errors/database-unavailable-error.ts";
import { InboxPersistenceError } from "#domain/errors/inbox-persistence-error.ts";
import { InboxSyncError } from "#domain/errors/inbox-sync-error.ts";
import { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";

const postgresLeakPatterns = [/relation\s+"/i, /does not exist/i, /syntax error/i, /postgres/i];

describe("HTTP-facing errors do not embed SQL or driver text", () => {
  it("LabelPersistenceError.fromError ignores SqlError message body", () => {
    const sqlFailure = new SqlError({
      reason: new UnknownError({
        message: 'relation "user_secrets" does not exist at character 42',
        cause: new Error("pg driver detail"),
      }),
    });
    const safe = LabelPersistenceError.fromError(sqlFailure);
    const json = JSON.stringify(Schema.encodeUnknownSync(LabelPersistenceError)(safe));
    for (const p of postgresLeakPatterns) {
      expect(json).not.toMatch(p);
    }
    expect(json).toContain("LabelPersistenceError");
    expect(json).toContain("A database error occurred while processing labels");
  });

  it("AuthPersistenceError.fromError ignores underlying messages", () => {
    const safe = AuthPersistenceError.fromError(
      new Error('duplicate key value violates unique constraint "auth_users_email_key"'),
    );
    const json = JSON.stringify(Schema.encodeUnknownSync(AuthPersistenceError)(safe));
    expect(json).not.toContain("auth_users_email_key");
    expect(json).toContain("authentication data");
  });

  it("InboxPersistenceError.fromError ignores underlying messages", () => {
    const safe = InboxPersistenceError.fromError(
      new Error("ERROR: canceling statement due to statement timeout"),
    );
    const json = JSON.stringify(Schema.encodeUnknownSync(InboxPersistenceError)(safe));
    expect(json).not.toContain("statement timeout");
    expect(json).toContain("inbox data");
  });

  it("InboxSyncError.fromError ignores underlying messages", () => {
    const safe = InboxSyncError.fromError(new Error("Gmail API 503: backendError"));
    const json = JSON.stringify(Schema.encodeUnknownSync(InboxSyncError)(safe));
    expect(json).not.toContain("Gmail");
    expect(json).toContain("Inbox synchronization failed");
  });

  it("DatabaseUnavailableError exposes only the static client message", () => {
    const safe = makeDatabaseUnavailableError();
    const json = JSON.stringify(Schema.encodeUnknownSync(DatabaseUnavailableError)(safe));
    expect(json).toBe(
      JSON.stringify({
        _tag: "DatabaseUnavailableError",
        message: "Service temporarily unavailable.",
      }),
    );
  });

  it("AutoLabelError.fromError encodes a stable tagged shape", () => {
    const safe = AutoLabelError.fromError(new Error("labeler failure detail"));
    const json = JSON.stringify(Schema.encodeUnknownSync(AutoLabelError)(safe));
    expect(json).toContain("AutoLabelError");
    expect(json).toContain("labeler failure detail");
  });
});
