import { defineRule } from "@oxlint/plugins";

import type { FunctionNode } from "../../shared/ast.ts";
import type { ESTree } from "@oxlint/plugins";

function isNamed(node: ESTree.Node, name: string): boolean {
  return node.type === "Identifier" && node.name === name;
}

function isNullish(node: ESTree.Node): boolean {
  return (
    (node.type === "Literal" && node.value === null) ||
    isNamed(node, "undefined")
  );
}

function isNullishExclusion(node: ESTree.Node, name: string): boolean {
  return (
    node.type === "BinaryExpression" &&
    (node.operator === "!==" || node.operator === "!=") &&
    ((isNamed(node.left, name) && isNullish(node.right)) ||
      (isNullish(node.left) && isNamed(node.right, name)))
  );
}

function isTypeofCheck(node: ESTree.Node, name: string): boolean {
  if (
    node.type !== "BinaryExpression" ||
    (node.operator !== "===" && node.operator !== "==")
  ) {
    return false;
  }

  const isTypeof = (side: ESTree.Node) =>
    side.type === "UnaryExpression" &&
    side.operator === "typeof" &&
    isNamed(side.argument, name);

  const isLiteral = (side: ESTree.Node) => side.type === "Literal";

  return (
    (isTypeof(node.left) && isLiteral(node.right)) ||
    (isLiteral(node.left) && isTypeof(node.right))
  );
}

function isInferableCheck(node: ESTree.Node, name: string): boolean {
  if (node.type === "LogicalExpression") {
    return (
      node.operator === "&&" &&
      isNullishExclusion(node.left, name) &&
      isNullishExclusion(node.right, name)
    );
  }

  return (
    isNullishExclusion(node, name) ||
    isTypeofCheck(node, name) ||
    (node.type === "BinaryExpression" &&
      node.operator === "instanceof" &&
      isNamed(node.left, name))
  );
}

function returnedExpression(owner: FunctionNode): ESTree.Node | null {
  const body = owner.body;

  if (!body) return null;

  if (body.type !== "BlockStatement") return body;

  const [statement] = body.body;

  return body.body.length === 1 && statement?.type === "ReturnStatement"
    ? statement.argument
    : null;
}

function isPublicSignature(owner: FunctionNode): boolean {
  const parent = owner.parent;

  if (
    parent.type === "MethodDefinition" ||
    parent.type === "ExportNamedDeclaration" ||
    parent.type === "ExportDefaultDeclaration"
  ) {
    return true;
  }

  return (
    parent.type === "VariableDeclarator" &&
    parent.parent.parent?.type === "ExportNamedDeclaration"
  );
}

/** Flag explicit type predicates that TypeScript would infer from a simple check. */
export const noExplicitInferableTypePredicateRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow explicit type predicates on simple null, typeof, or instanceof checks that TypeScript 5.5+ infers.",
    },
    messages: {
      removeTypePredicate:
        "TypeScript infers the type predicate for `{{parameter}}` from this check, while an explicit predicate is never checked against the body. Remove the annotation and rely on the inferred predicate.",
    },
  },
  create(context) {
    const check = (owner: FunctionNode) => {
      const annotation = owner.returnType?.typeAnnotation;

      if (
        annotation?.type !== "TSTypePredicate" ||
        annotation.asserts ||
        annotation.parameterName.type !== "Identifier" ||
        isPublicSignature(owner)
      ) {
        return;
      }

      const parameter = annotation.parameterName.name;
      const expression = returnedExpression(owner);

      if (
        !owner.params.some((param) => isNamed(param, parameter)) ||
        !expression ||
        !isInferableCheck(expression, parameter)
      ) {
        return;
      }

      context.report({
        node: annotation,
        messageId: "removeTypePredicate",
        data: { parameter },
      });
    };

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
});
