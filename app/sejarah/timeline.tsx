'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge, Card, CardBody, CardHeader, CardTitle, cn } from '@repo/ui';
import type { Milestone } from '@repo/ui/types';

/**
 * Arsip foto yang benar-benar ada di `apps/zamroed/public/images`.
 *
 * Jalur di luar daftar ini diperlakukan sebagai "belum ada arsip": memercayai
 * jalur apa adanya berarti mengirim permintaan gambar yang pasti gagal dan
 * menyisakan kotak rusak di tengah halaman. Tonggak tanpa arsip dirender
 * sebagai kartu narasi dengan garis emas sebagai ganti media.
 */
const ARCHIVE_PHOTOS: readonly string[] = [
  '/images/hero-movement.jpg',
  '/images/rembuk-warga.jpg',
  '/images/sejarah-archive.jpg',
  '/images/piagam-deklarasi.jpg',
  '/images/tanggap-bencana.jpg',
  '/images/pendidikan-akar-rumput.jpg',
  '/images/citarum.jpg',
];

/** Jalur arsip untuk sebuah tonggak, atau `undefined` bila fotonya belum tersedia. */
function archivePhoto(milestone: Milestone): string | undefined {
  return milestone.image && ARCHIVE_PHOTOS.includes(milestone.image)
    ? milestone.image
    : undefined;
}

/** Rentang aman 0–1 untuk nilai progres gulir. */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Apakah pengguna meminta gerak minimal? Dibaca sinkron agar render pertama sudah benar. */
function readReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface TimelineProps {
  /** Tonggak sejarah berurutan dari yang paling lama ke yang terbaru. */
  milestones: Milestone[];
  /** Kelas tambahan pada pembungkus rel. */
  className?: string;
}

/**
 * Rel waktu vertikal ZAMROED Bergerak.
 *
 * Tiga keputusan teknis yang menentukan terasa atau tidaknya halaman ini:
 *
 * 1. **Gulir tidak pernah menyentuh tata letak.** Listener `scroll` hanya
 *    menghitung satu angka (0–1) lalu menulisnya ke `transform: scaleY()` dan
 *    `style.opacity` sebuah elemen overlay. Tidak ada pembacaan geometri
 *    (`getBoundingClientRect`) di dalam listener dan tidak ada perubahan
 *    ukuran/posisi, sehingga browser cukup mengomposit ulang lapisan — tetap
 *    60 fps meski halaman panjang.
 * 2. **Progres dihitung dari viewport, bukan dari tinggi dokumen.** Rel
 *    dianggap "penuh" saat simpul terakhir menyentuh sekitar dua pertiga
 *    layar, bukan saat dasar dokumen tercapai (dasar dokumen baru tercapai
 *    setelah footer, sehingga rel tampak tidak pernah tuntas).
 * 3. **Simpul aktif ditentukan IntersectionObserver.** Garis pemicunya
 *    dipersempit ke pita tipis di tengah layar; hanya satu entri yang berada
 *    di pita itu dianggap aktif, jadi tahun besar di kiri dan sorotan kartu
 *    tidak pernah berkedip di antara dua tonggak.
 */
export function Timeline({ milestones, className }: TimelineProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(milestones[0]?.id ?? null);
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);

  // Preferensi gerak bisa berubah di tengah sesi (mis. saat daya baterai menipis).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    setReducedMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const measure = useCallback(() => {
    const node = railRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const viewport = window.innerHeight;
    // Titik "pembaca sekarang": dua per tiga layar dari atas.
    const readLine = viewport * 0.66;
    const travelled = readLine - rect.top;
    const height = node.offsetHeight;

    // Pita `space-y` terakhir tidak memuat tonggak apa pun, jadi jarak dari
    // tonggak terakhir ke dasar rel dikurangi lebih dulu. Tanpa ini, rel
    // menyelesaikan pengisiannya 80px setelah tonggak terakhir terlewati.
    const trailingGap = milestones.length > 0 ? 80 : 0;
    const span = Math.max(height - trailingGap, 1);

    setProgress(clamp01(travelled / span));
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setProgress(1);
      return;
    }

    let frame = 0;

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Font web yang selesai dimuat mengubah tinggi rel — ukur ulang sekali.
    document.fonts?.ready.then(schedule).catch(() => undefined);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [measure, reducedMotion]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const nodes = railRef.current?.querySelectorAll<HTMLElement>('[data-milestone-id]');
    if (!nodes || nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
        if (!best) return;
        const id = best.target.getAttribute('data-milestone-id');
        if (id) setActiveId(id);
      },
      // Pita tipis di tengah layar: hanya satu tonggak yang bisa "menang".
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.01, 0.5, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={railRef} className={cn('relative', className)}>
      {/* Rel dasar: garis tipis editorial, selalu terlihat penuh. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[22px] top-0 w-px bg-editorial md:left-1/2 md:-translate-x-1/2"
      />

      {/* Rel terisi: emas ochre, tumbuh murni lewat scaleY (compositor-only). */}
      <div
        aria-hidden="true"
        data-timeline-progress=""
        style={{
          transform: `scaleY(${reducedMotion ? 1 : progress})`,
          transformOrigin: 'top',
          opacity: reducedMotion ? 0.55 : clamp01(progress * 4 + 0.15),
          willChange: reducedMotion ? undefined : 'transform',
        }}
        className="pointer-events-none absolute bottom-0 left-[22px] top-0 w-[3px] rounded-full bg-gold-ochre md:left-1/2 md:-translate-x-1/2"
      />

      <ol className="relative space-y-14 md:space-y-20">
        {milestones.map((milestone, index) => {
          const isActive = milestone.id === activeId;
          const isRight = index % 2 === 1;
          const photo = archivePhoto(milestone);

          return (
            <li key={milestone.id} className="list-none">
              <article
                data-milestone-id={milestone.id}
                aria-current={isActive ? 'step' : undefined}
                className="scroll-mt-28"
              >
                <div className="grid items-start gap-x-12 md:grid-cols-2 md:gap-y-0">
                  {/* ── Kolom tahun ────────────────────────────────────────────
                      Mobile: satu baris ringkas bersama penanda simpul.
                      Desktop: kolom kiri/kanan penuh, tahun ditampilkan besar. */}
                  <div
                    className={cn(
                      'flex min-w-0 items-center gap-4 md:gap-6',
                      isRight
                        ? 'md:order-2 md:justify-start md:pl-10'
                        : 'md:order-1 md:justify-end md:pr-10',
                    )}
                  >
                    <span className="text-4xl font-bold leading-none tracking-tight text-ink-secondary/35 sm:text-5xl md:hidden">
                      {milestone.year}
                    </span>

                    {/* Penanda simpul: tetap di rel pada kedua breakpoint. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute left-[22px] flex -translate-x-1/2 items-center justify-center',
                        'md:static md:translate-x-0',
                        isRight ? 'md:order-first' : 'md:order-last',
                      )}
                    >
                      <span
                        className={cn(
                          'relative flex items-center justify-center rounded-full',
                          'transition-[box-shadow,background-color,transform] duration-300 ease-crisp',
                          isActive
                            ? 'h-4 w-4 bg-gold-ochre ring-4 ring-gold-ochre/35'
                            : 'h-2.5 w-2.5 bg-ink-secondary/40 ring-1 ring-canvas',
                          !reducedMotion && isActive && 'scale-110',
                        )}
                      >
                        {isActive && !reducedMotion ? (
                          <span className="absolute inset-0 rounded-full bg-gold-ochre/40 animate-pulse-ring" />
                        ) : null}
                      </span>
                    </span>

                    <span
                      className={cn(
                        'hidden font-mono text-6xl font-bold leading-none tracking-tight',
                        'transition-colors duration-300 ease-crisp md:block lg:text-7xl',
                        isActive ? 'text-gold-ochre' : 'text-brand-primary/25',
                      )}
                    >
                      {milestone.year}
                    </span>
                  </div>

                  {/* ── Kartu tonggak ────────────────────────────────────────── */}
                  <div
                    className={cn(
                      'min-w-0 pl-14 md:pl-0',
                      isRight ? 'md:order-1' : 'md:order-2',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-4 md:mt-0',
                        isRight ? 'md:-mr-5' : 'md:-ml-5',
                        'md:transition-transform md:duration-300 md:ease-crisp',
                        !reducedMotion && isActive && 'md:-translate-y-1',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute left-[22px] h-5 w-px md:left-auto md:w-6',
                          'md:top-8',
                          isRight ? 'md:left-0' : 'md:right-0',
                          isActive ? 'bg-gold-ochre' : 'bg-editorial',
                        )}
                      />

                      <Card
                        className={cn(
                          'transition-[box-shadow,border-color] duration-300 ease-crisp',
                          isActive && 'border-gold-ochre/50 shadow-lg',
                        )}
                      >
                        {photo ? (
                          // Kotak rasio tetap: tinggi sudah final sebelum gambar tiba (CLS = 0).
                          <div className="relative aspect-[16/9] w-full overflow-hidden bg-canvas">
                            <img
                              src={photo}
                              alt={`Arsip dokumentasi tonggak ${milestone.year}: ${milestone.title}`}
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          // Tonggak tanpa arsip foto: garis emas sebagai penanda editorial,
                          // bukan kotak kosong yang terbaca seperti gambar gagal dimuat.
                          <div
                            aria-hidden="true"
                            className="h-1.5 w-full bg-gradient-to-r from-gold-ochre via-gold-ochre/60 to-brand-primary"
                          />
                        )}

                        <CardHeader action={<Badge tone="warning">{milestone.phase}</Badge>}>
                          <CardTitle as="h3" className="text-balance">
                            {milestone.title}
                          </CardTitle>
                        </CardHeader>

                        <CardBody className="space-y-5">
                          <p className="text-base leading-relaxed text-ink-secondary">
                            {milestone.narrative}
                          </p>

                          {milestone.quote ? (
                            <blockquote className="border-l-2 border-gold-ochre pl-4 md:pl-5">
                              <p className="text-base italic leading-relaxed text-ink md:text-lg">
                                &ldquo;{milestone.quote}&rdquo;
                              </p>
                            </blockquote>
                          ) : null}
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default Timeline;
