import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { serverEnv } from "@/lib/env/server";

function pathSegments(path: string) {
  const segments = path.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        /[\\\u0000-\u001f]/.test(segment),
    )
  ) {
    throw new Error("Invalid media path.");
  }
  return segments;
}

export function resolveMediaPath(path: string) {
  return join(serverEnv.MEDIA_STORAGE_ROOT, ...pathSegments(path));
}

export async function uploadPublicAsset(path: string, bytes: Uint8Array) {
  const destination = resolveMediaPath(path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes, { flag: "wx" });
}

export async function readPublicAsset(path: string) {
  return readFile(resolveMediaPath(path));
}
