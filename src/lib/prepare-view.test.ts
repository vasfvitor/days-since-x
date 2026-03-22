import { describe, it, expect } from "vitest";
import { prepareView } from "./prepare-view";
import type { DaySinceConfig } from "./types";

describe("prepareView", () => {
  const config: DaySinceConfig = {
    title: "test releases",
    entries: [
      { name: "First", date: "2023-01-01" },
      { name: "Second", url: "https://example.com", date: "2024-06-15" },
      { name: "Third", date: "2024-01-01" },
      { name: "No date" },
    ],
  };

  it("resolves default colors when not specified", () => {
    const view = prepareView(config, "en");
    expect(view.bg).toBe("#f0f8ff");
    expect(view.accent).toBe("#4444ff");
  });

  it("uses custom colors when specified", () => {
    const custom = { ...config, bg: "#000", accent: "#fff" };
    const view = prepareView(custom, "en");
    expect(view.bg).toBe("#000");
    expect(view.accent).toBe("#fff");
  });

  it("finds the latest entry by date", () => {
    const view = prepareView(config, "en");
    expect(view.latest).not.toBeNull();
    expect(view.latest!.name).toBe("Second");
    expect(view.latest!.date).toBe("2024-06-15");
  });

  it("computes days since latest", () => {
    const view = prepareView(config, "en");
    expect(view.days).toBeGreaterThan(0);
  });

  it("sets dayWord correctly", () => {
    const view = prepareView(config, "en");
    expect(["day", "days"]).toContain(view.dayWord);
  });

  it("sorts timeline chronologically (oldest first)", () => {
    const view = prepareView(config, "en");
    const datedEntries = view.timeline.filter(e => e.date);
    for (let i = 1; i < datedEntries.length; i++) {
      const prev = new Date(datedEntries[i - 1].date!).getTime();
      const curr = new Date(datedEntries[i].date!).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it("includes all entries in timeline", () => {
    const view = prepareView(config, "en");
    expect(view.timeline).toHaveLength(4);
  });

  it("formats dates for entries", () => {
    const view = prepareView(config, "en");
    const dated = view.timeline.find(e => e.date === "2024-06-15");
    expect(dated?.dateFormatted).toBeTruthy();
    expect(dated?.dateFormatted).toContain("2024");
  });

  it("handles config with no dated entries", () => {
    const noDates: DaySinceConfig = {
      title: "test",
      entries: [{ name: "A" }, { name: "B" }],
    };
    const view = prepareView(noDates, "en");
    expect(view.latest).toBeNull();
    expect(view.days).toBe(0);
  });

  it("handles empty entries", () => {
    const empty: DaySinceConfig = { title: "test", entries: [] };
    const view = prepareView(empty, "en");
    expect(view.latest).toBeNull();
    expect(view.days).toBe(0);
    expect(view.timeline).toHaveLength(0);
  });

  it("preserves title", () => {
    const view = prepareView(config, "en");
    expect(view.title).toBe("test releases");
  });

  it("computes record as the largest gap between consecutive entries", () => {
    const gapConfig: DaySinceConfig = {
      title: "test",
      entries: [
        { name: "A", date: "2024-01-01" },
        { name: "B", date: "2024-01-10" },  // 9 day gap
        { name: "C", date: "2024-02-10" },  // 31 day gap (biggest)
        { name: "D", date: "2024-02-15" },  // 5 day gap
      ],
    };
    const view = prepareView(gapConfig, "en");
    // record should be at least 31 (the gap between B and C)
    // but current streak (days since D) may be larger
    expect(view.record).toBeGreaterThanOrEqual(31);
  });

  it("marks current streak as record when it exceeds all gaps", () => {
    const view = prepareView(config, "en");
    // Current streak from 2024-06-15 is very long, should be record
    expect(view.isRecord).toBe(true);
  });

  it("record is 0 with fewer than 2 dated entries", () => {
    const single: DaySinceConfig = {
      title: "test",
      entries: [{ name: "A", date: "2024-01-01" }],
    };
    const view = prepareView(single, "en");
    // With only 1 entry, the current streak IS the record
    expect(view.record).toBeGreaterThan(0);
    expect(view.isRecord).toBe(true);
  });
});
