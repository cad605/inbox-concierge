import type { Label } from "#infrastructure/collections/labels.ts";

export function firstLine(text: string): string {
  const line = text.split(/\r?\n/)[0]?.trim() ?? "";
  return line;
}

export function labelSubline(label: Label): string {
  if (label.prompt?.trim()) {
    return firstLine(label.prompt);
  }
  return "—";
}
