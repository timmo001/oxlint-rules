import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

/** Prefer typing values at their source over asserting them at use sites. */
export const preferTypesOverAssertionsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Prefer typing a value at its source over a TypeScript type assertion.",
    },
    messages: {
      avoidAssertion:
        "Type this value at its source, such as a function parameter or DOM lookup, instead of asserting it here. A SAFETY comment is not a fix.",
    },
  },
  create(context) {
    const checkAssertion = (node: TypeAssertion) => {
      if (
        node.typeAnnotation.type === "TSTypeReference" &&
        node.typeAnnotation.typeName.type === "Identifier" &&
        node.typeAnnotation.typeName.name === "const"
      ) {
        return;
      }

      context.report({ node, messageId: "avoidAssertion" });
    };

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
