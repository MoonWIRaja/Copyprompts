# MYney Agent Instructions

When an AI assistant enters this repo, it should treat `myney-core/` as the
project memory source of truth.

## Universal Command Router

If the user types a command that starts with `/myney-`, do this:

1. Read `myney-core/master-memory.md` if present.
2. Read the matching file in `myney-core/commands/`.
3. Follow that command file as the source of truth.
4. Read existing state before asking questions.
5. Keep member memory and `team-ledger.md` append-friendly and honest.

Command map:

- `/myney-setup` -> `myney-core/commands/setup.md`
- `/myney-whoami` -> `myney-core/commands/whoami.md`
- `/myney-party` -> `myney-core/commands/party.md`
- `/myney-quest` -> `myney-core/commands/quest.md`
- `/myney-pair` -> `myney-core/commands/pair.md`
- `/myney-handoff` -> `myney-core/commands/handoff.md`
- `/myney-invite` -> `myney-core/commands/invite.md`
- `/myney-agent` -> `myney-core/commands/agent.md`
- `/myney-check` -> `myney-core/commands/check.md`

## Optional CLI Mirror

The CLI is a helper, not the primary user interface:

- `npm run myney -- command list`
- `npm run myney -- command show setup`
- `npm run myney -- check`

MYney agents are protocols, not background processes.
