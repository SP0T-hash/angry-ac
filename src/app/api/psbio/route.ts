import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';

/**
 * API de Validação Biométrica - IDWall
 *
 * Fluxo real:
 * 1. Cliente envia selfie + documento (base64)
 * 2. IDWall compara face do documento com selfie
 * 3. Verifica liveness (pessoa real vs foto)
 * 4. Retorna score de similaridade e status
 *
 * Documentação IDWall: https://docs.idwall.com.br
 */

interface BiometricRequest {
  cpf: string;
  selfieBase64: string;
  documentFrontBase64?: string;
  documentBackBase64?: string;
}

interface IDWallResponse {
  id: string;
  status: 'approved' | 'rejected' | 'pending';
  similarity_score: number;
  liveness_score: number;
  face_match: boolean;
  document_valid: boolean;
  errors?: string[];
}

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  const IDWALL_API_KEY = process.env.IDWALL_API_KEY;
  const IDWALL_API_URL = process.env.IDWALL_API_URL || 'https://api.idwall.com.br/v2';

  try {
    const body: BiometricRequest = await req.json();

    if (!body.cpf || !body.selfieBase64) {
      return NextResponse.json(
        { error: 'CPF e selfie são obrigatórios' },
        { status: 400 },
      );
    }

    // Validar formato CPF
    const cpfDigits = body.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido: deve conter 11 dígitos' },
        { status: 400 },
      );
    }

    // --- MODO PRODUÇÃO (IDWALL) ---
    if (IDWALL_API_KEY) {
      const response = await fetch(`${IDWALL_API_URL}/biometric/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${IDWALL_API_KEY}`,
        },
        body: JSON.stringify({
          cpf: cpfDigits,
          selfie: body.selfieBase64,
          document_front: body.documentFrontBase64,
          document_back: body.documentBackBase64,
          webhook_url: process.env.IDWALL_WEBHOOK_URL,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `IDWall respondeu com status: ${response.status}`);
      }

      const data: IDWallResponse = await response.json();

      await AuditLogger.log({
        eventType: 'BIOMETRY_CHECK',
        agrId: session.agrId,
        ipAddress: ip,
        payload: {
          status: data.status,
          similarityScore: data.similarity_score,
          livenessScore: data.liveness_score,
          provider: 'IDWALL',
          idWallId: data.id,
        },
        severity: data.status === 'approved' ? 'INFO' : 'WARN',
      });

      return NextResponse.json({
        status: data.status === 'approved' ? 'APROVADA' : 
                data.status === 'rejected' ? 'REJEITADA' : 'PENDENTE',
        similarityScore: data.similarity_score,
        livenessScore: data.liveness_score,
        faceMatch: data.face_match,
        documentValid: data.document_valid,
        provider: 'IDWALL',
        idWallId: data.id,
        message: data.status === 'approved'
          ? 'Validação biométrica aprovada. Identidade confirmada.'
          : data.status === 'rejected'
          ? 'Validação biométrica rejeitada. Dossiê manual requerido.'
          : 'Validação em processamento.',
        errors: data.errors,
      });
    }

    // --- MODO DESENVOLVIMENTO (sem API key) ---
    console.log('--- PSBIO DEV MODE ---');
    console.log('CPF:', cpfDigits.slice(0, 3) + '***');

    // Simular delay de processamento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Em dev, aprovar 90% das vezes
    const isApproved = Math.random() > 0.1;
    const similarityScore = isApproved ? 0.92 + Math.random() * 0.08 : 0.3 + Math.random() * 0.4;
    const livenessScore = 0.95 + Math.random() * 0.05;

    await AuditLogger.log({
      eventType: 'BIOMETRY_CHECK',
      agrId: session.agrId,
      ipAddress: ip,
      payload: {
        status: isApproved ? 'APROVADA' : 'PENDENTE',
        similarityScore,
        livenessScore,
        provider: 'VEMAPI_DEV_MODE',
      },
      severity: isApproved ? 'INFO' : 'WARN',
    });

    return NextResponse.json({
      status: isApproved ? 'APROVADA' : 'PENDENTE',
      similarityScore: Math.round(similarityScore * 100) / 100,
      livenessScore: Math.round(livenessScore * 100) / 100,
      faceMatch: isApproved,
      documentValid: true,
      provider: 'VEMAPI_DEV_MODE',
      message: isApproved
        ? 'Validação biométrica aprovada (modo desenvolvimento).'
        : 'Dossiê manual requerido (modo desenvolvimento).',
    });

  } catch (error: any) {
    console.error('[PSBIO ERROR]', error);

    await AuditLogger.log({
      eventType: 'BIOMETRY_ERROR',
      agrId: session.agrId,
      ipAddress: ip,
      payload: { error: error.message },
      severity: 'ERROR',
    });

    return NextResponse.json(
      { error: 'Falha na validação biométrica', details: error.message },
      { status: 500 },
    );
  }
}, { rateLimit: 'EMIT' });
