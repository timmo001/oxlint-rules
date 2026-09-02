import { describe, expect, test } from "bun:test";

import { enablePluginRules } from "./enable-plugin-rules.ts";

describe("enablePluginRules", () => {
  test("enables every registered rule", () => {
    expect(
      enablePluginRules("example", {
        rules: { "second-rule": {}, "first-rule": {} },
      }),
    ).toEqual({
      "example/first-rule": "error",
      "example/second-rule": "error",
    });
  });
});
