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
    META_CAPI_ACCESS_TOKEN: optionalEnvironmentString(z.string().min(16)),
    META_TRACKING_CONFIG_ENCRYPTION_KEY: optionalEnvironmentString(
      z.string().regex(/^[a-f0-9]{64}$/i),
    ),
    META_AD_ACCOUNT_ID: optionalEnvironmentString(
      z.string().regex(/^(act_)?\d+$/),
    ),
    META_MARKETING_API_ACCESS_TOKEN: optionalEnvironmentString(
      z.string().min(16),
    ),
    GA4_PROPERTY_ID: optionalEnvironmentString(z.string().regex(/^\d+$/)),
    GA4_SERVICE_ACCOUNT_EMAIL: optionalEnvironmentString(z.email()),
    GA4_SERVICE_ACCOUNT_PRIVATE_KEY: optionalEnvironmentString(
      z.string().min(32),
    ),
    FIRECRAWL_API_KEY: optionalEnvironmentString(nonEmptyString),
    TRACKING_ENABLED: z.enum(["true", "false"]).default("false"),
    CRON_SECRET: z.string().min(16),
  })
  .superRefine((environment, context) => {
    requireHttpsOutsideLocal(environment, context);

    if (environment.TRACKING_ENABLED !== "true") return;

    const globalMetaVariables = [
      "NEXT_PUBLIC_META_PIXEL_ID",
      "META_CAPI_ACCESS_TOKEN",
    ] as const;
    const configuredGlobalVariables = globalMetaVariables.filter((variable) =>
      Boolean(environment[variable]),
    );
    if (
      configuredGlobalVariables.length > 0 &&
      configuredGlobalVariables.length !== globalMetaVariables.length
    ) {
      for (const variable of globalMetaVariables) {
        if (!environment[variable]) {
          context.addIssue({
            code: "custom",
            path: [variable],
            message:
              "Configure all global Meta values together, or configure Meta per branch.",
          });
        }
      }
    }
  });

export function parseServerEnv(input: unknown) {
  const result = serverEnvironmentSchema.safeParse(input);
  if (!result.success)
    throw new EnvironmentValidationError(invalidVariables(result.error));
  return result.data;
}
