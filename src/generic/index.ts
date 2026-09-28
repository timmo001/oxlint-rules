import { eslintCompatPlugin } from "@oxlint/plugins";

import { preferEventParameterTypeRule } from "./rules/prefer-event-parameter-type.ts";
import { preferTypesOverAssertionsRule } from "./rules/prefer-types-over-assertions.ts";

const timmoPlugin = eslintCompatPlugin({
  meta: { name: "timmo" },
  rules: {
    "prefer-event-parameter-type": preferEventParameterTypeRule,
    "prefer-types-over-assertions": preferTypesOverAssertionsRule,
  },
});

export default timmoPlugin;
