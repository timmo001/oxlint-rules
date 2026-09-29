import { RuleTester } from "oxlint/plugins-dev";

import { noExplicitInferableTypePredicateRule } from "./no-explicit-inferable-type-predicate.ts";

const error = { messageId: "removeTypePredicate" };

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run(
  "timmo/no-explicit-inferable-type-predicate",
  noExplicitInferableTypePredicateRule,
  {
    valid: [
      `const present = values.filter((value) => value !== null);`,
      `const present = values.filter((value): value is string => Boolean(value));`,
      `const items = values.filter((value): value is Item => "id" in value);`,
      `export function isString(value: unknown): value is string { return typeof value === "string"; }`,
      `export const isDefined = <T,>(value: T | null): value is T => value !== null;`,
      `class Guard { isFoo(value: unknown): value is Foo { return value instanceof Foo; } }`,
      `function assertString(value: unknown): asserts value is string { if (typeof value !== "string") throw new Error(); }`,
      `
        function isReady(value: Item | null): value is Item {
          log(value);
          return value !== null;
        }
      `,
    ],
    invalid: [
      {
        code: `const present = values.filter((value): value is string => value !== null);`,
        errors: [error],
        output: null,
      },
      {
        code: `const present = values.filter((value): value is Item => value != null);`,
        errors: [error],
        output: null,
      },
      {
        code: `const present = values.filter((value): value is Item => null !== value && value !== undefined);`,
        errors: [error],
        output: null,
      },
      {
        code: `function isString(value: unknown): value is string { return typeof value === "string"; }`,
        errors: [error],
        output: null,
      },
      {
        code: `const foos = values.filter(function (value): value is Foo { return value instanceof Foo; });`,
        errors: [error],
        output: null,
      },
    ],
  },
);
