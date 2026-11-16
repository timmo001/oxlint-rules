// Adapted from K-Mistele/anti-slop (MIT), a fork of dmmulroy/anti-slop.
import { defineRule } from "@oxlint/plugins";

import { nearestEnclosingFunction } from "../../shared/ast.ts";
import {
  collectEffectModuleNames,
  genFunction,
  keyName,
  moduleCallName,
  moduleMemberName,
  precedingSteps,
  pipeReceiver,
  unwrapNode,
} from "../../shared/effect-modules.ts";

import type { FunctionNode } from "../../shared/ast.ts";
import type { EffectModuleNames } from "../../shared/effect-modules.ts";
import type { ESTree, SourceCode } from "@oxlint/plugins";

type Construction = ESTree.NewExpression | ESTree.CallExpression;

const narrowingOperators: ReadonlySet<string> = new Set([
  "mapError",
  "catch",
  "catchAll",
  "catchCause",
  "orElse",
]);

const tapOperators: ReadonlySet<string> = new Set([
  "tapError",
  "tapErrorCause",
  "tapCause",
  "tapErrorTag",
]);

const emptyFailureSources: ReadonlySet<string> = new Set([
  "fromNullable",
  "fromNullishOr",
  "fromOption",
]);

const effectModules = ["Context", "Effect", "Layer", "ManagedRuntime"] as const;

/** Whether the handler never reads the error it receives. */
function ignoresError(handler: FunctionNode, sourceCode: SourceCode): boolean {
  const [parameter] = handler.params;

  if (parameter === undefined) return true;

  if (parameter.type !== "Identifier") return false;

  const variable = sourceCode
    .getDeclaredVariables(handler)
    .find((candidate) =>
      candidate.identifiers.some((identifier) => identifier === parameter),
    );

  return variable !== undefined && variable.references.length === 0;
}

/** `new X(...)` or `X.make(...)` for a capitalised `X` that is not an Effect module. */
function isErrorConstruction(
  node: Construction,
  names: EffectModuleNames,
): boolean {
  const callee = unwrapNode(node.callee);

  if (node.type === "NewExpression") {
    return callee.type === "Identifier" || callee.type === "MemberExpression";
  }

  if (
    callee.type !== "MemberExpression" ||
    callee.computed ||
    callee.property.type !== "Identifier" ||
    callee.property.name !== "make"
  ) {
    return false;
  }

  const owner = unwrapNode(callee.object);

  const ownerName =
    owner.type === "Identifier"
      ? owner.name
      : owner.type === "MemberExpression" &&
          owner.property.type === "Identifier"
        ? owner.property.name
        : null;

  if (ownerName === null || !/^[A-Z]/u.test(ownerName)) return false;

  return !effectModules.some(
    (module) => moduleMemberName(callee, names, module) !== null,
  );
}

/** Whether any argument is an object literal with a `cause` property or a spread that may supply one. */
function passesCause(node: Construction): boolean {
  return node.arguments.some((argument) => {
    const expression = unwrapNode(argument);

    return (
      expression.type === "ObjectExpression" &&
      expression.properties.some(
        (property) =>
          property.type === "SpreadElement" ||
          (!property.computed && keyName(property.key) === "cause"),
      )
    );
  });
}

/** The outermost node that still evaluates to `node`, past parentheses and type wrappers. */
function outerExpression(node: ESTree.Node): ESTree.Node {
  let current = node;

  while (current.parent && unwrapNode(current.parent) === node) {
    current = current.parent;
  }

  return current;
}

/** The narrowing operator call a handler is the last argument of, or null. */
function narrowingCall(
  handler: FunctionNode | null,
  names: EffectModuleNames,
): ESTree.CallExpression | null {
  const call = handler?.parent;

  if (call?.type !== "CallExpression" || call.arguments.at(-1) !== handler) {
    return null;
  }

  const operator = moduleCallName(call, names, "Effect");

  return operator !== null && narrowingOperators.has(operator) ? call : null;
}

/**
 * The function whose effect fails with the error `anchor` produces: the nearest function around it, looking through
 * Effect.gen generators, which run as the surrounding function's effect.
 */
function failingFunction(
  anchor: ESTree.Node,
  names: EffectModuleNames,
): FunctionNode | null {
  let owner = nearestEnclosingFunction(anchor);

  while (
    owner?.type === "FunctionExpression" &&
    genFunction(owner.parent, names) === owner
  ) {
    owner = nearestEnclosingFunction(owner);
  }

  return owner;
}

/**
 * The handler that produces `construction` as its error: returned from the handler itself, passed to `Effect.fail`,
 * or yielded with `yield*` in the handler or an Effect.gen generator it runs.
 */
function producingHandler(
  construction: Construction,
  names: EffectModuleNames,
): FunctionNode | null {
  const expression = outerExpression(construction);
  const parent = expression.parent;

  if (!parent) return null;

  if (
    (parent.type === "YieldExpression" && parent.delegate) ||
    (parent.type === "CallExpression" &&
      parent.arguments[0] === expression &&
      moduleCallName(parent, names, "Effect") === "fail")
  ) {
    return failingFunction(parent, names);
  }

  if (parent.type === "ArrowFunctionExpression" && parent.body === expression) {
    return parent;
  }

  if (parent.type === "ReturnStatement") {
    return nearestEnclosingFunction(parent);
  }

  return null;
}

/** Whether `node` is a call of a tap operator, or the operator itself. */
function isTapStep(node: ESTree.Node, names: EffectModuleNames): boolean {
  const expression = unwrapNode(node);

  const member =
    moduleCallName(expression, names, "Effect") ??
    moduleMemberName(expression, names, "Effect");

  return member !== null && tapOperators.has(member);
}

/**
 * Whether the narrowed effect comes straight from `Effect.fromOption`, `Effect.fromNullishOr` or
 * `Effect.fromNullable`, whose
 * `NoSuchElementError` has nothing worth keeping as a cause.
 */
function failsWithoutDetail(
  call: ESTree.CallExpression,
  dataFirstSource: ESTree.Node | undefined,
  names: EffectModuleNames,
): boolean {
  const pipe = call.parent;

  const source =
    dataFirstSource ??
    (pipe?.type === "CallExpression" && pipe.arguments[0] === call
      ? pipeReceiver(pipe)
      : null);

  const constructor =
    source === null
      ? null
      : moduleCallName(unwrapNode(source), names, "Effect");

  return constructor !== null && emptyFailureSources.has(constructor);
}

/** Require narrowing handlers that replace an error to keep the original as `cause`. */
export const requireCauseWhenNarrowingRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require Effect.mapError/catch/catchAll/catchCause/orElse handlers that construct a new error to keep the original error as `cause`.",
    },
    messages: {
      missingCause:
        "This {{operator}} handler discards the original error and constructs a new one without it. Name the handler's parameter and pass it as `cause` (`(error) => new {{error}}({ ..., cause: error })`), or log it first with `Effect.tapError(Effect.logError)` before narrowing.",
    },
  },
  create(context) {
    const names = collectEffectModuleNames(context.sourceCode.ast);

    function check(node: Construction) {
      if (!isErrorConstruction(node, names) || passesCause(node)) return;
      const handler = producingHandler(node, names);
      const call = narrowingCall(handler, names);

      if (handler === null || call === null) return;

      if (!ignoresError(handler, context.sourceCode)) return;

      const dataFirstSource =
        call.arguments.length > 1 ? call.arguments[0] : undefined;

      const earlier =
        dataFirstSource === undefined
          ? precedingSteps(call)
          : [dataFirstSource];

      if (earlier.some((step) => isTapStep(step, names))) return;

      if (failsWithoutDetail(call, dataFirstSource, names)) return;
      const callee = unwrapNode(node.callee);

      const error = context.sourceCode.getText(
        callee.type === "MemberExpression" && node.type === "CallExpression"
          ? callee.object
          : callee,
      );

      context.report({
        node,
        messageId: "missingCause",
        data: {
          operator: `Effect.${moduleCallName(call, names, "Effect")}`,
          error,
        },
      });
    }

    return { CallExpression: check, NewExpression: check };
  },
});
