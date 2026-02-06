# Spec Alignment Prompt

Run this prompt to align scenario specs one at a time. Use agent teams & tasks to do the work in parallel

---

## Skills & Documentation
**IMPORTANT:** Before implementing any Lightning-related features, invoke the Alby Agent Skill:

```
/alby-agent-skill
```

This skill provides authoritative documentation for:
- NWC (Nostr Wallet Connect / NIP-47) protocol
- LNURL protocol for Lightning Addresses
- `@getalby/sdk` and `@getalby/lightning-tools` usage
- Payment operations, HOLD invoices, notifications
- BOLT-11 invoice parsing and preimage verification
- Fiat currency conversion

Read the code into context and download the libraries to check for code consistency

## Prompt

```
Check specs/ALIGNMENT_TRACKER.md and find the first scenario spec with status "fixing" or "pending".

If "fixing": Continue working on that spec.
If all "pending": Mark the first pending spec as "fixing" and begin.
If all "no fixes": Report "All scenario specs are aligned!" and stop.

For the target spec:

1. READ these reference documents (if not already in context):
   - PRD.md
   - specs/00-overview.md
   - specs/01-project-setup.md
   - specs/02-shared-types.md
   - specs/03-shared-components.md
   - specs/04-wallet-context.md
   - specs/05-layout.md
   - specs/14-backend.md
   - specs/15-testing-strategy.md

2. READ the target scenario spec fully.

3. READ any scenario specs already marked "no fixes" in the tracker.

4. CHECK for inconsistencies:
   - Type names/signatures vs specs/02-shared-types.md
   - Component names/props vs specs/03-shared-components.md
   - Hook names/returns vs specs/04-wallet-context.md
   - Route paths vs specs/05-layout.md
   - Backend endpoints vs specs/14-backend.md
   - Feature requirements vs PRD.md scenario description
   - File structure patterns vs already-aligned scenario specs
     (e.g., if aligned specs use `src/pages/X-Name/index.tsx` with `components/` subfolder,
     this spec should too)

5. REPORT findings:
   - If consistent: "No inconsistencies found in [spec name]"
   - If inconsistent: List each inconsistency with file locations

6. If inconsistencies exist:
   - Propose minimal fixes (prefer fixing the scenario spec unless reference is wrong)
   - Apply fixes
   - Commit with message: "align: [spec name] with reference specs"

7. Update ALIGNMENT_TRACKER.md:
   - If you did work in this round: keep "fixing"
   - If there was nothing to do in this round: mark "no fixes"

Stop after ONE alignment pass. User will re-run for continued work.
```

---

## Usage

1. Copy the prompt above
2. Paste into Claude
3. Repeat until tracker shows all "no fixes"
