# /myney-check

## Purpose
Universal AI command protocol for MYney check flow.

## How AI Should Execute
1. Validate required MemoryCore files, command files, agent files, roster JSON, member JSON, invite JSON, quest JSON, and pair consistency.
2. Before first setup, report that roster/member state is not initialized yet.
3. After setup, failures must be fixed before memory-sensitive work continues.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-check`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirror: `npm run myney -- check`.
