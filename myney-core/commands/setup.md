# /myney-setup

## Purpose
Universal AI command protocol for MYney setup flow.

## How AI Should Execute
1. If `myney-core/team/roster.json` is missing, this is first-run setup and the current user becomes owner.
2. Ask for display name, codename, RPG class, solo/team mode, and join mode when team mode is selected.
3. Create the roster JSON, owner member JSON, core memory files, and append an OWNER entry to `team-ledger.md`.
4. If the roster exists, ask for member identity and activate or create that member according to join mode.
5. In `owner-approved` mode, only codenames in `approvedMembers` may join.
6. In `open` mode, any valid codename may join.
7. In `invite` mode, ask for an invite code, verify it is active, then mark it used.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-setup`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirror: `npm run myney -- setup`.
