import { RuleTester } from "oxlint/plugins-dev";

import { noUncheckedQuerySelectorTypeRule } from "./no-unchecked-query-selector-type.ts";

const error = { messageId: "checkQueryResult" };

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run(
  "timmo/no-unchecked-query-selector-type",
  noUncheckedQuerySelectorTypeRule,
  {
    valid: [
      `const input = document.querySelector("input");`,
      `
        const element = document.querySelector("#name");
        if (element instanceof HTMLInputElement) element.focus();
      `,
      `const value = read<string>("key");`,
      `class Card extends LitElement { get input() { return this.renderRoot.querySelector<HTMLInputElement>("#name"); } }`,
    ],
    invalid: [
      {
        code: `const input = document.querySelector<HTMLInputElement>("#name");`,
        errors: [error],
        output: null,
      },
      {
        code: `const rows = root.querySelectorAll<HTMLTableRowElement>(".row");`,
        errors: [error],
        output: null,
      },
      {
        code: `const card = target.closest<HTMLElement>(".card");`,
        errors: [error],
        output: null,
      },
      {
        code: `
          class Card extends LitElement {
            focusRow(index: number) {
              return this.renderRoot.querySelector<HTMLElement>(\`[data-index="\${index}"]\`);
            }
          }
        `,
        errors: [error],
        output: null,
      },
    ],
  },
);
