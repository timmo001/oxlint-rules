import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;
type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

function nearestEnclosingFunction(node: ESTree.Node): FunctionNode | null {
  let current: ESTree.Node | null = node.parent;
  while (current) {
    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function assertedEventParameter(node: TypeAssertion): {
  readonly parameter: string;
  readonly property: "currentTarget" | "target";
} | null {
  const expression = node.expression;
  if (
    expression.type !== "MemberExpression" ||
    expression.computed ||
    expression.object.type !== "Identifier" ||
    expression.property.type !== "Identifier" ||
    (expression.property.name !== "currentTarget" &&
      expression.property.name !== "target")
  ) {
    return null;
  }
  const parameterName = expression.object.name;
  const property = expression.property.name;
  const owner = nearestEnclosingFunction(node);
  if (
    !owner?.params.some(
      (parameter) =>
        parameter.type === "Identifier" && parameter.name === parameterName,
    )
  ) {
    return null;
  }
  return {
    parameter: parameterName,
    property,
  };
}

/** Prefer expressing an event target type in its handler parameter signature. */
export const preferEventParameterTypeRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer typing event target properties in the handler parameter instead of asserting them at use sites.",
    },
    messages: {
      typeEventParameter:
        "Type `{{parameter}}.{{property}}` in the function signature instead of asserting it at the use site.",
    },
  },
  create(context) {
    const checkAssertion = (node: TypeAssertion) => {
      const eventParameter = assertedEventParameter(node);
      if (!eventParameter) return;
      context.report({
        node,
        messageId: "typeEventParameter",
        data: eventParameter,
      });
    };
    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
