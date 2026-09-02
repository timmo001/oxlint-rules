import { defineConfig } from "oxlint";

import timmoEffectPlugin from "../effect/index.ts";
import antiSlopEffectPlugin from "../upstream/effect.ts";
import { enablePluginRules } from "./enable-plugin-rules.ts";
import recommended from "./recommended.ts";

const recommendedEffect = defineConfig({
  extends: [recommended],
  jsPlugins: [
    {
      name: "anti-slop-effect",
      specifier: "@timmo001/oxlint-rules/upstream/effect",
    },
    { name: "timmo-effect", specifier: "@timmo001/oxlint-rules/effect" },
  ],
  rules: {
    ...enablePluginRules("anti-slop-effect", antiSlopEffectPlugin),
    ...enablePluginRules("timmo-effect", timmoEffectPlugin),
  },
});

export default recommendedEffect;
