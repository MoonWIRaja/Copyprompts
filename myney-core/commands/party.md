# /myney-party

## Purpose
Universal AI command protocol for MYney party flow.

## How AI Should Execute
1. Read roster, all member JSON files, active pairs, blockers, and current quests.
2. Show owner, mode, join mode, active member, and one compact line per member.
3. Do not write files.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-party`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirror: `npm run myney -- party`.
