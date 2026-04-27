# /myney-pair

## Purpose
Universal AI command protocol for MYney pair flow.

## How AI Should Execute
1. Support start, update, and end actions.
2. A pair always has exactly two different members.
3. Both member JSON files must contain cross-consistent `activePair` records with the same task and timestamps.
4. Ending a pair clears `activePair` in both member files and appends a PAIR ledger entry.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-pair`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirror: `npm run myney -- pair start|update|end`.
