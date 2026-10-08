export function resolveProfileVisibility(
  branchValue: boolean | null,
  templateValue: boolean,
) {
  return branchValue ?? templateValue;
}
