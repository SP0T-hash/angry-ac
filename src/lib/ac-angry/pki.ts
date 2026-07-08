import forge from 'node-forge';

/**
 * Função utilitária para gerar chaves e CSR (Certificate Signing Request)
 * no navegador do AGR/Cliente.
 */
export async function generateCSR(titular: { name: string, email: string, cpfOrCnpj: string }) {
  return new Promise((resolve, reject) => {
    try {
      // 1. Gerar Par de Chaves RSA (Simulando o que o WebPKI/Token faria)
      const keys = forge.pki.rsa.generateKeyPair(2048);

      // 2. Criar o pedido de certificação (CSR)
      const csr = forge.pki.createCertificationRequest();
      csr.publicKey = keys.publicKey;

      const attrs = [
        { name: 'commonName', value: titular.name },
        { name: 'countryName', value: 'BR' },
        { name: 'organizationName', value: 'VEMAPI TECNOLOGIA' },
        { shortName: 'OU', value: 'AC ANGRY CP' }
      ];

      csr.setSubject(attrs);

      // 3. Assinar o CSR com a Chave Privada (Prova de Posse)
      csr.sign(keys.privateKey, forge.md.sha256.create());

      const pem = forge.pki.certificationRequestToPem(csr);

      resolve({
        csrPem: pem,
        publicKeyPem: forge.pki.publicKeyToPem(keys.publicKey),
        // NOTA: Em produção, a chave privada NUNCA sai do hardware/token
        // Esta função é apenas para desenvolvimento/testes
        privateKeyPem: process.env.NODE_ENV === 'development'
          ? forge.pki.privateKeyToPem(keys.privateKey)
          : undefined
      });
    } catch (err) {
      reject(err);
    }
  });
}
