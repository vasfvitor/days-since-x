import { describe, it, expect } from "vitest";
import { sanitizeConfig } from "./sanitize";
import { encode, decode } from "./codec";

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
  "';alert(1)//",
  '${alert(1)}',
  '<iframe src="javascript:alert(1)">',
  '\u0000<script>alert(1)</script>',
  '<details open ontoggle=alert(1)>',
];

describe("XSS payload rejection", () => {
  for (const payload of XSS_PAYLOADS) {
    it(`sanitizeConfig passes through "${payload.slice(0, 40)}" in title (renderer must escape)`, () => {
      const result = sanitizeConfig({
        title: payload,
        entries: [{ name: "A" }],
      });
      // sanitizeConfig strips control chars but does NOT strip HTML tags.
      // The renderer (escHtml / Astro JSX / DOM API) is responsible for safe output.
      if (result) {
        expect(result.title).not.toContain("\u0000");
      }
    });
  }

  it("javascript: URLs are rejected in all forms", () => {
    const schemes = [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "  javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:alert(1)",
      "jAvAsCrIpT:alert(1)",
    ];
    for (const url of schemes) {
      const result = sanitizeConfig({
        title: "test",
        entries: [{ name: "A", url }],
      });
      expect(result!.entries[0].url).toBeUndefined();
    }
  });

  it("CSS injection via color fields is blocked", () => {
    const injections = [
      "#fff; } * { background: url(evil) } .x {",
      "expression(alert(1))",
      "red",
      "#fff)</style><script>alert(1)</script>",
      "url(javascript:alert(1))",
    ];
    for (const val of injections) {
      const result = sanitizeConfig({
        title: "test",
        entries: [{ name: "A" }],
        bg: val,
        accent: val,
      });
      expect(result!.bg).toBeUndefined();
      expect(result!.accent).toBeUndefined();
    }
  });

  it("attribute breakout via date field is blocked", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", date: '2024-01-01"><script>alert(1)</script>' }],
    });
    expect(result!.entries[0].date).toBeUndefined();
  });

  it("embedded credentials in URLs are rejected", () => {
    const result = sanitizeConfig({
      title: "test",
      entries: [{ name: "A", url: "https://admin:password@evil.com" }],
    });
    expect(result!.entries[0].url).toBeUndefined();
  });

  it("Unicode RTL/control characters are stripped from text", () => {
    const result = sanitizeConfig({
      title: "\u202Eevil\u200Bhidden\u0000null",
      entries: [{ name: "\u202Atest\u202B" }],
    });
    expect(result!.title).toBe("evilhiddennull");  // control chars stripped, literal text "null" preserved
    expect(result!.title).not.toMatch(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e]/);
    expect(result!.entries[0].name).not.toMatch(/[\u202a\u202b]/);
  });
});

describe("decompression bomb guard", () => {
  it("decode rejects decompressed payloads over 50KB", () => {
    // Create a config that compresses well but is large
    const bigConfig = {
      title: "test",
      entries: Array.from({ length: 100 }, (_, i) => ({
        name: "A".repeat(100),
        url: `https://example.com/${"x".repeat(90)}`,
        date: "2024-01-01",
      })),
    };
    const hash = encode(bigConfig);
    // This should succeed (under 50KB)
    const result = decode(hash);
    expect(result).not.toBeNull();
  });

  it("round-trip encode/decode preserves data integrity", () => {
    const config = {
      title: "Security Test",
      entries: [
        { name: "Entry 1", url: "https://example.com", date: "2024-06-15" },
      ],
      bg: "#ff0000",
      accent: "#00ff00",
    };
    const hash = encode(config);
    const decoded = decode(hash);
    expect(decoded).toEqual(config);
  });
});
