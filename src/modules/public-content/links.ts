export function publicHref(
  value: string | null,
  allowLocalHttp = false,
): string | null {
  if (!value) return null;
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }

  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (url.protocol === "https:") return url.href;
    return allowLocalHttp &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function publicAssetUrl(
  supabaseUrl: string,
  bucket: string,
  path: string | null,
): string | null {
  if (!path) return null;

  const segments = path.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        /[\\?#\u0000-\u001f]/.test(segment),
    )
  ) {
    return null;
  }

  const objectPath = segments.map(encodeURIComponent).join("/");
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
}

export function whatsappHref(
  number: string,
  template: string,
  product: string,
  branch: string,
): string {
  const message = template
    .replaceAll("{product}", product)
    .replaceAll("{branch}", branch);

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function resolveWhatsappCta(input: {
  number: string;
  product: string;
  branch: string;
  assignmentLabel: string | null;
  branchLabel: string | null;
  defaultLabel: string;
  assignmentMessage: string | null;
  defaultMessage: string;
}) {
  const template = input.assignmentMessage ?? input.defaultMessage;
  return {
    ctaLabel: input.assignmentLabel ?? input.branchLabel ?? input.defaultLabel,
    message: template
      .replaceAll("{product}", input.product)
      .replaceAll("{branch}", input.branch),
    whatsappUrl: whatsappHref(
      input.number,
      template,
      input.product,
      input.branch,
    ),
  };
}
