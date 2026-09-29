import { staticMemberName } from "./ast.ts";
import { jsonObject } from "./json.ts";

import type { ESTree, Settings } from "@oxlint/plugins";

type AssignedMethod = "assignedElements" | "assignedNodes";

type QueryMethod = "querySelector" | "querySelectorAll";

export type LitQueryMethod = AssignedMethod | QueryMethod;

type WrapperExpression =
  | ESTree.ChainExpression
  | ESTree.ParenthesizedExpression
  | ESTree.TSAsExpression
  | ESTree.TSNonNullExpression
  | ESTree.TSSatisfiesExpression
  | ESTree.TSTypeAssertion;

const renderRoots = new Set(["renderRoot", "shadowRoot"]);

/** Read `settings.lit.elementBaseClasses`, as eslint-plugin-lit does. */
export function litElementBaseClasses(
  settings: Readonly<Settings>,
): ReadonlySet<string> {
  const configured = jsonObject(settings.lit)?.elementBaseClasses;

  return new Set([
    "LitElement",
    ...(Array.isArray(configured) ? configured.map(String) : []),
  ]);
}

function isWrapperExpression(
  node: ESTree.Node | null,
): node is WrapperExpression {
  return (
    node?.type === "ChainExpression" ||
    node?.type === "ParenthesizedExpression" ||
    node?.type === "TSAsExpression" ||
    node?.type === "TSNonNullExpression" ||
    node?.type === "TSSatisfiesExpression" ||
    node?.type === "TSTypeAssertion"
  );
}

function unwrapExpression(node: ESTree.Node): ESTree.Node {
  let current = node;

  while (isWrapperExpression(current)) current = current.expression;

  return current;
}

function extendsLitBase(
  node: ESTree.Node,
  bases: ReadonlySet<string>,
): boolean {
  if (node.type === "Identifier") return bases.has(node.name);

  return (
    node.type === "CallExpression" &&
    node.arguments.some((argument) => extendsLitBase(argument, bases))
  );
}

function isLitClass(node: ESTree.Class, bases: ReadonlySet<string>): boolean {
  const hasCustomElementDecorator = node.decorators.some(
    (decorator) =>
      decorator.expression.type === "CallExpression" &&
      decorator.expression.callee.type === "Identifier" &&
      decorator.expression.callee.name === "customElement",
  );

  return (
    hasCustomElementDecorator ||
    (node.superClass !== null && extendsLitBase(node.superClass, bases))
  );
}

function classOfBody(body: ESTree.Node): ESTree.Class | null {
  const owner = body.parent;

  return owner?.type === "ClassDeclaration" || owner?.type === "ClassExpression"
    ? owner
    : null;
}

/** The class whose instance `this` refers to at `node`, if any. */
function thisClass(node: ESTree.Node): ESTree.Class | null {
  let current = node;

  while (current.parent) {
    const parent: ESTree.Node = current.parent;

    if (
      parent.type === "FunctionDeclaration" ||
      parent.type === "FunctionExpression"
    ) {
      const owner = parent.parent;

      return (owner?.type === "MethodDefinition" ||
        owner?.type === "TSAbstractMethodDefinition") &&
        !owner.static &&
        owner.value === parent
        ? classOfBody(owner.parent)
        : null;
    }

    if (
      (parent.type === "PropertyDefinition" ||
        parent.type === "AccessorProperty") &&
      parent.value === current
    ) {
      return parent.static ? null : classOfBody(parent.parent);
    }

    if (
      parent.type === "StaticBlock" ||
      parent.type === "ClassBody" ||
      parent.type === "Program"
    ) {
      return null;
    }

    current = parent;
  }

  return null;
}

function isStaticSelector(node: ESTree.Node | undefined): boolean {
  return (
    node?.type === "Literal" ||
    (node?.type === "TemplateLiteral" && node.expressions.length === 0)
  );
}

function renderRootQuery(
  node: ESTree.CallExpression,
  bases: ReadonlySet<string>,
): { readonly method: QueryMethod; readonly root: string } | null {
  const method = staticMemberName(node.callee);

  if (
    (method !== "querySelector" && method !== "querySelectorAll") ||
    node.callee.type !== "MemberExpression" ||
    !isStaticSelector(node.arguments[0])
  ) {
    return null;
  }

  const receiver = unwrapExpression(node.callee.object);
  const root = staticMemberName(receiver);

  if (
    !root ||
    !renderRoots.has(root) ||
    receiver.type !== "MemberExpression" ||
    receiver.object.type !== "ThisExpression"
  ) {
    return null;
  }

  const owner = thisClass(receiver.object);

  return owner && isLitClass(owner, bases) ? { method, root } : null;
}

function isAssignedMethod(name: string | null): name is AssignedMethod {
  return name === "assignedElements" || name === "assignedNodes";
}

function feedsAssignedCall(node: ESTree.CallExpression): boolean {
  let current: ESTree.Node = node;

  while (isWrapperExpression(current.parent)) current = current.parent;

  const member = current.parent;

  return (
    member?.type === "MemberExpression" &&
    member.object === current &&
    isAssignedMethod(staticMemberName(member))
  );
}

/**
 * Match a static render-root query in a Lit class that a query decorator can
 * replace, following eslint-plugin-lit's `prefer-query-decorators`.
 */
export function litQueryDecoratorCall(
  node: ESTree.CallExpression,
  bases: ReadonlySet<string>,
): { readonly method: LitQueryMethod; readonly root: string } | null {
  const method = staticMemberName(node.callee);

  if (!isAssignedMethod(method)) {
    return feedsAssignedCall(node) ? null : renderRootQuery(node, bases);
  }

  if (node.callee.type !== "MemberExpression") return null;
  const inner = unwrapExpression(node.callee.object);

  if (inner.type !== "CallExpression") return null;
  const query = renderRootQuery(inner, bases);

  return query?.method === "querySelector"
    ? { method, root: query.root }
    : null;
}

/** Whether a call is a static render-root query in a Lit class. */
export function isLitRenderRootQuery(
  node: ESTree.CallExpression,
  bases: ReadonlySet<string>,
): boolean {
  return renderRootQuery(node, bases) !== null;
}
