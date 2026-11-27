import { execFile } from "node:child_process";
import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface DiagramFence {
  ext: "mmd" | "puml";
  source: string;
}

export function isDiagramSource(path: string): boolean {
  return /\.(mmd|puml|plantuml)$/i.test(path);
}

export function extractDiagramFences(text: string): DiagramFence[] {
  const fences: DiagramFence[] = [];
  for (const match of text.matchAll(/```(mermaid|plantuml)\s*\n([\s\S]*?)```/gi)) {
    const source = match[2]?.trim();
    if (!source) continue;
    fences.push({ ext: match[1]?.toLowerCase() === "plantuml" ? "puml" : "mmd", source });
  }
  return fences;
}

export async function renderDiagram(sourcePath: string): Promise<{ pngPath: string; pngName: string } | undefined> {
  const ext = extname(sourcePath).toLowerCase();
  const outDir = await mkdtemp(join(tmpdir(), "openbot-diagram-"));
  const pngName = `${basename(sourcePath, ext)}.png`;
  const pngPath = join(outDir, pngName);
  const rendered = ext === ".mmd"
    ? await runFirst(["mmdc", "mmdc.cmd"], ["-i", sourcePath, "-o", pngPath, "-b", "transparent"])
    : ext === ".puml" || ext === ".plantuml"
      ? await runFirst(["plantuml", "plantuml.cmd", "plantuml.bat"], ["-tpng", "-output", outDir, sourcePath])
        || await runFirst(["plantuml", "plantuml.cmd", "plantuml.bat"], ["-tpng", "-o", outDir, sourcePath])
      : false;
  if (!rendered) return undefined;
  try {
    await stat(pngPath);
    return { pngPath, pngName };
  } catch {
    return undefined;
  }
}

async function runFirst(commands: string[], args: string[]): Promise<boolean> {
  for (const command of commands) {
    try {
      await execFileAsync(command, args, { timeout: 30_000, windowsHide: true });
      return true;
    } catch {
      continue;
    }
  }
  return false;
}
