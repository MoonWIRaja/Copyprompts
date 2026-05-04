# .myney.core: Portable MYney RPG MemoryCore

`.myney.core` is a portable, local, file-based RPG MemoryCore powered by MYney.
It stores identity, team state, quests, pair work, handoffs, reminders, and
agent protocols in one human-readable Markdown file: `MYNEY.md`.

No backend. No database. No external runtime dependency.

## Install Into Any Project

Copy this folder into any repo:

```text
your-project/
└── .myney.core/
```

Then tell the AI: "Read `.myney.core/AGENTS.md`", or open this folder directly
and type `/myney-setup`.

## Quick Start

Open this project in any AI-assisted IDE or chat with file access, then type:

```text
/myney-setup
```

The AI reads `AGENTS.md`, loads `MYNEY.md`, and follows the setup
flow. The first setup creates the owner. MYney asks whether this is a solo
project or a team project. In team mode, choose one join model:

- `owner-approved`: owner maintains the `approvedMembers` list inside `MYNEY.md`.
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
- `/myney-autosync` - Automates Quest -> Build -> Memory -> GitHub Push flow (All changes).
- `/myney-check` - validate MemoryCore files and consistency.

All command specs and live memory state live in `MYNEY.md`.

## Optional CLI Mirror

The slash commands are the primary interface. A local TypeScript CLI still exists
for automation and testing:

```bash
cd .myney.core
npm run myney -- command list
npm run myney -- setup
npm run myney -- party
```

## Memory Map

```text
.myney.core/
├── MYNEY.md
├── AGENTS.md
├── README.md
├── setup.md
├── package.json
├── tsconfig.json
├── src/
└── tests/
```

`MYNEY.md` contains the human protocol sections plus one `json myney-state`
block that stores roster, members, invites, quests, reminders, ledger entries,
agents, and commands.

## Development

```bash
cd .myney.core
npm test
```

The optional CLI is TypeScript and runs directly on Node 24 using type stripping.
There is no build step for v1.
