import type { ESTree } from "@oxlint/plugins";

export type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

export type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

export function isFunction(
  node: ESTree.Node | null | undefined,
): node is FunctionNode {
  return (
    node?.type === "ArrowFunctionExpression" ||
    node?.type === "FunctionExpression" ||
    node?.type === "FunctionDeclaration"
  );
}

/** Whether the file is a `*.test.*` or `*.spec.*` file. */
export function isTestFile(filename: string): boolean {
  return /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(filename);
}

export function nearestEnclosingFunction(
  node: ESTree.Node,
): FunctionNode | null {
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

export function staticMemberName(node: ESTree.Node): string | null {
  if (node.type !== "MemberExpression" || node.computed) return null;

  return node.property.type === "Identifier" ? node.property.name : null;
}
