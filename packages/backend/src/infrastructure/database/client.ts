import { PgClient } from "@effect/sql-pg";
import { Config, Effect, Layer, Redacted, String } from "effect";

/**
 * PostgreSQL pool settings (`PG_MAX_CONNECTIONS`, idle/connect timeouts) should be chosen
 * together with your host’s connection limits. If you use PgBouncer or a managed pool
 * in front of Postgres, keep total client connections across app instances below the
 * provider’s cap (transaction pooling multiplies concurrent requests, not connections).
 */
export const PgClientConfig = Config.all({
  url: Config.redacted("DATABASE_URL").pipe(
    Config.orElse(() =>
      Config.all({
        host: Config.string("PGHOST"),
        port: Config.int("PGPORT"),
        user: Config.string("PGUSER"),
        password: Config.redacted("PGPASSWORD"),
        database: Config.string("PGDATABASE"),
      }).pipe(
        Config.map(({ host, port, user, password, database }) =>
          Redacted.make(
            `postgresql://${user}:${Redacted.value(password)}@${host}:${port}/${database}`,
          ),
        ),
      ),
    ),
  ),
  ssl: Config.boolean("PG_SSL").pipe(Config.withDefault(true)),
  maxConnections: Config.int("PG_MAX_CONNECTIONS").pipe(Config.withDefault(10)),
  idleTimeout: Config.duration("PG_IDLE_TIMEOUT").pipe(Config.withDefault("60 seconds")),
  connectTimeout: Config.duration("PG_CONNECTION_TIMEOUT").pipe(Config.withDefault("10 seconds")),
});

export const DatabaseLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* PgClientConfig;

    return PgClient.layer({
      url: config.url,
      ssl: config.ssl,
      maxConnections: config.maxConnections,
      idleTimeout: config.idleTimeout,
      connectTimeout: config.connectTimeout,
      transformQueryNames: String.camelToSnake,
      transformResultNames: String.snakeToCamel,
    });
  }),
);
