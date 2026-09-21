import * as z from "zod";

import { databaseUrlSchema } from "./database-url";
import {
  EnvironmentValidationError,
  invalidVariables,
  optionalEnvironmentString,
  publicEnvironmentShape,
  requireHttpsOutsideLocal,
} from "./schema";

const nonEmptyString = z.string().trim().min(1);

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
    META_CAPI_DATASET_ID: optionalEnvironmentString(
      z.string().regex(/^\d+$/),
    ),
    META_CAPI_ACCESS_TOKEN: optionalEnvironmentString(z.string().min(16)),
    TRACKING_ENABLED: z.enum(["true", "false"]).default("false"),
    CRON_SECRET: z.string().min(16),
  })
  .superRefine((environment, context) => {
    requireHttpsOutsideLocal(environment, context);

    if (environment.TRACKING_ENABLED !== "true") return;

    for (const variable of [
      "NEXT_PUBLIC_META_PIXEL_ID",
      "NEXT_PUBLIC_GTM_CONTAINER_ID",
      "META_CAPI_DATASET_ID",
      "META_CAPI_ACCESS_TOKEN",
    ] as const) {
      if (!environment[variable]) {
        context.addIssue({
          code: "custom",
          path: [variable],
          message: "Required when tracking is enabled.",
        });
      }
    }
  });

export function parseServerEnv(input: unknown) {
  const result = serverEnvironmentSchema.safeParse(input);
  if (!result.success)
    throw new EnvironmentValidationError(invalidVariables(result.error));
  return result.data;
}
