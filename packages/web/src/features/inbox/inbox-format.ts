import type { InboxThread } from "#infrastructure/collections/threads.ts";

export function formatThreadTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatFrom(
  participants: ReadonlyArray<InboxThread["participants"][number]>,
): string {
  if (participants.length === 0) {
    return "—";
  }
  return participants.map((p) => (p.name._tag === "Some" ? p.name.value : p.email)).join(", ");
}
