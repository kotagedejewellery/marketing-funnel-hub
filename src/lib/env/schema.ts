import * as z from "zod";

const environmentName = z.enum(["local", "staging", "production"]);
const webUrl = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
});
export const publicEnvironmentShape = {
  NEXT_PUBLIC_APP_ENV: environmentName,
  NEXT_PUBLIC_SITE_URL: webUrl,
  NEXT_PUBLIC_SUPABASE_URL: webUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(16)
    .refine((value) => !value.startsWith("sb_secret_")),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().regex(/^\d+$/),
  NEXT_PUBLIC_GTM_CONTAINER_ID: z.string().regex(/^GTM-[A-Z0-9]+$/),
};

export function requireHttpsOutsideLocal(
  environment: {
    NEXT_PUBLIC_APP_ENV: z.infer<typeof environmentName>;
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
  },
  context: z.RefinementCtx,
) {
  if (environment.NEXT_PUBLIC_APP_ENV === "local") return;

  for (const variable of [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
  ] as const) {
    if (new URL(environment[variable]).protocol !== "https:") {
      context.addIssue({
        code: "custom",
        path: [variable],
        message: "HTTPS is required outside the local environment.",
      });
    }
  }
}

const clientEnvironmentSchema = z
  .object(publicEnvironmentShape)
  .superRefine(requireHttpsOutsideLocal);

export class EnvironmentValidationError extends Error {
  constructor(readonly variables: string[]) {
    super(`Invalid environment configuration: ${variables.join(", ")}.`);
    this.name = "EnvironmentValidationError";
  }
}

export function invalidVariables(error: z.ZodError) {
  return [
    ...new Set(error.issues.map((issue) => String(issue.path[0] ?? "unknown"))),
  ].sort();
}

export function parseClientEnv(input: unknown) {
  const result = clientEnvironmentSchema.safeParse(input);
  if (!result.success)
    throw new EnvironmentValidationError(invalidVariables(result.error));
  return result.data;
}
