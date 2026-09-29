import { RuleTester } from "oxlint/plugins-dev";

import { noUntypedCustomEventRule } from "./no-untyped-custom-event.ts";

const error = { messageId: "typeCustomEventDetail" };

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run("timmo/no-untyped-custom-event", noUntypedCustomEventRule, {
  valid: [
    `function handle(ev: CustomEvent<{ value: string }>) { return ev.detail.value; }`,
    `type ValueEvent<T> = CustomEvent<{ value: T }>;`,
    `const event = new CustomEvent("change", { detail: 1 });`,
    `function isCustom(ev: Event) { return ev instanceof CustomEvent; }`,
  ],
  invalid: [
    {
      code: `function handle(ev: CustomEvent) { return ev.detail; }`,
      errors: [error],
      output: null,
    },
    {
      code: `
          declare global {
            interface HTMLElementEventMap { "value-changed": CustomEvent; }
          }
        `,
      errors: [error],
      output: null,
    },
  ],
});
