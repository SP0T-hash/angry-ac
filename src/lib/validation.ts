/**
 * Schemas de validação com Zod
 * 
 * Validação de input em todos os boundary points do sistema.
 */

// NOTA: Para usar este arquivo, instale zod: npm install zod
// Por enquanto, usamos validação manual com regex para evitar dependência extra

// ============================================================================
// CPF Validation
// ============================================================================

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

// ============================================================================
// CNPJ Validation
// ============================================================================

export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validar primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleaned.charAt(12)) !== digit1) return false;
  
  // Validar segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleaned.charAt(13)) !== digit2) return false;
  
  return true;
}

// ============================================================================
// Email Validation
// ============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================================
// Phone Validation (Brazilian)
// ============================================================================

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Format: +55XXXXXXXXXXX or XXXXXXXXXXX
  return /^(55)?\d{10,11}$/.test(cleaned);
}

// ============================================================================
// UUID Validation
// ============================================================================

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================================================
// Base64 Validation
// ============================================================================

export function isValidBase64(str: string): boolean {
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Regex.test(str);
}

// ============================================================================
// Input Sanitization
// ============================================================================

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function sanitizeCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

// ============================================================================
// Type Guards
// ============================================================================

export function isNonceScope(value: string): value is 'AUTH' | 'SIGN' | 'BIOMETRY' | 'EMIT' {
  return ['AUTH', 'SIGN', 'BIOMETRY', 'EMIT'].includes(value);
}

export function isAuditSeverity(value: string): value is 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' {
  return ['INFO', 'WARN', 'ERROR', 'CRITICAL'].includes(value);
}

export function isCertificateStatus(value: string): value is 'active' | 'revoked' | 'expired' {
  return ['active', 'revoked', 'expired'].includes(value);
}

export function isProtocolStatus(value: string): value is 'pending' | 'in_progress' | 'completed' | 'rejected' {
  return ['pending', 'in_progress', 'completed', 'rejected'].includes(value);
}
