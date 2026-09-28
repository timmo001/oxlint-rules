import { RuleTester } from "oxlint/plugins-dev";

import { preferTypesOverAssertionsRule } from "./prefer-types-over-assertions.ts";

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run(
  "timmo/prefer-types-over-assertions",
  preferTypesOverAssertionsRule,
  {
    valid: [
      `const value: string = "value";`,
      `const value = { name: "value" } satisfies { name: string };`,
      `const value = { name: "value" } as const;`,
      `function isString(value: unknown): value is string {
      return typeof value === "string";
    }`,
    ],
    invalid: [
      {
        code: `const value = input as string;`,
        errors: [{ messageId: "avoidAssertion" }],
        output: null,
      },
      {
        code: `const value = <string>input;`,
        errors: [{ messageId: "avoidAssertion" }],
        output: null,
      },
      {
        code: `// SAFETY: The caller checked this value.
const value = input as string;`,
        errors: [{ messageId: "avoidAssertion" }],
        output: null,
      },
    ],
  },
);
