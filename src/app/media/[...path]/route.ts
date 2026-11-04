import { readPublicAsset } from "@/lib/media/server";

const mediaTypes = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

function mediaType(path: string[]) {
  const extension = path.at(-1)?.split(".").at(-1)?.toLowerCase();
  return extension ? mediaTypes[extension as keyof typeof mediaTypes] : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const contentType = mediaType(path);
  if (!contentType) return new Response(null, { status: 404 });

  try {
    const file = await readPublicAsset(path.join("/"));
    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
