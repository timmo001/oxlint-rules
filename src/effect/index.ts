import { eslintCompatPlugin } from "@oxlint/plugins";

import { noManualTaggedTypeRule } from "./rules/no-manual-tagged-type.ts";
import { noOrDieInServiceConstructionRule } from "./rules/no-ordie-in-service-construction.ts";
import { noRawGhRule } from "./rules/no-raw-gh.ts";
import { noTryCatchInEffectGeneratorsRule } from "./rules/no-try-catch-in-effect-generators.ts";
import { preferPlatformServicesRule } from "./rules/prefer-platform-services.ts";
import { preferTaggedErrorHandlingRule } from "./rules/prefer-tagged-error-handling.ts";
import { requireCauseWhenNarrowingRule } from "./rules/require-cause-when-narrowing.ts";

const timmoEffectPlugin = eslintCompatPlugin({
  meta: { name: "timmo-effect" },
  rules: {
    "no-manual-tagged-type": noManualTaggedTypeRule,
    "no-ordie-in-service-construction": noOrDieInServiceConstructionRule,
    "no-raw-gh": noRawGhRule,
    "no-try-catch-in-effect-generators": noTryCatchInEffectGeneratorsRule,
    "prefer-platform-services": preferPlatformServicesRule,
    "prefer-tagged-error-handling": preferTaggedErrorHandlingRule,
    "require-cause-when-narrowing": requireCauseWhenNarrowingRule,
  },
});

export default timmoEffectPlugin;
