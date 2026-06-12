import { describe, expect, test } from "bun:test";
import { createDefaultTddBlocks } from "@/lib/onboarding/tdd-types";
import { extractGoogleDocId } from "./google-docs";

describe("extractGoogleDocId", () => {
  test("parses standard Google Docs edit URLs", () => {
    expect(
      extractGoogleDocId("https://docs.google.com/document/d/abc123XYZ-_/edit"),
    ).toBe("abc123XYZ-_");
  });

  test("returns null for invalid URLs", () => {
    expect(extractGoogleDocId("https://example.com")).toBeNull();
  });
});

describe("TDD layout export coverage", () => {
  test("default blocks include all documentation sections", () => {
    const blocks = createDefaultTddBlocks({
      project_overview: "# Overview\n\n**Bold** intro",
      core_features: "- Feature A\n- Feature B",
      database_schema: "| Table | Column |\n| --- | --- |\n| users | id |",
      tdd_specs: "## Tests\n\n`expect(true).toBe(true)`",
    });

    expect(blocks).toHaveLength(4);
    expect(blocks.map((block) => block.type)).toEqual([
      "project_overview",
      "core_features",
      "database_schema",
      "tdd_specs",
    ]);
    expect(blocks.every((block) => block.content.length > 0)).toBe(true);
  });
});
