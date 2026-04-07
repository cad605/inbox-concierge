import { fileURLToPath } from "node:url";

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect } from "effect";

import { DatabaseLive } from "#infrastructure/database/client.ts";
import { run } from "#infrastructure/database/migrator.ts";

const migrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));

const program = Effect.gen(function* () {
  yield* Effect.logInfo("Running database migrations...");
  const applied = yield* run(migrationsDir);

  if (applied.length === 0) {
    yield* Effect.logInfo("No new migrations to apply.");
  } else {
    yield* Effect.logInfo(`Applied ${applied.length} migration(s):`);
    for (const [id, name] of applied) {
      yield* Effect.logInfo(`  ${id}_${name}`);
    }
  }
});

program.pipe(Effect.provide(DatabaseLive), Effect.provide(BunServices.layer), BunRuntime.runMain);
