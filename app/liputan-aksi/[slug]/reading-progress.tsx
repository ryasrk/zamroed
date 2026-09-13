'use client';

import { useEffect, useRef } from 'react';

/**
 * Bilah kemajuan baca yang menempel di tepi paling atas viewport.
 *
 * Kenapa ditulis sebagai Client Component kecil: nilainya bergantung pada
 * posisi gulir (`window.scrollY` dan tinggi dokumen) yang tidak ada saat
 * render server. Isi artikelnya sendiri tetap Server Component — hanya bilah
 * setipis 4 piksel ini yang dikirim ke klien.
 *
 * Prinsip:
 * 1. **Tanpa re-render per frame.** Lebar bilah di-set langsung ke CSS
 *    variable lewat `style.setProperty()` di dalam `requestAnimationFrame`,
 *    jadi gulir tetap 60fps walau artikelnya panjang. React tidak pernah
 *    di-render ulang saat pengguna menggulir.
 * 2. **CLS = 0.** Bilah diposisikan `fixed` dengan tinggi tetap, sehingga ia
 *    tidak pernah menggeser tata letak.
 * 3. **Aksesibilitas.** Bilah adalah hiasan visual; teksnya disediakan untuk
 *    pembaca layar lewat `aria-valuenow`/`aria-valuetext` pada `role="progressbar"`
 *    dan `aria-live="off"` supaya angka yang berubah cepat tidak dibacakan
 *    terus-menerus.
 * 4. **Menghormati preferensi pengguna.** Saat `prefers-reduced-motion: reduce`,
 *    bilah tetap berfungsi tetapi tanpa transisi.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (bar === null) return;

    /** Satu frame tertunda; mencegah pembacaan layout berkali-kali dalam satu gulir. */
    let frame = 0;

    const update = (): void => {
      frame = 0;

      const doc = document.documentElement;
      // Tinggi yang benar-benar dapat digulir. Pada artikel pendek nilainya 0,
      // dan bilah sengaja dibiarkan kosong (bukan 100%) supaya tidak menipu.
      const scrollable = doc.scrollHeight - window.innerHeight;
      const progress =
        scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;

      bar.style.setProperty('--reading-progress', String(progress));
      bar.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    };

    const scheduleUpdate = (): void => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    // `passive` supaya gulir tidak pernah tertahan menunggu handler ini.
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return (
    <div
      ref={barRef}
      role="progressbar"
      aria-label="Kemajuan membaca artikel"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-valuetext="Sejauh mana artikel ini sudah Anda baca"
      aria-live="off"
      data-slot="reading-progress"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 bg-transparent"
    >
      <div
        aria-hidden="true"
        className="h-full w-full origin-left bg-brand-primary shadow-[0_0_12px_0_var(--brand-accent)] motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-crisp motion-reduce:transition-none"
        style={{ transform: 'scaleX(var(--reading-progress, 0))' }}
      />
    </div>
  );
}

export default ReadingProgress;
