import { RuleTester } from "oxlint/plugins-dev";

import { requireCauseWhenNarrowingRule } from "./require-cause-when-narrowing.ts";

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

const imports = `
  import * as Effect from "effect/Effect";
`;

const missingCause = (operator: string, error: string) => ({
  messageId: "missingCause",
  data: { operator, error },
});

tester.run(
  "timmo-effect/require-cause-when-narrowing",
  requireCauseWhenNarrowingRule,
  {
    valid: [
      `${imports}
      const a = decode(text).pipe(Effect.mapError((cause) => BadRequest.make({ reason: "Invalid JSON", cause })));
      const b = decode(text).pipe(Effect.mapError((error) => new BadRequest({ reason: error.message })));
      const c = decode(text).pipe(Effect.mapError(() => BadRequest.make({ reason: "Invalid JSON", ...details })));`,
      // Capture before narrowing.
      `${imports}
      const a = decode(text).pipe(Effect.tapError(Effect.logError), Effect.mapError(() => BadRequest.make({ reason: "Invalid JSON" })));
      const b = Effect.fn("decode")(function* () {}, Effect.tapCause(Effect.logError), Effect.catch(() => Effect.fail(new Failed())));
      const c = Effect.mapError(Effect.tapErrorCause(decode(text), Effect.logError), () => new Failed());`,
      // Specific expected tags are handled on purpose.
      `${imports}
      const a = load.pipe(Effect.catchTag("NotFound", () => Effect.fail(new Missing())));
      const b = load.pipe(Effect.catchTags({ NotFound: () => Effect.fail(new Missing()) }));`,
      // Recovering with a value, or constructing inside a nested function, is not narrowing.
      `${imports}
      const a = load.pipe(Effect.orElse(() => Effect.succeed(new Fallback())));
      const b = load.pipe(Effect.catch(() => Effect.sync(() => new Fallback())));
      const c = load.pipe(Effect.catch(() => Effect.succeed(Option.make(1))));
      const d = load.pipe(Effect.catch(() => Effect.gen(function* () {
        return new Fallback();
      })));`,
      // Not Effect's Effect.
      `
      import * as Effect from "other-library";
      const a = load.pipe(Effect.mapError(() => new Failed()));`,
      // A missing Option value has nothing worth keeping as a cause.
      `${imports}
      const a = Effect.fromOption(model).pipe(Effect.mapError(() => new MissingOption({ option: "model" })));
      const b = Effect.mapError(Effect.fromNullable(file), () => new MissingFile());`,
    ],
    invalid: [
      {
        code: `${imports}
        const a = decode(text).pipe(Effect.mapError(() => BadRequest.make({ reason: "Invalid JSON" })));`,
        errors: [missingCause("Effect.mapError", "BadRequest")],
      },
      {
        code: `
        import { Effect } from "effect";
        const a = Effect.mapError(decode(text), (_error) => new McpDialFailed({ message: "bad frame" }));`,
        errors: [missingCause("Effect.mapError", "McpDialFailed")],
      },
      {
        code: `${imports}
        const a = read.pipe(Effect.catch(() => AuthUnavailable.make({ error: "unavailable" })));
        const b = read.pipe(Effect.catchAll(() => Effect.fail(new Unavailable())));
        const c = read.pipe(Effect.orElse(() => Effect.gen(function* () {
          return yield* new Unavailable({ reason: "down" });
        })));
        const d = read.pipe(Effect.catchCause(() => { return Effect.fail(Errors.Unavailable.make()); }));
        const e = read.pipe(Effect.catch(() => Effect.fail(new Errors.Offline())));`,
        errors: [
          missingCause("Effect.catch", "AuthUnavailable"),
          missingCause("Effect.catchAll", "Unavailable"),
          missingCause("Effect.orElse", "Unavailable"),
          missingCause("Effect.catchCause", "Errors.Unavailable"),
          missingCause("Effect.catch", "Errors.Offline"),
        ],
      },
      {
        code: `${imports}
        const a = read.pipe(Effect.tapError(Effect.logError)).pipe(Effect.map(f), Effect.mapError(() => new Failed()));
        const b = read.pipe(Effect.mapError(() => new Failed()), Effect.tapError(Effect.logError));`,
        errors: [missingCause("Effect.mapError", "Failed")],
      },
      {
        // Only the step straight after fromOption is exempt.
        code: `${imports}
        const a = Effect.fromOption(id).pipe(Effect.flatMap(load), Effect.mapError(() => new Failed()));`,
        errors: [missingCause("Effect.mapError", "Failed")],
      },
      {
        // Every error the handler can construct is reported.
        code: `${imports}
        const a = read.pipe(Effect.catch(() => offline ? Effect.fail(new Offline()) : Effect.fail(new Failed())));`,
        errors: [
          missingCause("Effect.catch", "Offline"),
          missingCause("Effect.catch", "Failed"),
        ],
      },
    ],
  },
);
