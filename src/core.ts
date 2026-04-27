import { randomBytes } from "node:crypto";
import { basename, join } from "node:path";
import {
  AGENTS,
  type CheckResult,
  type Invite,
  type JoinMode,
  type MemberMemory,
  type PairRecord,
  type ProjectMode,
  type Quest,
  type Roster
} from "./schema.ts";
import {
  CORE_DIR,
  corePath,
  ensureDir,
  exists,
  listFiles,
  pathOf,
  readJson,
  readText,
  timestamp,
  today,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./storage.ts";

export type SetupInput = {
  name: string;
  codename: string;
  className?: string;
  mode?: ProjectMode;
  joinMode?: JoinMode;
  roster?: string[];
  invite?: string;
};

const VALID_JOIN_MODES: JoinMode[] = ["owner-approved", "open", "invite"];
const VALID_MODES: ProjectMode[] = ["solo", "team"];

export function normalizeCodename(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}

export function assertCodename(input: string): string {
  const codename = normalizeCodename(input);
  if (!/^[a-z][a-z0-9-]*$/.test(codename)) {
    throw new Error(`Invalid codename "${input}". Use lowercase ASCII letters, numbers, and hyphens.`);
  }
  return codename;
}

function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "quest";
}

function memberPath(root: string, codename: string): string {
  return corePath(root, "members", `${codename}.json`);
}

function questPath(root: string, id: string): string {
  return corePath(root, "quests", `${id}.json`);
}

function invitePath(root: string, code: string): string {
  return corePath(root, "team", "invites", `${code.toUpperCase()}.json`);
}

function rosterPath(root: string): string {
  return corePath(root, "team", "roster.json");
}

function loadRoster(root: string): Roster {
  const file = rosterPath(root);
  if (!exists(file)) {
    throw new Error("MYney is not initialized. Run `npm run myney -- setup` first.");
  }
  return readJson<Roster>(file);
}

function saveRoster(root: string, roster: Roster): void {
  roster.updatedAt = timestamp();
  roster.members = [...new Set(roster.members)].sort();
  roster.approvedMembers = [...new Set(roster.approvedMembers)].sort();
  writeJson(rosterPath(root), roster);
}

function ensureKnownMember(root: string, codename: string): MemberMemory {
  const file = memberPath(root, codename);
  if (!exists(file)) {
    throw new Error(`Unknown member "${codename}". Run setup for that member first.`);
  }
  return readJson<MemberMemory>(file);
}

function saveMember(root: string, member: MemberMemory): void {
  member.updatedAt = timestamp();
  writeJson(memberPath(root, member.codename), member);
}

function resolveActor(root: string, actor?: string): MemberMemory {
  const roster = loadRoster(root);
  const codename = actor ? assertCodename(actor) : roster.activeMember;
  return ensureKnownMember(root, codename);
}

function createMember(input: {
  name: string;
  codename: string;
  role: "owner" | "member";
  className?: string;
  joinedVia: MemberMemory["joinedVia"];
}): MemberMemory {
  const now = timestamp();
  return {
    name: input.name.trim(),
    codename: input.codename,
    role: input.role,
    class: input.className?.trim() || (input.role === "owner" ? "Architect" : "Adventurer"),
    level: 1,
    xp: 0,
    currentQuest: null,
    activePair: null,
    inventory: [],
    lastHandoff: null,
    lastBlocker: null,
    firstOnboarded: now,
    lastSession: now,
    sessionsCount: 1,
    joinedVia: input.joinedVia,
    personalNotes: [],
    createdAt: now,
    updatedAt: now
  };
}

export function isInitialized(root: string): boolean {
  return exists(rosterPath(root));
}

export function ensureCoreSkeleton(root: string): void {
  const dirs = [
    corePath(root),
    corePath(root, "main"),
    corePath(root, "members"),
    corePath(root, "team"),
    corePath(root, "team", "invites"),
    corePath(root, "quests"),
    corePath(root, "agents")
  ];
  for (const dir of dirs) {
    ensureDir(dir);
  }

  writeTextIfMissing(
    corePath(root, "master-memory.md"),
    `# MYney Master Memory\n\nMYney is the Grand Core for EmptyProject.\n\nLoad order:\n\n1. Read \`myney-core/main/main-memory.md\`.\n2. Read \`myney-core/team/roster.json\`.\n3. Read active member memory from \`myney-core/members/\`.\n4. Use \`myney-core/agents/\` for local subagent protocols.\n`
  );
  writeTextIfMissing(
    corePath(root, "main", "main-memory.md"),
    `# MYney Main Memory\n\nEmptyProject uses a local RPG MemoryCore.\n\nCore rules:\n\n- Members are real users with persistent JSON memory.\n- Quests are work items.\n- Pairs represent focused collaboration.\n- The team ledger is append-only.\n- Agents are markdown protocols, not background processes.\n`
  );
  writeTextIfMissing(
    corePath(root, "main", "current-session.md"),
    `# Current Session\n\nRun \`npm run myney -- whoami\` to restore the active member.\n`
  );
  writeTextIfMissing(corePath(root, "main", "reminders.md"), "# Reminders\n\n## Open\n\n## Completed\n");
  writeTextIfMissing(
    corePath(root, "members", "README.md"),
    `# Members\n\nEach member gets one JSON file named \`<codename>.json\`.\n\nThe first setup creates the owner. Later setup runs activate members according to the configured join mode.\n`
  );
  writeTextIfMissing(
    corePath(root, "team", "team-ledger.md"),
    `# Team Ledger\n\nAppend-only log for decisions, blockers, pairs, handoffs, quest completions, and gates.\n\n## Legend\n\n- OWNER\n- JOIN\n- INVITE\n- QUEST\n- PAIR\n- HANDOFF\n- BLOCKER\n- CHECK\n\n## Entries\n`
  );
  writeAgents(root);
}

export function writeAgents(root: string): void {
  for (const agent of AGENTS) {
    writeTextIfMissing(
      corePath(root, "agents", agent.file),
      `# ${agent.name} - ${agent.title}\n\n## Purpose\n${agent.purpose}\n\n## When To Use\n${agent.commandHint}\n\n## Protocol\n- Read \`myney-core/master-memory.md\` before acting.\n- Respect the current project roster and active member.\n- Keep file-based memory consistent and append-friendly.\n- If the task writes member state, update the relevant member JSON and team ledger.\n`
    );
  }
  writeJson(corePath(root, "agents", "agents.json"), AGENTS);
}

export function appendLedger(root: string, kind: string, actor: string, message: string): void {
  ensureCoreSkeleton(root);
  const file = corePath(root, "team", "team-ledger.md");
  const date = today();
  const line = `- **${timestamp()} · ${kind} · ${actor}** · ${message}\n`;
  let content = readText(file);
  if (!content.includes(`### ${date}`)) {
    content = `${content.trimEnd()}\n\n### ${date}\n\n`;
  }
  writeText(file, `${content.trimEnd()}\n${line}`);
}

export function runSetup(root: string, input: SetupInput): string {
  ensureCoreSkeleton(root);
  const codename = assertCodename(input.codename);
  if (!input.name.trim()) {
    throw new Error("Name is required.");
  }

  if (!isInitialized(root)) {
    return initializeProject(root, { ...input, codename });
  }
  return activateMember(root, { ...input, codename });
}

function initializeProject(root: string, input: SetupInput & { codename: string }): string {
  const mode = input.mode || "solo";
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Invalid mode "${mode}". Use solo or team.`);
  }
  const joinMode = mode === "team" ? input.joinMode || "owner-approved" : "owner-approved";
  if (!VALID_JOIN_MODES.includes(joinMode)) {
    throw new Error(`Invalid join mode "${joinMode}".`);
  }
  const owner = input.codename;
  const approvedMembers = new Set([owner, ...(input.roster || []).map(assertCodename)]);
  const now = timestamp();
  const roster: Roster = {
    project: "EmptyProject",
    coreName: "MYney",
    initialized: true,
    mode,
    joinMode,
    owner,
    activeMember: owner,
    members: [owner],
    approvedMembers: [...approvedMembers].sort(),
    createdAt: now,
    updatedAt: now
  };
  writeJson(rosterPath(root), roster);
  const member = createMember({
    name: input.name,
    codename: owner,
    role: "owner",
    className: input.className,
    joinedVia: mode === "solo" ? "solo" : "owner"
  });
  saveMember(root, member);
  appendLedger(root, "OWNER", owner, `Initialized ${mode} MemoryCore with join mode ${joinMode}.`);
  return `MYney initialized. Owner ${member.name} (${owner}) is active.`;
}

function activateMember(root: string, input: SetupInput & { codename: string }): string {
  const roster = loadRoster(root);
  const existingFile = memberPath(root, input.codename);
  if (exists(existingFile)) {
    const member = readJson<MemberMemory>(existingFile);
    member.lastSession = timestamp();
    member.sessionsCount += 1;
    saveMember(root, member);
    roster.activeMember = member.codename;
    if (!roster.members.includes(member.codename)) {
      roster.members.push(member.codename);
    }
    saveRoster(root, roster);
    return `Welcome back, ${member.name}. Active member: ${member.codename}.`;
  }

  if (roster.mode === "solo") {
    throw new Error("This MemoryCore is in solo mode. Only the owner can activate.");
  }

  let joinedVia: JoinMode = roster.joinMode;
  if (roster.joinMode === "owner-approved") {
    if (!roster.approvedMembers.includes(input.codename)) {
      throw new Error(`Member "${input.codename}" is not in the owner-approved roster.`);
    }
  }
  if (roster.joinMode === "invite") {
    if (!input.invite) {
      throw new Error("Invite code is required for this MemoryCore.");
    }
    const invite = readInvite(root, input.invite);
    if (invite.status !== "active") {
      throw new Error(`Invite "${input.invite}" is ${invite.status}.`);
    }
    if (invite.codename && invite.codename !== input.codename) {
      throw new Error(`Invite "${input.invite}" is reserved for ${invite.codename}.`);
    }
    invite.status = "used";
    invite.usedBy = input.codename;
    invite.usedAt = timestamp();
    writeJson(invitePath(root, invite.code), invite);
    joinedVia = "invite";
  }

  const member = createMember({
    name: input.name,
    codename: input.codename,
    role: "member",
    className: input.className,
    joinedVia
  });
  saveMember(root, member);
  roster.members.push(member.codename);
  roster.activeMember = member.codename;
  if (!roster.approvedMembers.includes(member.codename)) {
    roster.approvedMembers.push(member.codename);
  }
  saveRoster(root, roster);
  appendLedger(root, "JOIN", member.codename, `Joined via ${joinedVia}.`);
  return `Member ${member.name} (${member.codename}) activated via ${joinedVia}.`;
}

export function renderWhoami(root: string, actor?: string): string {
  const member = resolveActor(root, actor);
  member.lastSession = timestamp();
  member.sessionsCount += 1;
  saveMember(root, member);
  const quest = member.currentQuest ? loadQuest(root, member.currentQuest) : null;
  const lines = [
    `${member.name} (${member.codename})`,
    `Role: ${member.role}`,
    `Class: ${member.class}`,
    `Level: ${member.level}`,
    `XP: ${member.xp}`,
    `Session: #${member.sessionsCount}`,
    `Current quest: ${quest ? `${quest.id} - ${quest.title}` : "none"}`,
    `Active pair: ${member.activePair ? `${member.activePair.partner} on ${member.activePair.task}` : "none"}`,
    `Last blocker: ${member.lastBlocker || "none"}`
  ];
  if (member.lastHandoff) {
    lines.push(`Last handoff: ${member.lastHandoff.finished} Next: ${member.lastHandoff.nextAction}`);
  }
  return lines.join("\n");
}

export function renderParty(root: string): string {
  const roster = loadRoster(root);
  const lines = [
    `Project: ${roster.project}`,
    `Core: ${roster.coreName}`,
    `Mode: ${roster.mode}`,
    `Join mode: ${roster.joinMode}`,
    `Owner: ${roster.owner}`,
    `Active member: ${roster.activeMember}`,
    "",
    "Members:"
  ];
  for (const codename of roster.members) {
    const member = ensureKnownMember(root, codename);
    const pair = member.activePair ? ` pair:${member.activePair.partner}` : "";
    const blocker = member.lastBlocker ? ` blocker:${member.lastBlocker}` : "";
    const quest = member.currentQuest ? ` quest:${member.currentQuest}` : "";
    lines.push(`- ${member.codename} (${member.name}) class:${member.class} level:${member.level}${quest}${pair}${blocker}`);
  }
  return lines.join("\n");
}

function loadQuest(root: string, id: string): Quest {
  const file = questPath(root, id);
  if (!exists(file)) {
    throw new Error(`Unknown quest "${id}".`);
  }
  return readJson<Quest>(file);
}

function saveQuest(root: string, quest: Quest): void {
  quest.updatedAt = timestamp();
  writeJson(questPath(root, quest.id), quest);
}

export function addQuest(root: string, input: {
  actor?: string;
  title: string;
  id?: string;
  assignee?: string;
  xp?: number;
  gate?: string;
}): string {
  const actor = resolveActor(root, input.actor);
  if (!input.title?.trim()) {
    throw new Error("Quest title is required.");
  }
  const id = input.id ? slugify(input.id) : `${slugify(input.title)}-${Date.now().toString(36)}`;
  if (exists(questPath(root, id))) {
    throw new Error(`Quest "${id}" already exists.`);
  }
  const assignee = input.assignee ? assertCodename(input.assignee) : null;
  if (assignee) {
    ensureKnownMember(root, assignee);
  }
  const now = timestamp();
  const quest: Quest = {
    id,
    title: input.title.trim(),
    status: "open",
    assignedTo: assignee,
    createdBy: actor.codename,
    xp: Number.isFinite(input.xp) ? Math.max(0, Math.trunc(input.xp || 0)) : 25,
    gate: input.gate?.trim() || null,
    notes: [],
    createdAt: now,
    startedAt: null,
    completedAt: null,
    updatedAt: now
  };
  saveQuest(root, quest);
  appendLedger(root, "QUEST", actor.codename, `Added ${quest.id}: ${quest.title}.`);
  return `Quest added: ${quest.id}`;
}

export function listQuests(root: string): string {
  ensureCoreSkeleton(root);
  const files = listFiles(corePath(root, "quests")).filter((file) => file.endsWith(".json"));
  if (files.length === 0) {
    return "No quests yet.";
  }
  return files
    .map((file) => readJson<Quest>(corePath(root, "quests", file)))
    .map((quest) => `- ${quest.id} [${quest.status}] ${quest.title} -> ${quest.assignedTo || "unassigned"} (${quest.xp} XP)`)
    .join("\n");
}

export function startQuest(root: string, id: string, actorName?: string): string {
  const actor = resolveActor(root, actorName);
  const quest = loadQuest(root, id);
  if (quest.status === "completed") {
    throw new Error(`Quest "${id}" is already completed.`);
  }
  quest.status = "active";
  quest.startedAt ||= timestamp();
  quest.assignedTo ||= actor.codename;
  saveQuest(root, quest);
  const assignee = ensureKnownMember(root, quest.assignedTo);
  assignee.currentQuest = quest.id;
  saveMember(root, assignee);
  appendLedger(root, "QUEST", actor.codename, `Started ${quest.id}.`);
  return `Quest started: ${quest.id}`;
}

export function completeQuest(root: string, id: string, actorName?: string): string {
  const actor = resolveActor(root, actorName);
  const quest = loadQuest(root, id);
  if (quest.status === "completed") {
    throw new Error(`Quest "${id}" is already completed.`);
  }
  quest.status = "completed";
  quest.completedAt = timestamp();
  saveQuest(root, quest);
  const assignee = ensureKnownMember(root, quest.assignedTo || actor.codename);
  assignee.xp += quest.xp;
  assignee.level = Math.floor(assignee.xp / 100) + 1;
  if (assignee.currentQuest === quest.id) {
    assignee.currentQuest = null;
  }
  assignee.inventory.push(`Quest clear: ${quest.title}`);
  saveMember(root, assignee);
  appendLedger(root, "QUEST", actor.codename, `Completed ${quest.id}; ${assignee.codename} gained ${quest.xp} XP.`);
  return `Quest completed: ${quest.id}`;
}

export function startPair(root: string, input: { actor?: string; partner: string; task: string }): string {
  const actor = resolveActor(root, input.actor);
  const partner = ensureKnownMember(root, assertCodename(input.partner));
  if (actor.codename === partner.codename) {
    throw new Error("A member cannot pair with themselves.");
  }
  if (!input.task?.trim()) {
    throw new Error("Pair task is required.");
  }
  const now = timestamp();
  const actorPair: PairRecord = { partner: partner.codename, task: input.task.trim(), startedAt: now, updatedAt: now };
  const partnerPair: PairRecord = { partner: actor.codename, task: input.task.trim(), startedAt: now, updatedAt: now };
  actor.activePair = actorPair;
  partner.activePair = partnerPair;
  saveMember(root, actor);
  saveMember(root, partner);
  appendLedger(root, "PAIR", actor.codename, `${actor.codename} + ${partner.codename}: ${input.task.trim()}.`);
  return `Pair started: ${actor.codename} + ${partner.codename}`;
}

export function updatePair(root: string, input: { actor?: string; task?: string; note?: string; status?: string }): string {
  const actor = resolveActor(root, input.actor);
  if (!actor.activePair) {
    throw new Error(`${actor.codename} has no active pair.`);
  }
  const partner = ensureKnownMember(root, actor.activePair.partner);
  const summary = input.task || input.status || input.note;
  if (!summary?.trim()) {
    throw new Error("Pair update needs --task, --status, or --note.");
  }
  if (input.task?.trim()) {
    actor.activePair.task = input.task.trim();
    if (partner.activePair) {
      partner.activePair.task = input.task.trim();
    }
  }
  actor.activePair.updatedAt = timestamp();
  if (partner.activePair) {
    partner.activePair.updatedAt = actor.activePair.updatedAt;
  }
  saveMember(root, actor);
  saveMember(root, partner);
  appendLedger(root, "PAIR", actor.codename, `Update with ${partner.codename}: ${summary.trim()}.`);
  return `Pair updated: ${actor.codename} + ${partner.codename}`;
}

export function endPair(root: string, input: { actor?: string; summary: string }): string {
  const actor = resolveActor(root, input.actor);
  if (!actor.activePair) {
    throw new Error(`${actor.codename} has no active pair.`);
  }
  const partner = ensureKnownMember(root, actor.activePair.partner);
  const partnerName = partner.codename;
  actor.activePair = null;
  partner.activePair = null;
  saveMember(root, actor);
  saveMember(root, partner);
  appendLedger(root, "PAIR", actor.codename, `Closed pair with ${partnerName}. Summary: ${input.summary || "none"}.`);
  return `Pair ended: ${actor.codename} + ${partnerName}`;
}

export function handoff(root: string, input: {
  actor?: string;
  finished: string;
  nextAction: string;
  blocker?: string;
}): string {
  const actor = resolveActor(root, input.actor);
  const blocker = input.blocker && !["none", "takde", "no"].includes(input.blocker.toLowerCase()) ? input.blocker : null;
  actor.lastHandoff = {
    at: timestamp(),
    finished: input.finished.trim(),
    nextAction: input.nextAction.trim(),
    blockerAtHandoff: blocker
  };
  actor.lastSession = actor.lastHandoff.at;
  actor.lastBlocker = blocker;
  saveMember(root, actor);
  appendLedger(root, blocker ? "BLOCKER" : "HANDOFF", actor.codename, `Finished: ${input.finished.trim()}. Next: ${input.nextAction.trim()}.`);
  return `Handoff saved for ${actor.codename}.`;
}

function requireOwner(root: string, actorName?: string): MemberMemory {
  const roster = loadRoster(root);
  const actor = resolveActor(root, actorName);
  if (actor.codename !== roster.owner) {
    throw new Error("Only the owner can manage invites.");
  }
  return actor;
}

function readInvite(root: string, code: string): Invite {
  const file = invitePath(root, code);
  if (!exists(file)) {
    throw new Error(`Invite "${code}" does not exist.`);
  }
  return readJson<Invite>(file);
}

export function createInvite(root: string, input: { actor?: string; code?: string; codename?: string }): string {
  const actor = requireOwner(root, input.actor);
  const code = (input.code || randomBytes(4).toString("hex")).toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(code)) {
    throw new Error("Invite code must use uppercase letters, numbers, or hyphens.");
  }
  if (exists(invitePath(root, code))) {
    throw new Error(`Invite "${code}" already exists.`);
  }
  const invite: Invite = {
    code,
    status: "active",
    codename: input.codename ? assertCodename(input.codename) : null,
    createdBy: actor.codename,
    createdAt: timestamp(),
    usedBy: null,
    usedAt: null,
    revokedAt: null
  };
  writeJson(invitePath(root, code), invite);
  appendLedger(root, "INVITE", actor.codename, `Created invite ${code}${invite.codename ? ` for ${invite.codename}` : ""}.`);
  return `Invite created: ${code}`;
}

export function listInvites(root: string): string {
  ensureCoreSkeleton(root);
  const files = listFiles(corePath(root, "team", "invites")).filter((file) => file.endsWith(".json"));
  if (files.length === 0) {
    return "No invites.";
  }
  return files
    .map((file) => readJson<Invite>(corePath(root, "team", "invites", file)))
    .map((invite) => `- ${invite.code} [${invite.status}] for ${invite.codename || "anyone"} usedBy:${invite.usedBy || "-"}`)
    .join("\n");
}

export function revokeInvite(root: string, input: { actor?: string; code: string }): string {
  const actor = requireOwner(root, input.actor);
  const invite = readInvite(root, input.code);
  if (invite.status !== "active") {
    throw new Error(`Invite "${invite.code}" is already ${invite.status}.`);
  }
  invite.status = "revoked";
  invite.revokedAt = timestamp();
  writeJson(invitePath(root, invite.code), invite);
  appendLedger(root, "INVITE", actor.codename, `Revoked invite ${invite.code}.`);
  return `Invite revoked: ${invite.code}`;
}

export function listAgents(root: string): string {
  ensureCoreSkeleton(root);
  return AGENTS.map((agent) => `- ${agent.name}: ${agent.title} (${agent.file})`).join("\n");
}

export function showAgent(root: string, name: string): string {
  ensureCoreSkeleton(root);
  const target = AGENTS.find((agent) => agent.name.toLowerCase() === name.toLowerCase() || agent.file === name);
  if (!target) {
    throw new Error(`Unknown agent "${name}".`);
  }
  return readText(corePath(root, "agents", target.file));
}

export function checkProject(root: string): CheckResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  const required = [
    corePath(root, "master-memory.md"),
    corePath(root, "main", "main-memory.md"),
    corePath(root, "main", "current-session.md"),
    corePath(root, "main", "reminders.md"),
    corePath(root, "members", "README.md"),
    rosterPath(root),
    corePath(root, "team", "team-ledger.md"),
    corePath(root, "team", "invites"),
    corePath(root, "quests"),
    corePath(root, "agents")
  ];
  for (const item of required) {
    if (!exists(item)) {
      failures.push(`Missing ${item.replace(`${root}/`, "")}`);
    }
  }
  for (const agent of AGENTS) {
    if (!exists(corePath(root, "agents", agent.file))) {
      failures.push(`Missing agent ${agent.file}`);
    }
  }
  if (!exists(rosterPath(root))) {
    return { ok: false, failures, warnings };
  }

  try {
    const roster = readJson<Roster>(rosterPath(root));
    if (!roster.owner) failures.push("Roster has no owner.");
    if (!VALID_MODES.includes(roster.mode)) failures.push(`Invalid project mode ${roster.mode}.`);
    if (!VALID_JOIN_MODES.includes(roster.joinMode)) failures.push(`Invalid join mode ${roster.joinMode}.`);
    if (!roster.members.includes(roster.owner)) failures.push("Owner is not listed as a member.");
    for (const codename of roster.members) {
      const file = memberPath(root, codename);
      if (!exists(file)) {
        failures.push(`Roster member ${codename} has no member JSON.`);
        continue;
      }
      const member = readJson<MemberMemory>(file);
      if (member.codename !== codename) failures.push(`${basename(file)} codename mismatch.`);
      try {
        assertCodename(member.codename);
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
      if (member.activePair) {
        const partnerFile = memberPath(root, member.activePair.partner);
        if (!exists(partnerFile)) {
          failures.push(`${member.codename} pairs with missing ${member.activePair.partner}.`);
        } else {
          const partner = readJson<MemberMemory>(partnerFile);
          if (!partner.activePair || partner.activePair.partner !== member.codename) {
            failures.push(`${member.codename} pair with ${partner.codename} is not cross-consistent.`);
          }
          if (partner.activePair && partner.activePair.task !== member.activePair.task) {
            failures.push(`${member.codename} pair task differs from ${partner.codename}.`);
          }
        }
      }
    }
  } catch (error) {
    failures.push(`Roster/member parse failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  for (const file of listFiles(corePath(root, "team", "invites")).filter((name) => name.endsWith(".json"))) {
    try {
      readJson<Invite>(join(corePath(root, "team", "invites"), file));
    } catch (error) {
      failures.push(`Invite ${file} is not valid JSON.`);
    }
  }
  for (const file of listFiles(corePath(root, "quests")).filter((name) => name.endsWith(".json"))) {
    try {
      readJson<Quest>(join(corePath(root, "quests"), file));
    } catch (error) {
      failures.push(`Quest ${file} is not valid JSON.`);
    }
  }
  if (!exists(pathOf(root, "setup.md"))) warnings.push("setup.md is missing from repo root.");
  return { ok: failures.length === 0, failures, warnings };
}

export function renderCheck(result: CheckResult): string {
  const lines = [result.ok ? "MYney check passed." : "MYney check failed."];
  if (result.failures.length) {
    lines.push("", "Failures:", ...result.failures.map((failure) => `- ${failure}`));
  }
  if (result.warnings.length) {
    lines.push("", "Warnings:", ...result.warnings.map((warning) => `- ${warning}`));
  }
  return lines.join("\n");
}

