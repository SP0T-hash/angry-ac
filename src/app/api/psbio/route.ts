import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  // A chave de acesso oficial (IDWall ou Datavalid) vai no seu .env.local
  const PSBIO_API_KEY = process.env.PSBIO_API_KEY;

  // --- MODO DEMONSTRAÇÃO E DESENVOLVIMENTO ---
  if (!PSBIO_API_KEY) {
    const body = await req.json().catch(() => ({}));
    console.log('--- PSBIO REQUEST RECEIVED ---');
    console.log('CPF:', body.cpf);

    // Finge um delay das redes neurais de match de 1.5s
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Aprova 85% das vezes no modo demo
    const isApproved = Math.random() > 0.15;

    await AuditLogger.log({
      eventType: 'BIOMETRY_CHECK',
      agrId: session.agrId,
      ipAddress: ip,
      payload: {
        status: isApproved ? 'APROVADA' : 'PENDENTE',
        provider: 'VEMAPI_DEMO_ENGINE',
      },
      severity: isApproved ? 'INFO' : 'WARN',
    });

    return NextResponse.json({
      status: isApproved ? 'APROVADA' : 'PENDENTE',
      similarityScore: isApproved ? 0.98 : 0.45,
      livenessScore: 0.99,
      provider: 'VEMAPI_DEMO_ENGINE',
      message: isApproved
        ? 'Validação Biométrica (Digital + Face) bem-sucedida.'
        : 'Dossiê Manual Requerido.',
    });
  }

  // --- MUNDO REAL / PRODUÇÃO (IDWALL) ---
  try {
    const { biometricPhotoBase64, documentoBase64 } = await req.json();

    return NextResponse.json({
      error: 'Modo produção do IDWall requer descomentar o código fetch no endpoint.',
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha na requisição Biométrica de Produção' },
      { status: 500 },
    );
  }
}, { rateLimit: 'EMIT' });
