'use client';

import React, { useState } from 'react';
import { 
  User, 
  Hash, 
  Calendar, 
  Shield, 
  Landmark, 
  Briefcase, 
  Video, 
  PlusCircle, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle,
  Camera
} from 'lucide-react';

interface NewOrderFormProps {
  onProtocolGenerated: (formData: any) => void;
}

export default function NewOrderForm({ onProtocolGenerated }: NewOrderFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birthdate: '',
    certType: 'e-CPF A3 1 Ano',
    isPJ: false,
    companyName: '',
    cnpj: '',
    attendanceMode: 'videoconferencia' as 'videoconferencia' | 'presencial',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [protocolId, setProtocolId] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === 'cpf') {
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 11) {
        maskedValue = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      } else {
        maskedValue = digits.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      }
    }
    
    if (name === 'cnpj') {
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 14) {
        maskedValue = digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      } else {
        maskedValue = digits.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      }
    }

    if (name === 'certType') {
      const isPJ = value.includes('e-CNPJ');
      setFormData(prev => ({ ...prev, [name]: value, isPJ }));
    } else {
      setFormData(prev => ({ ...prev, [name]: maskedValue }));
    }
  };

  const handleGenerateProtocol = async () => {
    if (!formData.name || !formData.cpf) return;
    
    setIsGenerating(true);
    
    try {
      const res = await fetch("/api/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao criar protocolo");
      
      setProtocolId(data.protocol.protocol_number);
      // Notificar o componente pai com o protocolo REAL (persistido)
      onProtocolGenerated(data.protocol);
      setSuccess(true);
    } catch (e: any) {
      alert(e.message || "Erro ao gerar protocolo");
    } finally {
      setIsGenerating(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-100 ring-4 ring-white">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Protocolo Gerado!</h2>
        <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-8">O pedido foi lançado com sucesso</p>
        
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 mb-8 text-center w-full max-w-sm">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Número do Protocolo</span>
           <span className="text-4xl font-black text-slate-900 tracking-tighter">{protocolId}</span>
        </div>

        <button 
          onClick={onProtocolGenerated}
          className="px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
        >
          Voltar para a Fila
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-12 overflow-y-auto bg-slate-50/50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <PlusCircle size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Lançar Novo Pedido</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Preencha os dados do titular para gerar um novo protocolo de emissão.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <div className="bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-600"></div>
              
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <User size={12} className="text-emerald-600" /> Dados do Titular
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormGroup label="Nome Completo" icon={<User size={14} />}>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="João Silva..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-all font-medium" 
                  />
                </FormGroup>

                <FormGroup label="CPF" icon={<Hash size={14} />}>
                  <input 
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-all font-medium" 
                  />
                </FormGroup>

                <FormGroup label="Data de Nascimento" icon={<Calendar size={14} />}>
                  <input 
                    name="birthdate"
                    type="date"
                    value={formData.birthdate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-600" 
                  />
                </FormGroup>

                <FormGroup label="Modelo do Certificado" icon={<Shield size={14} />}>
                  <select 
                    name="certType"
                    value={formData.certType}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-all font-bold text-slate-700 appearance-none"
                  >
                    <option>e-CPF A1 1 Ano</option>
                    <option>e-CPF A3 1 Ano</option>
                    <option>e-CPF A3 3 Anos</option>
                    <option>e-CNPJ A1 1 Ano</option>
                    <option>e-CNPJ A3 1 Ano</option>
                    <option>NF-e A1 1 Ano</option>
                  </select>
                </FormGroup>
              </div>

              {/* Conditional PJ Section */}
              {formData.isPJ && (
                <div className="mt-8 pt-8 border-t border-slate-50 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <Briefcase size={12} className="text-emerald-600" /> Dados da Empresa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup label="Razão Social" icon={<Landmark size={14} />}>
                      <input 
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Nome da Empresa LTDA" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-all font-medium" 
                      />
                    </FormGroup>
                    <FormGroup label="CNPJ" icon={<Hash size={14} />}>
                      <input 
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleInputChange}
                        placeholder="00.000.000/0000-00" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-all font-medium" 
                      />
                    </FormGroup>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance & Config */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                 Modalidade de Atendimento
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, attendanceMode: 'videoconferencia' }))}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                      formData.attendanceMode === 'videoconferencia' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-lg shadow-emerald-100' 
                        : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                       formData.attendanceMode === 'videoconferencia' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Video size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-xs uppercase tracking-widest">Videoconferência</span>
                      <span className="text-[10px] opacity-70 font-bold uppercase">Atendimento Remoto</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, attendanceMode: 'presencial' }))}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                      formData.attendanceMode === 'presencial' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-lg shadow-emerald-100' 
                        : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                       formData.attendanceMode === 'presencial' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Camera size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-xs uppercase tracking-widest">Atendimento Presencial</span>
                      <span className="text-[10px] opacity-70 font-bold uppercase">Emissão no Balcão</span>
                    </div>
                  </button>
               </div>
            </div>
          </div>

          {/* Right Column: Upload & Action */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-full">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Documentação Principal</h3>
              
              <div className="flex-1 border-2 border-dashed border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center p-8 text-center group hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-4 group-hover:text-emerald-500 group-hover:shadow-emerald-100 transition-all">
                  <UploadCloud size={32} />
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">Upload de Identidade</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">Arraste RG, CNH ou Passaporte digitalizado (PDF/JPG)</span>
              </div>

              <div className="mt-8 space-y-3">
                 <button 
                   onClick={handleGenerateProtocol}
                   disabled={isGenerating || !formData.name || !formData.cpf}
                   className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-200 hover:bg-emerald-600 transition-all disabled:opacity-20 relative overflow-hidden flex items-center justify-center gap-3"
                 >
                   {isGenerating && (
                     <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     </div>
                   )}
                   <PlusCircle size={16} /> Gerar Protocolo
                 </button>
                 
                 <div className="bg-amber-50 rounded-xl p-4 flex gap-3 border border-amber-100">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-900 font-bold leading-relaxed uppercase tracking-tight">
                       Ao gerar, o protocolo será injetado na fila de conformidade para aprovação imediata.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormGroup({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <span className="text-emerald-500 opacity-50">{icon}</span> {label}
      </label>
      {children}
    </div>
  );
}
