import { eslintCompatPlugin } from "@oxlint/plugins";

import { noExplicitInferableTypePredicateRule } from "./rules/no-explicit-inferable-type-predicate.ts";
import { noUntypedCustomEventRule } from "./rules/no-untyped-custom-event.ts";
import { preferEventParameterTypeRule } from "./rules/prefer-event-parameter-type.ts";
import { preferTypesOverAssertionsRule } from "./rules/prefer-types-over-assertions.ts";

const timmoPlugin = eslintCompatPlugin({
  meta: { name: "timmo" },
  rules: {
    "no-explicit-inferable-type-predicate":
      noExplicitInferableTypePredicateRule,
    "no-untyped-custom-event": noUntypedCustomEventRule,
    "prefer-event-parameter-type": preferEventParameterTypeRule,
    "prefer-types-over-assertions": preferTypesOverAssertionsRule,
  },
});

export default timmoPlugin;
