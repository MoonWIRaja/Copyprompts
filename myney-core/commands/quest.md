# /myney-quest

## Purpose
Universal AI command protocol for MYney quest flow.

## How AI Should Execute
1. Support add, list, start, and complete actions.
2. Quest files live in `myney-core/quests/<quest-id>.json`.
3. Starting a quest sets member `currentQuest`.
4. Completing a quest marks it complete, awards XP, recalculates level, clears currentQuest, adds an inventory note, and appends a QUEST ledger entry.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-quest`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirrors: `npm run myney -- quest add|list|start|complete`.
