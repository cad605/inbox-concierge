const cookieHeaderString = (
  headers: Record<string, string | Array<string> | undefined>,
): string => {
  const raw = headers["cookie"] ?? headers["Cookie"];
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return raw[0]!;
  }
  return "";
};

export const getCookieValue = (
  headers: Record<string, string | Array<string> | undefined>,
  name: string,
): string | undefined => {
  const cookieHeader = cookieHeaderString(headers);
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
};
