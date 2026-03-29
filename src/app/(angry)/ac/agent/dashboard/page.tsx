'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/ac-angry/Sidebar';
import Navbar from '@/components/ac-angry/Navbar';
import ProtocolQueue from '@/components/ac-angry/ProtocolQueue';
import ProtocolViewer from '@/components/ac-angry/ProtocolViewer';
import ClientCRM from '@/components/ac-angry/ClientCRM';
import MessageCenter from '@/components/ac-angry/MessageCenter';
import { MOCK_PROTOCOLS } from '@/lib/ac-angry/mockData';
import { Users, Video, ShieldCheck, MessageSquare, Search, ArrowRight, PlusCircle, CreditCard, Landmark, FileText } from 'lucide-react';
import NewOrderForm from '@/components/ac-angry/NewOrderForm';

export default function AgentDashboard() {
  const [protocols, setProtocols] = useState<any[]>(MOCK_PROTOCOLS);
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [activeView, setActiveView] = useState('protocolos');

  const handleNewProtocol = (formData: any) => {
    const newId = `PRT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newProtocol = {
      id: newId,
      status: 'ASSUMA_ESTE_PEDIDO',
      priority: 'NORMAL',
      product: formData.certType,
      created_at: new Date().toISOString(),
      is_presencial: formData.attendanceMode === 'presencial',
      titular: {
        name: formData.name,
        cpf: formData.cpf,
        birthdate: formData.birthdate || '01/01/1980',
        email: 'aguardando@email.com',
        phone: '(00) 00000-0000',
      },
      company: formData.isPJ ? {
        cnpj: formData.cnpj,
        razao_social: formData.companyName,
        cei: '',
      } : null,
      documents: [],
      compliance: {
        biometria: 'PENDENTE',
        score_liveness: '0%',
        biometric_photo: 'https://via.placeholder.com/400?text=Aguardando+Captura',
        receita_federal: 'PENDENTE',
        require_dossie: true,
        saf_generated: false
      }
    };
    
    setProtocols(prev => [newProtocol, ...prev]);
    setActiveView('protocolos');
  };

  const handleChangeView = (view: string) => {
    setActiveView(view);
    if (view !== 'protocolos') {
      setSelectedProtocol(null);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'protocolos':
        return !selectedProtocol ? (
          <ProtocolQueue 
             protocols={protocols} 
             onSelect={setSelectedProtocol}
          />
        ) : (
          <ProtocolViewer 
             protocol={selectedProtocol} 
             onBack={() => setSelectedProtocol(null)}
          />
        );
      case 'clientes':
        return <ClientCRM />;
      case 'video':
        return (
          <SectionPlaceholder 
            icon={<Video size={48} />}
            title="Central de Videoconferência"
            subtitle="Salas de vídeo e gravações de auditoria"
            description="Painel centralizado para gerenciar videoconferências de validação. Acompanhe agendamentos, salas ativas e todas as gravações de auditoria realizadas pelo seu perfil de AGR."
            features={[
              'Salas agendadas e em andamento em tempo real',
              'Repositório de gravações de auditoria (cloud)',
              'Link de convite para titulares com código QR',
              'Dashboard de métricas (duração, taxa de sucesso)',
            ]}
          />
        );
      case 'conformidade':
        return (
          <SectionPlaceholder 
            icon={<ShieldCheck size={48} />}
            title="Painel de Conformidade"
            subtitle="Auditorias ICP-Brasil e Dossiês"
            description="Centro de controle de conformidade regulatória. Gerencie os dossiês finalizados, acompanhe auditorias da ICP-Brasil, revise relatórios SAF e monitore a taxa de conformidade do seu perfil de AGR."
            features={[
              'Dossiês finalizados e pendentes de revisão',
              'Relatórios SAF (Sistema Antifraude) consolidados',
              'Indicadores de conformidade por período',
              'Exportação de relatórios para auditoria externa',
            ]}
          />
        );
      case 'mensagens':
        return <MessageCenter />;
      case 'novo-pedido':
        return <NewOrderForm onProtocolGenerated={handleNewProtocol} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-gray-800 font-sans selection:bg-emerald-500/30">
      
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Componente Modular 1: Barra Lateral Sempre Visível */}
        <Sidebar activeView={activeView} onChangeView={handleChangeView} />
        
        {/* Área Principal */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden h-16 bg-white border-t border-gray-100 flex items-center justify-around px-4 sticky bottom-0 z-50 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => handleChangeView('protocolos')}
          className={`flex flex-col items-center gap-1 p-2 ${activeView === 'protocolos' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <FileText size={18} strokeWidth={activeView === 'protocolos' ? 2.5 : 2} />
          <span className="text-[9px] font-black uppercase">Fila</span>
        </button>
        <button 
          onClick={() => handleChangeView('novo-pedido')}
          className={`flex flex-col items-center gap-1 p-2 ${activeView === 'novo-pedido' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <PlusCircle size={18} strokeWidth={activeView === 'novo-pedido' ? 2.5 : 2} />
          <span className="text-[9px] font-black uppercase">Novo</span>
        </button>
        <button 
          onClick={() => handleChangeView('clientes')}
          className={`flex flex-col items-center gap-1 p-2 ${activeView === 'clientes' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <Users size={18} strokeWidth={activeView === 'clientes' ? 2.5 : 2} />
          <span className="text-[9px] font-black uppercase">CRM</span>
        </button>
        <button 
          onClick={() => handleChangeView('mensagens')}
          className={`flex flex-col items-center gap-1 p-2 ${activeView === 'mensagens' ? 'text-emerald-600' : 'text-gray-400'}`}
        >
          <MessageSquare size={18} strokeWidth={activeView === 'mensagens' ? 2.5 : 2} />
          <span className="text-[9px] font-black uppercase">Chat</span>
        </button>
      </div>

    </div>
  );
}

function SectionPlaceholder({ icon, title, subtitle, description, features }: { 
  icon: React.ReactNode, 
  title: string, 
  subtitle: string, 
  description: string,
  features: string[] 
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="max-w-lg text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-lg shadow-emerald-100/50">
          {icon}
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{title}</h2>
        <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4">{subtitle}</p>
        <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">{description}</p>
        
        <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Funcionalidades Planejadas</h4>
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowRight size={10} className="text-emerald-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-400 font-bold mt-6 tracking-wider">🚧 Em desenvolvimento — Disponível em breve</p>
      </div>
    </div>
  );
}
