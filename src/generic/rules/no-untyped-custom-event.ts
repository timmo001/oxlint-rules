import { defineRule } from "@oxlint/plugins";

/** Require a detail type wherever `CustomEvent` is used as a type. */
export const noUntypedCustomEventRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `CustomEvent` type references without a detail type, which leave `detail` as `any`.",
    },
    messages: {
      typeCustomEventDetail:
        "`CustomEvent` without a type argument leaves `detail` as `any`. Reuse the project's typed event helper if one fits, or add one, instead of a bare `CustomEvent`.",
    },
  },
  create(context) {
    return {
      TSTypeReference(node) {
        if (
          node.typeName.type !== "Identifier" ||
          node.typeName.name !== "CustomEvent" ||
          node.typeArguments
        ) {
          return;
        }

        context.report({ node, messageId: "typeCustomEventDetail" });
      },
    };
  },
});
