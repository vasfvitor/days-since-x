import { describe, it, expect } from "vitest";
import { sanitizeConfig } from "./sanitize";

describe("sanitizeConfig", () => {
  it("passes through valid config", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", url: "https://example.com", date: "2024-01-15" }],
      bg: "#ff0000",
      accent: "#00ff00",
    });
    expect(result).not.toBeNull();
    expect(result!.title).toBe("test");
    expect(result!.entries[0].name).toBe("A");
  });

  it("rejects null/undefined/non-object", () => {
    expect(sanitizeConfig(null)).toBeNull();
    expect(sanitizeConfig(undefined)).toBeNull();
    expect(sanitizeConfig("string")).toBeNull();
  });

  it("rejects missing title", () => {
    expect(sanitizeConfig({ entries: [{ name: "A" }] })).toBeNull();
  });

  it("rejects empty entries", () => {
    expect(sanitizeConfig({ title: "test", entries: [] })).toBeNull();
  });

  it("strips invalid colors", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A" }],
      bg: "red; } body { background: url(evil)",
      accent: "not-a-color",
    });
    expect(result!.bg).toBeUndefined();
    expect(result!.accent).toBeUndefined();
  });

  it("accepts valid hex colors", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A" }],
      bg: "#f0f8ff",
      accent: "#4444ff",
    });
    expect(result!.bg).toBe("#f0f8ff");
    expect(result!.accent).toBe("#4444ff");
  });

  it("strips javascript: URLs", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", url: "javascript:alert(1)" }],
    });
    expect(result!.entries[0].url).toBeUndefined();
  });

  it("strips data: URLs", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", url: "data:text/html,<script>alert(1)</script>" }],
    });
    expect(result!.entries[0].url).toBeUndefined();
  });

  it("allows https URLs", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", url: "https://github.com/foo/bar" }],
    });
    expect(result!.entries[0].url).toBe("https://github.com/foo/bar");
  });

  it("strips invalid dates", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", date: "not-a-date" }],
    });
    expect(result!.entries[0].date).toBeUndefined();
  });

  it("strips dates with extra content", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", date: '2024-01-01"><script>alert(1)</script>' }],
    });
    expect(result!.entries[0].date).toBeUndefined();
  });

  it("truncates overly long titles", () => {
    const result = sanitizeConfig({
      title: "x".repeat(500),
      entries: [{ name: "A" }],
    });
    expect(result!.title.length).toBe(200);
  });

  it("limits entries to 100", () => {
    const entries = Array.from({ length: 150 }, (_, i) => ({ name: `E${i}` }));
    const result = sanitizeConfig({ title: "test", entries });
    expect(result!.entries.length).toBe(100);
  });

  it("filters out entries with no valid name", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "" }, { name: "Valid" }, { name: 123 }],
    });
    expect(result!.entries.length).toBe(1);
    expect(result!.entries[0].name).toBe("Valid");
  });

  it("strips Unicode control characters from text", () => {
    const result = sanitizeConfig({
      title: "test\u202Eevil\u200Bhidden",
      entries: [{ name: "A\u0000B\u200FC" }],
    });
    expect(result!.title).toBe("testevilhidden");
    expect(result!.entries[0].name).toBe("ABC");
  });

  it("rejects URLs with embedded credentials (@)", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", url: "https://user:pass@evil.com/path" }],
    });
    expect(result!.entries[0].url).toBeUndefined();
  });

  it("allows normal URLs without @", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", url: "https://example.com/path?q=1" }],
    });
    expect(result!.entries[0].url).toBe("https://example.com/path?q=1");
  });

  it("rejects auto-corrected dates like Feb 31", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", date: "2024-02-31" }],
    });
    expect(result!.entries[0].date).toBeUndefined();
  });

  it("accepts valid leap year date", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", date: "2024-02-29" }],
    });
    expect(result!.entries[0].date).toBe("2024-02-29");
  });

  it("rejects color values with 5 or 7 hex chars", () => {
    expect(sanitizeConfig({
      title: "test", entries: [{ name: "A" }],
      bg: "#fffff", accent: "#1234567",
    })!.bg).toBeUndefined();
  });
});
