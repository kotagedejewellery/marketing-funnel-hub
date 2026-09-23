export function branchPageTitle(siteName: string, branchName: string) {
  const site = siteName.trim();
  const branch = branchName.trim();

  if (!site) return branch;
  if (!branch) return site;

  return branch
    .toLocaleLowerCase("id-ID")
    .includes(site.toLocaleLowerCase("id-ID"))
    ? branch
    : `${site} ${branch}`;
}
