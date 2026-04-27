# MYney Agent Instructions

When an AI assistant enters this repo, it should treat `.myney.core/` as the
project memory source of truth. This whole portable system lives inside
`.myney.core/`, so it does not need to touch the host repo root.

```text
.myney.core/
└── MYNEY.md
```

## Universal Command Router

If the user types a command that starts with `/myney-`, do this:

1. Read `.myney.core/MYNEY.md` if you are at the host repo root, or `MYNEY.md` if this folder is the current working directory.
2. Follow the command protocol and JSON state in that single file.
3. Read existing state before asking questions.
4. Keep the `ledger` array append-friendly and honest.

Command map:

- `/myney-setup` -> `commands[]` entry in `MYNEY.md`
- `/myney-whoami` -> `commands[]` entry in `MYNEY.md`
- `/myney-party` -> `commands[]` entry in `MYNEY.md`
- `/myney-quest` -> `commands[]` entry in `MYNEY.md`
- `/myney-pair` -> `commands[]` entry in `MYNEY.md`
- `/myney-handoff` -> `commands[]` entry in `MYNEY.md`
- `/myney-invite` -> `commands[]` entry in `MYNEY.md`
- `/myney-agent` -> `agents[]` entry in `MYNEY.md`
- `/myney-check` -> `commands[]` entry in `MYNEY.md`

## Optional CLI Mirror

The CLI is a helper, not the primary user interface:

- `npm run myney -- command list`
- `npm run myney -- command show setup`
- `npm run myney -- check`

MYney agents are protocols, not background processes.
