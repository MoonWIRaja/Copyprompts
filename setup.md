# setup.md

This file is the universal entrypoint for MYney.

Run this in the project root:

```bash
npm run myney -- setup
```

## First Run

The first person to run setup becomes the owner.

MYney will ask:

1. Your display name.
2. Your codename.
3. Your RPG class.
4. Whether the project is `solo` or `team`.
5. If team, which join mode to use:
   - `owner-approved`
   - `open`
   - `invite`

## Returning Runs

After the project is initialized, every member runs the same setup command.
MYney detects the existing MemoryCore and activates that user.

## Non-Interactive Examples

Owner, solo:

```bash
npm run myney -- setup --name Moon --codename moon --mode solo --class Architect
```

Owner, team invite mode:

```bash
npm run myney -- setup --name Moon --codename moon --mode team --join-mode invite --class Architect
npm run myney -- invite create --actor moon --for ally --code ALLY-001
npm run myney -- setup --name Ally --codename ally --class Scout --invite ALLY-001
```

Owner-approved roster mode:

```bash
npm run myney -- setup --name Moon --codename moon --mode team --join-mode owner-approved --roster ally,riven
npm run myney -- setup --name Ally --codename ally --class Scout
```

Open team mode:

```bash
npm run myney -- setup --name Moon --codename moon --mode team --join-mode open
npm run myney -- setup --name Newcomer --codename newcomer --class Scribe
```
