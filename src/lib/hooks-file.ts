import { readFile } from "fs/promises";
import path from "path";

const HOOKS_FILE = path.join(process.cwd(), "data", "hooks.txt");
const MAX_HOOKS_SAMPLE = 20;

/**
 * Read hook inspiration from static file (data/hooks.txt).
 * One hook per line; lines starting with # are ignored.
 * Returns a random sample of up to MAX_HOOKS_SAMPLE hooks for AI context.
 */
export async function getHookInspirationSample(): Promise<string[]> {
  try {
    const content = await readFile(HOOKS_FILE, "utf-8");
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
    if (lines.length === 0) return [];
    const shuffled = [...lines].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, MAX_HOOKS_SAMPLE);
  } catch {
    return [];
  }
}
