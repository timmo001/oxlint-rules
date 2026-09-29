import { RuleTester } from "oxlint/plugins-dev";

import { preferLitQueryDecoratorsRule } from "./prefer-lit-query-decorators.ts";

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run("timmo/prefer-lit-query-decorators", preferLitQueryDecoratorsRule, {
  valid: [
    `class Plain { get input() { return this.shadowRoot.querySelector("input"); } }`,
    `
      class Card extends LitElement {
        focusRow(index: number) {
          return this.renderRoot.querySelector(\`[data-index="\${index}"]\`);
        }
      }
    `,
    `
      class Card extends LitElement {
        get items() { return this.querySelector("li"); }
      }
    `,
    `
      class Card extends LitElement {
        method() {
          return class Inner { get input() { return this.shadowRoot.querySelector("input"); } };
        }
      }
    `,
    `
      class Card extends LitElement {
        method() {
          return function () { return this.renderRoot.querySelector("input"); };
        }
      }
    `,
    {
      code: `class Card extends LitElement { get input() { return this.renderRoot.querySelector("input"); } }`,
      options: [{ querySelector: false }],
    },
    `class Card extends BaseCard { get input() { return this.renderRoot.querySelector("input"); } }`,
  ],
  invalid: [
    {
      code: `class Card extends LitElement { get input() { return this.renderRoot.querySelector("input"); } }`,
      errors: [{ messageId: "preferQuery" }],
      output: null,
    },
    {
      code: `
        @customElement("my-card")
        class Card extends Base {
          get input() { return this.shadowRoot!.querySelector<HTMLInputElement>("input"); }
        }
      `,
      errors: [{ messageId: "preferQuery" }],
      output: null,
    },
    {
      code: `
        class Card extends SubscribeMixin(LitElement) {
          close = () => this.shadowRoot?.querySelectorAll(\`.row\`);
        }
      `,
      errors: [{ messageId: "preferQueryAll" }],
      output: null,
    },
    {
      code: `
        class Card extends LitElement {
          get slotted() {
            return (this.shadowRoot!.querySelector("slot") as HTMLSlotElement).assignedElements();
          }
        }
      `,
      errors: [{ messageId: "preferQueryAssignedElements" }],
      output: null,
    },
    {
      code: `
        class Card extends LitElement {
          get slotted() { return this.renderRoot.querySelector("slot")?.assignedNodes(); }
        }
      `,
      errors: [{ messageId: "preferQueryAssignedNodes" }],
      output: null,
    },
    {
      code: `class Card extends BaseCard { get input() { return this.renderRoot.querySelector("input"); } }`,
      settings: { lit: { elementBaseClasses: ["BaseCard"] } },
      errors: [{ messageId: "preferQuery" }],
      output: null,
    },
  ],
});
