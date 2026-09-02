import { eslintCompatPlugin } from "@oxlint/plugins";

import { noTryCatchInEffectGeneratorsRule } from "./rules/no-try-catch-in-effect-generators.ts";

const timmoEffectPlugin = eslintCompatPlugin({
  meta: { name: "timmo-effect" },
  rules: {
    "no-try-catch-in-effect-generators": noTryCatchInEffectGeneratorsRule,
  },
});

export default timmoEffectPlugin;
