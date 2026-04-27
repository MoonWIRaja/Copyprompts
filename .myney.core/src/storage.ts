import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const CORE_DIR = ".";

export function pathOf(root: string, ...parts: string[]): string {
  return join(root, ...parts);
}

export function corePath(root: string, ...parts: string[]): string {
  return join(root, ...parts);
}

export function exists(path: string): boolean {
  return existsSync(path);
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function writeText(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf8");
}

export function writeTextIfMissing(path: string, content: string): void {
  if (!existsSync(path)) {
    writeText(path, content);
  }
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

export function readJson<T>(path: string): T {
  return JSON.parse(readText(path)) as T;
}

export function writeJson(path: string, value: unknown): void {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function listFiles(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

export function timestamp(now = new Date()): string {
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const sec = pad(now.getSeconds());
  const ms = pad(now.getMilliseconds(), 3);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}.${ms}${sign}${oh}:${om}`;
}

export function today(): string {
  return timestamp().slice(0, 10);
}
