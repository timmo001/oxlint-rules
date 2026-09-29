import { defineConfig } from "oxlint";

import antiSlopPlugin from "../upstream/anti-slop.ts";
import timmoPlugin from "../generic/index.ts";
import { enablePluginRules } from "./enable-plugin-rules.ts";

const recommended = defineConfig({
  jsPlugins: [
    {
      name: "anti-slop",
      specifier: "@timmo001/oxlint-rules/upstream/anti-slop",
    },
    { name: "timmo", specifier: "@timmo001/oxlint-rules/generic" },
  ],
  rules: {
    ...enablePluginRules("anti-slop", antiSlopPlugin),
    ...enablePluginRules("timmo", timmoPlugin),
    "anti-slop/require-safety-comment-for-type-assertion": "off",
    "typescript/no-non-null-assertion": "error",
    "typescript/no-unnecessary-type-arguments": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/no-unnecessary-type-parameters": "error",
  },
});

export default recommended;
