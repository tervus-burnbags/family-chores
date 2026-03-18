# Task State - Family Hub

**Task:** Phase 36 - Grid Fix, Balance Audit, Bank Input, List Settings
**Current Phase:** complete
**Status:** Build Complete
**Next Agent:** gemini
**Next Action:** Review Phase 36
**Last Updated:** 2026-03-17

## Completed

- [x] Phases 8-35
- [x] Phase 36: Grid Fix, Balance Audit, Bank Input, List Settings

## Current

- [ ] Waiting on Gemini review for Phase 36

## Notes

- Fun grid now stays 2 columns on phones, and the shared `.btn` class has active tap feedback.
- The old one-time Louisa balance patch is replaced by `auditAndFixBalances()`, which derives owed balances from transaction history and corrects drift once per family.
- Bank parsing now supports verb-less dollar inputs via `bank_ambiguous`, prompting the user to classify the amount as earned or spent.
- Lists settings now live in the header gear for the active list, and the in-card list gear/settings panel have been removed.
