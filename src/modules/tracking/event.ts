import * as z from "zod";

const nullableContext = z.string().trim().min(1).max(200).nullable();

const attributionSchema = z.strictObject({
  source: nullableContext,
  campaign: nullableContext,
  utmSource: nullableContext,
  utmMedium: nullableContext,
  utmCampaign: nullableContext,
  utmContent: nullableContext,
  utmTerm: nullableContext,
});

const productSchema = z.strictObject({
  id: z.uuid(),
  category: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
});

const branchSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
});

const linkSchema = z.strictObject({
  id: z.uuid(),
  label: z.string().trim().min(1).max(200),
  type: z.enum(["secondary", "social"]),
});

const pageUrlSchema = z
  .url()
  .max(2048)
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol))
  .nullable();

const common = {
  eventId: z.uuid(),
  eventTime: z.iso.datetime({ offset: true }),
  anonymousSessionId: z.uuid(),
  pageUrl: pageUrlSchema,
  attribution: attributionSchema,
  // No additional metadata fields are approved for P0.
  metadata: z.strictObject({}),
};

export const canonicalEventSchema = z.discriminatedUnion("eventName", [
  z.strictObject({
    ...common,
    eventName: z.literal("PageView"),
    product: z.null(),
    branch: z.null(),
    cta: z.null(),
  }),
  z.strictObject({
    ...common,
    eventName: z.literal("ViewContent"),
    product: productSchema,
    branch: z.null(),
    cta: z.null(),
  }),
  z.strictObject({
    ...common,
    eventName: z.literal("Contact"),
    product: productSchema,
    branch: branchSchema,
    cta: z.literal("whatsapp"),
  }),
  z.strictObject({
    ...common,
    eventName: z.literal("LinkClick"),
    product: z.null(),
    branch: branchSchema,
    cta: z.literal("link"),
    link: linkSchema,
  }),
]);

export type CanonicalEvent = z.infer<typeof canonicalEventSchema>;

export function branchSlugFromPagePath(pathname: string) {
  const slug = pathname.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)?.[1];
  return slug && slug.length <= 120 ? slug : null;
}
