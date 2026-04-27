# /myney-whoami

## Purpose
Universal AI command protocol for MYney whoami flow.

## How AI Should Execute
1. Read `myney-core/team/roster.json` and identify the active member, or ask the user for their codename.
2. Read `myney-core/members/<codename>.json`.
3. Show role, class, level, XP, current quest, active pair, last blocker, and last handoff.
4. Update `lastSession` and increment `sessionsCount`.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-whoami`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirror: `npm run myney -- whoami --actor <codename>`.
