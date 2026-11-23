export const staleDeliveryMilliseconds = 2 * 60 * 1000;

export function isGoogleSheetsDeliveryRetryable(
  status: string | null,
  lastAttemptAt: Date | null,
  now = new Date(),
) {
  return (
    status === "pending" ||
    status === "failed" ||
    (status === "delivering" &&
      Boolean(
        lastAttemptAt &&
        lastAttemptAt.getTime() < now.getTime() - staleDeliveryMilliseconds,
      ))
  );
}
