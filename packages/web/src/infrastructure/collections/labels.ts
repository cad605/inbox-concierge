import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { components } from "@workspace/http/schema";
import { Schema } from "effect";

import { api } from "#infrastructure/api-client.ts";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { queryClient } from "#infrastructure/query-client.ts";
import { labelKeys } from "#infrastructure/query-keys.ts";

export type Label = components["schemas"]["Label"];

const LabelSchema = Schema.Struct({
  id: Schema.String.pipe(Schema.check(Schema.isUUID())),
  userId: Schema.String.pipe(Schema.check(Schema.isUUID())),
  name: Schema.NonEmptyString,
  prompt: Schema.NullOr(Schema.String),
  type: Schema.Literals(["system", "custom"]),
  isActive: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

const labelStandardSchema = Schema.toStandardSchemaV1(LabelSchema);

export const labelCollection = createCollection(
  queryCollectionOptions({
    id: "labels",
    queryKey: labelKeys.list,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/labels");

      if (!response.ok) {
        throw new Error(getErrorMessage(error));
      }

      return data ?? [];
    },
    queryClient,
    getKey: (item) => item.id,
    schema: labelStandardSchema,
    onInsert: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        const row = mutation.modified as Label;
        const { data, error, response } = await api.POST("/api/labels", {
          body: {
            name: row.name,
            prompt: row.prompt ?? null,
          },
        });

        if (!response.ok) {
          throw new Error(getErrorMessage(error));
        }

        if (data === undefined) {
          throw new Error(getErrorMessage(error));
        }
      }

      await labelCollection.utils.refetch();
    },
    onUpdate: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        const { original, changes } = mutation;
        if (!("id" in original)) {
          throw new Error("Label update missing original row");
        }

        const delta = changes as Partial<Label>;
        if (!("isActive" in delta) || delta.isActive === undefined) {
          throw new Error("Label update must include isActive");
        }

        const { data, error, response } = await api.PUT("/api/labels/{id}", {
          params: { path: { id: original.id } },
          body: { isActive: delta.isActive },
        });

        if (!response.ok) {
          throw new Error(getErrorMessage(error));
        }

        if (data === undefined) {
          throw new Error(getErrorMessage(error));
        }
      }

      await labelCollection.utils.refetch();
    },
  }),
);
