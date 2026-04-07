import { HttpApiBuilder } from "effect/unstable/httpapi";

import { AppApi } from "#entrypoints/http/api.ts";
import { createLabelHandler } from "#entrypoints/http/groups/labels/handlers/create-label.handler.ts";
import { listLabelsHandler } from "#entrypoints/http/groups/labels/handlers/list-labels.handler.ts";
import { updateLabelHandler } from "#entrypoints/http/groups/labels/handlers/update-label.handler.ts";

export const LabelHandlers = HttpApiBuilder.group(AppApi, "labels", (handlers) =>
  handlers
    .handle("listLabels", listLabelsHandler)
    .handle("createLabel", createLabelHandler)
    .handle("updateLabel", updateLabelHandler),
);
