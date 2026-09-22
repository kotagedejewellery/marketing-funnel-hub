import * as z from "zod";

export const mediaTargetSchema = z.union([
  z.object({
    entityType: z.literal("site"),
    entityId: z.literal("00000000-0000-0000-0000-000000000001"),
  }),
  z.object({
    entityType: z.enum(["branch", "campaign", "product", "assignment"]),
    entityId: z.uuid(),
  }),
]);

export const maxImageBytes = 5 * 1024 * 1024;

const imageTypes: Record<
  string,
  { extension: string; matches: (bytes: Uint8Array) => boolean }
> = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes) =>
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
  },
};

export function imageExtension(mimeType: string, bytes: Uint8Array) {
  const type = imageTypes[mimeType];
  return type && type.matches(bytes) ? type.extension : null;
}
