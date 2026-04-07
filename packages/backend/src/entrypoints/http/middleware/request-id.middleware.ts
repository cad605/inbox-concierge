import { Effect, Option, ServiceMap } from "effect";
import { HttpEffect, HttpMiddleware, HttpServerResponse } from "effect/unstable/http";
import * as Headers from "effect/unstable/http/Headers";
import { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";

export const requestIdMiddleware = HttpMiddleware.make((app) =>
  Effect.withFiber((fiber) => {
    const request = ServiceMap.getUnsafe(fiber.services, HttpServerRequest);
    const requestId = Option.match(Headers.get(request.headers, "x-request-id"), {
      onNone: () => crypto.randomUUID(),
      onSome: (value) => {
        const trimmed = value.trim();
        return trimmed === "" ? crypto.randomUUID() : trimmed;
      },
    });

    return app.pipe(
      HttpEffect.withPreResponseHandler((_req, response) =>
        Effect.succeed(HttpServerResponse.setHeader(response, "X-Request-Id", requestId)),
      ),
      Effect.annotateLogs({ requestId }),
    );
  }),
);
