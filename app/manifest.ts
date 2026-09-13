import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZAMROED Bergerak',
    short_name: 'ZAMROED',
    description:
      'Gerakan solidaritas warga untuk kedaulatan ekologi, keadilan sosial, dan masa depan berkelanjutan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#047857',
    lang: 'id',
    orientation: 'portrait-primary',
    categories: [
      'education',
      'news',
      'social',
      'community',
      'environment',
    ],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
