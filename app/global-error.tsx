'use client';

/**
 * Batas galat akar (root) untuk aplikasi ZAMROED Bergerak.
 *
 * Saat galat terjadi di root layout, Next.js mengganti seluruh pohon dokumen —
 * termasuk layout root — sehingga komponen ini harus merender `<html>` dan
 * `<body>` sendiri. Gaya ditulis inline agar berkas ini tetap bebas dependensi
 * dan tidak bergantung pada stylesheet yang mungkin belum sempat dimuat.
 * `@repo/ui/styles/globals.css` sengaja tidak diimpor di sini karena sudah
 * dimuat oleh layout root.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id" className="theme-zamroed">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#ffffff',
          color: '#11221c',
          fontFamily:
            "Inter, 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
          lineHeight: 1.6,
        }}
      >
        <main
          role="alert"
          style={{
            width: '100%',
            maxWidth: '38rem',
            textAlign: 'center',
            border: '1px solid #d7e0db',
            borderRadius: '16px',
            padding: '32px 24px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#047857',
            }}
          >
            Gangguan sementara
          </p>

          <h1
            style={{
              margin: '12px 0 0',
              fontSize: '1.75rem',
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Terjadi kesalahan
          </h1>

          <p style={{ margin: '12px 0 0', fontSize: '1rem', color: '#33443d' }}>
            Aplikasi tidak berhasil dimuat sepenuhnya. Muat ulang halaman untuk
            mencoba lagi — bila masih gagal, silakan hubungi koordinator kami di{' '}
            <a
              href="mailto:halo@zamroed.id"
              style={{
                color: '#047857',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              halo@zamroed.id
            </a>
            .
          </p>

          {error.digest ? (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: '0.75rem',
                color: '#5b6b64',
                wordBreak: 'break-word',
              }}
            >
              Kode rujukan: <span style={{ fontFamily: 'monospace' }}>{error.digest}</span>
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '24px',
              minHeight: '48px',
              minWidth: '48px',
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#047857',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
