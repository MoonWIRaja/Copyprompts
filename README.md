# EmptyProject: MYney RPG MemoryCore CLI

EmptyProject is a local, file-based RPG MemoryCore powered by MYney.
It stores identity, team state, quests, pair work, handoffs, reminders, and
agent protocols in human-readable Markdown and JSON files.

No backend. No database. No external runtime dependency.

## Quick Start

```bash
npm run myney -- setup
```

The first setup creates the owner. MYney asks whether this is a solo project or
a team project. In team mode, choose one join model:

- `owner-approved`: owner maintains `myney-core/team/roster.json`.
- `open`: any valid codename can join by running setup.
- `invite`: owner creates invite codes with `myney invite create`.

Later users run the same setup command. MYney detects the initialized project
and activates or creates their member memory according to the chosen join mode.

## Commands

```bash
npm run myney -- setup
npm run myney -- whoami
npm run myney -- party
npm run myney -- quest add --title "Build first slice" --assignee moon
npm run myney -- quest list
npm run myney -- quest start <quest-id> --actor moon
npm run myney -- quest complete <quest-id> --actor moon
npm run myney -- pair start --actor moon --partner teammate --task "Wire feature"
npm run myney -- handoff --actor moon --finished "Shipped setup" --next "Run check" --blocker none
npm run myney -- invite create --actor moon --for teammate
npm run myney -- agent list
npm run myney -- check
```

## Development

```bash
npm test
```

The CLI is TypeScript and runs directly on Node 24 using type stripping.
There is no build step for v1.
