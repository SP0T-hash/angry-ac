import { NextResponse } from 'next/server';

// PSBIO (Validação Biométrica Face Match) Padrão Ouro ICP-Brasil
export async function POST(request: Request) {
  // A chave de acesso oficial (IDWall ou Datavalid) vai no seu .env.local
  const PSBIO_API_KEY = process.env.PSBIO_API_KEY;

  // --- MODO DEMONSTRAÇÃO E DESENVOLVIMENTO ---
  if (!PSBIO_API_KEY) {
     const body = await request.json().catch(() => ({}));
     console.log('--- PSBIO REQUEST RECEIVED ---');
     console.log('CPF:', body.cpf);
     if (body.template) {
       console.log('TEMPLATE BIOMÉTRICO DETECTADO (Captura via Hardware)');
     }

     // Finge um delay das redes neurais de match de 1.5s
     await new Promise(resolve => setTimeout(resolve, 1500));
     
     // Aprova 85% das vezes no modo demo
     const isApproved = Math.random() > 0.15;
     
     return NextResponse.json({
       status: isApproved ? 'APROVADA' : 'PENDENTE',
       similarityScore: isApproved ? 0.98 : 0.45,
       livenessScore: 0.99,
       provider: 'VEMAPI_DEMO_ENGINE',
       message: isApproved ? 'Validação Biométrica (Digital + Face) bem-sucedida.' : 'Dossiê Manual Requerido.',
     });
  }

  // --- MUNDO REAL / PRODUÇÃO (IDWALL) ---
  try {
    const { biometricPhotoBase64, documentoBase64 } = await request.json();

    // Apenas aguardando você criar a conta do IDWall para descomentar em produção:
    /*
    const response = await fetch('https://api.idwall.co/api/v2/face-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PSBIO_API_KEY}`,
      },
      body: JSON.stringify({ face1: biometricPhotoBase64, face2: documentoBase64 }),
    });
    
    const result = await response.json();
    return NextResponse.json({
      status: result.match_probability >= 0.85 ? 'APROVADA' : 'PENDENTE',
      similarityScore: result.match_probability,
      livenessScore: result.liveness_probability,
      provider: 'IDWALL_OFICIAL',
      message: 'Consultado com sucesso.'
    });
    */

    return NextResponse.json({ error: 'Modo produção do IDWall requer descomentar o código fetch no endpoint.' }, { status: 501 });

  } catch (error) {
    return NextResponse.json({ error: 'Falha na requisição Biométrica de Produção' }, { status: 500 });
  }
}
