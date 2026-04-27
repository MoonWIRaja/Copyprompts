# EmptyProject: MYney RPG MemoryCore

EmptyProject is a local, file-based RPG MemoryCore powered by MYney.
It stores identity, team state, quests, pair work, handoffs, reminders, and
agent protocols in human-readable Markdown and JSON files.

No backend. No database. No external runtime dependency.

## Quick Start

Open this project in any AI-assisted IDE or chat with file access, then type:

```text
/myney-setup
```

The AI reads `AGENTS.md`, loads `myney-core/commands/setup.md`, and follows the
setup flow. The first setup creates the owner. MYney asks whether this is a solo
project or a team project. In team mode, choose one join model:

- `owner-approved`: owner maintains `myney-core/team/roster.json`.
- `open`: any valid codename can join by running `/myney-setup`.
- `invite`: owner creates invite codes with `/myney-invite`.

Later users run the same `/myney-setup` command. MYney detects the initialized
project and activates or creates their member memory according to the chosen
join mode.

## Universal Commands

- `/myney-setup` - owner bootstrap or member activation.
- `/myney-whoami` - show the active member and current RPG state.
- `/myney-party` - show team state, pairs, blockers, and join mode.
- `/myney-quest` - add, list, start, or complete work quests.
- `/myney-pair` - start, update, or end a focused pair session.
- `/myney-handoff` - save session end state and next action.
- `/myney-invite` - owner-only invite management.
- `/myney-agent` - list or inspect local subagent protocols.
- `/myney-check` - validate MemoryCore files and consistency.

The command specs live in `myney-core/commands/`.

## Optional CLI Mirror

The slash commands are the primary interface. A local TypeScript CLI still exists
for automation and testing:

```bash
npm run myney -- command list
npm run myney -- setup
npm run myney -- party
```

## Development

```bash
npm test
```

The optional CLI is TypeScript and runs directly on Node 24 using type stripping.
There is no build step for v1.
