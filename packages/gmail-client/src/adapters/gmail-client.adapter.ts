import type { Redacted } from "effect";
import { Effect, flow, Layer } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { GmailApiError, HttpError, ValidationError } from "#domain/errors.ts";
import { GmailThreadDetailResponse, GmailThreadsListResponse } from "#domain/thread.ts";
import { GMAIL_API_BASE_URL, type GmailClientConfig } from "#lib/gmail-client.config.ts";
import { GmailClient } from "#ports/gmail-client.port.ts";

const make = (_: GmailClientConfig) =>
  Effect.gen(function* () {
    const baseClient = yield* HttpClient.HttpClient;

    const client = baseClient.pipe(
      HttpClient.mapRequest(
        flow(HttpClientRequest.prependUrl(GMAIL_API_BASE_URL), HttpClientRequest.acceptJson),
      ),
      HttpClient.retryTransient({ times: 3 }),
    );

    const listThreads = Effect.fn("GmailClient.listThreads")(
      function* (input: {
        readonly accessToken: Redacted.Redacted<string>;
        readonly maxResults: number;
      }) {
        const path = "/threads";

        const request = HttpClientRequest.get(path, {
          urlParams: { maxResults: input.maxResults },
        }).pipe(HttpClientRequest.bearerToken(input.accessToken));

        const response = yield* client.execute(request);

        return yield* HttpClientResponse.matchStatus(response, {
          "2xx": (self) => HttpClientResponse.schemaBodyJson(GmailThreadsListResponse)(self),
          404: ({ status }) =>
            Effect.fail(
              new GmailApiError({
                endpoint: path,
                statusCode: status,
                error: new Error("Thread not found"),
              }),
            ),
          orElse: ({ status }) =>
            Effect.fail(
              new GmailApiError({
                endpoint: path,
                statusCode: status,
                error: new Error(`Unexpected status: ${status}`),
              }),
            ),
        });
      },

      Effect.catchTags({
        HttpClientError: ({ message, response }) =>
          Effect.fail(
            new HttpError({
              message,
              statusCode: response?.status,
            }),
          ),
        SchemaError: ({ message }) =>
          Effect.fail(
            new ValidationError({
              message,
            }),
          ),
      }),
    );

    const getThread = Effect.fn("GmailClient.getThread")(
      function* (input: {
        readonly accessToken: Redacted.Redacted<string>;
        readonly threadId: string;
      }) {
        const path = `/threads/${input.threadId}`;

        const request = HttpClientRequest.get(path, {
          urlParams: { format: "full" },
        }).pipe(HttpClientRequest.bearerToken(input.accessToken));

        const response = yield* client.execute(request);

        return yield* HttpClientResponse.matchStatus(response, {
          "2xx": (self) => HttpClientResponse.schemaBodyJson(GmailThreadDetailResponse)(self),
          404: ({ status }) =>
            Effect.fail(
              new GmailApiError({
                endpoint: path,
                statusCode: status,
                error: new Error("Thread not found"),
              }),
            ),
          orElse: ({ status }) =>
            Effect.fail(
              new GmailApiError({
                endpoint: path,
                statusCode: status,
                error: new Error(`Unexpected status: ${status}`),
              }),
            ),
        });
      },

      Effect.catchTags({
        HttpClientError: ({ message, response }) =>
          Effect.fail(
            new HttpError({
              message,
              statusCode: response?.status,
            }),
          ),
        SchemaError: ({ message }) =>
          Effect.fail(
            new ValidationError({
              message,
            }),
          ),
      }),
    );

    return GmailClient.of({ listThreads, getThread });
  });

export const GmailClientLive = (config: GmailClientConfig) =>
  Layer.effect(GmailClient, make(config));
