import "server-only";

import { and, eq, lt, or, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { formSubmissionDeliveries, formSubmissions } from "@/lib/db/schema";
import { googleSheetsDestinationSchema } from "@/modules/page-builder/schema";

import { decryptFormValues } from "./crypto";
import {
  isGoogleSheetsDeliveryRetryable,
  staleDeliveryMilliseconds,
} from "./delivery-state";
import {
  appendGoogleSheetsResponse,
  type GoogleSheetsDeliveryErrorCode,
} from "./google-sheets";

export type FormDeliveryResult =
  | { ok: true }
  | {
      ok: false;
      code: "not_found" | "busy" | GoogleSheetsDeliveryErrorCode;
    };

export async function deliverGoogleSheetsFormSubmission(
  deliveryId: string,
): Promise<FormDeliveryResult> {
  const db = getDatabase();
  const now = new Date();
  const staleAt = new Date(now.getTime() - staleDeliveryMilliseconds);
  const [delivery] = await db
    .update(formSubmissionDeliveries)
    .set({
      status: "delivering",
      attemptCount: sql`${formSubmissionDeliveries.attemptCount} + 1`,
      lastAttemptAt: now,
      errorCode: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(formSubmissionDeliveries.id, deliveryId),
        eq(formSubmissionDeliveries.provider, "google_sheets"),
        or(
          eq(formSubmissionDeliveries.status, "pending"),
          eq(formSubmissionDeliveries.status, "failed"),
          and(
            eq(formSubmissionDeliveries.status, "delivering"),
            lt(formSubmissionDeliveries.lastAttemptAt, staleAt),
          ),
        ),
      ),
    )
    .returning({
      submissionId: formSubmissionDeliveries.submissionId,
      destination: formSubmissionDeliveries.destination,
    });
  if (!delivery) return { ok: false, code: "busy" };

  const [submission] = await db
    .select({ valuesEncrypted: formSubmissions.valuesEncrypted })
    .from(formSubmissions)
    .where(eq(formSubmissions.id, delivery.submissionId))
    .limit(1);
  if (!submission)
    return updateDelivery(deliveryId, { ok: false, code: "configuration" });

  const destination = googleSheetsDestinationSchema.safeParse(
    delivery.destination,
  );
  let values: Record<string, string | boolean>;
  try {
    values = decryptFormValues(submission.valuesEncrypted);
  } catch {
    return updateDelivery(deliveryId, { ok: false, code: "configuration" });
  }
  if (!destination.success)
    return updateDelivery(deliveryId, { ok: false, code: "configuration" });

  const result = await appendGoogleSheetsResponse({
    ...destination.data,
    values,
  });
  return updateDelivery(deliveryId, result);
}

export { isGoogleSheetsDeliveryRetryable };

export async function retryFailedGoogleSheetsFormSubmission(
  submissionId: string,
): Promise<FormDeliveryResult> {
  const [delivery] = await getDatabase()
    .select({ id: formSubmissionDeliveries.id })
    .from(formSubmissionDeliveries)
    .where(
      and(
        eq(formSubmissionDeliveries.submissionId, submissionId),
        eq(formSubmissionDeliveries.provider, "google_sheets"),
        or(
          eq(formSubmissionDeliveries.status, "pending"),
          eq(formSubmissionDeliveries.status, "failed"),
          and(
            eq(formSubmissionDeliveries.status, "delivering"),
            lt(
              formSubmissionDeliveries.lastAttemptAt,
              new Date(Date.now() - staleDeliveryMilliseconds),
            ),
          ),
        ),
      ),
    )
    .limit(1);
  if (!delivery) return { ok: false, code: "not_found" };
  return deliverGoogleSheetsFormSubmission(delivery.id);
}

async function updateDelivery(
  deliveryId: string,
  result: Exclude<
    FormDeliveryResult,
    { ok: false; code: "not_found" | "busy" }
  >,
) {
  const now = new Date();
  await getDatabase()
    .update(formSubmissionDeliveries)
    .set({
      status: result.ok
        ? "delivered"
        : result.code === "unknown"
          ? "unknown"
          : "failed",
      deliveredAt: result.ok ? now : null,
      errorCode: result.ok ? null : result.code,
      updatedAt: now,
    })
    .where(
      and(
        eq(formSubmissionDeliveries.id, deliveryId),
        eq(formSubmissionDeliveries.status, "delivering"),
      ),
    );
  return result;
}
