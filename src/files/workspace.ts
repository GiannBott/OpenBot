import { lstat, mkdir, realpath, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";

const workspaceRoot = await realpath(process.cwd());

export interface WorkspaceFile {
  path: string;
  absolutePath: string;
  size: number;
  mime: string | null;
}

const mimeByExtension: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".pdf": "application/pdf", ".md": "text/markdown", ".txt": "text/plain", ".mmd": "text/plain",
  ".puml": "text/plain", ".plantuml": "text/plain",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

function asRelativePath(path: string): string {
  return path.replaceAll("\\", "/");
}

function resolveInsideWorkspace(path: string): { candidate: string; relativePath: string } {
  const relativeInput = toWorkspaceRelative(path);
  if (!relativeInput) throw new Error("Ruta de archivo inválida.");
  const candidate = resolve(workspaceRoot, relativeInput);
  const relativePath = relative(workspaceRoot, candidate);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) throw new Error("La ruta sale del workspace.");
  return { candidate, relativePath: asRelativePath(relativePath) };
}

export function toWorkspaceRelative(path: string): string | undefined {
  const trimmed = path.trim().replace(/^file:\/\//i, "");
  if (!trimmed) return undefined;
  const candidate = isAbsolute(trimmed) ? resolve(trimmed) : resolve(workspaceRoot, trimmed);
  const relativePath = relative(workspaceRoot, candidate);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) return undefined;
  return asRelativePath(relativePath);
}

export async function workspaceFile(path: string): Promise<WorkspaceFile> {
  const { candidate, relativePath } = resolveInsideWorkspace(path);
  const info = await lstat(candidate);
  if (!info.isFile()) throw new Error("La ruta no es un archivo.");
  const resolved = await realpath(candidate);
  const resolvedRelative = relative(workspaceRoot, resolved);
  if (resolvedRelative.startsWith("..") || isAbsolute(resolvedRelative)) throw new Error("El archivo apunta fuera del workspace.");
  const extension = basename(resolved).match(/\.[^.]+$/)?.[0]?.toLocaleLowerCase() ?? "";
  return { path: asRelativePath(relativePath), absolutePath: resolved, size: (await stat(resolved)).size, mime: mimeByExtension[extension] ?? null };
}

export async function writeWorkspaceFile(path: string, content: string | Buffer): Promise<WorkspaceFile> {
  const { candidate } = resolveInsideWorkspace(path);
  await mkdir(dirname(candidate), { recursive: true });
  await writeFile(candidate, content);
  return workspaceFile(path);
}
