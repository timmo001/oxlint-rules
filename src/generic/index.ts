import { eslintCompatPlugin } from "@oxlint/plugins";

import { preferEventParameterTypeRule } from "./rules/prefer-event-parameter-type.ts";

const timmoPlugin = eslintCompatPlugin({
  meta: { name: "timmo" },
  rules: {
    "prefer-event-parameter-type": preferEventParameterTypeRule,
  },
});

export default timmoPlugin;
