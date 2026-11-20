import type { PageBuilderBlock } from "./schema";

export function isOwnedBuilderImagePath(path: string, branchId: string) {
  return path.startsWith(`builder/${branchId}/`);
}

function imagePaths(blocks: PageBuilderBlock[], branchId: string) {
  return blocks.flatMap((block) =>
    block.type === "image" &&
    block.path &&
    isOwnedBuilderImagePath(block.path, branchId)
      ? [block.path]
      : [],
  );
}

export function releasedBuilderImagePaths({
  branchId,
  previousDraft,
  previousPublished,
  nextDraft,
  nextPublished,
}: {
  branchId: string;
  previousDraft: PageBuilderBlock[];
  previousPublished: PageBuilderBlock[];
  nextDraft: PageBuilderBlock[];
  nextPublished: PageBuilderBlock[];
}) {
  const previous = new Set([
    ...imagePaths(previousDraft, branchId),
    ...imagePaths(previousPublished, branchId),
  ]);
  const retained = new Set([
    ...imagePaths(nextDraft, branchId),
    ...imagePaths(nextPublished, branchId),
  ]);
  return [...previous].filter((path) => !retained.has(path));
}
