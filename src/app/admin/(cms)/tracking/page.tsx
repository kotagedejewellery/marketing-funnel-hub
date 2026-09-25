import { TrackingAnalyticsDashboard } from "@/components/admin/tracking-analytics";
import { getTrackingAnalytics } from "@/modules/admin/tracking/data";
import { parseTrackingAnalyticsFilters } from "@/modules/admin/tracking/validation";

export default async function TrackingAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseTrackingAnalyticsFilters(await searchParams);
  const analytics = await getTrackingAnalytics(filters);

  return <TrackingAnalyticsDashboard analytics={analytics} />;
}
