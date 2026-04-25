# Referencing existing documentation

When generating or expanding functionality or documentation in this repository, reference existing documentation. Each project in the `apps` directory and each package in the `packages` directory should have `README.md` files describing their contents and functionality. Some readme files will link to additional documentaion within the project. Always make sure to raise an additional prompt if existing documentation doesn't match with new functionality or if new documentation should be created.


# Coding Delegation

Agent is trusted to implement coding tasks autonomously. Prefer doing over asking, except when:

- a task requires a design or architecture decision not derivable from existing patterns
- the change affects shared interfaces, schemas, or IAM configurations

When implementing:

- read existing code in the relevant area before writing new code
- follow patterns already established in the project
- run tests after changes
- flag if existing documentation is stale relative to new functionality

# Coding Style Guidelines

## General

- **Language**: All source code is TypeScript. Avoid `any`; use `unknown` at system boundaries.
- **Async/IO**: Use the [Effect](https://effect.website) library for all async and effectful operations. Do not use raw `Promise` or `async/await` outside of Effect bridging (`Effect.tryPromise`).
- **Effect composition**: Prefer `Effect.gen(function* () { ... })` for readable sequential composition. Use `Effect.all(..., { concurrency })` for parallel work.
- **Error handling**: Define custom errors with `Data.TaggedError('ErrorName')<{ readonly cause: unknown }>`. Use `Effect.catchTag()` for known errors; let unknown errors propagate. Express effectful code as thunks and wrap in an `Effect` to ensure errors are handled within effect.
- **Configuration**: Read all environment config via the `Config` Effect with schema validation and `.pipe(Config.withDefault(...))` for defaults. No hardcoded config values in source files.
- **Logging**: Use `Effect.logInfo` / `Effect.logError` with `.annotateLogs({ ... })` for structured context. Do not use `console.log`.
- **Schema validation**: Validate all data crossing system boundaries (inbound events, outbound records, config) with Effect `Schema`. Extract TypeScript types from schemas via `Schema.Schema.Type<typeof ...>` — do not define types separately from schemas. Schema transformations should support both `decode` and `encode` directions whenever possible.
- **Naming**: PascalCase for classes, interfaces, and schema variables (`FetcherError`, `IngestionAttemptedSchema`). camelCase for functions and variables (`parseJson`, `runId`). `UPPER_CASE` for environment variable names.

## App Coding Style Guidelines

Apps follow a **hexagonal (ports & adapters)** architecture.

- **Ports** (`src/ports/`): Define interfaces as `Context.Tag` classes. One file per port. Ports define capability only — no implementation.
- **Adapters** (`src/adapters/`): Each adapter implements one port. Adapters export a `make` function and a `layer` constant (`Layer.effect(Port, make)`). Group adapters by transport (e.g. `adapters/cloud-storage/`, `adapters/filesystem/`).
- **Compositi on root** (`src/environments/`): Wire layers together here. Maintain separate files for dev and prod environments. Development layers typically use the filesystem for IO rather than GCP infrastructure. No business logic in environment files.
- **Program** (`src/program.ts`): Core logic only. Receives all dependencies via Effect context. Should read clearly as a sequence of operations.
- **Entry point** (`src/main.ts`): Minimal — runs the program with the appropriate environment. No logic.
- **Domain logic** (`src/integration/`): Prefer pure functions (no effects) where possible. Policy evaluation, data transformation, and decision logic live here.
- **Data types** (`src/data/`): Plain TypeScript types or thin schemas used only internally within the app.
- **Configuration**: Require and access layer configuration from environment variables. Examples of configuration include concurrency limits and log levels via the `Config` package from effect. Use `Effect.all(..., { mode: 'either' })` when partial failure is acceptable; define a success threshold to gate overall run success.

## Package Coding Style Guidelines

Packages are reusable libraries with no dependency on app-level code.

- **Scope**: Each package aims to wrap a single external SDK. Minimize mixing concerns.
- **Effect integration**: Wrap all effectful calls with `Effect.tryPromise({ try, catch })`. Expose `Context.Tag` classes for injectable services (e.g. `StorageClient`, `PubsubTopic`).
- **Layer factory pattern**: Export a `layer` constant or factory function. Callers should never instantiate SDK clients directly.
- **Combinator pattern** (`node`, `node-csv`, `yaml`): Combinators are curried higher-order functions — they accept options and return a function `(schema) => schema`. This enables composition via `pipe()`.
- **No side effects at module load time**: Defer all initialization inside `Effect.gen()` or `Layer.effect()`.
- **`contracts` package**: All cross-app data contracts live here. Every record type must include `version` (literal), `kind`, and `outcome` discriminators. Use constructor functions that supply defaults for `version`, `kind`, and `outcome`. Export schemas and types grouped by domain (e.g. `export * as IngestorRecord`).

# Documentation Style Guidelines

When generating or expanding documentation in this repository:

- Prefer short sections with clear headings
- Use bullet points for responsibilities and guarantees
- Separate “what this system does” from “what it does not do”
- Avoid speculative language (“could”, “might”) unless explicitly noted
- Treat infrastructure outputs and interfaces as stable contracts
- Assume documentation may be read independently of the code

Documentation should read like something that could plausibly be included in:

- an internal platform design review
- a handoff document for a new infra engineer

# Monorepo Context (Reminder)

When generating documentation:

- describe systems in terms of their capabilities and responsibilities
- assume projects may be deployed independently despite living in one repo

# What to Optimize For

When generating documentation for this project, optimize for:

- Legibility – a new reader should quickly understand system roles
- Credibility – decisions should appear intentional and defensible
- Operational realism – systems should feel runnable and maintainable

# Do not optimize for:

- brevity at the expense of clarity
- impressiveness through complexity
- completeness over correctness
