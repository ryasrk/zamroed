import { ImageResponse } from 'next/og';

export const alt = 'ZAMROED Bergerak — gerakan solidaritas warga';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const runtime = 'edge';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          backgroundImage:
            'linear-gradient(135deg, #ECFDF5 0%, #F8FAFC 55%, #D1FAE5 100%)',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#047857',
              color: '#FFFFFF',
              borderRadius: '24px',
              fontSize: '56px',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            Z
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 22px',
              borderRadius: '999px',
              backgroundColor: '#047857',
              color: '#FFFFFF',
              fontSize: '26px',
              fontWeight: 600,
              letterSpacing: '2px',
            }}
          >
            ZAMROED.ID
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '104px',
              fontWeight: 700,
              color: '#064E3B',
              lineHeight: 1.05,
              letterSpacing: '-2px',
            }}
          >
            ZAMROED Bergerak
          </div>
          <div
            style={{
              display: 'flex',
              maxWidth: '900px',
              fontSize: '38px',
              lineHeight: 1.35,
              color: '#115E59',
            }}
          >
            Gerakan solidaritas warga untuk kedaulatan ekologi, keadilan sosial, dan masa
            depan berkelanjutan.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '4px solid #047857',
            paddingTop: '24px',
            fontSize: '28px',
            color: '#334155',
          }}
        >
          <div style={{ display: 'flex' }}>Sejarah · Program · Relawan · Liputan &amp; Aksi</div>
          <div style={{ display: 'flex', fontWeight: 600, color: '#047857' }}>
            zamroed.id
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
