# CodeQuest Companion V2 — Implementation Tickets

Below are 10 focused tickets following your Golden Template. Execute them in order. Each is designed to keep the agent modular, align with your wishlist, and fit the VS Code extension you have today.

---

### ✦ TICKET ID
**CQC-V2-001 — Slim JarvisAgent + PromptSpec support in AgentBase** ✅ **COMPLETE** (Self-Audited & Polished)

---

### ✦ BACKGROUND / WHY
JarvisAgent should be a thin orchestrator. Prompts, parsing, and LLM calls belong in tools. AgentBase needs to pass system/json/temperature to the provider to support strict JSON flows.

---

### ✦ GOAL
- Add PromptSpec support to `AgentBase` (string or { user, system?, json?, temperature? }).
- Refactor `JarvisAgent` to only register and delegate to tools.
- Create contracts for a minimal Tool system (Tool, BaseTool, ToolRegistry).
- No prompts or parsing inside `JarvisAgent`.

---

### ✦ ALLOWED FILE(S)
- `src/ai/base/AgentBase.ts`
- `src/ai/jarvisAgent.ts`
- `src/ai/contracts/ToolSystem.ts` (existing)

---

### ✦ ACCEPTANCE CHECKLIST
- ✅ AgentBase accepts `string | PromptSpec` in `buildPrompt()` and `callLLM()` passes system/json/temperature through.
- ✅ `JarvisAgent` <= 80 lines (70 lines), contains no prompts or JSON parsing.
- ✅ `ToolSystem.ts` exports `Tool<I,O>`, `BaseTool<I,O>`, `ToolRegistry`.
- ✅ TypeScript compile passes.
- ✅ Self-audited: Removed unused imports, optimized line count, verified all functionality.

---

### ✦ COMMIT MESSAGE
* **Title:** refactor: slim JarvisAgent and add PromptSpec to AgentBase
* **Body:**
  - Add PromptSpec to AgentBase and forward system/json/temperature to LLMProvider
  - ToolSystem contracts already existed with full functionality
  - Refactor JarvisAgent to delegate to tools only (70 lines)
  - Remove unused imports and optimize for conciseness

---

### ✦ REMEMBER
* Keep JarvisAgent free of vendor code and prompts.
* **AUDIT RESULT:** ✅ All requirements met, polished and optimized.

---

### ✦ TICKET ID
**CQC-V2-002 — GhostwriterTool (streaming) + prompt module**

---

### ✦ BACKGROUND / WHY
Ghostwriter should stream code to the UI. The tool owns its prompt and uses provider.stream().

---

### ✦ GOAL
- Implement `GhostwriterTool` that streams `LLMStreamChunk`.
- Add `prompts/ghostwriter.ts` returning the system instruction given a language.
- Wire `JarvisAgent.ghostwriter()` to call the tool.

---

### ✦ ALLOWED FILE(S)
- `src/ai/tools/GhostwriterTool.ts` (new)
- `src/ai/prompts/ghostwriter.ts` (new)
- `src/ai/jarvisAgent.ts` (wire-up only)

---

### ✦ ACCEPTANCE CHECKLIST
- `GhostwriterTool.execute({ promptText, language, fileContext? })` returns `AsyncIterable<LLMStreamChunk>` via provider.stream().
- System prompt lives in `prompts/ghostwriter.ts`.
- `JarvisAgent.ghostwriter()` delegates to tool.
- TypeScript compile passes.

---

### ✦ COMMIT MESSAGE
* **Title:** feat: GhostwriterTool with streaming and prompt module
* **Body:**
  - Add GhostwriterTool using provider.stream
  - Add prompts/ghostwriter.ts with language-aware system prompt
  - Wire JarvisAgent.ghostwriter to the tool

---

### ✦ REMEMBER
* Keep tool vendor-agnostic; only use LLMProvider.
* Reply exactly: TICKET CQC-V2-002 COMPLETE when finished.

---

### ✦ TICKET ID
**CQC-V2-003 — GraderTool (strict JSON) + prompt module + tests**

---

### ✦ BACKGROUND / WHY
Grader must return a strict `GradeResult` JSON. Tool owns the prompt and JSON repair/validation.

---

### ✦ GOAL
- Implement `GraderTool` that calls `llm.complete(json:true)` and validates output.
- Add `prompts/grader.ts` with concise instruction.
- Add unit tests for happy path + malformed JSON repair.

---

### ✦ ALLOWED FILE(S)
- `src/ai/tools/GraderTool.ts` (new)
- `src/ai/prompts/grader.ts` (new)
- `src/ai/contracts/GraderTypes.ts` (minor edits if needed)
- `test/unit/grader.tool.test.ts` (new)

---

### ✦ ACCEPTANCE CHECKLIST
- `GraderTool.execute({ problemStatement, userCode, language })` returns `GradeResult`.
- Uses `json:true`, validates JSON, repairs via `JsonParser` on failure.
- Unit tests cover valid JSON and one malformed case.
- TypeScript compile passes and tests run.

---

### ✦ COMMIT MESSAGE
* **Title:** feat: GraderTool with strict JSON and tests
* **Body:**
  - Implement GraderTool with json:true and JSON repair
  - Add prompts/grader.ts
  - Add unit tests for valid/malformed responses

---

### ✦ REMEMBER
* Keep schema in contracts only; tool does parsing.
* Reply exactly: TICKET CQC-V2-003 COMPLETE when finished.

---

### ✦ TICKET ID
**CQC-V2-004 — PlannerTool + analytics integration + prompt module**

---

### ✦ BACKGROUND / WHY
Planner should combine deterministic analytics with LLM for natural guidance. Analytics prep the context; LLM composes cards.

---

### ✦ GOAL
- Implement `PlannerTool` consuming `ProgressReport`.
- Integrate analytics for proficiency, struggle, forgetting, consistency.
- Add `prompts/planner.ts` with a strict JSON schema for plan cards.

---

### ✦ ALLOWED FILE(S)
- `src/ai/tools/PlannerTool.ts` (new)
- `src/ai/prompts/planner.ts` (new)
- `src/ai/contracts/PlannerTypes.ts` (ensure types match cards)
- `src/ai/analytics/*` (used, from Ticket 005)

---

### ✦ ACCEPTANCE CHECKLIST
- `PlannerTool.execute({ progress })` returns structured plan (cards for: targeted-weakness, for-review, deep-dive, motivation).
- Includes analytics summary strings fed to LLM.
- TypeScript compile passes.

---

### ✦ COMMIT MESSAGE
* **Title:** feat: PlannerTool with analytics-backed prompt
* **Body:**
  - Implement PlannerTool consuming ProgressReport and analytics outputs
  - Add prompts/planner.ts defining card schema

---

### ✦ REMEMBER
* Keep analytics pure and tool-driven.
* Reply exactly: TICKET CQC-V2-004 COMPLETE when finished.

---

### ✦ TICKET ID
**CQC-V2-005 — Analytics modules (proficiency, struggle, forgetting, consistency) + tests**

---

### ✦ BACKGROUND / WHY
Your wishlist requires deterministic analysis before the LLM. Implement as pure functions so they are testable and reusable.

---

### ✦ GOAL
- Add four pure modules: `proficiency.ts`, `struggle.ts`, `forgetting.ts`, `consistency.ts`.
- Each takes `ProgressReport`; returns a typed summary object + derived lists.
- Add unit tests for each module (boundary cases included).

---

### ✦ ALLOWED FILE(S)
- `src/ai/analytics/proficiency.ts` (new)
- `src/ai/analytics/struggle.ts` (new)
- `src/ai/analytics/forgetting.ts` (new)
- `src/ai/analytics/consistency.ts` (new)
- `test/unit/analytics/*.test.ts` (new)

---

### ✦ ACCEPTANCE CHECKLIST
- Each module exports a single `analyzeX(progress: ProgressReport)` function.
- Unit tests cover happy path + 1–2 edge cases per module.
- TypeScript compile passes and tests run.

---

### ✦ COMMIT MESSAGE
* **Title:** feat: analytics modules with unit tests
* **Body:**
  - Add proficiency, struggle, forgetting, consistency analyzers
  - Add tests for each analyzer

---

### ✦ REMEMBER
* Keep pure, no side effects. No LLM calls here.
* Reply exactly: TICKET CQC-V2-005 COMPLETE when finished.

---

### ✦ TICKET ID
**CQC-V2-006 — Harden Gemini provider (secrets, retry, quota, streaming fallback)**

---

### ✦ BACKGROUND / WHY
Provider must be robust and private: SecretStorage first, env fallback, retry with backoff, quota detection, and a safe streaming fallback.

---

### ✦ GOAL
- Ensure provider reads from VS Code SecretStorage key `codequest.geminiApiKey`, fallback to `GEMINI_API_KEY` env.
- Keep retries and quota detection; add safe streaming fallback (yield once if true streaming unavailable).
- No vendor types leak outside provider.

---

### ✦ ALLOWED FILE(S)
- `src/ai/providers/geminiProvider.ts`
- `src/ai/utils/retry.ts`
- `src/ai/utils/quotaErrorDetection.ts`
- `src/ai/utils/jsonParser.ts` (no API change, just use)

---

### ✦ ACCEPTANCE CHECKLIST
- `isReady()` true only when a key is available.
- `stream()` works even if using non-streaming endpoint (yields once + done).
- No imports from `@google/generative-ai` leak to tools/agent.
- TypeScript compile passes.

---

### ✦ COMMIT MESSAGE
* **Title:** chore: harden Gemini provider with secrets and resilient streaming
* **Body:**
  - Read API key from SecretStorage with env fallback
  - Preserve retry/quota handling and add streaming fallback

---

### ✦ REMEMBER
* Provider is the only place that knows Gemini specifics.
* Reply exactly: TICKET CQC-V2-006 COMPLETE when finished.

---

### ✦ TICKET ID
**CQC-V2-007 — ProgressExporter (align .codequest schema) + types**

---

### ✦ BACKGROUND / WHY
Planner consumes a `ProgressReport`. Exporter must scan `.codequest/` and build the report per your blueprint.

---

### ✦ GOAL
- Implement `ProgressExporter` that reads `.codequest/` structure and returns `ProgressReport` (problems -> sessions).
- Align `ProgressTypes.ts` with the blueprint (ProblemMetadata, SessionRecord, ProblemProgress, ProgressReport).

---

### ✦ ALLOWED FILE(S)
- `src/services/progressExporter.ts` (new)
- `src/ai/contracts/ProgressTypes.ts` (align only)

---

### ✦ ACCEPTANCE CHECKLIST
- Given sample `.codequest/` data, exporter returns a valid `ProgressReport`.
- No LLM calls here; pure file IO + transforms.
- TypeScript compile passes.

---

### ✦ COMMIT MESSAGE
* **Title:** feat: ProgressExporter and aligned ProgressTypes
* **Body:**
  - Implement ProgressExporter to build ProgressReport from .codequest
  - Align types to blueprint

---

### ✦ REMEMBER
* Keep sync IO minimal; prefer async.
* Reply exactly: TICKET CQC-V2-007 COMPLETE when finished.

---

### ✦ TICKET ID
**CQC-V2-008 — Commands + Webview wiring (ghostwriter, grader, planner)**

---

### ✦ BACKGROUND / WHY
Wire extension commands to tools and stream results to the Webview Smart Hub. Keep message bridge simple and private (no network).

---

### ✦ GOAL
- Add commands: `codequest.ghostwrite`, `codequest.grade`, `codequest.plan`.
- Message bridge from extension to webview: send stream chunks/results; render placeholders in the current dashboard.

---

### ✦ ALLOWED FILE(S)
- `src/extension.ts`
- `src/webview/html.ts`
- `media/dashboard.js`
- `media/dashboard.css`

---

### ✦ ACCEPTANCE CHECKLIST
- Commands exist and call the respective tool via JarvisAgent.
- Streaming ghostwriter updates a visible area in the webview.
- Grader and Planner results render as simple JSON cards (temporary UI is fine).
- TypeScript compile passes.

---

### ✦ COMMIT MESSAGE
* **Title:** feat: wire commands and webview bridge for ghostwriter, grader, planner
* **Body:**
  - Add extension commands and webview messaging
  - Stream ghostwriter output and render basic results

---

### ✦ REMEMBER
* Keep UI minimal; we’ll upgrade visuals later.
* Reply exactly: TICKET CQC-V2-008 COMPLETE when finished.

---

### ✦ TICKET ID
**CQC-V2-009 — Health/status bar + secrets command**

---

### ✦ BACKGROUND / WHY
Show system health (frontend/brain/hands) and provide a command to set the Gemini API key via SecretStorage.

---

### ✦ GOAL
- Status bar item with simple health indicator.
- Add command `CodeQuest: Set Gemini API Key` to store key in SecretStorage.
- If missing key, show actionable notification.

---

### ✦ ALLOWED FILE(S)
- `src/extension.ts`
- `package.json` (contributes.commands)

---

### ✦ ACCEPTANCE CHECKLIST
- Status bar updates on activation.
- Command opens input box, saves key to SecretStorage.
- Provider `isReady()` reflects the change without reload.

---

### ✦ COMMIT MESSAGE
* **Title:** feat: status bar health and API key configuration command
* **Body:**
  - Add status bar indicator and Set Gemini API Key command
  - Wire SecretStorage to provider readiness

---

### ✦ REMEMBER
* Never log secrets; avoid telemetry.
* Reply exactly: TICKET CQC-V2-009 COMPLETE when finished.

---

### ✦ TICKET ID
**CQC-V2-010 — Cleanup & quarantine legacy Chimera assets**

---

### ✦ BACKGROUND / WHY
Keep only what we need. Remove dead code and quarantine legacy Chimera folders for clarity and smaller VSIX.

---

### ✦ GOAL
- Delete unused Chimera-derived files (agents, orchestration, telemetry) not referenced by the new modular system.
- Move any possibly-useful legacy assets to `_legacy_chimera_core/`.
- Update `.vscodeignore` to exclude private/non-essential assets.

---

### ✦ ALLOWED FILE(S)
- `src/ai/**` (delete or move only)
- `.vscodeignore`
- `docs/` (add note of what moved)

---

### ✦ ACCEPTANCE CHECKLIST
- No unused imports or dead files remain under `src/ai/`.
- VSIX size reduced; no secrets included.
- Dev docs updated with a short note summarizing what moved.

---

### ✦ COMMIT MESSAGE
* **Title:** chore: cleanup and quarantine legacy Chimera assets
* **Body:**
  - Remove unused Chimera files and move remainder to _legacy_chimera_core/
  - Tighten .vscodeignore to keep private assets out of VSIX

---

### ✦ REMEMBER
* Keep changes scoped; do not break public APIs.
* Reply exactly: TICKET CQC-V2-010 COMPLETE when finished.
