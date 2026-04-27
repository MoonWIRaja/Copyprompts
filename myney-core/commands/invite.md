# /myney-invite

## Purpose
Universal AI command protocol for MYney invite flow.

## How AI Should Execute
1. Only the owner can create, list, or revoke invites.
2. Invite files live in `myney-core/team/invites/<CODE>.json`.
3. Create active invites, revoke unused invites, and never reactivate a used invite.
4. Reserved invites must match the member codename during `/myney-setup`.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-invite`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirror: `npm run myney -- invite create|list|revoke`.
