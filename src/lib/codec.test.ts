import { describe, it, expect } from "vitest";
import { encode, decode, daysSince, resolveUrl } from "./codec";
import type { DaySinceConfig } from "./types";

describe("encode / decode", () => {
  const config: DaySinceConfig = {
    title: "test",
    entries: [
      { name: "A", url: "https://example.com", date: "2024-01-15" },
      { name: "B" },
    ],
    bg: "#ff0000",
    accent: "#00ff00",
  };

  it("round-trips a config", () => {
    const hash = encode(config);
    const decoded = decode(hash);
    expect(decoded).toEqual(config);
  });

  it("returns null for invalid hash", () => {
    expect(decode("garbage")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(decode("")).toBeNull();
  });
});

describe("daysSince", () => {
  it("returns 0 for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(daysSince(today)).toBe(0);
  });

  it("returns positive number for past date", () => {
    expect(daysSince("2020-01-01")).toBeGreaterThan(0);
  });

  it("returns correct value for a known offset", () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const weekAgo = d.toISOString().slice(0, 10);
    expect(daysSince(weekAgo)).toBe(7);
  });
});

describe("resolveUrl", () => {
  it("returns full URLs as-is", () => {
    expect(resolveUrl("https://github.com/foo")).toBe("https://github.com/foo");
    expect(resolveUrl("http://example.com")).toBe("http://example.com");
  });

  it("converts user/repo to GitHub URL", () => {
    expect(resolveUrl("foo/bar")).toBe("https://github.com/foo/bar");
  });

  it("returns undefined for empty input", () => {
    expect(resolveUrl("")).toBeUndefined();
    expect(resolveUrl("   ")).toBeUndefined();
  });

  it("returns undefined for bare word without slash", () => {
    expect(resolveUrl("something")).toBeUndefined();
  });
});
