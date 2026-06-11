# Onboarding Discovery Agent

A self-managing LangGraph.js agent that runs the "AI discovery interview" step
of onboarding. Instead of a fixed sequence of questions, it evaluates how much
it actually knows about the project after every turn and decides for itself
whether to keep asking grouped, plain-language questions or to stop and
synthesize a structured **TDD Planning Brief**.

## Graph topology

```
START → analyzeResponses → assessSufficiency ─┬─(ask_more)───→ generateQuestions → END
                                               └─(synthesize)─→ synthesizePlan   → END
```

- **`analyzeResponses`** — re-reads the full transcript (project name,
  description, every user/assistant message so far) and re-derives
  `collectedInfo` + `confidence` for all 8 rubric categories from scratch.
  Re-deriving holistically (rather than incrementally merging) is simpler and
  self-correcting: a later answer can raise *or* lower confidence in an
  earlier category, and implicit information ("Uber for laundry" → two-sided
  marketplace, in-app payments, ratings) gets picked up even if the user never
  states it directly.
- **`assessSufficiency`** — pure logic (`rubric.ts`, no LLM call) that turns
  `confidence` + `round` into a `sufficiencyDecision` of `"ask_more"` or
  `"synthesize"`, plus a human-readable `sufficiencyReasoning`.
- **`generateQuestions`** *(ask_more branch)* — asks the model for 2-4 new,
  grouped, plain-language questions targeting the lowest-confidence /
  highest-impact gaps, instructed never to repeat a topic in `askedTopics`.
  `filterRepeatedQuestions` is a deterministic safety net in case the model
  ignores that instruction. Increments `round` and appends the new topics to
  `askedTopics`.
- **`synthesizePlan`** *(synthesize branch)* — asks the model for the final
  `TddPlanningBrief`. Categories that never reached `sufficient` are surfaced
  as entries in `openQuestionsAndAssumptions` so nothing is silently dropped.

## Sufficiency rubric

Eight categories (`RubricCategory` in `discovery.types.ts`), each scored
`unknown` / `partial` / `sufficient`:

| Category | High-impact? |
| --- | --- |
| `product_vision` | yes |
| `target_users` | yes |
| `core_features` | yes |
| `platform_type` | yes |
| `data_entities` | yes |
| `integrations` | no |
| `scale_performance` | no |
| `constraints` | no |

`assessSufficiency` (in `rubric.ts`) decides `"synthesize"` when:

- `round >= HARD_ROUND_CAP` (currently **5**) — synthesize regardless of
  coverage, treating any remaining gaps as assumptions; or
- every category is at least `partial` **and** every high-impact category is
  `sufficient`.

Otherwise it returns `"ask_more"` with reasoning naming the specific gaps.
`SOFT_ROUND_TARGET_MIN`/`MAX` (2-4) are informational only — they describe the
*expected* number of rounds for a typical project but do not change routing.

`computeCoveragePercent` turns the confidence map into a single 0-100 number
(`unknown` = 0, `partial` = 0.5, `sufficient` = 1, averaged across all 8
categories) for the client's progress bar.

## Session-resume model: D1 row as checkpoint

LangGraph's usual "pause for human input" primitives — `interrupt()` plus a
checkpointer (e.g. `MemorySaver`) — assume a long-lived process that can
suspend a graph run in memory and resume it later. Cloudflare Workers requests
are short-lived and stateless, so that model doesn't apply here.

Instead, **each `POST /api/onboarding/chat` request is exactly one
`graph.invoke(...)` call**:

1. Load the session row from `onboarding_sessions`. Parse its
   `discovery_state` JSON column via `parseDiscoveryState` (defaults: all
   categories `unknown`, `round: 0`, `askedTopics: []` if the column is empty
   — i.e. the very first turn).
2. Append the new user message to `transcript` and pass everything
   (`projectName`, `description`, full `messages`, `collectedInfo`,
   `confidence`, `round`, `askedTopics`) into `graph.invoke(...)`.
3. The graph runs `analyzeResponses → assessSufficiency` and then exactly one
   of `generateQuestions` or `synthesizePlan` — never both, and never loops
   internally.
4. Persist the relevant slice of the result back to `discovery_state`
   (`collectedInfo`, `confidence`, `round`, `askedTopics`,
   `sufficiencyReasoning`) via `serializeDiscoveryState`. On the
   `synthesize` branch, also persist `planning_brief`
   (`serializePlanningBrief`) and flip `status` to `CANVAS_EDIT`.
5. "Pausing for the user" = the HTTP response simply ends with the round's
   questions. The next user message is a brand-new request that repeats steps
   1-4 with the now-updated `discovery_state` — the D1 row *is* the
   checkpoint.

This trades LangGraph's in-memory interrupt/resume for a small amount of
explicit (de)serialization, which is a natural fit for Workers' stateless
request model and means no sticky sessions / Durable Objects are needed.

## TDD Planning Brief

The terminal output of `synthesizePlan` (`TddPlanningBrief` in
`discovery.types.ts`) is **not** the TDD document itself — it's a structured
intermediate artifact:

- `productSummary`, `targetUsers`, `primaryUserJourneys`
- `featureBreakdown` (`mustHave` / `niceToHave` / `outOfScope`)
- `domainEntities` (name, description, relationships)
- `technicalConsiderations` (platform, architecture style, integrations,
  scale assumptions)
- `constraintsAndRisks`
- `openQuestionsAndAssumptions`
- `tddOutline`

`server/src/lib/groq/onboarding-tdd-synthesis.ts` consumes this brief to
generate the four-block TDD canvas document (`project_overview`,
`core_features`, `database_schema`, `tdd_specs`) — that step is unchanged by
this agent beyond taking a brief instead of a raw transcript.

## Tuning

- **`HARD_ROUND_CAP`** (`rubric.ts`) — raise/lower the absolute round limit.
- **`HIGH_IMPACT_CATEGORIES`** (`discovery.types.ts`) — which categories must
  reach `sufficient` (vs. just `partial`) before synthesizing.
- **Confidence thresholds** — `assessSufficiency` only checks for `sufficient`
  vs. not-`sufficient` and `unknown` vs. not-`unknown`; `partial` is treated as
  "good enough" for non-high-impact categories.
- **Question pacing** — `generateQuestionsResultSchema` enforces 2-4 questions
  per round; the prompt in `prompts.ts` describes the desired tone, grouping,
  and example-driven style for non-technical founders.

## Running locally

```sh
# from server/
GEMINI_API_KEY=... bun run discovery:cli
```

`cli.ts` is a standalone Bun REPL that drives the same graph used by the chat
controller: it prompts for a project name + one-line description, then loops
(bounded by `HARD_ROUND_CAP + 1`), printing each round's grouped questions and
reading answers from stdin, until the agent synthesizes and prints the final
`TddPlanningBrief` as JSON.

## Tests

```sh
# from server/
bun test src/agent/onboarding-discovery
```

- `rubric.test.ts` — `assessSufficiency`, `computeCoveragePercent`,
  `filterRepeatedQuestions`.
- `discovery.types.test.ts` — default-state construction and
  `parseDiscoveryState`/`parsePlanningBrief` (de)serialization, including
  fallback behavior for missing/invalid persisted JSON.
- `discoveryGraph.test.ts` — end-to-end routing through the compiled graph
  with a fake model (dispatches on zod schema identity), covering the
  `ask_more`, `synthesize`, and hard-cap paths.
