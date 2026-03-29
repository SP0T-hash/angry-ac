import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // A chave da Daily.co deve ser colocada no seu arquivo .env.local na raiz do projeto
  // Exemplo: DAILY_API_KEY=123abc456def...
  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  if (!DAILY_API_KEY) {
    return NextResponse.json({ 
      error: 'API Key não configurada',
      message: 'Para o vídeo funcionar no mundo real, adicione DAILY_API_KEY no seu .env.local.'
    }, { status: 400 });
  }

  try {
    // Requisição para criar uma sala virtual "descartável" para esse protocolo específico.
    // Assim que a reunião acabar (1 hora), a sala é destruída, mas o vídeo da auditoria
    // ficará salvo no dashboard da Cloud da Daily (ou AWS próprio configurado).
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          exp: Math.round(Date.now() / 1000) + 3600, // Expira em 1 hora
          enable_chat: false, // Sem chat, só voz e vídeo
          start_video_off: false,
          start_audio_off: false,
          lang: 'pt', // Interface em Português
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha na Daily: ${response.statusText}`);
    }

    const room = await response.json();
    return NextResponse.json({ 
      success: true,
      roomUrl: room.url, 
      roomName: room.name 
    });
    
  } catch (error) {
    console.error('[DAILY API ERROR]', error);
    return NextResponse.json({ error: 'Erro interno ao criar sala de videoconferência' }, { status: 500 });
  }
}
