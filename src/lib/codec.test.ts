import { describe, it, expect } from "vitest";
import { encode, decode, daysSince, daysBetween, resolveUrl } from "./codec";

function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
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
    expect(daysSince(localISO(new Date()))).toBe(0);
  });

  it("returns positive number for past date", () => {
    expect(daysSince("2020-01-01")).toBeGreaterThan(0);
  });

  it("returns correct value for a known offset", () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    expect(daysSince(localISO(d))).toBe(7);
  });
});

describe("daysBetween", () => {
  it("returns 0 for the same date", () => {
    expect(daysBetween("2024-06-15", "2024-06-15")).toBe(0);
  });

  it("returns positive count for chronological pair", () => {
    expect(daysBetween("2024-01-01", "2024-01-10")).toBe(9);
  });

  it("returns negative count when reversed", () => {
    expect(daysBetween("2024-01-10", "2024-01-01")).toBe(-9);
  });

  it("is unaffected by DST transitions", () => {
    // US spring-forward 2024 was Mar 10 — straddle it.
    expect(daysBetween("2024-03-09", "2024-03-11")).toBe(2);
    // US fall-back 2024 was Nov 3 — straddle it.
    expect(daysBetween("2024-11-02", "2024-11-04")).toBe(2);
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
