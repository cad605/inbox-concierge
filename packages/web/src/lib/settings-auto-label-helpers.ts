import type { components } from "@workspace/http/schema";

export type SettingsLabelForDisplay = components["schemas"]["Label"];

export function firstLine(text: string): string {
  const line = text.split(/\r?\n/)[0]?.trim() ?? "";
  return line;
}

export function labelSubline(label: SettingsLabelForDisplay): string {
  if (label.prompt?.trim()) {
    return firstLine(label.prompt);
  }
  return "—";
}
