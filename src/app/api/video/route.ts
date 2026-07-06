import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  if (!DAILY_API_KEY) {
    return NextResponse.json(
      {
        error: 'API Key não configurada',
        message:
          'Para o vídeo funcionar no mundo real, adicione DAILY_API_KEY no seu .env.local.',
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          exp: Math.round(Date.now() / 1000) + 3600,
          enable_chat: false,
          start_video_off: false,
          start_audio_off: false,
          lang: 'pt',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha na Daily: ${response.statusText}`);
    }

    const room = await response.json();

    await AuditLogger.log({
      eventType: 'VIDEO_ROOM_CREATED',
      agrId: session.agrId,
      ipAddress: ip,
      payload: { roomName: room.name },
      severity: 'INFO',
    });

    return NextResponse.json({
      success: true,
      roomUrl: room.url,
      roomName: room.name,
    });
  } catch (error) {
    console.error('[DAILY API ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar sala de videoconferência' },
      { status: 500 },
    );
  }
});
