export type ProjectMode = "solo" | "team";
export type JoinMode = "owner-approved" | "open" | "invite";
export type MemberRole = "owner" | "member";
export type QuestStatus = "open" | "active" | "completed";
export type InviteStatus = "active" | "used" | "revoked";

export type PairRecord = {
  partner: string;
  task: string;
  startedAt: string;
  updatedAt: string;
};

export type HandoffRecord = {
  at: string;
  finished: string;
  nextAction: string;
  blockerAtHandoff: string | null;
};

export type MemberMemory = {
  name: string;
  codename: string;
  role: MemberRole;
  class: string;
  level: number;
  xp: number;
  currentQuest: string | null;
  activePair: PairRecord | null;
  inventory: string[];
  lastHandoff: HandoffRecord | null;
  lastBlocker: string | null;
  firstOnboarded: string;
  lastSession: string;
  sessionsCount: number;
  joinedVia: JoinMode | "owner" | "solo";
  personalNotes: Array<{ at: string; note: string }>;
  createdAt: string;
  updatedAt: string;
};

export type Roster = {
  project: "EmptyProject";
  coreName: "MYney";
  initialized: true;
  mode: ProjectMode;
  joinMode: JoinMode;
  owner: string;
  activeMember: string;
  members: string[];
  approvedMembers: string[];
  createdAt: string;
  updatedAt: string;
};

export type Invite = {
  code: string;
  status: InviteStatus;
  codename: string | null;
  createdBy: string;
  createdAt: string;
  usedBy: string | null;
  usedAt: string | null;
  revokedAt: string | null;
};

export type Quest = {
  id: string;
  title: string;
  status: QuestStatus;
  assignedTo: string | null;
  createdBy: string;
  xp: number;
  gate: string | null;
  notes: string[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type AgentProtocol = {
  name: string;
  file: string;
  title: string;
  purpose: string;
  commandHint: string;
};

export type CheckResult = {
  ok: boolean;
  failures: string[];
  warnings: string[];
};

export const AGENTS: AgentProtocol[] = [
  {
    name: "MYney",
    file: "myney.md",
    title: "Grand Core Orchestrator",
    purpose: "Routes memory, team, quest, and agent work through the correct protocol.",
    commandHint: "Use for architecture, orchestration, and final decision flow."
  },
  {
    name: "Lumina",
    file: "lumina.md",
    title: "Memory Archivist",
    purpose: "Maintains diary, consolidation, reminders, and long-term recall hygiene.",
    commandHint: "Use for save, recall, diary, and memory cleanup tasks."
  },
  {
    name: "Nara",
    file: "nara.md",
    title: "Onboarding Steward",
    purpose: "Handles owner setup, member activation, roster rules, and invite flow.",
    commandHint: "Use for setup, party membership, and join-mode decisions."
  },
  {
    name: "Kaizen",
    file: "kaizen.md",
    title: "Questmaster",
    purpose: "Turns work into quests, phase gates, XP, and progress discipline.",
    commandHint: "Use for quest planning, gates, blockers, and team cadence."
  },
  {
    name: "Riven",
    file: "riven.md",
    title: "Builder Agent",
    purpose: "Transforms plans into scoped implementation tasks and handoffs.",
    commandHint: "Use for build execution, work plans, and implementation summaries."
  },
  {
    name: "Vega",
    file: "vega.md",
    title: "Integrity Guardian",
    purpose: "Runs preflight checks, schema validation, consistency checks, and risk review.",
    commandHint: "Use before and after file-based memory changes."
  },
  {
    name: "Echo",
    file: "echo.md",
    title: "Recall Agent",
    purpose: "Searches memory, ledger, reminders, handoffs, and agent protocols.",
    commandHint: "Use when someone asks what happened before or where context lives."
  }
];

