import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export async function GET(request: Request) {
  try {
    // Get locale from query params, default to 'en'
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    
    // Get translations for the specified locale
    const t = await getTranslations({ locale });
    
    const siteName = t('Site.name', { artistName: t('Artist.name') });
    const siteDescription = t('Site.description');
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FF69B4, #FFB6C1)',
            padding: '40px',
          }}
        >
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
          }} />
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '40px 60px',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h1
              style={{
                fontSize: 72,
                fontWeight: 800,
                margin: '0 0 20px 0',
                background: 'linear-gradient(135deg, #FF1493, #FF69B4)',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {siteName}
            </h1>
            <p
              style={{
                fontSize: 36,
                margin: '0',
                color: '#4A4A4A',
                textAlign: 'center',
                maxWidth: '600px',
                lineHeight: 1.4,
                letterSpacing: '-0.02em',
              }}
            >
              {siteDescription}
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`${error.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}