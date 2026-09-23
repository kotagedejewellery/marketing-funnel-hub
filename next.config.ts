import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicAssetBucket = process.env.SUPABASE_PUBLIC_ASSET_BUCKET;

let remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

if (supabaseUrl && publicAssetBucket) {
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol === "http:" || url.protocol === "https:") {
      remotePatterns = [
        {
          protocol: url.protocol.slice(0, -1) as "http" | "https",
          hostname: url.hostname,
          port: url.port,
          pathname: `${url.pathname.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(publicAssetBucket)}/**`,
          search: "",
        },
      ];
    }
  } catch {
    // Invalid environment values are reported by the application validator.
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: { remotePatterns },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async redirects() {
    return [
      { source: "/b/:slug", destination: "/:slug", permanent: true },
      {
        source: "/admin/content",
        destination: "/admin/settings",
        permanent: false,
      },
      {
        source: "/admin/campaigns/:path*",
        destination: "/admin/link-bio",
        permanent: false,
      },
      {
        source: "/admin/links/:path*",
        destination: "/admin/link-bio",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
