import { defineConfig } from "oxlint";

import recommended from "./recommended.ts";

const effect = defineConfig({
  extends: [recommended],
  jsPlugins: [
    {
      name: "anti-slop-effect",
      specifier: "@timmo001/oxlint-rules/upstream/effect",
    },
    { name: "timmo-effect", specifier: "@timmo001/oxlint-rules/effect" },
  ],
  rules: {
    "anti-slop-effect/no-service-constructor-imports": "error",
    "timmo-effect/no-try-catch-in-effect-generators": "error",
  },
});

export default effect;
