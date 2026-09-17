export const runtime = "nodejs";

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-content-center bg-background px-6 py-16 text-foreground sm:px-10">
      <div className="max-w-3xl">
        <p className="mb-3 text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
          KGJ · Sprint 0
        </p>
        <h1 className="text-4xl leading-[0.95] font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
          Marketing Funnel Hub
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8">
          Fondasi aplikasi siap. Fitur produk, CMS, dan tracking akan dibangun
          pada tahap implementasi berikutnya.
        </p>
      </div>
    </main>
  );
}
