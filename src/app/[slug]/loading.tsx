export default function BranchLoading() {
  return (
    <main className="kgj-public min-h-dvh px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl animate-pulse space-y-8 motion-reduce:animate-none">
        <div className="mx-auto h-20 w-20 rounded-full bg-secondary" />
        <div className="mx-auto space-y-3 text-center">
          <div className="mx-auto h-8 w-48 rounded-full bg-secondary" />
          <div className="mx-auto h-4 w-72 max-w-full rounded-full bg-secondary" />
        </div>
        <div className="aspect-[4/5] w-full rounded-2xl bg-secondary" />
        <div className="space-y-3">
          <div className="h-28 rounded-2xl bg-[var(--kgj-dark)]" />
          <div className="h-28 rounded-2xl bg-[var(--kgj-dark)]" />
        </div>
      </div>
    </main>
  );
}
