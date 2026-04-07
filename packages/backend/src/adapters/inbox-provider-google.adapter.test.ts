import { describe, expect, it } from "vitest";

import { extractBodyText, stripHtml } from "#adapters/inbox-provider-google.adapter.ts";

const toBase64Url = (text: string): string =>
  Buffer.from(text, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

describe("stripHtml", () => {
  it("strips basic tags and decodes common entities", () => {
    expect(stripHtml("<p>Hello &amp; world</p>")).toBe("Hello & world");
  });

  it("removes <script> blocks including content", () => {
    expect(stripHtml("<p>before</p><script>alert('x')</script><p>after</p>")).toBe(
      "before\n\nafter",
    );
  });

  it("removes <style> blocks including content", () => {
    expect(stripHtml("<style>.x{color:red}</style><div>visible</div>")).toBe("visible");
  });

  it("converts <br> to newlines", () => {
    expect(stripHtml("line1<br>line2<br/>line3")).toBe("line1\nline2\nline3");
  });

  it("inserts line breaks for block elements", () => {
    expect(stripHtml("<div>one</div><div>two</div>")).toBe("one\n\ntwo");
  });

  it("handles list items", () => {
    const html = "<ul><li>first</li><li>second</li></ul>";
    const result = stripHtml(html);
    expect(result).toContain("- first");
    expect(result).toContain("- second");
  });

  it("decodes numeric entities", () => {
    expect(stripHtml("&#169; &#x2603;")).toBe("\u00A9 \u2603");
  });

  it("collapses whitespace and excess newlines", () => {
    expect(stripHtml("<p>a</p><p></p><p></p><p></p><p>b</p>")).toBe("a\n\nb");
  });

  it("handles &nbsp; as space", () => {
    expect(stripHtml("hello&nbsp;world")).toBe("hello world");
  });
});

describe("extractBodyText", () => {
  it("extracts inline text/plain body directly", () => {
    const payload = {
      mimeType: "text/plain",
      body: { data: toBase64Url("Hello world") },
    };
    expect(extractBodyText(payload)).toBe("Hello world");
  });

  it("strips HTML from inline text/html body", () => {
    const payload = {
      mimeType: "text/html",
      body: { data: toBase64Url("<p>Hello <b>world</b></p>") },
    };
    expect(extractBodyText(payload)).toBe("Hello world");
  });

  it("prefers text/plain over text/html in multipart/alternative", () => {
    const payload = {
      mimeType: "multipart/alternative",
      body: {},
      parts: [
        { mimeType: "text/plain", body: { data: toBase64Url("plain version") } },
        { mimeType: "text/html", body: { data: toBase64Url("<p>html version</p>") } },
      ],
    };
    expect(extractBodyText(payload)).toBe("plain version");
  });

  it("falls back to text/html when no text/plain exists", () => {
    const payload = {
      mimeType: "multipart/alternative",
      body: {},
      parts: [{ mimeType: "text/html", body: { data: toBase64Url("<p>only html</p>") } }],
    };
    expect(extractBodyText(payload)).toBe("only html");
  });

  it("handles two-level nesting (multipart/mixed > multipart/alternative)", () => {
    const payload = {
      mimeType: "multipart/mixed",
      body: {},
      parts: [
        {
          mimeType: "multipart/alternative",
          body: {},
          parts: [
            { mimeType: "text/plain", body: { data: toBase64Url("nested plain") } },
            { mimeType: "text/html", body: { data: toBase64Url("<p>nested html</p>") } },
          ],
        },
        { mimeType: "application/pdf", body: {} },
      ],
    };
    expect(extractBodyText(payload)).toBe("nested plain");
  });

  it("handles three-level nesting", () => {
    const payload = {
      mimeType: "multipart/signed",
      body: {},
      parts: [
        {
          mimeType: "multipart/mixed",
          body: {},
          parts: [
            {
              mimeType: "multipart/alternative",
              body: {},
              parts: [
                { mimeType: "text/plain", body: { data: toBase64Url("deep plain") } },
                { mimeType: "text/html", body: { data: toBase64Url("<p>deep html</p>") } },
              ],
            },
          ],
        },
      ],
    };
    expect(extractBodyText(payload)).toBe("deep plain");
  });

  it("handles three-level nesting with only HTML leaf", () => {
    const payload = {
      mimeType: "multipart/signed",
      body: {},
      parts: [
        {
          mimeType: "multipart/related",
          body: {},
          parts: [
            {
              mimeType: "multipart/alternative",
              body: {},
              parts: [
                { mimeType: "text/html", body: { data: toBase64Url("<b>deep html only</b>") } },
              ],
            },
          ],
        },
      ],
    };
    expect(extractBodyText(payload)).toBe("deep html only");
  });

  it("returns empty string for payload with no decodable body", () => {
    const payload = {
      mimeType: "multipart/mixed",
      body: {},
      parts: [{ mimeType: "application/pdf", body: {} }],
    };
    expect(extractBodyText(payload)).toBe("");
  });

  it("prefers text/plain even when html appears first in tree order", () => {
    const payload = {
      mimeType: "multipart/alternative",
      body: {},
      parts: [
        { mimeType: "text/html", body: { data: toBase64Url("<p>html first</p>") } },
        { mimeType: "text/plain", body: { data: toBase64Url("plain second") } },
      ],
    };
    expect(extractBodyText(payload)).toBe("plain second");
  });
});
