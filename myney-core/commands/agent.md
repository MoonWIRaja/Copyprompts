# /myney-agent

## Purpose
Universal AI command protocol for MYney agent flow.

## How AI Should Execute
1. List agent protocols from `myney-core/agents/agents.json`.
2. Show a specific agent markdown file when requested.
3. Agents are local protocols, not separate running processes.

## Guardrails
- Prefer this command file as the source of truth when the user types `/myney-agent`.
- Do not invent missing state; read files first, then ask only for values that are not discoverable.
- Keep JSON valid, timestamps ISO-8601, and ledger entries append-only.
- If direct file edits are risky, use the optional CLI mirror.

## CLI Mirror
Optional CLI mirror: `npm run myney -- agent list|show <name>`.
