import * as z from "zod";

import { databaseUrlSchema } from "./database-url";
import {
  EnvironmentValidationError,
  invalidVariables,
  publicEnvironmentShape,
  requireHttpsOutsideLocal,
} from "./schema";

const nonEmptyString = z.string().trim().min(1);
const positiveInteger = z.coerce.number().int().positive();

const serverEnvironmentSchema = z
  .object({
    ...publicEnvironmentShape,
    DATABASE_URL: databaseUrlSchema,
    SUPABASE_SECRET_KEY: z
      .string()
      .trim()
      .min(16)
      .refine((value) => !value.startsWith("sb_publishable_")),
    SUPABASE_PUBLIC_ASSET_BUCKET: nonEmptyString,
    SUPABASE_PRIVATE_MEDIA_BUCKET: nonEmptyString,
    META_CAPI_DATASET_ID: z.string().regex(/^\d+$/),
    META_CAPI_ACCESS_TOKEN: z.string().min(16),
    EVENT_RATE_LIMIT_WINDOW_SECONDS: positiveInteger.max(3600),
    EVENT_RATE_LIMIT_PER_IP: positiveInteger.max(10_000),
    EVENT_RATE_LIMIT_GLOBAL: positiveInteger.max(100_000),
    CRON_SECRET: z.string().min(16),
  })
  .superRefine(requireHttpsOutsideLocal);

export function parseServerEnv(input: unknown) {
  const result = serverEnvironmentSchema.safeParse(input);
  if (!result.success)
    throw new EnvironmentValidationError(invalidVariables(result.error));
  return result.data;
}
