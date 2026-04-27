import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(projectRoot, "src", "cli.ts");

function run(cwd: string, args: string[]) {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", cli, ...args], {
    cwd,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function json<T>(root: string, path: string): T {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as T;
}

describe("MYney workflow", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "myney-flow-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("runs the acceptance flow from owner setup to party state", () => {
    run(root, ["setup", "--name", "Moon", "--codename", "moon", "--mode", "team", "--join-mode", "invite"]);
    run(root, ["invite", "create", "--actor", "moon", "--for", "ally", "--code", "ALLY-001"]);
    run(root, ["setup", "--name", "Ally", "--codename", "ally", "--class", "Scout", "--invite", "ALLY-001"]);
    run(root, ["quest", "add", "--actor", "moon", "--title", "Forge the first memory gate", "--id", "memory-gate", "--assignee", "ally", "--xp", "75"]);
    run(root, ["quest", "start", "memory-gate", "--actor", "ally"]);
    run(root, ["pair", "start", "--actor", "moon", "--partner", "ally", "--task", "Connect setup with quest state"]);
    run(root, ["handoff", "--actor", "ally", "--finished", "Setup and quest state verified", "--next", "Run MYney check", "--blocker", "none"]);

    const party = run(root, ["party"]);
    assert.match(party.stdout, /moon/);
    assert.match(party.stdout, /ally/);
    assert.match(party.stdout, /pair:ally/);
    assert.match(party.stdout, /quest:memory-gate/);

    const check = run(root, ["check"]);
    assert.match(check.stdout, /MYney check passed/);
  });

  it("keeps pair state cross-consistent and completes quests with XP", () => {
    run(root, ["setup", "--name", "Moon", "--codename", "moon", "--mode", "team", "--join-mode", "open"]);
    run(root, ["setup", "--name", "Vega", "--codename", "vega", "--class", "Guardian"]);
    run(root, ["quest", "add", "--actor", "moon", "--title", "Validate schemas", "--id", "schema-check", "--assignee", "vega", "--xp", "125"]);
    run(root, ["quest", "start", "schema-check", "--actor", "vega"]);
    run(root, ["pair", "start", "--actor", "moon", "--partner", "vega", "--task", "Schema validation"]);

    const moon = json<{ activePair: { partner: string; task: string } }>(root, "myney-core/members/moon.json");
    const vega = json<{ activePair: { partner: string; task: string } }>(root, "myney-core/members/vega.json");
    assert.equal(moon.activePair.partner, "vega");
    assert.equal(vega.activePair.partner, "moon");
    assert.equal(moon.activePair.task, vega.activePair.task);

    run(root, ["quest", "complete", "schema-check", "--actor", "vega"]);
    const updated = json<{ xp: number; level: number; currentQuest: string | null; inventory: string[] }>(root, "myney-core/members/vega.json");
    assert.equal(updated.xp, 125);
    assert.equal(updated.level, 2);
    assert.equal(updated.currentQuest, null);
    assert.equal(updated.inventory.length, 1);
  });

  it("lists and shows local agent protocols", () => {
    run(root, ["setup", "--name", "Moon", "--codename", "moon", "--mode", "solo"]);
    const list = run(root, ["agent", "list"]);
    assert.match(list.stdout, /MYney/);
    assert.match(list.stdout, /Lumina/);
    assert.match(list.stdout, /Echo/);

    const show = run(root, ["agent", "show", "Vega"]);
    assert.match(show.stdout, /Integrity Guardian/);
  });
});

