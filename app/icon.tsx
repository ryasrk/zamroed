import { ImageResponse } from 'next/og';

export const alt = 'Ikon ZAMROED Bergerak';
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';
export const runtime = 'edge';

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#047857',
          borderRadius: '7px',
          color: '#FFFFFF',
          fontSize: '24px',
          fontWeight: 700,
          fontFamily: 'sans-serif',
          lineHeight: 1,
        }}
      >
        Z
      </div>
    ),
    {
      ...size,
    },
  );
}
