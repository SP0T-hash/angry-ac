import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger, NonceManager } from '@/lib/ac-angry/security';
import type forge from 'node-forge';

/**
 * MOCK AC CORE - Esta API simula o comportamento de uma Autoridade Certificadora Real.
 * Em produção, a chave privada da CA deve estar em um HSM ou ambiente ultra-seguro.
 *
 * A chave é carregada LAZY (apenas na primeira requisição) para evitar
 * bloqueio do server startup.
 */

// ===========================================================================
// ESTADO LAZY DAS CHAVES DA AC
// ===========================================================================

let caKeys: { publicKey: forge.pki.rsa.PublicKey; privateKey: forge.pki.rsa.PrivateKey } | null = null;
let caCert: forge.pki.Certificate | null = null;
let caInitPromise: Promise<void> | null = null;

/**
 * Inicializa a CA (uma vez apenas) com lazy loading do node-forge.
 */
async function ensureCAInitialized(): Promise<void> {
  if (caKeys && caCert) return;
  if (caInitPromise) return caInitPromise;

  caInitPromise = (async () => {
    const forge = await import('node-forge');

    caKeys = forge.default.pki.rsa.generateKeyPair(2048);
    caCert = forge.default.pki.createCertificate();
    caCert.publicKey = caKeys.publicKey;
    caCert.serialNumber = '01';
    caCert.validity.notBefore = new Date();
    caCert.validity.notAfter = new Date();
    caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 10);

    const caAttrs = [
      { name: 'commonName', value: 'VEMAPI AC RAIZ' },
      { name: 'countryName', value: 'BR' },
      { name: 'organizationName', value: 'VEMAPI TECNOLOGIA' },
      { name: 'organizationalUnitName', value: 'AUTORIDADE CERTIFICADORA' },
    ];
    caCert.setSubject(caAttrs);
    caCert.setIssuer(caAttrs);
    caCert.setExtensions([
      { name: 'basicConstraints', cA: true },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      { name: 'subjectKeyIdentifier' },
    ]);
    caCert.sign(caKeys.privateKey, forge.default.md.sha256.create());
  })()
  .catch((err) => {
    // Se falhar, limpa a promise p/ permitir retry na próxima chamada
    caInitPromise = null;
    caKeys = null;
    caCert = null;
    throw err;
  });

  return caInitPromise;
}

// ===========================================================================
// POST — Assina CSR e emite certificado
// ===========================================================================

export const POST = withAuth(
  async (req: NextRequest, { session, ip }) => {
    try {
      // Garantir que a CA está inicializada
      await ensureCAInitialized();

      const forge = await import('node-forge');
      const { csrPem, titularData, product, nonce } = await req.json();

      if (!csrPem) {
        return NextResponse.json({ error: 'CSR não fornecido' }, { status: 400 });
      }

      // Validar nonce one-time para emissão
      if (nonce) {
        try {
          await NonceManager.consume(nonce, 'SIGN');
        } catch (e: any) {
          return NextResponse.json({ error: e.message }, { status: 400 });
        }
      }

      // Carregar o CSR
      const csr = forge.default.pki.certificationRequestFromPem(csrPem);

      // Validar assinatura do CSR
      if (!csr.verify()) {
        throw new Error('Assinatura do CSR inválida');
      }

      // Criar o certificado final
      const cert = forge.default.pki.createCertificate();
      cert.serialNumber = forge.default.util.bytesToHex(
        forge.default.random.getBytesSync(16),
      );

      if (!csr.publicKey) {
        throw new Error('Chave pública não encontrada no CSR');
      }
      cert.publicKey = csr.publicKey;
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();

      // Validade baseada no produto (1 ano A1, 3 anos A3)
      const years = product?.includes('A3') ? 3 : 1;
      cert.validity.notAfter.setFullYear(
        cert.validity.notBefore.getFullYear() + years,
      );

      cert.setSubject(csr.subject.attributes);
      cert.setIssuer(caCert!.subject.attributes);

      cert.setExtensions([
        { name: 'basicConstraints', cA: false },
        {
          name: 'keyUsage',
          digitalSignature: true,
          nonRepudiation: true,
          keyEncipherment: true,
          dataEncipherment: true,
        },
        {
          name: 'subjectAltName',
          altNames: [
            { type: 1, value: titularData?.email || 'unknown@vemapi.com.br' },
          ],
        },
        { name: 'subjectKeyIdentifier' },
      ]);

      // Assinar com a chave privada da CA
      cert.sign(caKeys!.privateKey, forge.default.md.sha256.create());

      // Exportar para PEM
      const pem = forge.default.pki.certificateToPem(cert);
      const caPem = forge.default.pki.certificateToPem(caCert!);

      // Log de auditoria
      await AuditLogger.log({
        eventType: 'CERT_SIGNED',
        agrId: session.agrId,
        protocolId: undefined,
        ipAddress: ip,
        payload: {
          serialNumber: cert.serialNumber,
          product,
          validUntil: cert.validity.notAfter,
        },
        severity: 'INFO',
      });

      return NextResponse.json({
        success: true,
        certificatePem: pem,
        caChainPem: caPem,
        serialNumber: cert.serialNumber,
        validUntil: cert.validity.notAfter.toISOString(),
        issuer: 'VEMAPI AC RAIZ',
      });
    } catch (error: any) {
      console.error('AC Error:', error);
      await AuditLogger.log({
        eventType: 'CERT_SIGN_ERROR',
        agrId: session.agrId,
        ipAddress: ip,
        payload: { error: error.message },
        severity: 'ERROR',
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  },
  { rateLimit: 'SIGN' },
);
