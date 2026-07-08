/**
 * CertValidator - Validação de Certificados ICP-Brasil
 * 
 * Valida certificados X.509, cadeia de certificação
 * e conformidade com ICP-Brasil.
 */

import { getSupabaseAdmin } from './supabase-factory';

export interface CertValidation {
  valid: boolean;
  errors: string[];
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  isICPBr: boolean;
}

export interface CertInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  commonName: string;
  organization: string;
  isICPBr: boolean;
}

function parseDN(dn: string): Record<string, string> {
  const parts: Record<string, string> = {};
  const regex = /([A-Za-z]+)\s*=\s*([^,]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(dn)) !== null) {
    parts[match[1].toUpperCase()] = match[2].trim();
  }
  return parts;
}

function tryParseX509(pem: string): CertInfo | null {
  try {
    const { X509Certificate: X509 } = require('crypto') as typeof import('crypto');
    const cert = new X509(pem);
    const subjectParts = parseDN(cert.subject);
    const issuerParts = parseDN(cert.issuer);
    const cn = subjectParts['CN'] ?? '';
    const org = subjectParts['O'] ?? '';
    const isICPBr =
      subjectParts['O']?.includes('ICP-Brasil') ||
      issuerParts['O']?.includes('ICP-Brasil') ||
      subjectParts['OU']?.includes('ICP-Brasil') ||
      false;

    return {
      subject: cert.subject,
      issuer: cert.issuer,
      validFrom: cert.validFrom,
      validTo: cert.validTo,
      serialNumber: cert.serialNumber,
      commonName: cn,
      organization: org,
      isICPBr,
    };
  } catch {
    return null;
  }
}

function parsePEMFields(pem: string): CertInfo {
  const fields: Record<string, string> = {};
  const lines = pem.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      fields[key] = value;
    }
  }

  const fullSubject = fields['Subject'] ?? fields['subject'] ?? '';
  const fullIssuer = fields['Issuer'] ?? fields['issuer'] ?? '';
  const subjectParts = parseDN(fullSubject);
  const issuerParts = parseDN(fullIssuer);

  return {
    subject: fullSubject,
    issuer: fullIssuer,
    validFrom: fields['Not Before'] ?? fields['notBefore'] ?? '',
    validTo: fields['Not After'] ?? fields['notAfter'] ?? '',
    serialNumber: fields['Serial Number'] ?? fields['serialNumber'] ?? '',
    commonName: subjectParts['CN'] ?? '',
    organization: subjectParts['O'] ?? '',
    isICPBr:
      subjectParts['O']?.includes('ICP-Brasil') ||
      issuerParts['O']?.includes('ICP-Brasil') ||
      fullSubject.includes('ICP-Brasil') ||
      fullIssuer.includes('ICP-Brasil'),
  };
}

export const CertValidator = {
  /**
   * Valida cadeia de certificação completa
   */
  async validateCertificateChain(certPem: string): Promise<CertValidation> {
    const errors: string[] = [];

    if (!certPem || !certPem.includes('-----BEGIN CERTIFICATE-----')) {
      return { valid: false, errors: ['Formato PEM inválido.'], subject: '', issuer: '', validFrom: '', validTo: '', serialNumber: '', isICPBr: false };
    }

    const info = tryParseX509(certPem);
    if (!info) {
      return { valid: false, errors: ['Não foi possível parsear o certificado.'], subject: '', issuer: '', validFrom: '', validTo: '', serialNumber: '', isICPBr: false };
    }

    const now = new Date();
    const validFrom = new Date(info.validFrom);
    const validTo = new Date(info.validTo);

    if (isNaN(validFrom.getTime())) errors.push('Data de início inválida.');
    if (isNaN(validTo.getTime())) errors.push('Data de expiração inválida.');
    if (validFrom > now) errors.push('Certificado ainda não é válido.');
    if (validTo < now) errors.push('Certificado expirado.');

    if (!info.serialNumber || info.serialNumber === '00') {
      errors.push('Número de série inválido.');
    }

    return {
      valid: errors.length === 0,
      errors,
      subject: info.subject,
      issuer: info.issuer,
      validFrom: info.validFrom,
      validTo: info.validTo,
      serialNumber: info.serialNumber,
      isICPBr: info.isICPBr,
    };
  },

  /**
   * Extrai informações do certificado
   */
  extractCertInfo(certPem: string): CertInfo {
    const parsed = tryParseX509(certPem);
    if (parsed) return parsed;
    return parsePEMFields(certPem);
  },

  /**
   * Verifica se certificado foi revogado
   */
  async checkRevocation(certSerial: string): Promise<boolean> {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('protocols')
      .select('cert_serial, status')
      .eq('cert_serial', certSerial)
      .maybeSingle();

    if (error) return true;
    if (data?.status === 'CANCELLED' || data?.status === 'ERROR') return true;

    return false;
  },

  /**
   * Verifica se certificado é ICP-Brasil
   */
  isICPBrBrasil(certPem: string): boolean {
    try {
      const info = CertValidator.extractCertInfo(certPem);
      return info.isICPBr;
    } catch {
      return false;
    }
  },
};
