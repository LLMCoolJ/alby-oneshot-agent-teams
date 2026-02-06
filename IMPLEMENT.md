# Implement All Specs

Run each spec sequentially using `/implement-spec`. Each spec creates a persistent agent team (builder, tester, reviewer) for the duration of that spec's implementation, then tears it down. Each spec handles its own commit and tag via Phase 9 — no manual git steps needed between specs.

**Use the task list (TaskCreate/TaskUpdate) to track progress.** Create a task for each spec before starting, mark it `in_progress` when you begin, and `completed` when done. This keeps the workflow organized and makes it easy to see where you left off.

**Resume:** If context is lost mid-spec, just re-run `/implement-spec XX`. The manifest at `progress/spec-XX/manifest.json` tracks phase-level state, so it picks up exactly where it left off. A new team is created on resume — teammates start fresh but receive full context from artifacts.

## Instructions

We're not concerned with time it takes or amount of tokens it takes. We want to great the best production ready version of this implementation. No shortcuts for time or tokens.

For each spec listed below, execute the following steps **in order**:

### 1. Check Task List
Run `TaskList` to see current progress. The next pending spec task is your target.

### 2. Mark In Progress
Update the spec's task to `in_progress` before starting.

### 3. Implement
```
/implement-spec XX
```

### 4. Mark Complete
Update the task to `completed` when done.

### 5. Compact for Next Spec
Run `/compact` with this focus:
```
/compact Completed spec XX (team torn down). Next: spec YY ([spec name]). Task list tracks progress. Ready to continue with /implement-spec YY.
```

This preserves:
- Which spec just finished
- Which spec is next (from task list)
- That you should continue with `/implement-spec YY`

### 6. Continue
After compact, immediately run `/implement-spec YY` for the next pending task.

## Spec Execution Order

| Step | Command | Spec |
|------|---------|------|
| 1 | `/implement-spec 01` | Project Setup |
| 2 | `/implement-spec 02` | Shared Types |
| 3 | `/implement-spec 03` | Shared Components |
| 4 | `/implement-spec 04` | Wallet Context |
| 5 | `/implement-spec 05` | Layout |
| 6 | `/implement-spec 06` | Scenario 1 - Simple Payment |
| 7 | `/implement-spec 07` | Scenario 2 - Lightning Address |
| 8 | `/implement-spec 08` | Scenario 3 - Notifications |
| 9 | `/implement-spec 09` | Scenario 4 - Hold Invoice |
| 10 | `/implement-spec 10` | Scenario 5 - Proof of Payment |
| 11 | `/implement-spec 11` | Scenario 6 - Transaction History |
| 12 | `/implement-spec 12` | Scenario 7 - Nostr Zap |
| 13 | `/implement-spec 13` | Scenario 8 - Fiat Conversion |
| 14 | `/implement-spec 14` | Backend |
| 15 | `/implement-spec 15` | Testing Strategy |

## Full Prompt

Copy and paste the following to execute all specs:

---

Implement all specs sequentially following the workflow below. For **each** spec in order (01 through 15):

1. Run `/implement-spec XX` and wait for it to fully complete before proceeding
2. Run `/compact`

Execute in this order:
- `/implement-spec 01` (Project Setup)
- `/implement-spec 02` (Shared Types)
- `/implement-spec 03` (Shared Components)
- `/implement-spec 04` (Wallet Context)
- `/implement-spec 05` (Layout)
- `/implement-spec 06` (Scenario 1 - Simple Payment)
- `/implement-spec 07` (Scenario 2 - Lightning Address)
- `/implement-spec 08` (Scenario 3 - Notifications)
- `/implement-spec 09` (Scenario 4 - Hold Invoice)
- `/implement-spec 10` (Scenario 5 - Proof of Payment)
- `/implement-spec 11` (Scenario 6 - Transaction History)
- `/implement-spec 12` (Scenario 7 - Nostr Zap)
- `/implement-spec 13` (Scenario 8 - Fiat Conversion)
- `/implement-spec 14` (Backend)
- `/implement-spec 15` (Testing Strategy)

**Notes:**
- Each spec creates a team (builder, tester, reviewer), implements, and tears it down
- Each spec commits and tags automatically (Phase 9)
- If context lost mid-spec, re-run `/implement-spec XX` — manifest handles resume, new team is created
- The task list survives compaction — it's your source of truth for progress
