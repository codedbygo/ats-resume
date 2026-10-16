import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env.server";

describe("parseServerEnv", () => {
  it("applies defaults with no AI key", () => {
    const env = parseServerEnv({});

    expect(env.OPENROUTER_API_KEY).toBeUndefined();
    expect(env.OPENROUTER_MODELS.length).toBeGreaterThan(0);
    expect(env.NODE_ENV).toBe("development");
    expect(env.SERVICE_VERSION).toBe("dev");
  });

  it("treats an empty string as unset and splits the model list", () => {
    const env = parseServerEnv({ OPENROUTER_API_KEY: "", OPENROUTER_MODELS: "a:free, b:free" });

    expect(env.OPENROUTER_API_KEY).toBeUndefined();
    expect(env.OPENROUTER_MODELS).toEqual(["a:free", "b:free"]);
  });

  it("names an invalid variable", () => {
    expect(() => parseServerEnv({ NODE_ENV: "staging" })).toThrow("NODE_ENV");
  });
});
