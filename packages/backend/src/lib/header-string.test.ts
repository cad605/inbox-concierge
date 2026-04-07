import { describe, expect, it } from "vitest";

import { headerString } from "#lib/header-string.ts";

describe("headerString", () => {
  it.each([
    {
      name: "returns string header by exact key",
      headers: { Authorization: "Bearer token" },
      headerName: "Authorization",
      expected: "Bearer token",
    },
    {
      name: "matches case-insensitively via explicit lower key",
      headers: { authorization: "Bearer low" },
      headerName: "Authorization",
      expected: "Bearer low",
    },
    {
      name: "finds mixed-case key in record via scan",
      headers: { AuThOrIzAtIoN: "Bearer mixed" },
      headerName: "authorization",
      expected: "Bearer mixed",
    },
    {
      name: "uses first element when header is array",
      headers: { "X-Forwarded-For": ["1.1.1.1", "2.2.2.2"] },
      headerName: "X-Forwarded-For",
      expected: "1.1.1.1",
    },
    {
      name: "returns undefined when header absent",
      headers: {},
      headerName: "X-Missing",
      expected: undefined,
    },
    {
      name: "returns undefined for empty array",
      headers: { "X-Empty": [] },
      headerName: "X-Empty",
      expected: undefined,
    },
  ])("$name", ({ headers, headerName, expected }) => {
    expect(headerString(headers, headerName)).toBe(expected);
  });
});
