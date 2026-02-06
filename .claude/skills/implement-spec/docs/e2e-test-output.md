# E2E Test Output Handling

## Why Tests Are Filtered

Running all E2E tests produces massive output that can exceed context limits:
- A full test suite (e.g., 249 tests across 3 browsers) generates 60k+ tokens of output
- This makes error analysis impractical and wastes context

**Solution:** Filter tests to only the spec being implemented:
```bash
FORCE_COLOR=0 npx playwright test tests/e2e/{{SPEC_NUMBER}}-*.spec.ts --project=chromium --reporter=line
```

## Understanding Playwright Reporters

| Reporter | Output | Use Case |
|----------|--------|----------|
| `line` | 1 line per test + full error details | **Recommended** - concise progress, detailed errors |
| `dot` | 1 character per test | CI pipelines, very large suites |
| `list` | Verbose per-test output | Local debugging |
| `html` | HTML report file | Post-run analysis |

The `--reporter=line` still shows full error details for failures - this is intentional. We want to see the errors.

## Reading Error Context Files

When tests fail, Playwright generates error context files:
```
Error Context: test-results/12-nostr-zap-Nostr-Zap-pag-21b17--proper-title-and-structure-chromium/error-context.md
```

These files contain:
- Full stack trace
- Page state at time of failure
- Screenshots (if configured)
- Console logs

**To investigate a failure:**
1. Note the error-context.md path from test output
2. Read the file for additional debugging information
3. Check for screenshots in the same directory

## Identifying Root Causes

When multiple tests fail, look for patterns:

**Same assertion failing across tests:**
```
locator('text=Connected') → 0 elements (expected 2)
```
This pattern in multiple tests suggests a root cause (e.g., wallet connection isn't working) rather than individual test bugs.

**Fix strategy:**
1. Identify the common failure pattern
2. Fix the root cause (usually implementation, not tests)
3. Re-run to verify multiple tests pass

## Browser Strategy

- **Iterations 1-4:** Use `--project=chromium` for faster feedback
- **Final verification:** Run all browsers to catch cross-browser issues

This reduces test time from ~3x to 1x during the fix loop.
