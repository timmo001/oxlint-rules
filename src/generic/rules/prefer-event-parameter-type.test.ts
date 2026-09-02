import { RuleTester } from "oxlint/plugins-dev";

import { preferEventParameterTypeRule } from "./prefer-event-parameter-type.ts";

const error = { messageId: "typeEventParameter" };
const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run("timmo/prefer-event-parameter-type", preferEventParameterTypeRule, {
  valid: [
    `
        type CurrentTargetEvent<T extends EventTarget> = Event & { currentTarget: T };
        function handle(ev: CurrentTargetEvent<HTMLInputElement>) {
          return ev.currentTarget.value;
        }
      `,
    `function convert(value: unknown) { return (value as string).length; }`,
    `function handle(ev: Event) { return (source.currentTarget as HTMLElement).id; }`,
    `
        function handle(ev: Event) {
          const callback = (value: unknown) => (ev.currentTarget as HTMLElement).id;
          return callback;
        }
      `,
  ],
  invalid: [
    {
      code: `
          function handle(ev: MouseEvent) {
            return (ev.currentTarget as HTMLInputElement).value;
          }
        `,
      errors: [error],
      output: null,
    },
    {
      code: `
          const handle = (event: Event) =>
            (<HTMLElement>event.target).dataset.id;
        `,
      errors: [error],
      output: null,
    },
  ],
});
