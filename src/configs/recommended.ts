import { defineConfig } from "oxlint";

import antiSlopPlugin from "../upstream/anti-slop.ts";
import { enablePluginRules } from "./enable-plugin-rules.ts";

const recommended = defineConfig({
  jsPlugins: [
    {
      name: "anti-slop",
      specifier: "@timmo001/oxlint-rules/upstream/anti-slop",
    },
  ],
  rules: enablePluginRules("anti-slop", antiSlopPlugin),
});

export default recommended;
