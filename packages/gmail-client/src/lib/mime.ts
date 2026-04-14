import type { GmailMimeTreeNodeRaw, GmailMessagePayloadRawDecoded } from "#domain/thread.ts";

/** Parses a single From header value into display name and addr (no angle brackets on email). */
export const parseFromHeader = (from: string): { name: string | undefined; email: string } => {
  let s = from.trim();
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).trim();
  }
  const angleOnly = s.match(/^<([^>]+)>$/);
  if (angleOnly?.[1] !== undefined) {
    return { name: undefined, email: angleOnly[1].trim() };
  }
  const withName = s.match(/^(.+?)\s*<([^>]+)>$/);
  if (withName?.[1] !== undefined && withName[2] !== undefined) {
    return {
      name: withName[1].trim().replace(/^"|"$/g, ""),
      email: withName[2].trim(),
    };
  }
  return { name: undefined, email: s };
};

export const decodeBase64Url = (data: string): string => {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
};

export const stripHtml = (html: string): string =>
  html
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|tr|li|blockquote|h[1-6])>/gi, "\n\n")
    .replace(/<\/(?:td|th)>/gi, "\t")
    .replace(/<li[\s>]/gi, "\n- ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(Number.parseInt(h, 16)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const findPlainText = (part: GmailMimeTreeNodeRaw): string | undefined => {
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  for (const child of part.parts ?? []) {
    const found = findPlainText(child);
    if (found !== undefined) return found;
  }
  return undefined;
};

const findHtmlText = (part: GmailMimeTreeNodeRaw): string | undefined => {
  if (part.mimeType === "text/html" && part.body?.data) {
    return stripHtml(decodeBase64Url(part.body.data));
  }
  for (const child of part.parts ?? []) {
    const found = findHtmlText(child);
    if (found !== undefined) return found;
  }
  return undefined;
};

export const extractBodyText = (payload: GmailMessagePayloadRawDecoded): string => {
  const root: GmailMimeTreeNodeRaw = {
    mimeType: payload.mimeType,
    body: payload.body,
    parts: payload.parts,
  };
  return findPlainText(root) ?? findHtmlText(root) ?? "";
};
