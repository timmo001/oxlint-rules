import { defineRule } from "@oxlint/plugins";

import { staticMemberName } from "../../shared/ast.ts";
import {
  isLitRenderRootQuery,
  litElementBaseClasses,
} from "../../shared/lit.ts";

const queryMethods = new Set(["closest", "querySelector", "querySelectorAll"]);

/** Disallow type arguments that silently cast DOM query results. */
export const noUncheckedQuerySelectorTypeRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow type arguments on `querySelector`, `querySelectorAll`, and `closest`, which cast the result without checking it.",
    },
    messages: {
      checkQueryResult:
        "`{{method}}<T>` casts the result without checking it. Check it with `instanceof`, use a checked lookup helper, or query a tag name so TypeScript infers the element type.",
    },
  },
  create(context) {
    const bases = litElementBaseClasses(context.settings);

    return {
      CallExpression(node) {
        const method = staticMemberName(node.callee);

        if (
          !node.typeArguments ||
          !method ||
          !queryMethods.has(method) ||
          isLitRenderRootQuery(node, bases)
        ) {
          return;
        }

        context.report({
          node: node.typeArguments,
          messageId: "checkQueryResult",
          data: { method },
        });
      },
    };
  },
});
