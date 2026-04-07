import { Effect, Layer } from "effect";
import type { Config } from "effect/Config";
import * as Logger from "effect/Logger";
import type { LogLevel } from "effect/LogLevel";
import * as References from "effect/References";

export type LoggerConfig = {
  readonly logLevel: LogLevel;
  readonly logFormat: "logfmt" | "pretty";
};

export const makeLoggerLayer = (config: Config<LoggerConfig>) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const cfg = yield* config;
      const loggerImpl = cfg.logFormat === "pretty" ? Logger.consolePretty() : Logger.consoleLogFmt;

      return Layer.mergeAll(
        Logger.layer([loggerImpl]),
        Layer.effect(References.MinimumLogLevel, Effect.succeed(cfg.logLevel)),
      );
    }),
  );
