import { describe, expect, it } from "vitest";

import { getCookieValue } from "#lib/get-cookie-value.ts";

describe("getCookieValue", () => {
  it.each([
    {
      name: "reads lowercase cookie header",
      headers: { cookie: "sid=abc; other=1" },
      cookieName: "sid",
      expected: "abc",
    },
    {
      name: "reads Cookie capital-C header",
      headers: { Cookie: "sid=xyz" },
      cookieName: "sid",
      expected: "xyz",
    },
    {
      name: "prefers cookie over Cookie when both present (first branch wins)",
      headers: { cookie: "a=1", Cookie: "a=2" },
      cookieName: "a",
      expected: "1",
    },
    {
      name: "uses first element of cookie header array",
      headers: { cookie: ["first=value", "ignored"] },
      cookieName: "first",
      expected: "value",
    },
    {
      name: "returns undefined when cookie name missing",
      headers: { cookie: "other=1" },
      cookieName: "sid",
      expected: undefined,
    },
    {
      name: "returns undefined when Cookie header empty",
      headers: {},
      cookieName: "sid",
      expected: undefined,
    },
    {
      name: "trims segments and matches first name=",
      headers: { cookie: "  sid=trimmed  ; sid=second" },
      cookieName: "sid",
      expected: "trimmed",
    },
    {
      name: "value may contain equals signs",
      headers: { cookie: "data=a=b=c" },
      cookieName: "data",
      expected: "a=b=c",
    },
  ])("$name", ({ headers, cookieName, expected }) => {
    expect(getCookieValue(headers, cookieName)).toBe(expected);
  });
});
