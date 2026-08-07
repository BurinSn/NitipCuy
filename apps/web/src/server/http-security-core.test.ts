import { describe, expect, it } from "vitest";

import { isSameOriginJsonMutation } from "./http-security-core";

describe("state-changing HTTP boundary", () => {
  it("accepts an exact same-origin JSON browser request", () => {
    expect(
      isSameOriginJsonMutation({
        appOrigin: "https://nitipcuy.example",
        contentType: "application/json; charset=utf-8",
        fetchSite: "same-origin",
        origin: "https://nitipcuy.example",
      }),
    ).toBe(true);
  });

  it.each([
    {
      contentType: "application/json",
      fetchSite: "cross-site",
      origin: "https://evil.example",
    },
    {
      contentType: "text/plain",
      fetchSite: "same-origin",
      origin: "https://nitipcuy.example",
    },
    {
      contentType: "application/json",
      fetchSite: null,
      origin: "https://nitipcuy.example",
    },
    { contentType: "application/json", fetchSite: "same-origin", origin: null },
  ])("rejects missing or conflicting browser metadata", (metadata) => {
    expect(
      isSameOriginJsonMutation({
        appOrigin: "https://nitipcuy.example",
        ...metadata,
      }),
    ).toBe(false);
  });
});
