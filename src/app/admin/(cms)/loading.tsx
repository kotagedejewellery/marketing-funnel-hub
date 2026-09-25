export default function AdminLoading() {
  return (
    <div className="space-y-7 animate-pulse motion-reduce:animate-none">
      <div className="space-y-3">
        <div className="h-9 w-64 max-w-full rounded-full bg-secondary" />
        <div className="h-5 w-[30rem] max-w-full rounded-full bg-secondary" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-48 rounded-2xl bg-[var(--kgj-dark)]" />
        <div className="h-48 rounded-2xl bg-secondary" />
        <div className="h-48 rounded-2xl bg-card" />
      </div>
      <div className="h-72 rounded-2xl bg-card" />
    </div>
  );
}
