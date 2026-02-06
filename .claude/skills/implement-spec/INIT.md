# PREAMBLE Generation Workflow

Generates `specs/PREAMBLE.md` by scanning project files using parallel sub-agents to avoid context exhaustion.

## Usage

```
/implement-spec init
```

**Note:** This command **overwrites** any existing `specs/PREAMBLE.md`. It does not merge with previous content. Run this whenever specs change significantly or to regenerate from scratch.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR (you)                          │
│  1. Glob specs/[0-9][0-9]-*.md → get numbered spec list         │
│  2. Read config files directly (package.json, tsconfig)         │
│  3. Spawn sub-agents in PARALLEL - one per spec (use Opus)      │
│  4. Collect JSON from each, merge extracted data                │
│  5. Generate PREAMBLE.md from merged data                       │
│  6. Verify all required sections exist (checklist)              │
└─────────────────────────────────────────────────────────────────┘
```

**Important:** Only numbered specs (e.g., `00-overview.md`, `06-scenario-1.md`) are processed.
Non-numbered files (README, trackers, PREAMBLE.md itself) are ignored.

---

## STEP 1: Gather Config Files (Do Directly)

Read these small files yourself - no sub-agent needed:

1. **package.json** → Extract:
   - `name`, `description`
   - `dependencies` / `devDependencies` (for tech stack with versions)
   - `scripts` (test commands: typecheck, test, test:e2e)

2. **tsconfig.json** → Extract:
   - `compilerOptions.paths` (e.g., `@/*` → `src/*`)

3. **CLAUDE.md** (if exists) → Extract:
   - Project description
   - Any skills that should be invoked for certain specs

4. **.claude/skills/** → List project-specific skills (exclude implement-spec)

---

## STEP 2: Spawn Spec Extractors (Parallel Sub-Agents)

For each spec file found by `glob specs/[0-9][0-9]-*.md`, spawn a sub-agent.

**IMPORTANT:** Use `model: "opus"` - extraction quality matters.

### Sub-Agent Prompt

```
TASK: Extract structured data from a spec file for PREAMBLE generation.

READ: {{SPEC_PATH}}

EXTRACT THE FOLLOWING (return null for fields that don't apply):

1. **spec_type**: Classify as one of:
   - "reference" - Defines reusable code (types, components, hooks, context, config, testing infrastructure)
   - "scenario" - Implements a user-facing feature with a route

2. **defined_files**: Array of file paths this spec creates. Look in:
   - "File Structure" section
   - Code blocks showing file creation
   - Export statements
   Format: ["src/types/index.ts", "src/hooks/useFeature.ts"]

3. **exports**: For reference specs, what does each file export? Format:
   {
     "src/types/index.ts": ["AppState", "Config", "CONSTANTS", "isValidInput"],
     "src/hooks/useFeature.ts": ["useFeature", "useFeatureActions"]
   }

4. **route**: For scenario specs only - the URL path (e.g., "/feature-name")

5. **page_directory**: For scenario specs only - the page folder (e.g., "src/pages/FeatureName/")

6. **dependencies**: Array of spec numbers this spec depends on. Look in:
   - "Dependencies" section
   - Import statements referencing other specs' files

7. **coding_standards**: Array of specific patterns/conventions established. Extract EXACT details:
   - Import patterns (e.g., "Use @/ path alias for all src imports")
   - Data handling (e.g., "Internal: cents, Display: dollars, use CONSTANTS.CENTS_PER_DOLLAR")
   - Component patterns (e.g., "Use PageLayout wrapper for all pages")
   - Hook patterns (e.g., "Use useAuth() for auth state, useData() for data fetching")
   - Naming conventions
   - Error handling patterns
   - data-testid conventions

8. **test_commands**: If this spec defines test commands, extract them:
   {
     "typecheck": "npm run typecheck",
     "unit": "npm test",
     "e2e": "npm run test:e2e"
   }

9. **test_structure**: For testing specs, extract paths and patterns:
   {
     "unit_pattern": "tests/unit/**/*.test.{ts,tsx}",
     "e2e_pattern": "tests/e2e/**/*.spec.ts",
     "screenshot_dir": "tests/e2e/screenshots/",
     "mock_dir": "tests/mocks/",
     "mock_files": ["api.ts", "auth.ts"]
   }

10. **mock_patterns**: Code snippets showing how to mock dependencies. Extract the actual mock setup code if present.

11. **tech_stack**: Libraries/frameworks mentioned in code examples. Format:
    ["React", "TypeScript", "Tailwind CSS", "Vitest", "Playwright"]

12. **path_aliases**: Import aliases shown in code examples. Format:
    { "@/": "src/", "@components/": "src/components/" }

13. **import_from**: The import path(s) for this spec's exports. Format:
    - For types: "@/types"
    - For components: "@/components/ui" or "@/components/layout/*"
    - For hooks: "@/hooks/*" or "@/hooks/useSpecificHook"
    - For context: "@/context/ContextName"
    - null if spec creates config files with no code exports (e.g., spec 00, 01)
    - For multiple paths, use array: ["@/context/AppContext", "@/hooks/*"]

14. **provides_summary**: Brief description of what this spec provides (for the Available by Spec table).
    - Examples: "Types, constants, type guards", "UI primitives", "App state and actions"
    - null if spec has no code exports

RETURN JSON ONLY:
{
  "spec_number": "04",
  "spec_name": "app-context",
  "spec_type": "reference",
  "defined_files": ["src/context/AppContext.tsx", "src/hooks/useApp.ts"],
  "exports": {
    "src/context/AppContext.tsx": ["AppProvider", "AppContext"],
    "src/hooks/useApp.ts": ["useApp", "useAppActions"]
  },
  "route": null,
  "page_directory": null,
  "dependencies": ["02", "03"],
  "coding_standards": [
    "Import hooks from @/hooks, not directly from context",
    "Use useApp() for read-only state, useAppActions() for mutations"
  ],
  "test_commands": null,
  "test_structure": null,
  "mock_patterns": null,
  "tech_stack": ["React", "TypeScript"],
  "path_aliases": { "@/": "src/" },
  "import_from": ["@/context/AppContext", "@/hooks/*"],
  "provides_summary": "App state and actions"
}
```

### Spawn Configuration

```javascript
Task({
  subagent_type: "general-purpose",
  model: "opus",  // Quality matters for extraction
  prompt: /* above prompt with {{SPEC_PATH}} filled */
})
```

**Spawn ALL spec agents in a SINGLE message for parallel execution.**

---

## Collecting Sub-Agent Responses

When sub-agents complete, **you (the orchestrator) must**:

1. **Wait for all parallel agents** to return before proceeding
2. **Parse JSON from each response** - the sub-agent's final message contains the JSON object
3. **Store results in an array** for merging:

```javascript
// Conceptual - you track this mentally, not in code
const extractedSpecs = [
  { spec_number: "00", spec_type: "reference", ... },
  { spec_number: "01", spec_type: "reference", ... },
  { spec_number: "06", spec_type: "scenario", ... },
  // ... one entry per sub-agent response
];
```

4. **Handle failures gracefully**:
   - If a sub-agent returns invalid JSON, log which spec failed
   - Continue with valid responses
   - Note failed specs in PREAMBLE output

The sub-agents do NOT communicate with each other - they only return data to you. You are responsible for combining their outputs in Step 3.

---

## STEP 3: Merge Extracted Data

After all sub-agents return:

### Build Reference Files Table

Filter results where `spec_type === "reference"`:

```markdown
| Spec | File(s) | Contents |
|------|---------|----------|
```

For each reference spec:
- Spec column: `spec_number`-`spec_name`
- File(s) column: Join `defined_files` with backticks
- Contents column: Join keys from `exports` object (the exported names)

### Build Scenario Routes Table

Filter results where `spec_type === "scenario"`:

```markdown
| Spec | Route | Page File |
|------|-------|-----------|
```

For each scenario spec:
- Spec column: `spec_number`-`spec_name`
- Route column: `route`
- Page File column: `page_directory`

### Build Coding Standards

1. Collect all `coding_standards` arrays
2. Deduplicate (some patterns appear in multiple specs)
3. Group by category:
   - Path Aliases
   - Units Convention
   - Component Patterns
   - Hook Patterns
   - Error Handling
   - Type Safety
4. Number the final list

### Build Test Commands

**Priority order:**
1. Specs (any spec with `test_commands !== null`)
2. package.json scripts (`typecheck`, `test`, `test:e2e`)
3. Defaults: `npx tsc --noEmit`, `npm test`, `npx playwright test`

### Build Test Structure

**Priority order:**
1. Specs (any spec with `test_structure !== null`)
2. Defaults based on detected test framework:
   - Unit: `tests/**/*.test.{ts,tsx}` or `src/**/*.test.{ts,tsx}`
   - E2E: `tests/e2e/**/*.spec.ts` or `e2e/**/*.spec.ts`
   - Screenshots: `tests/e2e/screenshots/`
   - Mocks: `tests/mocks/` or `src/__mocks__/`

### Build Mock Patterns

Find specs with `mock_patterns !== null` and include example code.

### Build Tech Stack

**Priority order:**
1. package.json `dependencies` + `devDependencies` (with versions)
2. Specs (merge all `tech_stack` arrays, deduplicate)

### Build Path Aliases

**Priority order:**
1. tsconfig.json `compilerOptions.paths`
2. Specs (merge all `path_aliases` objects)

### Build Available by Spec Table

This table helps workers know what imports are available when implementing each spec.

For each spec (sorted by `spec_number`):
- **Spec column:** Just the number (e.g., "01", "02")
- **Import From column:** `import_from` field, or "—" if null
- **Provides column:** `provides_summary` field, or describe based on spec type:
  - For spec 00: "Documentation only (architecture reference)"
  - For spec 01: "Config files, entry points (no code exports)"
  - For other null cases: "See spec for details"

```markdown
| Spec | Import From | Provides |
|------|-------------|----------|
| 00 | — | Documentation only (architecture reference) |
| 01 | — | Config files, entry points (no code exports) |
| 02 | `@/types` | Types, constants, type guards |
| 03 | `@/components/ui` | UI primitives |
| 04 | `@/context/AppContext`, `@/hooks/*` | App state and actions |
| ... | ... | ... |
```

---

## STEP 4: Generate PREAMBLE.md

**Overwrite** `specs/PREAMBLE.md` with the following structure (do not merge with existing content):

```markdown
# Project Context for Spec Implementation

## Project
- Name: {{name from package.json}}
- Directory: {{working directory}}
- Description: {{description from package.json or CLAUDE.md}}

## Tech Stack
{{Format dependencies with versions, grouped by purpose}}

## Project-Specific Skills

| Spec Pattern | Skill | Purpose |
|--------------|-------|---------|
{{From .claude/skills/ and CLAUDE.md skill references}}

## Reference Files

| Spec | File(s) | Contents |
|------|---------|----------|
{{MERGED_REFERENCE_TABLE}}

## Scenario Routes

| Spec | Route | Page File |
|------|-------|-----------|
{{MERGED_SCENARIO_TABLE}}

## Available by Spec

| Spec | Import From | Provides |
|------|-------------|----------|
{{AVAILABLE_BY_SPEC_TABLE}}

*For complete export lists, read the referenced spec file.*

## Import Availability Rule

Specs are implemented in numerical order. When implementing spec N:
- **You may import from** specs where number < N
- **You may NOT import from** specs where number >= N (they don't exist yet)
- **For spec 01**: No imports available - this is the foundation spec

Example: Implementing spec 06 means you can use imports from specs 02, 03, 04, 05.

## Coding Standards

{{NUMBERED_DEDUPLICATED_STANDARDS}}

## Test Commands

```bash
{{scripts.typecheck or "npm run typecheck"}}
{{scripts.test or "npm test"}}
{{scripts["test:e2e"] or "npm run test:e2e"}}
```

## Test Structure

- Unit tests: {{test_structure.unit_pattern}}
- E2E tests: {{test_structure.e2e_pattern}}
- Screenshots: {{test_structure.screenshot_dir}}
- Mocks: {{test_structure.mock_dir}}

## Mock Patterns

{{Include actual mock code snippets extracted}}

## Response Format

Sub-agents must return JSON only - no prose, no explanations.
Include only: status, summary, file paths, counts, pass/fail booleans.
```

---

## STEP 6: Verify Required Sections

**After generating PREAMBLE.md, verify all required sections have content.**

Worker sub-agents (phases 1-9 in SKILL.md) depend on specific PREAMBLE sections. If any are missing, add defaults or TODO comments before finishing.

| Section | Used By Phase(s) | Required? | If Missing |
|---------|------------------|-----------|------------|
| **Reference Files** | 1 (read deps), 2 (verify imports) | Yes, if reference specs exist | Omit table, add note |
| **Scenario Routes** | 1 (app structure), 4 (E2E nav) | Yes, if scenario specs exist | Omit table, add note |
| **Available by Spec** | 1 (know what's importable) | **Yes** | Generate from extracted data |
| **Import Availability Rule** | 1 (understand ordering) | **Yes, verbatim** | Always include exactly as shown |
| **Coding Standards** | 1 (follow), 2 (verify), 8 (review) | **Yes** | Use minimal defaults (see below) |
| **Test Commands** | 5 (run tests) | **Yes** | Use priority fallback |
| **Test Structure** | 3 (unit paths), 4 (E2E paths), 7 (screenshots) | **Yes** | Use defaults for detected framework |
| **Mock Patterns** | 3 (reuse mocks) | No | Add placeholder note |
| **Response Format** | All phases | **Yes, verbatim** | Always include exactly as shown |

### Minimal Coding Standards Defaults

If no `coding_standards` extracted from any spec:

```markdown
## Coding Standards

1. Use consistent import style (relative for same directory, absolute/aliased for cross-directory)
2. Add `data-testid` attributes to interactive elements for E2E testing
3. Handle errors with try/catch and display user-friendly messages
```

### Final Verification Checklist

Run through this after generating:

- [ ] Reference Files table has data OR note explaining none exist
- [ ] Scenario Routes table has data OR note explaining none exist
- [ ] Available by Spec table has entry for each numbered spec
- [ ] Import Availability Rule section is present verbatim
- [ ] Coding Standards has numbered list (from specs or defaults)
- [ ] Test Commands has 3 runnable bash commands
- [ ] Test Structure has all 4 paths (unit, e2e, screenshots, mocks)
- [ ] Response Format section is present verbatim

If any **required** section is empty with no fallback, add a `<!-- TODO: ... -->` comment so the user knows to fill it in manually.

---

## Error Handling

| Condition | Action |
|-----------|--------|
| No specs found | Tell user to create specs first |
| Sub-agent returns invalid JSON | Log error, exclude from merge, note in output |
| Missing package.json | Use directory name, add TODO placeholders |
| No testing spec found | Use sensible defaults, add TODO for test structure |
| Duplicate patterns | Keep first occurrence, dedupe by exact string match |

