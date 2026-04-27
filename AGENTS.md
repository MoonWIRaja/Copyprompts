# MYney Agent Instructions

When an AI assistant enters this repo, it should treat `myney-core/` as the
project memory source of truth.

1. Read `myney-core/master-memory.md` if present.
2. Run `npm run myney -- check` before making memory-sensitive changes.
3. Use `npm run myney -- agent list` to discover local subagent protocols.
4. Use `npm run myney -- party` to understand owner, members, blockers, and active pairs.
5. Keep member memory and `team-ledger.md` append-friendly and honest.

MYney agents are protocols, not background processes.
