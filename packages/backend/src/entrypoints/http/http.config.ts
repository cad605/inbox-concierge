import { Config } from "effect";

export const HttpConfig = Config.all({
  port: Config.number("PORT").pipe(Config.withDefault(3000)),
  host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
  logLevel: Config.logLevel("LOG_LEVEL").pipe(Config.withDefault("Info")),
  logFormatRaw: Config.string("LOG_FORMAT").pipe(Config.withDefault("logfmt")),
  corsAllowedOrigins: Config.string("CORS_ALLOWED_ORIGINS").pipe(
    Config.map((s) => s.split(",").map((v) => v.trim())),
  ),
  openRouterModel: Config.string("OPENROUTER_MODEL").pipe(Config.withDefault("openai/gpt-4o-mini")),
  webAppUrl: Config.string("WEB_APP_URL").pipe(Config.withDefault("http://localhost:3001")),
}).pipe(
  Config.map(
    ({ port, host, logLevel, logFormatRaw, corsAllowedOrigins, openRouterModel, webAppUrl }) => ({
      port,
      host,
      logLevel,
      logFormat: logFormatRaw === "pretty" ? "pretty" : "logfmt",
      corsAllowedOrigins,
      openRouterModel,
      webAppUrl,
    }),
  ),
);

export const config = HttpConfig;
