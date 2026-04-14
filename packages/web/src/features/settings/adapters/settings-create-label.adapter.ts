import type {
  CreateSettingsLabelBody,
  CreateSettingsLabelResult,
} from "#features/settings/ports/settings.port.ts";
import { api } from "#infrastructure/api-client.ts";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { labelCollection } from "#infrastructure/collections/labels.ts";

export async function createSettingsLabelRequest(
  body: CreateSettingsLabelBody,
): Promise<CreateSettingsLabelResult> {
  const { data, error, response } = await api.POST("/api/labels", {
    body: {
      name: body.name,
      prompt: body.prompt !== null && body.prompt.length > 0 ? body.prompt : null,
      examples:
        body.examples !== undefined && body.examples.length > 0 ? [...body.examples] : undefined,
    },
  });

  if (!response.ok) {
    return { ok: false, message: getErrorMessage(error) };
  }

  if (data === undefined) {
    return { ok: false, message: getErrorMessage(error) };
  }

  await labelCollection.utils.refetch();
  return { ok: true };
}
