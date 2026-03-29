export const MOCK_PROTOCOLS = [
  {
    id: 'PRT-2026-9001',
    status: 'AGUARDANDO_VIDEO',
    priority: 'ALTA',
    product: 'e-CNPJ A1',
    created_at: '2026-03-26T14:30:00Z',
    titular: {
      name: 'João da Silva Sauro',
      cpf: '123.456.789-00',
      birthdate: '15/08/1985',
      email: 'joao.sauro@empresa.com.br',
      phone: '(87) 99999-1234',
    },
    company: {
      cnpj: '12.345.678/0001-90',
      razao_social: 'SAURO TECNOLOGIA LTDA',
      cei: '',
    },
    documents: [
      { type: 'CNH_FRENTE', url: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=200&auto=format&fit=crop', status: 'VERIFICADO' },
      { type: 'CNH_VERSO', url: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=200&auto=format&fit=crop', status: 'VERIFICADO' },
      { type: 'CONTRATO_SOCIAL', url: 'https://via.placeholder.com/600x800/1e293b/ffffff?text=CONTRATO+SOCIAL', status: 'PENDENTE' }
    ],
    compliance: {
      biometria: 'APROVADA',
      score_liveness: '98%',
      biometric_photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=400&auto=format&fit=crop', // Homem sorrindo
      receita_federal: 'REGULAR',
      require_dossie: true,
      saf_generated: true
    }
  },
  {
    id: 'PRT-2026-9002',
    status: 'EM_ANALISE',
    priority: 'NORMAL',
    product: 'e-CPF A3 (Token)',
    created_at: '2026-03-26T15:10:00Z',
    titular: {
      name: 'Maria Eduarda Fernandes',
      cpf: '987.654.321-11',
      birthdate: '22/01/1990',
      email: 'eduarda.maria@gmail.com',
      phone: '(11) 98888-5555',
    },
    company: null,
    documents: [],
    compliance: {
      biometria: 'APROVADA',
      score_liveness: '99.8%',
      biometric_photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop', // Mulher
      receita_federal: 'REGULAR',
      require_dossie: true,
      saf_generated: true
    }
  },
  {
    id: 'PRT-2026-8999',
    status: 'REJEITADO',
    priority: 'URGENTE',
    product: 'e-CNPJ A1',
    created_at: '2026-03-26T10:05:00Z',
    titular: {
      name: 'Carlos Alberto Costa',
      cpf: '012.314.516-77',
      birthdate: '05/11/1978',
      email: 'diretoria@costa.com.br',
      phone: '(21) 97777-4444',
    },
    company: {
      cnpj: '98.765.432/0001-10',
      razao_social: 'COSTA & COSTA ADVOGADOS',
      cei: '76543210',
    },
    documents: [
      { type: 'RG_FRENTE', url: 'https://via.placeholder.com/600x400/1e293b/ffffff?text=RG+FRENTE', status: 'VERIFICADO' },
    ],
    compliance: {
      biometria: 'REPROVADA',
      score_liveness: '45%',
      biometric_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
      receita_federal: 'OCULTA',
      require_dossie: true,
      saf_generated: true
    }
  },
  {
    id: 'PRT-2026-2024',
    status: 'AGUARDANDO_VIDEO',
    priority: 'ALTA',
    product: 'e-CPF A3 (1 ano)',
    created_at: '2026-03-29T00:05:00Z',
    is_presencial: true,
    titular: {
      name: 'VOCÊ (ESTADO DE MESTRE)',
      cpf: '777.888.999-00',
      birthdate: '01/01/1990',
      email: 'admin@vemapi.com.br',
      phone: '(11) 97777-7777',
    },
    company: null,
    documents: [
      { type: 'RG_FRENTE', url: 'https://via.placeholder.com/600x400/065f46/ffffff?text=SEU+RG+FRENTE', status: 'VERIFICADO' },
    ],
    compliance: {
      biometria: 'PENDENTE',
      score_liveness: '0%',
      biometric_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop', // Placeholder
      receita_federal: 'REGULAR',
      require_dossie: true,
      saf_generated: false
    }
  },
  {
    id: 'PRT-2026-4784',
    status: 'RECEBIDA',
    priority: 'ALTA',
    product: 'e-CPF A3 (1 ano)',
    created_at: new Date().toISOString(),
    titular: {
      name: 'VITOR MATHEUS ALVES DE CASTRO',
      cpf: '08698728189',
      birthdate: '1985-05-20',
      email: 'vitormatheus120605@gmail.com',
      phone: '(67) 99307-0781',
    },
    company: null,
    documents: [],
    compliance: {
      biometria: 'PENDENTE',
      score_liveness: '0%',
      biometric_photo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=400&auto=format&fit=crop',
      receita_federal: 'REGULAR',
      require_dossie: true,
      saf_generated: false
    }
  }
];

export const MOCK_AGENTS = [
  {
    id: 'AGR-001',
    name: 'VITOR MATHEUS CASTRO',
    cpf: '086.987.281-89',
    certificate_serial: '7A8B9C1D2E3F', // Serial do Token A3 (Mock)
    provider: 'vidaas',
    status: 'ATIVO',
    role: 'AGR_MASTER'
  },
  {
    id: 'AGR-002',
    name: 'MARCELO ANDRE DOS SANTOS',
    cpf: '111.222.333-44',
    certificate_serial: 'E1F2G3H4I5J6',
    provider: 'birdid',
    status: 'ATIVO',
    role: 'AGR'
  }
];
