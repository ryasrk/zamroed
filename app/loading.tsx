/**
 * Keadaan memuat tingkat segmen untuk aplikasi ZAMROED Bergerak.
 *
 * Server Component tanpa hook: cukup menandai area dengan `role="status"` agar
 * pembaca layar mengumumkan proses pemuatan, sementara pengguna lain melihat
 * kerangka kartu yang berdenyut lembut.
 */
export default function Loading() {
  return (
    <div className="bg-canvas px-5 py-16 sm:px-8 md:py-24">
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="mx-auto w-full max-w-7xl"
      >
        <span className="sr-only">Memuat halaman…</span>

        <div aria-hidden="true" className="flex flex-col items-start">
          {/* Eyebrow dan judul */}
          <div className="h-4 w-32 rounded-full bg-editorial motion-safe:animate-pulse" />
          <div className="mt-5 h-9 w-3/4 max-w-2xl rounded-2xl bg-editorial motion-safe:animate-pulse" />
          <div className="mt-4 h-4 w-full max-w-xl rounded-full bg-editorial motion-safe:animate-pulse" />
          <div className="mt-3 h-4 w-5/6 max-w-lg rounded-full bg-editorial motion-safe:animate-pulse" />

          {/* Kerangka kartu konten */}
          <div className="mt-12 grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="rounded-2xl border border-editorial bg-surface p-6 motion-safe:animate-pulse"
              >
                <div className="h-40 w-full rounded-xl bg-editorial" />
                <div className="mt-5 h-5 w-2/3 rounded-full bg-editorial" />
                <div className="mt-3 h-4 w-full rounded-full bg-editorial" />
                <div className="mt-3 h-4 w-1/2 rounded-full bg-editorial" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
