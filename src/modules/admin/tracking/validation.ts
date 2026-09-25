import * as z from "zod";

const analyticsRangeSchema = z.enum(["7", "30", "month", "custom"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const trackingAnalyticsSearchSchema = z.object({
  view: z.enum(["overview", "events"]).default("overview"),
  range: analyticsRangeSchema.default("30"),
  start: z.union([dateSchema, z.literal("")]).optional(),
  end: z.union([dateSchema, z.literal("")]).optional(),
  branchId: z.union([z.uuid(), z.literal("")]).optional(),
  eventName: z
    .union([z.enum(["PageView", "Contact", "LinkClick"]), z.literal("")])
    .optional(),
  product: z.string().trim().max(120).optional(),
  source: z.string().trim().max(200).optional(),
  campaign: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
});

export type TrackingAnalyticsFilters = {
  view: "overview" | "events";
  range: z.infer<typeof analyticsRangeSchema>;
  start: string | null;
  end: string | null;
  branchId: string | null;
  eventName: "PageView" | "Contact" | "LinkClick" | null;
  product: string | null;
  source: string | null;
  campaign: string | null;
  page: number;
};

export function parseTrackingAnalyticsFilters(
  input: Record<string, string | string[] | undefined>,
): TrackingAnalyticsFilters {
  const parsed = trackingAnalyticsSearchSchema.safeParse({
    view: firstValue(input.view),
    range: firstValue(input.range),
    start: firstValue(input.start),
    end: firstValue(input.end),
    branchId: firstValue(input.branchId),
    eventName: firstValue(input.eventName),
    product: firstValue(input.product),
    source: firstValue(input.source),
    campaign: firstValue(input.campaign),
    page: firstValue(input.page),
  });
  const value = parsed.success
    ? parsed.data
    : trackingAnalyticsSearchSchema.parse({});

  return {
    ...value,
    start: value.start || null,
    end: value.end || null,
    branchId: value.branchId || null,
    eventName: value.eventName || null,
    product: value.product || null,
    source: value.source || null,
    campaign: value.campaign || null,
  };
}
