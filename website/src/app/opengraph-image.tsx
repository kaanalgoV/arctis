import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0D12',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial gradient glow — top-right, ice-blue */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(92,184,240,0.18) 0%, rgba(92,184,240,0.06) 45%, transparent 70%)',
          }}
        />

        {/* Secondary glow — bottom-left, subtle */}
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(92,184,240,0.08) 0%, transparent 65%)',
          }}
        />

        {/* Grid pattern — horizontal lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(92,184,240,0.04) 1px, transparent 1px)',
            backgroundSize: '100% 60px',
          }}
        />

        {/* Grid pattern — vertical lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(90deg, rgba(92,184,240,0.04) 1px, transparent 1px)',
            backgroundSize: '80px 100%',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0px',
            zIndex: 1,
          }}
        >
          {/* Logo wordmark */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontWeight: 700,
              fontSize: '96px',
              letterSpacing: '0.12em',
              color: '#FFFFFF',
              lineHeight: 1,
              marginBottom: '20px',
            }}
          >
            ARCTIS
          </div>

          {/* Divider line */}
          <div
            style={{
              width: '80px',
              height: '2px',
              background:
                'linear-gradient(90deg, transparent, #5CB8F0, transparent)',
              marginBottom: '24px',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontFamily: 'sans-serif',
              fontWeight: 500,
              fontSize: '28px',
              letterSpacing: '0.06em',
              color: '#5CB8F0',
              textTransform: 'uppercase',
            }}
          >
            Precision Trading Analysis
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, rgba(92,184,240,0.3), transparent)',
          }}
        />

        {/* Domain label */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#5CB8F0',
            }}
          />
          <span
            style={{
              fontFamily: 'sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em',
            }}
          >
            arctis.trade
          </span>
          <div
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#5CB8F0',
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
