import { NextRequest, NextResponse } from 'next/server';
import forge from 'node-forge';

/**
 * MOCK AC CORE - Esta API simula o Comportamento de uma Autoridade Certificadora Real
 * Em produção, a chave privada da CA deve estar em um HSM ou ambiente ultra-seguro.
 */

// 1. Gerar Chave Mestra da AC VEMAPI (Simulado)
const caKeys = forge.pki.rsa.generateKeyPair(2048);
const caCert = forge.pki.createCertificate();
caCert.publicKey = caKeys.publicKey;
caCert.serialNumber = '01';
caCert.validity.notBefore = new Date();
caCert.validity.notAfter = new Date();
caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 10);

const caAttrs = [
  { name: 'commonName', value: 'VEMAPI AC RAIZ' },
  { name: 'countryName', value: 'BR' },
  { name: 'organizationName', value: 'VEMAPI TECNOLOGIA' },
  { name: 'organizationalUnitName', value: 'AUTORIDADE CERTIFICADORA' }
];
caCert.setSubject(caAttrs);
caCert.setIssuer(caAttrs);
caCert.setExtensions([
  { name: 'basicConstraints', cA: true },
  { name: 'keyUsage', keyCertSign: true, digitalSignature: true, nonRepudiation: true, keyEncipherment: true, dataEncipherment: true },
  { name: 'subjectKeyIdentifier' }
]);
caCert.sign(caKeys.privateKey, forge.md.sha256.create());

export async function POST(req: NextRequest) {
  try {
    const { csrPem, titularData, product } = await req.json();

    if (!csrPem) {
      return NextResponse.json({ error: 'CSR não fornecido' }, { status: 400 });
    }

    // 2. Carregar o CSR enviado pelo Portal (AGR)
    const csr = forge.pki.certificationRequestFromPem(csrPem);

    // 3. Validar o CSR (Em produção, verificar assinatura do CSR)
    if (!csr.verify()) {
      throw new Error('Assinatura do CSR inválida');
    }

    // 4. Criar o Certificado Final assinado pela AC VEMAPI
    const cert = forge.pki.createCertificate();
    cert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(16));
    
    // Verificar se a chave pública existe antes de atribuir
    if (!csr.publicKey) {
      throw new Error('Chave pública não encontrada no CSR');
    }
    cert.publicKey = csr.publicKey;
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    
    // Validade baseada no produto (1 ano A1, 3 anos A3)
    const years = product?.includes('A3') ? 3 : 1;
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + years);

    // Copiar Subject do CSR ou sobrescrever com dados validados pela AR (Angry)
    cert.setSubject(csr.subject.attributes);
    cert.setIssuer(caCert.subject.attributes);
    
    // Adicionar Extensões (OIDs de AC)
    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, nonRepudiation: true, keyEncipherment: true, dataEncipherment: true },
      { name: 'subjectAltName', altNames: [
        { type: 1, value: titularData.email }, // Email
        // Aqui entrariam os OIDs de CPF/CNPJ reais da ICP-Brasil
      ]},
      { name: 'subjectKeyIdentifier' }
    ]);

    // 5. Assinar o certificado com a Chave Privada da AC RAIZ
    cert.sign(caKeys.privateKey, forge.md.sha256.create());

    // 6. Exportar para PEM
    const pem = forge.pki.certificateToPem(cert);
    const caPem = forge.pki.certificateToPem(caCert);

    return NextResponse.json({
      success: true,
      certificatePem: pem,
      caChainPem: caPem,
      serialNumber: cert.serialNumber,
      validUntil: cert.validity.notAfter,
      issuer: 'VEMAPI AC RAIZ'
    });

  } catch (error: any) {
    console.error('AC Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
