# MYney MemoryCore

This is the single source of truth for EmptyProject's MYney RPG MemoryCore.

AI assistants should read this file first. All memory, command protocols,
agent roles, roster state, members, invites, quests, reminders, and ledger
entries live here.

## Universal Commands

- `/myney-setup` - First-run owner bootstrap or returning member activation.
- `/myney-whoami` - Restore the active user and show current RPG state.
- `/myney-party` - Show owner, members, active pairs, blockers, and join mode.
- `/myney-quest` - Add, list, start, and complete RPG work quests.
- `/myney-pair` - Start, update, or end focused collaboration between two members.
- `/myney-handoff` - Save session end state, next action, and blockers.
- `/myney-invite` - Owner-only invite creation, listing, and revocation.
- `/myney-agent` - List or inspect MYney local subagent protocols.
- `/myney-skills` - List installed MYney skills and RPG coding class options.
- `/myney-memory` - Log or list conversation and memory-change journal entries.
- `/myney-todo` - Add, list, and complete persistent MemoryCore todos.
- `/myney-check` - Validate required MemoryCore files and consistency.

## Language Protocol

- Default conversation language: **Malay/English**.
- Default coding/adventure language: **TypeScript**.
- Members may override both during `/myney-setup`.
- Conversation language controls normal chat.
- Coding/adventure language controls code, technical names, quest wording, classes, and RPG flavor.

## Agents

- **MYney** (Grand Core Orchestrator) - Routes memory, team, quest, and agent work through the correct protocol.
- **Lumina** (Memory Archivist) - Maintains diary, consolidation, reminders, and long-term recall hygiene.
- **Nara** (Onboarding Steward) - Handles owner setup, member activation, roster rules, and invite flow.
- **Kaizen** (Questmaster) - Turns work into quests, phase gates, XP, and progress discipline.
- **Riven** (Builder Agent) - Transforms plans into scoped implementation tasks and handoffs.
- **Vega** (Integrity Guardian) - Runs preflight checks, schema validation, consistency checks, and risk review.
- **Echo** (Recall Agent) - Searches memory, ledger, reminders, handoffs, and agent protocols.

## Installed Skills

- **Language Protocol** (`/myney-setup`) - Sets conversation language and coding/adventure language per member.
- **Memory Journal** (`/myney-memory`) - Logs every meaningful conversation, setup choice, or memory change into MYNEY.md.
- **Todo Ledger** (`/myney-todo`) - Keeps open and completed todos so the core does not forget follow-ups.
- **Quest Engine** (`/myney-quest`) - Turns coding work into RPG quests with XP, owner, and completion state.
- **Party System** (`/myney-party`) - Tracks owner, active member, roster, pairings, blockers, and team mode.
- **Pair Sync** (`/myney-pair`) - Maintains cross-consistent pair state between two members.
- **Invite Gate** (`/myney-invite`) - Lets the owner control team activation with invite codes.
- **Agent Protocols** (`/myney-agent`) - Lists and explains MYney, Lumina, Nara, Kaizen, Riven, Vega, and Echo.
- **Integrity Check** (`/myney-check`) - Validates the single-file state, classes, skills, members, pairs, and todos.

## RPG Coding Classes

- **Necro Summoner** - Resurrects dead modules, migrates old code, and summons helper agents/tests.
- **Daemon Tamer** - Manages background jobs, queues, workers, dev servers, and long-running processes.
- **Stack Paladin** - Protects product flow across frontend, backend, database, and deployment.
- **Schema Druid** - Designs schemas, migrations, validation, fixtures, and data lifecycle.
- **Cipher Rogue** - Finds auth, crypto, API, and permission flaws before enemies do.
- **Compiler Monk** - Refines types, build checks, lint rules, and static correctness.
- **UI Illusionist** - Builds polished interactions, responsive layouts, states, and accessible UI.
- **Infra Warlock** - Handles Docker, servers, CI, secrets, observability, and release rituals.
- **Test Ranger** - Creates tests, probes edge cases, and guards critical paths.
- **Prompts Summoner** - Summons complex prompt chains and agentic entities from the void.

## Memory Discipline

- At the start or end of every meaningful conversation, add a `memoryJournal` entry.
- Any setup choice, memory change, todo change, quest update, invite, pair, or handoff must write both memory state and ledger where relevant.
- Todos live in `todos[]`; do not rely on chat history for follow-ups.

## Command Protocol

When a user types a `/myney-*` command:

1. Read this file.
2. Find the command in the JSON state block.
3. Read the current state before asking questions.
4. Update only the JSON state block unless the user asks to change the protocol text.
5. Keep ledger entries append-only.

## State

```json myney-state
{
  "schemaVersion": 1,
  "project": "EmptyProject",
  "coreName": "MYney",
  "initialized": true,
  "mode": "solo",
  "joinMode": "owner-approved",
  "owner": "moon",
  "activeMember": "moon",
  "defaultLanguagePreferences": {
    "conversationLanguage": "Malay/English",
    "codingLanguage": "TypeScript"
  },
  "approvedMembers": [
    "moon"
  ],
  "members": {
    "moon": {
      "name": "Moon",
      "codename": "moon",
      "role": "owner",
      "class": "Prompts Summoner",
      "level": 1,
      "xp": 100,
      "currentQuest": "Build Marketplace UI",
      "activePair": null,
      "inventory": [],
      "lastHandoff": "Marketplace UI refined with CreateModal and mock data.",
      "lastBlocker": null,
      "firstOnboarded": "2026-05-04T12:11:30+08:00",
      "lastSession": "2026-05-04T16:41:00+08:00",
      "sessionsCount": 3,
      "joinedVia": "solo",
      "languagePreferences": {
        "conversationLanguage": "Malay/English",
        "codingLanguage": "TypeScript"
      },
      "personalNotes": [],
      "createdAt": "2026-05-04T12:11:30+08:00",
      "updatedAt": "2026-05-04T16:41:00+08:00"
    }
  },
  "invites": {},
  "quests": {
    "q1": {
      "id": "q1",
      "title": "Build Marketplace UI",
      "description": "Create a premium marketplace interface for Copyprompts.",
      "status": "in-progress",
      "owner": "moon",
      "xpReward": 500,
      "startedAt": "2026-05-04T15:00:00+08:00",
      "completedAt": null
    }
  },
  "reminders": {
    "open": [],
    "completed": []
  },
  "memoryJournal": [
    {
      "id": "init-event",
      "at": "2026-05-04T12:11:30+08:00",
      "actor": "system",
      "kind": "setup",
      "summary": "MemoryCore initialized for Moon (Prompts Summoner)."
    },
    {
      "id": "marketplace-ui",
      "at": "2026-05-04T16:41:00+08:00",
      "actor": "MYney",
      "kind": "build",
      "summary": "Implemented Copyprompts Marketplace UI, including ComponentCard, CreateModal, and lib/data.ts integration. Set up /api/generate route and .env for Gemini."
    },
    {
      "id": "github-push",
      "at": "2026-05-04T16:49:40+08:00",
      "actor": "MYney",
      "kind": "deploy",
      "summary": "Initialized git, committed all files, created public GitHub repository 'MoonWIRaja/Copyprompts', and pushed the initial build."
    }
  ],
  "todos": [],
  "ledger": [
    {
      "at": "2026-05-04T12:11:30+08:00",
      "kind": "setup",
      "actor": "system",
      "message": "Initialized solo project by Moon (Prompts Summoner)"
    }
  ],
  "agents": [
    {
      "name": "MYney",
      "file": "myney.md",
      "title": "Grand Core Orchestrator",
      "purpose": "Routes memory, team, quest, and agent work through the correct protocol.",
      "commandHint": "Use for architecture, orchestration, and final decision flow."
    },
    {
      "name": "Lumina",
      "file": "lumina.md",
      "title": "Memory Archivist",
      "purpose": "Maintains diary, consolidation, reminders, and long-term recall hygiene.",
      "commandHint": "Use for save, recall, diary, and memory cleanup tasks."
    },
    {
      "name": "Nara",
      "file": "nara.md",
      "title": "Onboarding Steward",
      "purpose": "Handles owner setup, member activation, roster rules, and invite flow.",
      "commandHint": "Use for setup, party membership, and join-mode decisions."
    },
    {
      "name": "Kaizen",
      "file": "kaizen.md",
      "title": "Questmaster",
      "purpose": "Turns work into quests, phase gates, XP, and progress discipline.",
      "commandHint": "Use for quest planning, gates, blockers, and team cadence."
    },
    {
      "name": "Riven",
      "file": "riven.md",
      "title": "Builder Agent",
      "purpose": "Transforms plans into scoped implementation tasks and handoffs.",
      "commandHint": "Use for build execution, work plans, and implementation summaries."
    },
    {
      "name": "Vega",
      "file": "vega.md",
      "title": "Integrity Guardian",
      "purpose": "Runs preflight checks, schema validation, consistency checks, and risk review.",
      "commandHint": "Use before and after file-based memory changes."
    },
    {
      "name": "Echo",
      "file": "echo.md",
      "title": "Recall Agent",
      "purpose": "Searches memory, ledger, reminders, handoffs, and agent protocols.",
      "commandHint": "Use when someone asks what happened before or where context lives."
    }
  ],
  "commands": [
    {
      "command": "/myney-setup",
      "file": "setup.md",
      "purpose": "First-run owner bootstrap or returning member activation."
    },
    {
      "command": "/myney-whoami",
      "file": "whoami.md",
      "purpose": "Restore the active user and show current RPG state."
    },
    {
      "command": "/myney-party",
      "file": "party.md",
      "purpose": "Show owner, members, active pairs, blockers, and join mode."
    },
    {
      "command": "/myney-quest",
      "file": "quest.md",
      "purpose": "Add, list, start, and complete RPG work quests."
    },
    {
      "command": "/myney-pair",
      "file": "pair.md",
      "purpose": "Start, update, or end focused collaboration between two members."
    },
    {
      "command": "/myney-handoff",
      "file": "handoff.md",
      "purpose": "Save session end state, next action, and blockers."
    },
    {
      "command": "/myney-invite",
      "file": "invite.md",
      "purpose": "Owner-only invite creation, listing, and revocation."
    },
    {
      "command": "/myney-agent",
      "file": "agent.md",
      "purpose": "List or inspect MYney local subagent protocols."
    },
    {
      "command": "/myney-skills",
      "file": "skills.md",
      "purpose": "List installed MYney skills and RPG coding class options."
    },
    {
      "command": "/myney-memory",
      "file": "memory.md",
      "purpose": "Log or list conversation and memory-change journal entries."
    },
    {
      "command": "/myney-todo",
      "file": "todo.md",
      "purpose": "Add, list, and complete persistent MemoryCore todos."
    },
    {
      "command": "/myney-check",
      "file": "check.md",
      "purpose": "Validate required MemoryCore files and consistency."
    }
  ],
  "installedSkills": [
    {
      "name": "Language Protocol",
      "trigger": "/myney-setup",
      "purpose": "Sets conversation language and coding/adventure language per member."
    },
    {
      "name": "Memory Journal",
      "trigger": "/myney-memory",
      "purpose": "Logs every meaningful conversation, setup choice, or memory change into MYNEY.md."
    },
    {
      "name": "Todo Ledger",
      "trigger": "/myney-todo",
      "purpose": "Keeps open and completed todos so the core does not forget follow-ups."
    },
    {
      "name": "Quest Engine",
      "trigger": "/myney-quest",
      "purpose": "Turns coding work into RPG quests with XP, owner, and completion state."
    },
    {
      "name": "Party System",
      "trigger": "/myney-party",
      "purpose": "Tracks owner, active member, roster, pairings, blockers, and team mode."
    },
    {
      "name": "Pair Sync",
      "trigger": "/myney-pair",
      "purpose": "Maintains cross-consistent pair state between two members."
    },
    {
      "name": "Invite Gate",
      "trigger": "/myney-invite",
      "purpose": "Lets the owner control team activation with invite codes."
    },
    {
      "name": "Agent Protocols",
      "trigger": "/myney-agent",
      "purpose": "Lists and explains MYney, Lumina, Nara, Kaizen, Riven, Vega, and Echo."
    },
    {
      "name": "Integrity Check",
      "trigger": "/myney-check",
      "purpose": "Validates the single-file state, classes, skills, members, pairs, and todos."
    }
  ],
  "rpgClasses": [
    {
      "name": "Necro Summoner",
      "archetype": "Legacy reviver",
      "codingFocus": "Resurrects dead modules, migrates old code, and summons helper agents/tests.",
      "adventureStyle": "Controls fallen systems and turns broken code into useful allies."
    },
    {
      "name": "Daemon Tamer",
      "archetype": "Service handler",
      "codingFocus": "Manages background jobs, queues, workers, dev servers, and long-running processes.",
      "adventureStyle": "Tames wild daemons and keeps async beasts obedient."
    },
    {
      "name": "Stack Paladin",
      "archetype": "Full-stack defender",
      "codingFocus": "Protects product flow across frontend, backend, database, and deployment.",
      "adventureStyle": "Carries the shield for end-to-end vertical slices."
    },
    {
      "name": "Schema Druid",
      "archetype": "Data shapeshifter",
      "codingFocus": "Designs schemas, migrations, validation, fixtures, and data lifecycle.",
      "adventureStyle": "Speaks to data roots and grows clean system structures."
    },
    {
      "name": "Cipher Rogue",
      "archetype": "Security infiltrator",
      "codingFocus": "Finds auth, crypto, API, and permission flaws before enemies do.",
      "adventureStyle": "Moves quietly through attack surfaces with sharp eyes."
    },
    {
      "name": "Compiler Monk",
      "archetype": "Type discipline master",
      "codingFocus": "Refines types, build checks, lint rules, and static correctness.",
      "adventureStyle": "Meditates until red squiggles submit."
    },
    {
      "name": "UI Illusionist",
      "archetype": "Interface spellcaster",
      "codingFocus": "Builds polished interactions, responsive layouts, states, and accessible UI.",
      "adventureStyle": "Turns raw flows into convincing user-facing magic."
    },
    {
      "name": "Infra Warlock",
      "archetype": "Deployment conjurer",
      "codingFocus": "Handles Docker, servers, CI, secrets, observability, and release rituals.",
      "adventureStyle": "Binds clouds, ports, logs, and machines into one pact."
    },
    {
      "name": "Test Ranger",
      "archetype": "Regression tracker",
      "codingFocus": "Creates tests, probes edge cases, and guards critical paths.",
      "adventureStyle": "Tracks bugs through forests of behavior until nothing escapes."
    },
    {
      "name": "Prompts Summoner",
      "archetype": "AI Ritualist",
      "codingFocus": "Summons complex prompt chains and agentic entities from the void.",
      "adventureStyle": "Weaves words into powerful software spirits."
    }
  ],
  "createdAt": "2026-04-27T15:39:27.958+08:00",
  "updatedAt": "2026-05-04T12:13:49.600+08:00"
}
```
