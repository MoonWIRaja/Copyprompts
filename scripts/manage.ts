import { spawn, spawnSync } from "bun";
import { mkdir, rename, exists, writeFile } from "node:fs/promises";
import { join } from "node:path";

const APPS = [
  { name: "web", port: 3000, path: "apps/web" },
  { name: "backend", port: 3001, path: "apps/backend" },
  { name: "docs", port: 3002, path: "apps/docs" },
];

const LOG_ROOT = ".logs";

async function killPorts() {
  console.log("🔍 Checking for existing processes on target ports...");
  for (const app of APPS) {
    const result = spawnSync(["lsof", "-ti", `:${app.port}`]);
    const pids = result.stdout.toString().trim().split("\n").filter(Boolean);
    if (pids.length > 0) {
      console.log(`💀 Killing ${app.name} on port ${app.port} (PIDs: ${pids.join(", ")})`);
      spawnSync(["kill", "-9", ...pids]);
    }
  }
}

async function handleLogsOnStop() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "-"); // DD-MM-YYYY
  const timeStr = now.toLocaleTimeString("en-US", { 
    hour12: true, 
    hour: "2-digit", 
    minute: "2-digit" 
  }).replace(/ /g, "").replace(/:/g, "."); // 12.26PM

  for (const app of APPS) {
    const latestLog = join(LOG_ROOT, app.name, "latest.log");
    if (await exists(latestLog)) {
      const appLogDir = join(LOG_ROOT, app.name);
      const finalLog = join(appLogDir, `${timeStr}_${dateStr}.log`);
      await rename(latestLog, finalLog);
      console.log(`📂 Archived log: ${finalLog}`);
    }
  }
}

const command = process.argv[2];

if (command === "dev") {
  await killPorts();
  console.log("🚀 Starting Development Mode...");
  spawn(["bunx", "turbo", "run", "dev"], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
} else if (command === "start") {
  await killPorts();
  console.log("📡 Starting Apps in Background...");

  for (const app of APPS) {
    const appLogDir = join(LOG_ROOT, app.name);
    await mkdir(appLogDir, { recursive: true });
    const latestLog = join(appLogDir, "latest.log");

    console.log(`📦 [${app.name}] Logging to ${latestLog}`);
    
    const out = Bun.file(latestLog);
    
    // Start the process in background
    spawn(["bun", "run", "dev"], {
      cwd: app.path,
      stdout: out,
      stderr: out,
    });
  }
  console.log("\n✅ All apps are running in background.");
  console.log("👉 Use 'bun run stop' to stop them and archive logs.");
} else if (command === "stop") {
  await killPorts();
  await handleLogsOnStop();
  console.log("🛑 All processes stopped and logs archived.");
} else {
  console.log("Usage: bun run scripts/manage.ts [dev|start|stop]");
}
