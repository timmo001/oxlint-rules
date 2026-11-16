import { RuleTester } from "oxlint/plugins-dev";

import { noManualTaggedTypeRule } from "./no-manual-tagged-type.ts";

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

const manualTaggedType = { messageId: "manualTaggedType" };

tester.run("timmo-effect/no-manual-tagged-type", noManualTaggedTypeRule, {
  valid: [
    {
      filename: "value.ts",
      code: 'const Ready = Schema.TaggedStruct("Ready", { value: Schema.String });\ntype Ready = typeof Ready.Type;',
    },
    {
      filename: "value.ts",
      code: "type Event = Data.TaggedEnum<{ Ready: { readonly value: string } }>;",
    },
    {
      filename: "value.ts",
      code: "type Value = { readonly tag: string };",
    },
    {
      filename: "value.ts",
      code: 'type ValueTag = Value["_tag"];',
    },
    // Reading the tag off an existing value is not declaring one.
    {
      filename: "value.ts",
      code: "interface Authored { readonly _tag: string; readonly actor: string }",
    },
    {
      filename: "value.ts",
      code: "const tagOf = <A extends { readonly _tag: string }>(value: A) => value;",
    },
    {
      filename: "value.ts",
      code: "const handle = (event: { readonly _tag: string }) => event;",
    },
    {
      filename: "value.ts",
      code: 'const handle = (event: { readonly _tag: Value["_tag"] }) => event;',
    },
    // Picking a member of an existing union is not declaring a tag.
    {
      filename: "value.ts",
      code: 'type Failure = Extract<Event, { readonly _tag: "UnitFailure" }>;',
    },
    {
      filename: "value.ts",
      code: 'type Rest = Exclude<Event, { readonly _tag: "UnitFailure" | "Crash" }>;',
    },
    // Test doubles are left alone.
    {
      filename: "value.test.ts",
      code: 'type Value = { readonly _tag: "Ready"; readonly payload: string };',
    },
  ],
  invalid: [
    {
      filename: "value.ts",
      code: 'type Value = { readonly _tag: "Ready"; readonly payload: string };',
      errors: [manualTaggedType],
    },
    {
      filename: "value.ts",
      code: 'type Value = { readonly _tag: "Ready" } | { readonly _tag: "Done" };',
      errors: [manualTaggedType, manualTaggedType],
    },
    {
      filename: "value.ts",
      code: 'interface Value { readonly "_tag": "Ready"; }',
      errors: [manualTaggedType],
    },
    {
      filename: "value.ts",
      code: 'interface Value { readonly _tag: "Ready" | "Done"; }',
      errors: [manualTaggedType],
    },
  ],
});
