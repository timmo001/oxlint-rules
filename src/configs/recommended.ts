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
  },
});

export default recommended;
