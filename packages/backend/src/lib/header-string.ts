/** Normalize a header value that may be a string or repeated header array. */
export const headerString = (
  headers: Record<string, string | Array<string> | undefined>,
  name: string,
): string | undefined => {
  const lower = name.toLowerCase();
  const raw =
    headers[name] ??
    headers[lower] ??
    Object.entries(headers).find(([k]) => k.toLowerCase() === lower)?.[1];
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return raw[0];
  }
  return undefined;
};
