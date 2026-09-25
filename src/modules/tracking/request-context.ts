import "server-only";

export type TrackingRequestContext = {
  deviceType: "mobile" | "tablet" | "desktop" | "other";
  browserFamily: "Chrome" | "Safari" | "Firefox" | "Edge" | "Other";
  countryCode: string | null;
  city: string | null;
};

function compactCity(value: string | null) {
  if (!value) return null;
  try {
    const city = decodeURIComponent(value).trim().replace(/\s+/g, " ");
    return city.length > 0 && city.length <= 120 ? city : null;
  } catch {
    return null;
  }
}

function countryCode(value: string | null) {
  const country = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(country) ? country : null;
}

export function trackingRequestContext(request: Request): TrackingRequestContext {
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? "";
  const browserFamily = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /Chrome\//.test(userAgent) || /CriOS\//.test(userAgent)
        ? "Chrome"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Other";
  const deviceType = /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)
    ? "tablet"
    : /Mobi|Android|iPhone|iPod/i.test(userAgent)
      ? "mobile"
      : userAgent
        ? "desktop"
        : "other";

  return {
    deviceType,
    browserFamily,
    countryCode: countryCode(request.headers.get("x-vercel-ip-country")),
    city: compactCity(request.headers.get("x-vercel-ip-city")),
  };
}
