import { PgMigrator } from "@effect/sql-pg";

export const run = (migrationsDirectory: string) =>
  PgMigrator.run({
    loader: PgMigrator.fromFileSystem(migrationsDirectory),
  });
