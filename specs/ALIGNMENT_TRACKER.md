# Spec Alignment Tracker

## Status Legend
- `pending` - Not yet reviewed
- `fixing` - Currently being aligned (fixes were made this round)
- `no fixes` - Checked and nothing to fix

## Status Update Rules
**IMPORTANT:** Only change status to `no fixes` if NO work was done (no edits, no commits).

- If you made ANY changes/commits this round → keep as `fixing`
- If you reviewed and found nothing to fix → mark as `no fixes`

The next run of the alignment prompt will verify `fixing` specs and mark them `no fixes` if no further changes are needed.

## Scenario Specs

| Spec | Status | Notes |
|------|--------|-------|
| 07-scenario-1-simple-payment.md | no fixes | Verified: types, components, hooks, routes, NWC API all consistent |
| 08-scenario-2-lightning-address.md | no fixes | Verified: types, components, hooks, routes, Lightning Tools API all consistent |
| 09-scenario-3-notifications.md | no fixes | Fixed metadata snake_case→camelCase mapping; verified clean on second pass |
| 10-scenario-4-hold-invoice.md | no fixes | Verified: types, components, hooks, routes, hold invoice API all consistent |
| 11-scenario-5-proof-of-payment.md | no fixes | Verified: types, components, hooks, routes, bolt11 API all consistent |
| 12-scenario-6-transaction-history.md | no fixes | Fixed metadata mapping + unused imports; verified clean on second pass |
| 13-scenario-7-nostr-zap.md | no fixes | Verified: types, components, hooks, routes, zap API all consistent |
| 14-scenario-8-fiat-conversion.md | no fixes | Verified: types, components, hooks, routes, fiat API all consistent |

## Reference Documents
- PRD.md
- specs/00-overview.md
- specs/01-project-setup.md
- specs/03-shared-types.md
- specs/04-shared-components.md
- specs/05-wallet-context.md
- specs/06-layout.md
- specs/15-backend.md
- specs/16-testing-strategy.md
