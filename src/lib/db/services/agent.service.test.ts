import { describe, expect, it } from "vitest";
import { slugify } from "./agent.service";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Market Research")).toBe("market-research");
  });

  it("trims surrounding punctuation and whitespace", () => {
    expect(slugify("  Hello, World!  ")).toBe("hello-world");
  });

  it("collapses runs of non-alphanumerics into a single hyphen", () => {
    expect(slugify("a   ---   b")).toBe("a-b");
  });

  it("returns empty string for input with no alphanumerics", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("caps length at 60 characters", () => {
    expect(slugify("x".repeat(80)).length).toBe(60);
  });
});
