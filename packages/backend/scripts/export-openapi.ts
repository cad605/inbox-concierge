import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, FileSystem, Path } from "effect";

import { getOpenApiSpec } from "#entrypoints/http/api.ts";

/**
 * Export OpenAPI spec from Effect HttpApi as JSON.
 *
 * Writes the spec to packages/http/openapi.json where openapi-typescript
 * can generate typed schema definitions from it.
 *
 * Usage: bun run scripts/export-openapi.ts
 */
const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const scriptDirectory = yield* path.fromFileUrl(new URL(".", import.meta.url));
  const spec = yield* getOpenApiSpec();

  yield* Effect.logInfo("Exporting OpenAPI spec from Effect HttpApi...");
  yield* Effect.logInfo(`  - OpenAPI: ${spec.openapi}`);
  yield* Effect.logInfo(`  - Title: ${spec.info.title}`);
  yield* Effect.logInfo(`  - Endpoints: ${Object.keys(spec.paths).length}`);
  yield* Effect.logInfo(`  - Schemas: ${Object.keys(spec.components?.schemas ?? {}).length}`);

  const outputFile = path.join(scriptDirectory, "..", "..", "http", "openapi.json");
  const contents = JSON.stringify(spec, null, 2);

  yield* fs.writeFileString(outputFile, contents);
  yield* Effect.logInfo(`OpenAPI spec exported to ${outputFile}`);
});

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain);
