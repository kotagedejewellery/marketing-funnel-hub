import { redirect } from "next/navigation";

import { loadDefaultLinkBioSlug } from "@/modules/public-content/data";

type SearchParams = Record<string, string | string[] | undefined>;

function queryString(searchParams: SearchParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const value = query.toString();
  return value ? `?${value}` : "";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [slug, params] = await Promise.all([
    loadDefaultLinkBioSlug(),
    searchParams,
  ]);
  redirect(slug ? `/${slug}${queryString(params)}` : "/admin/login");
}
