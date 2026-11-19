export function branchDeletionBlockReason({
  isDefault,
  hasEvents,
  hasFormSubmissions,
}: {
  isDefault: boolean;
  hasEvents: boolean;
  hasFormSubmissions: boolean;
}) {
  if (isDefault) {
    return "Halaman utama Link Bio tidak dapat dihapus.";
  }
  if (hasEvents) {
    return "Halaman ini memiliki histori tracking dan hanya dapat dinonaktifkan.";
  }
  if (hasFormSubmissions) {
    return "Halaman ini memiliki respons form dan hanya dapat dinonaktifkan.";
  }
  return null;
}
