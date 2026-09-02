import { RuleTester } from "oxlint/plugins-dev";

import { noTryCatchInEffectGeneratorsRule } from "./no-try-catch-in-effect-generators.ts";

const error = { messageId: "useEffectErrorChannel" };
const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run(
  "timmo-effect/no-try-catch-in-effect-generators",
  noTryCatchInEffectGeneratorsRule,
  {
    valid: [
      `
        import { Effect, Schema } from "effect";
        Effect.gen(function* () {
          const value = yield* Effect.try(() => JSON.parse(raw));
          return yield* Schema.decodeUnknownEffect(RepositoryPicker)(value);
        }).pipe(Effect.orElseSucceed(() => fallback));
      `,
      `async function poll() { try { await check(); } catch { await wait(); } }`,
      `
        import { Effect } from "effect";
        Effect.gen(function* () {
          thirdParty(() => { try { read(); } catch { recover(); } });
        });
      `,
      `function* task() { try { read(); } catch { recover(); } }`,
      `
        import { Effect } from "effect";
        Effect.gen(function* () { try { yield* work; } finally { cleanup(); } });
      `,
      `
        import { Effect as Fx, Schema } from "effect";
        Fx.gen(function* () {
          return yield* Schema.decodeUnknownEffect(Value)(input).pipe(Fx.orElseFail);
        });
      `,
      `
        import * as EffectNamespace from "effect";
        EffectNamespace.Effect.gen(function* () { yield* work; });
      `,
      `
        import { Effect } from "effect";
        function* task() { try { read(); } catch { recover(); } }
        Effect.gen(task);
      `,
      `
        import { Effect } from "effect";
        function run(Effect: { gen: (value: unknown) => unknown }) {
          return Effect.gen(function* () { try { read(); } catch { recover(); } });
        }
      `,
    ],
    invalid: [
      {
        code: `
          import { Effect } from "effect";
          Effect.gen(function* () {
            try { return JSON.parse(raw); } catch { return fallback; }
          });
        `,
        errors: [error],
        output: null,
      },
      {
        code: `
          import { Effect as Fx } from "effect";
          Fx.gen(function* () { try { read(); } catch { recover(); } });
        `,
        errors: [error],
        output: null,
      },
      {
        code: `
          import * as EffectNamespace from "effect";
          EffectNamespace.Effect.gen(function* () {
            try { read(); } catch { recover(); }
          });
        `,
        errors: [error],
        output: null,
      },
      {
        code: `
          import { Effect } from "effect";
          Effect.fn("load")(function* () { try { read(); } catch { recover(); } });
        `,
        errors: [error],
        output: null,
      },
      {
        code: `
          import { Effect } from "effect";
          Effect.gen(function* () {
            while (ready()) { try { read(); } catch { recover(); } }
          });
        `,
        errors: [error],
        output: null,
      },
    ],
  },
);
