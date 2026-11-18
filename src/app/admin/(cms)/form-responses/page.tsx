import { FormResponseTable } from "@/components/admin/form-response-table";
import {
  getFormResponseManagement,
  hasValidFormResponseFilters,
  parseFormResponseFilters,
} from "@/modules/form-submissions/management";

export default async function FormResponsesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const responses = await getFormResponseManagement(
    parseFormResponseFilters(query),
  );
  return (
    <FormResponseTable
      {...responses}
      filterError={!hasValidFormResponseFilters(query)}
    />
  );
}
