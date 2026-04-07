/** Relative time from an ISO 8601 string (e.g. label `updatedAt`). */
export function formatRelativeTime(iso: string, nowMs = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  const diffMs = d.getTime() - nowMs;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  if (Math.abs(seconds) < 60) {
    return rtf.format(seconds, "second");
  }
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }
  if (Math.abs(hours) < 24) {
    return rtf.format(hours, "hour");
  }
  if (Math.abs(days) < 7) {
    return rtf.format(days, "day");
  }
  if (Math.abs(weeks) < 5) {
    return rtf.format(weeks, "week");
  }
  if (Math.abs(months) < 12) {
    return rtf.format(months, "month");
  }
  return rtf.format(years, "year");
}
