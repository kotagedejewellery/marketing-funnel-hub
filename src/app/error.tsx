"use client";

export default function PublicPageError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center px-6 py-16">
      <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Kotagede Jewellery
      </p>
      <h1 className="font-serif text-3xl">Halaman belum dapat dimuat</h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        Silakan coba lagi beberapa saat.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-7 min-h-11 border border-foreground px-5 font-medium hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Coba lagi
      </button>
    </main>
  );
}
