# /myney-handoff

## Purpose
Universal AI command protocol for MYney handoff flow.

## How AI Should Execute
1. Ask what finished, the next action, and whether there is a blocker.
2. Write `lastHandoff` to the member JSON.
3. Set `lastBlocker` only when a real blocker is reported.
4. Append HANDOFF or BLOCKER to `team-ledger.md`.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-handoff`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirror: `npm run myney -- handoff`.
