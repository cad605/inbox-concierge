import type { components } from "@workspace/http/schema";

export type SettingsUser = components["schemas"]["AuthUser"];
export type SettingsLabel = components["schemas"]["Label"];

/** Thread row shape for the add-label wizard (matches TanStack DB readonly rows). */
export type SettingsLabelWizardThreadRow = {
  readonly id: string;
  /** Present for synced threads; may be missing briefly from client collection rows. */
  readonly lastMessageId: string | undefined;
  readonly subject: string;
  readonly snippet: string;
};
