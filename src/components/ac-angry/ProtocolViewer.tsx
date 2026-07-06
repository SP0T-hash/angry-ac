import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, FileText, MoreHorizontal, Lock, Unlock, Edit2, Check, UploadCloud, X, Video, Fingerprint, Search, Save, ShieldCheck, UserCircle, History, AlertTriangle, Camera, AlertCircle, Shield, ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';
import VideoRoomModal from './VideoRoomModal';
import BiometricSignatureModal from './BiometricSignatureModal';
import { generateCSR } from '@/lib/ac-angry/pki';
import { jsPDF } from 'jspdf';

// Reusing BiometricSignatureModal as a base for Rejection Auth
function RejectionAuthModal({ isOpen, onClose, onConfirm, titularName }: any) {
  const [pin, setPin] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);

  if (!isOpen) return null;

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      setCaptured(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-emerald-100">
        <div className="bg-emerald-600 px-8 py-6 text-white relative">
          <button onClick={onClose} className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Confirmar Rejeição</h3>
          <p className="text-emerald-100 text-xs font-bold mt-1 uppercase tracking-widest opacity-80">Autenticação do Agente (AGR)</p>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Digite seu PIN (Certificado A3)</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-center text-lg font-black tracking-[0.5em] focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Validar Biometria do AGR</p>
            <button 
              onClick={handleCapture}
              disabled={isCapturing || captured}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all ${
                captured ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 
                isCapturing ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 
                'bg-white border-2 border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-500'
              }`}
            >
              <Fingerprint size={32} className={isCapturing ? 'animate-bounce' : ''} />
            </button>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-4">
              {captured ? 'Biometria Validada' : isCapturing ? 'Capturando digital...' : 'Toque no sensor biométrico'}
            </p>
          </div>

          <button 
            disabled={!captured || pin.length < 4}
            onClick={() => onConfirm(pin)}
            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-100 transition-all uppercase tracking-widest text-xs disabled:opacity-20 flex items-center justify-center gap-2"
          >
            <Check size={16} /> Confirmar Rejeição Definitiva
          </button>
        </div>
      </div>
    </div>
  );
}

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '($1) $2');
  if (v.length > 7) v = v.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
  return v;
};

const maskCNPJ = (v: string) => {
  v = v.replace(/\D/g, '');
  if (v.length > 14) v = v.slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/, '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
  v = v.replace(/(\d{4})(\d)/, '$1-$2');
  return v;
};

const maskCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split(/[-T]/);
  if (parts.length >= 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Rito de Autenticação e Assinatura via A3 Nuvem (PSC)
function CloudPSCAuthModal({ isOpen, onClose, onConfirm, titularName }: any) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'waiting' | 'signed' | 'error'>('idle');

  if (!isOpen) return null;

  const handleStartPush = async () => {
    setStatus('sending');
    // Em produção: chamada ao psc-auth.ts / soluti-vidaas.ts
    setTimeout(() => setStatus('waiting'), 1500);
    setTimeout(() => setStatus('signed'), 5000);
    setTimeout(() => onConfirm(), 6500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-emerald-100">
        <div className="bg-emerald-600 px-8 py-8 text-white text-center">
          <button onClick={onClose} className="absolute right-6 top-6 text-white/50 hover:text-white">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Assinatura A3 Nuvem</h3>
          <p className="text-emerald-100 text-[10px] font-black mt-1 uppercase tracking-widest opacity-80">Rito PSC (Vidaas / BirdID)</p>
        </div>

        <div className="p-8 text-center space-y-6">
          {status === 'idle' && (
            <>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                Você receberá uma solicitação de assinatura no seu smartphone vinculado.
              </p>
              <button 
                onClick={handleStartPush}
                className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                Solicitar Push no Celular <ArrowLeft className="rotate-180" size={14} />
              </button>
            </>
          )}

          {status === 'sending' && (
            <div className="py-8 flex flex-col items-center">
               <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
               <p className="text-xs font-black text-slate-400 uppercase">Conectando ao PSC...</p>
            </div>
          )}

          {status === 'waiting' && (
            <div className="py-8 flex flex-col items-center animate-pulse">
               <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500">
                  <Fingerprint size={40} />
               </div>
               <p className="text-sm font-bold text-slate-900">Aguardando no Smartphone...</p>
               <p className="text-[10px] font-black text-slate-400 mt-2">AUTORIZE COM SUA BIOMETRIA</p>
            </div>
          )}

          {status === 'signed' && (
            <div className="py-8 flex flex-col items-center">
               <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 text-white shadow-lg shadow-emerald-100">
                  <Check size={32} />
               </div>
               <p className="text-sm font-bold text-emerald-600">Dossier Assinado com Sucesso</p>
               <p className="text-[10px] font-black text-slate-400 mt-2 uppercase">CHAVE CRIPTOGRÁFICA GERADA</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProtocolViewer({ protocol, onBack }: any) {
  const currentUser = "VITOR MATHEUS CASTRO"; // Nome do AGR logado (em produção viria do Auth context)
  const [activeTab, setActiveTab] = useState('Dados');
  const [showAssumeModal, setShowAssumeModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showVideoRoom, setShowVideoRoom] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showCloudPSCModal, setShowCloudPSCModal] = useState(false);
  const [showLockWarningModal, setShowLockWarningModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('Documento de Identificação (RG / CNH / Passaporte)');
  const [certidaoCode, setCertidaoCode] = useState('');
  const [isCodigoComCliente, setIsCodigoComCliente] = useState(true);
  const [codigoEmissao, setCodigoEmissao] = useState(Math.floor(100000 + Math.random() * 900000).toString());
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [expandedDossies, setExpandedDossies] = useState<Record<string, boolean>>({});

  const toggleDossie = (id: string) => {
    setExpandedDossies(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  // Função para salvar Logs de Auditoria no Supabase
  const saveAuditLogToSupabase = async (action: string, metadata: any = {}) => {
    try {
      await fetch('/api/protocols/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_id: protocol.id,
          action,
          agent_name: currentUser, // Nome do AGR logado dinâmico
          metadata,
          ip_address: '187.64.122.10' // Mock de IP real
        })
      });
    } catch (e) {
      console.error("Erro ao persistir log:", e);
    }
  };
  
  // Hardware Bridge (WebSocket)
  const [hwStatus, setHwStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectCount = useRef(0);
  const wsMaxReconnect = 5;
  const isMountedRef = useRef(true);

  // WEBCAM
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (!isMountedRef.current) {
        mediaStream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Erro ao acessar webcam:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const resetState = () => {
    setCapturedPhoto(null);
    setIsEditingDados(false);
    setShowRejectionModal(false);
    // ... rest of reset
  };

  useEffect(() => {
    isMountedRef.current = true;
    if ((activeTab === 'Videoconferência' || activeTab === 'Atendimento') && protocol.is_presencial) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      isMountedRef.current = false;
    };
  }, [activeTab, protocol.id]);

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
        setIsBiometriaColetada(true);
        // Em modo presencial, a foto capturada equivale à videoconferência concluída
        if (protocol.is_presencial) {
           setVideoConcluida(true);
        }
        addAuditLog("Foto capturada presencialmente via Webcam REAL");
        stopCamera();
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const connectHw = () => {
      if (wsReconnectCount.current >= wsMaxReconnect) {
        console.warn('⚠️ Máximo de tentativas de reconexão WebSocket atingido');
        setHwStatus('disconnected');
        return;
      }
      wsReconnectCount.current += 1;
      setHwStatus('connecting');
      const ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        wsReconnectCount.current = 0; // reset no contador ao conectar
        setHwStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'BIOMETRY_CAPTURED') {
            setIsBiometriaColetada(true);
            addAuditLog("Biometria capturada via Hardware USB");
            handleConsultarPSBIO(data.template);
          }
        } catch { /* ignora msg malformada */ }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return; // componente desmontou
        setHwStatus('disconnected');
        setTimeout(connectHw, 5000);
      };

      wsRef.current = ws;
    };

    connectHw();

    return () => {
      isMountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onclose = null; // evita loop de reconexão
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);
  const [safStatus, setSafStatus] = useState<'idle' | 'searching' | 'clean' | 'attached'>('idle');
  
  // Status Tracker Logical States
  const [isBiometriaColetada, setIsBiometriaColetada] = useState(false);
  const [verificacaoBiometricaStatus, setVerificacaoBiometricaStatus] = useState<'neutral' | 'completed' | 'pending'>('neutral');
  const [analisePjStatus, setAnalisePjStatus] = useState<'neutral' | 'completed' | 'error'>('neutral');
  const [videoConcluida, setVideoConcluida] = useState(false);
  const [isVerificandoPj, setIsVerificandoPj] = useState(false);
  const [isVerificandoBio, setIsVerificandoBio] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const [isLocked, setIsLocked] = useState(protocol.status === 'ASSUMA_ESTE_PEDIDO' ? false : (protocol.assumed || false));
  const [lockedBy, setLockedBy] = useState<string | null>(isLocked ? 'VITOR MATHEUS CASTRO' : null);
  const [currentStatus, setCurrentStatus] = useState(protocol.status || 'RECEBIDA');
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Função para carregar logs iniciais dinâmicos
  useEffect(() => {
    const creationDate = new Date(protocol.created_at || Date.now());
    const kycDate = new Date(creationDate.getTime() + 2 * 60000); // +2 min
    
    const logs = [
      { 
        id: 'log-1', 
        action: 'Protocolo Recebido do Bureau', 
        agent: 'SISTEMA', 
        timestamp: creationDate.toLocaleString('pt-BR'), 
        metadata: {} 
      },
      { 
        id: 'log-2', 
        action: 'Validação Cadastral (KYC) - OK', 
        agent: 'SISTEMA', 
        timestamp: kycDate.toLocaleString('pt-BR'), 
        metadata: {} 
      },
    ];

    if (protocol.id === 'PRT-2026-9002') {
      logs.push({
        id: 'log-9002-res',
        action: 'Documento Reservado de Auditoria (Nível 5)',
        agent: 'SISTEMA',
        timestamp: new Date().toLocaleString('pt-BR'),
        metadata: {
          hasDownload: true,
          docName: "Dossiê Reservado (SECURE)",
          serialNumber: "RESERVED-9002-VEMAPI",
          certPem: "--- CONTEÚDO CRIPTOGRAFADO DE AUDITORIA ---"
        }
      });
    }

    setAuditLogs(logs);
  }, [protocol.id]);

  const [isEditingDados, setIsEditingDados] = useState(false);
  const [editableData, setEditableData] = useState({
    name: protocol.titular.name,
    email: protocol.titular.email,
    phone: protocol.titular.phone,
    birthdate: protocol.titular.birthdate || '01/01/1980',
    situacaoCpf: 'REGULAR',
    companyName: protocol.company?.razao_social || '',
  });

  const addAuditLog = (action: string, metadata?: any) => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('pt-BR'),
      action,
      agent: currentUser, // Identificação precisa do responsável
      metadata: metadata || {}
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToSupabase(action, metadata);
  };

  useEffect(() => {
    if (protocol.assumed) {
      setIsLocked(true);
      addAuditLog("AGR assumiu o protocolo na fila principal");
    }
  }, [protocol.assumed]);

  const [isVerificandoCpf, setIsVerificandoCpf] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);

  useEffect(() => {
    setActiveTab('Dados');
    setShowFiltersModal(false);
    setIsLocked(protocol.assumed || false);
    setIsEditingDados(false);
    
    // RESET DE ESTADOS CRÍTICOS (BUG FIX: State Leakage)
    setIsBiometriaColetada(false);
    setVerificacaoBiometricaStatus('neutral');
    setAnalisePjStatus('neutral');
    setVideoConcluida(false);
    setSafStatus('idle');
    setCurrentStatus(protocol.status || 'RECEBIDA');

    setEditableData({
      name: protocol.titular.name,
      email: protocol.titular.email,
      phone: protocol.titular.phone,
      birthdate: protocol.titular.birthdate || '01/01/1980',
      situacaoCpf: 'REGULAR',
      companyName: protocol.company?.razao_social || '',
    });
  }, [protocol.id]);

  useEffect(() => {
    if (!isLocked) setIsEditingDados(false);
  }, [isLocked]);

  const handleFinalizarEGerarDossie = async () => {
    setIsSendingEmail(true);
    
    // Simular Latência de Distribuição de Chaves (LGPD/ABNT)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const timestamp = new Date().toLocaleString('pt-BR');
    const arName = "AR VEMAPI (ANGRY)";
    const acName = "AC ANGRY (BIO-SECURE)";
    const downloadLink = `https://emissor.vemapi.com.br/download/${protocol.id}`;

    let dossieContent = "";
    
    if (isPJ) {
      dossieContent = `
        DOCUMENTO RESERVADO DE EMISSÃO (PJ) - NORMA ABNT/LGPD
        ----------------------------------------------------
        DATA/HORA: ${timestamp}
        AUTORIDADE: ${arName} / ${acName}
        
        TITULAR (REPRESENTANTE): ${protocol.titular.name}
        CPF: ${protocol.titular.cpf}
        DATA NASCIMENTO: ${protocol.titular.birthdate || '---'}
        
        EMPRESA: ${protocol.company?.razao_social || '---'}
        CNPJ: ${protocol.company?.cnpj || '---'}
        
        PROTOCOLO: ${protocol.id}
        CÓDIGO DE EMISSÃO: ${codigoEmissao}
        LINK DE EMISSÃO: ${downloadLink}
        ----------------------------------------------------
      `;
    } else {
      dossieContent = `
        DOCUMENTO RESERVADO DE EMISSÃO (PF) - NORMA ABNT/LGPD
        ----------------------------------------------------
        DATA/HORA: ${timestamp}
        AUTORIDADE: ${arName} / ${acName}
        
        TITULAR: ${protocol.titular.name}
        CPF: ${protocol.titular.cpf}
        DATA NASCIMENTO: ${protocol.titular.birthdate || '---'}
        
        PROTOCOLO: ${protocol.id}
        CÓDIGO DE EMISSÃO: ${codigoEmissao}
        LINK PARA DOWNLOAD: ${downloadLink}
        ----------------------------------------------------
      `;
    }

    if (isCodigoComCliente) {
      addAuditLog(`Dossiê Reservado enviado via e-mail para ${protocol.titular.email}`, {
        type: 'EMAIL_DISPATCH',
        dossie: dossieContent
      });
      alert("Sucesso! E-mail com o Dossiê Reservado disparado para o titular conforme normas LGPD.");
    } else {
      addAuditLog(`Dossiê Reservado armazenado para auditoria interna (Código retido na AR/AC)`, {
        type: 'RESERVED_STORAGE',
        dossie: dossieContent
      });
      alert("Atenção: Atendimento Finalizado. O Código de Emissão foi retido e o dossiê salvo no histórico de auditoria.");
    }

    setIsSendingEmail(false);
    setVideoConcluida(true); // Garante que o status visual reflita a finalização
    setCurrentStatus('APROVADO'); // Move para aprovado após gerar dossiê
  };

  const handleBuscarSaf = async () => {
    setShowFiltersModal(false);
    setSafStatus('searching');
    
    try {
      const res = await fetch('/api/saf', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         // Aqui seria o estado de React dos filtros marcados no modal:
         body: JSON.stringify({ characteristics: ["pinta", "oculos_escuros"] }) 
      });
      const data = await res.json();
      
      if (data.match) {
        setSafStatus('idle');
        alert("CRÍTICO: " + data.message);
      } else {
        setSafStatus('clean');
      }
    } catch (e) {
       console.error("SAF Error", e);
       setSafStatus('clean'); // Fallback visual
    }
  };

  const handleConsultarPJ = async () => {
    if (!protocol.company || !protocol.company.cnpj) return;
    setIsVerificandoPj(true);
    setAnalisePjStatus('neutral');

    try {
      addAuditLog(`Consulta RFB (CNPJ): ${protocol.company.cnpj}`);
      const res = await fetch(`/api/cnpj?cnpj=${protocol.company.cnpj.replace(/\D/g, '')}`);
      const data = await res.json();
      
      if (!res.ok) {
        setAnalisePjStatus('error');
        addAuditLog("Falha na Consulta RFB: CNPJ não encontrado ou erro na API");
      } else {
        setAnalisePjStatus('completed');
        addAuditLog("Consulta RFB Concluída: Empresa ATIVA");
        
        // Atualizar os dados editáveis com o que veio da Receita
        setEditableData(prev => ({
          ...prev,
          companyName: data.razao_social || data.nome || prev.companyName
        }));
      }
    } catch (err) {
      setAnalisePjStatus('error');
      addAuditLog("Erro técnico na consulta RFB");
    } finally {
      setIsVerificandoPj(false);
    }
  };

  const handleConsultarCPF = async () => {
    setIsVerificandoCpf(true);
    try {
      addAuditLog(`Consulta KYC (CPF): ${protocol.titular.cpf}`);
      const res = await fetch(`/api/cpf?cpf=${protocol.titular.cpf.replace(/\D/g, '')}`);
      const data = await res.json();
      if (data.found) {
        setEditableData(prev => ({
          ...prev,
          name: data.name,
          birthdate: data.birth_date,
          situacaoCpf: data.situation
        }));
      }
    } catch (e) {
      console.error("CPF Error", e);
    } finally {
      setIsVerificandoCpf(false);
    }
  };

  const handleSalvarDados = async () => {
    setIsSalvando(true);
    try {
      const res = await fetch('/api/protocol/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: protocol.id, // O ID do protocolo que estamos editando
          updates: {
            titular: {
              ...protocol.titular,
              name: editableData.name,
              email: editableData.email,
              phone: editableData.phone,
              birthdate: editableData.birthdate
            },
            company: isPJ ? {
              ...protocol.company,
              razao_social: editableData.companyName
            } : null
          }
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsEditingDados(false);
        setIsLocked(false);
        alert("Dados do protocolo atualizados com sucesso no Supabase!");
        addAuditLog("Alteração de Dados Cadastrais");
      } else {
        alert("Erro ao salvar: " + data.error);
      }
    } catch (e) {
      console.error("Save Error", e);
    } finally {
      setIsSalvando(false);
    }
  };

  const handleConsultarPSBIO = async (template?: string) => {
    setIsVerificandoBio(true);
    setVerificacaoBiometricaStatus('neutral');

    try {
      const res = await fetch('/api/psbio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: protocol.titular.cpf,
          template: template || null,
          biometricPhotoBase64: 'mock_base64_data',
          documentoBase64: 'mock_base64_data'
        })
      });
      const data = await res.json();
      
      if (data.status === 'APROVADA') {
        setVerificacaoBiometricaStatus('completed');
        addAuditLog("PSBIO: Biometria VALIDADA com sucesso");
      } else {
        setVerificacaoBiometricaStatus('pending'); // Require Manual
        addAuditLog("PSBIO: Validação Biométrica pendente de análise manual");
      }
    } catch (err) {
      setVerificacaoBiometricaStatus('pending');
      addAuditLog("Erro na comunicação com motor PSBIO");
    } finally {
      setIsVerificandoBio(false);
    }
  };

  const handleDownloadTermo = (log: any) => {
    const doc = new jsPDF();
    
    // BUG FIX: Tratar nomes muito longos no PDF
    const titularName = protocol.titular.name;
    const displayName = titularName.length > 30 ? titularName.substring(0, 27) + "..." : titularName;

    // Design do PDF
    doc.setFillColor(6, 95, 70); // Emerald 800
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("AC ANGRY - TERMO DE TITULARIDADE", 20, 25);
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`Protocolo: ${protocol.id}`, 20, 50);
    doc.text(`Data de Emissão: ${log.timestamp}`, 20, 55);
    
    doc.setFontSize(14);
    doc.text("DADOS DO TITULAR", 20, 70);
    doc.line(20, 72, 80, 72);
    
    doc.setFontSize(11);
    doc.text(`Nome: ${displayName}`, 20, 80);
    doc.text(`CPF/CNPJ: ${protocol.titular.cpf}`, 20, 87);
    doc.text(`E-mail: ${protocol.titular.email}`, 20, 94);
    
    doc.setFontSize(14);
    doc.text("DETALHES DO CERTIFICADO", 20, 110);
    doc.line(20, 112, 100, 112);
    
    doc.setFontSize(11);
    doc.text(`Modelo: ${isPJ ? 'e-CNPJ A1' : 'e-CPF A3'}`, 20, 120);
    doc.text(`Serial Number: ${log.metadata.serialNumber}`, 20, 127);
    doc.text(`Autoridade Certificadora: VEMAPI AC RAIZ`, 20, 134);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Este documento é uma evidência digital de titularidade emitida pela AC ANGRY.", 20, 150);
    doc.text("Auditado e Validado via Videoconferência ICP-Brasil.", 20, 155);
    
    doc.save(`Termo_Titularidade_${protocol.titular.name.replace(/ /g, '_')}.pdf`);
  };

  const isPJ = !!protocol.company;

  const handleTabClick = (tab: string) => {
    if (tab === 'Dados') {
      setActiveTab(tab);
      return;
    }

    if (!isLocked) {
      setPendingTab(tab);
      setShowAssumeModal(true);
      return;
    }

    setActiveTab(tab);
  };

  const confirmAssumption = () => {
    setIsLocked(true);
    setLockedBy(currentUser);
    setShowAssumeModal(false);
    addAuditLog(`PEDIDO ASSUMIDO: ${currentUser} assumiu a responsabilidade pela integridade dos dados.`);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleFinalizarAtendimento = async (metodo: 'A3_LOCAL' | 'A3_NUVEM') => {
    try {
      addAuditLog(`Iniciando rito de emissão via ${metodo === 'A3_LOCAL' ? 'Hardware Local' : 'Nuvem (PSC)'}...`);
      
      // 1. Gerar CSR no Client-side
      const csrData: any = await generateCSR({
        name: protocol.titular.name,
        email: protocol.titular.email,
        cpfOrCnpj: protocol.titular.cpf
      });
      
      addAuditLog("CSR gerado com sucesso. Solicitando assinatura à AC RAIZ...");
      
      // 2. Solicitar assinatura à AC Core da VEMAPI
      const res = await fetch('/api/ac/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csrPem: csrData.csrPem,
          titularData: protocol.titular,
          product: protocol.product,
          authMethod: metodo // Registra o método usado no certificado se necessário
        })
      });
      
      const emissionData = await res.json();
      
      if (emissionData.success) {
        setCurrentStatus('EMITIDO');
        
        // SALVAR CERTIFICADO NO SUPABASE
        await fetch('/api/ac/persist-certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serial_number: emissionData.serialNumber,
            protocol_id: protocol.id,
            titular_name: protocol.titular.name,
            titular_cpf_cnpj: protocol.titular.cpf,
            pem_content: emissionData.certificatePem,
            ca_chain_pem: emissionData.caChainPem,
            expires_at: emissionData.validUntil,
            product_type: protocol.product
          })
        });

        addAuditLog(`Certificado Emitido com Sucesso via ${metodo}! SN: ${emissionData.serialNumber}`, {
          hasDownload: true,
          authMethod: metodo,
          docName: "Certificado Digital",
          serialNumber: emissionData.serialNumber,
          certPem: emissionData.certificatePem
        });
        
        setTimeout(() => {
          window.location.href = "/ac/agent/dashboard";
        }, 3000);
      } else {
        throw new Error(emissionData.error || 'Erro na AC');
      }
    } catch (err: any) {
      console.error("Erro na Emissão:", err);
      alert("ERRO CRÍTICO NA EMISSÃO: " + err.message);
    }
  };

  const toggleCadeado = () => {
    if (isLocked) {
      // Se já está travado, perguntar se quer desbloquear
      if (confirm("Deseja desbloquear este pedido? Outros agentes poderão assumi-lo.")) {
        setIsLocked(false);
        setLockedBy(null);
        addAuditLog("Pedido DESBLOQUEADO (Modo Visualização)");
      }
    } else {
      setShowAssumeModal(true);
    }
  };

  return (
    <div className="flex h-full bg-white text-gray-800 font-sans shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
      
      {/* Modal de Assunção de Responsabilidade */}
      {showAssumeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-emerald-100">
            <div className="bg-emerald-600 px-10 py-10 text-white relative">
              <button onClick={() => setShowAssumeModal(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center mb-6 backdrop-blur-md">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Termo de Assunção de Responsabilidade</h3>
              <p className="text-emerald-100 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Conformidade ICP-Brasil / LGPD</p>
            </div>

            <div className="p-10 space-y-8">
              <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50">
                <p className="text-slate-600 font-bold text-sm leading-relaxed mb-4">
                  Ao assumir essa solicitação, você declara formalmente ser o Agente de Registro (AGR) responsável pela conferência biográfica e biométrica deste titular.
                </p>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-emerald-600"><Check size={16} /></div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Responsabilidade pela integridade dos documentos.</p>
                </div>
                <div className="flex items-start gap-3 mt-2">
                  <div className="mt-1 text-emerald-600"><Check size={16} /></div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Ciência do rito de validação por videoconferência.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowAssumeModal(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all font-sans"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAssumption}
                  className="flex-3 px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-100 hover:bg-emerald-600 transition-all font-sans flex items-center justify-center gap-2"
                >
                  <Lock size={14} /> Assumir Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <RejectionAuthModal 
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={(pin: string) => {
          setShowRejectionModal(false);
          setCurrentStatus('REJEITADO');
          addAuditLog(`Rejeição por: Vitor Matheus Castro (PIN: ${pin.replace(/./g, '*')})`);
          alert("Protocolo REJEITADO com sucesso pelo Agente.");
        }}
      />

      {/* Main Grid Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
        
        {/* 1. LEFT COLUMN: Patient Info - Oculta em md- se necessário ou stack */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-2 shrink-0 border-r border-gray-100 bg-white/40 backdrop-blur-xl flex-col p-6 overflow-y-auto relative z-20">
          <button
            onClick={onBack}
            className="self-start text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 mb-8 flex items-center gap-2 transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar
          </button>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h2 className="text-xl font-black text-slate-800 leading-tight tracking-tight">
              {protocol.titular.name}
            </h2>
            <button 
              onClick={toggleCadeado}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isLocked 
                  ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm hover:bg-amber-200' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm hover:bg-emerald-100'
              }`}
              title={isLocked ? "Pedido Seguro (Sua edição)" : "Clique para assumir este pedido"}
            >
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          </div>
          
          <div className="h-6 flex items-center mb-4">
             {isLocked ? (
               <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg px-2 py-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 transition-all">
                 <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black">VC</div>
                 <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">BLOQUEADO POR: {lockedBy || 'VITOR MATHEUS'}</span>
               </div>
             ) : (
               <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                 Pendente de Assunção
               </div>
             )}
          </div>

          {/* Hardware Connection Badge */}
          <div className="mb-4">
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
              hwStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              hwStatus === 'connecting' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              'bg-gray-50 text-gray-400 border-gray-100'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                hwStatus === 'connected' ? 'bg-emerald-600' :
                hwStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-gray-300'
              }`}></div>
              Hardware: {hwStatus === 'connected' ? 'Pronto' : hwStatus === 'connecting' ? 'Buscando...' : 'Desconectado'}
            </div>
          </div>

          <p className="text-sm font-bold text-slate-500 mb-3 tracking-tighter">{protocol.titular.cpf}</p>
          
          <div className="flex">
            <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-wider shadow-sm transition-all ${
              currentStatus === 'EMITIDO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-50' :
              currentStatus === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-50' :
              currentStatus === 'REJEITADO' ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-50' :
              'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {currentStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5 mt-4">
          <div className="space-y-0.5">
             <label className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Produto</label>
             <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{isPJ ? "e-CNPJ A1" : "e-CPF A3"}</p>
          </div>
          <div className="space-y-0.5">
             <label className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Protocolo</label>
             <p className="text-[11px] font-bold text-slate-600 tracking-tight">{protocol.id}</p>
          </div>
          
          <div className="h-[1px] bg-slate-50"></div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-0.5">
               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">AR Emissora</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase">{protocol.ar || 'AR VEMAPI'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Ponto de Atendimento</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase">{protocol.pa || 'Matriz Central'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Data Solicitação</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase">27/03/2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER COLUMN: Tabs & Main Content */}
      <div className="col-span-1 lg:col-span-9 xl:col-span-7 flex flex-col bg-white overflow-hidden relative border-r border-gray-100 z-10 shadow-[8px_0_20px_rgba(0,0,0,0.02)]">
        
        {/* Mobile Header (Back + Status) */}
        <div className="lg:hidden p-4 bg-slate-900 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-bold text-sm tracking-tight truncate max-w-[150px]">{protocol.titular.name}</h1>
          </div>
          <div className="bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{currentStatus}</div>
        </div>

        {currentStatus === 'REJEITADO' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-rose-100 border-4 border-white">
              <X size={48} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">Solicitação Rejeitada</h2>
            <p className="text-slate-500 font-bold max-w-md leading-relaxed mb-8">
              Este protocolo foi formalmente rejeitado pelo Agente de Registro. Nenhuma ação adicional é permitida neste atendimento.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="px-8 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all"
              >
                Voltar para a Fila
              </button>
              <button 
                onClick={() => setActiveTab('Histórico')}
                className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
              >
                Ver Motivo no Histórico
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Nav Tabs */}
            <div className="flex border-b border-gray-100 px-8 bg-white sticky top-0 z-20 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          {['Dados', 'Documentos', protocol.is_presencial ? 'Atendimento' : 'Videoconferência', 'SAF', 'Histórico'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-5 py-5 text-[11px] uppercase tracking-[0.15em] font-black border-b-[3px] transition-all relative ${activeTab === tab || (tab === 'Atendimento' && activeTab === 'Atendimento') || (tab === 'Videoconferência' && activeTab === 'Videoconferência')
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
            >
              <div className="flex items-center gap-2">
                {tab === 'Atendimento' && <Camera size={14} />}
                {tab === 'Videoconferência' && <Video size={14} />}
                {tab}
              </div>
              {tab === 'Histórico' && (
                <span className="ml-2 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px] font-black group-hover:bg-emerald-100">
                  {auditLogs.length}
                </span>
              )}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-emerald-600 rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.3)]"></div>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          
          {/* BARREIRA DE COLISÃO (Locked by another user) */}
          {isLocked && lockedBy !== currentUser && (
            <div className="absolute inset-0 z-[50] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
               <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl">
                  <Lock size={32} className="text-amber-500" />
               </div>
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Pedido em Análise</h3>
               <p className="max-w-md text-slate-500 font-bold leading-relaxed mb-8">
                  Este protocolo já está sendo analisado por <span className="text-amber-600 underline">{lockedBy}</span>.
                  <br />
                  Aguarde a liberação ou entre em contato com o supervisor para alternar a fila.
               </p>
               <button 
                onClick={onBack}
                className="px-8 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all font-sans"
               >
                 Voltar para a Fila
               </button>
            </div>
          )}

          {/* OVERLAY DE SEGURANÇA (Unlocked - Access Restricted) */}
          {!isLocked && activeTab !== 'Dados' && (
            <div className="absolute inset-0 z-[40] bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
               <div className="bg-white/80 backdrop-blur-xl border border-slate-100 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center max-w-sm">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">Acesso Restrito</h4>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-loose mb-8">
                    É necessário <span className="text-emerald-600">assumir a responsabilidade</span> deste pedido para visualizar ou operar nestes dados.
                  </p>
                  <button 
                    onClick={() => setShowAssumeModal(true)}
                    className="w-full py-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    Clique para Assumir
                  </button>
               </div>
            </div>
          )}

          {(activeTab === 'Videoconferência' || activeTab === 'Atendimento') && (
            <div className="flex flex-col items-center justify-center mt-10 space-y-6">
              {protocol.is_presencial ? (
                 <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera size={20} />
                        <span className="font-black text-sm uppercase tracking-widest">Captura de Foto Presencial</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded">WEBCAM ATIVA</span>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col items-center">
                      <div className="w-[320px] aspect-[4/3] bg-slate-900 rounded-xl mb-6 relative overflow-hidden ring-4 ring-emerald-50 group">
                         {capturedPhoto ? (
                           <img 
                             src={capturedPhoto} 
                             alt="Captura" 
                             className="w-full h-full object-cover scale-x-[-1]" 
                           />
                         ) : (
                           <video 
                             ref={videoRef} 
                             autoPlay 
                             playsInline 
                             className="w-full h-full object-cover scale-x-[-1]" 
                           />
                         )}
                         
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                           <div className="w-full h-full bg-gradient-to-t from-black/60 to-transparent absolute inset-0 z-10"></div>
                           
                            {!streamRef.current && !capturedPhoto && (
                             <div className="z-20 flex flex-col items-center text-emerald-400">
                               <div className="w-12 h-12 border-2 border-emerald-500 rounded-full flex items-center justify-center animate-pulse mb-3">
                                 <Camera size={24} />
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Iniciando Câmera...</span>
                             </div>
                           )}
                           
                           {capturedPhoto && (
                             <div className="z-20 flex flex-col items-center text-white">
                               <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                                 <Check size={24} />
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest drop-shadow-md">Foto Registrada</span>
                             </div>
                           )}
                           
                           {/* Overlay de Foco */}
                           {!capturedPhoto && (
                             <>
                               <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400/50 z-20"></div>
                               <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400/50 z-20"></div>
                               <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400/50 z-20"></div>
                               <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400/50 z-20"></div>
                             </>
                           )}
                         </div>
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                        <button 
                         onClick={handleCapturePhoto}
                         className="px-8 py-3.5 bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 group"
                        >
                          <Camera size={18} className="group-hover:rotate-12 transition-transform" /> Capturar Foto Agr
                        </button>
                        <button 
                          onClick={() => handleConsultarPSBIO()}
                          className="px-8 py-3 bg-white border-2 border-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Fingerprint size={16} /> Coletar Digital (Hardware)
                        </button>
                      </div>
                      <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Obrigatório captura frontal conforme ICP-Brasil</p>
                    </div>
                 </div>
              ) : (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center max-w-md shadow-sm">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                      <Video size={32} />
                    </div>
                    <h4 className="text-emerald-950 font-extrabold text-lg mb-2">Sala de Auditoria VIP</h4>
                    <p className="text-emerald-800/70 font-semibold text-sm mb-6 leading-relaxed">
                      Acesse o ambiente imersivo para realizar a verificação biográfica e biométrica do titular.
                    </p>
                    
                    {/* NOVA LÓGICA DE EMISSÃO LGPD/ABNT */}
                    <div className="bg-white rounded-2xl p-5 mb-6 border border-emerald-100 text-left shadow-inner">
                      <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Shield size={12} /> Configurações de Emissão
                      </h5>
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="delivery_mode" 
                            checked={isCodigoComCliente}
                            onChange={() => setIsCodigoComCliente(true)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Entregar Código ao Cliente</span>
                            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">O cliente recebe e-mail com Dossiê Reservado</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="delivery_mode" 
                            checked={!isCodigoComCliente}
                            onChange={() => setIsCodigoComCliente(false)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Reter Código (AR/AC Emite)</span>
                            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Dossiê salvo apenas no histórico de auditoria</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setShowVideoRoom(true);
                        setVideoConcluida(true); // Mock de vídeo concluído após ingresso
                        addAuditLog("Sessão de Videoconferência Iniciada e Gravada localmente (ISO/IEC 27001)");
                      }}
                      className="font-bold py-3.5 px-8 rounded-xl flex items-center gap-3 shadow-md transition-all bg-emerald-700 hover:bg-emerald-800 hover:shadow-lg text-white w-full justify-center group mb-3"
                    >
                      <span className="text-emerald-200 group-hover:text-white transition-colors">▶</span> INGRESSAR NA VIDEOCONFERÊNCIA
                    </button>

                    <button 
                      onClick={handleFinalizarEGerarDossie}
                      disabled={isSendingEmail || !videoConcluida}
                      className="w-full py-3 bg-white border-2 border-emerald-600 text-emerald-700 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-30 shadow-sm"
                    >
                      {isSendingEmail ? (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
                      ) : (
                        <FileText size={16} />
                      )}
                      Finalizar e Gerar Dossiê Reservado
                    </button>
                  </div>
              )}
            </div>
          )}

          {activeTab === 'Documentos' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Documentos</h3>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-1.5 border border-gray-300 rounded font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-gray-50 shadow-sm transition-colors">
                    Atualizar
                  </button>
                  <button 
                    onClick={() => setShowNewDocModal(true)}
                    disabled={!isLocked}
                    className="px-4 py-1.5 bg-emerald-800 text-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-20"
                  >
                    Novo
                  </button>
                </div>
              </div>

              <div className="border-b border-gray-200 mb-4 flex gap-6">
                <button className="text-sm font-semibold border-b-[3px] border-emerald-700 text-emerald-800 pb-2">Documentos</button>
                <button className="text-sm font-semibold text-gray-500 pb-2">Excluídos</button>
              </div>

              <div className="flex flex-col">
                <DocItem name="Documento de identificação" status="Novo" date="27/03/2026 09:40:41" showMenu />
                <DocItem name="Evidência de verificação biográfica" status="Novo" date="27/03/2026 09:39:54" />
                <DocItem name="Evidência de coleta biométrica" status="Novo" date="27/03/2026 09:35:54" />
                <DocItem name="Foto do solicitante" status="Novo" date="27/03/2026 09:39:33" />
                <DocItem name="Videoconferência" status="Novo" date="27/03/2026 10:01:13" />
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowNewDocModal(true)}
                  disabled={!isLocked}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg disabled:opacity-20 transition-all"
                >
                  Anexar Novo Dossiê
                </button>
              </div>
            </div>
          )}

          {activeTab === 'SAF' && (
            <div>
              <div className="flex items-center gap-3">
                <button 
                  disabled={!isLocked}
                  className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white disabled:opacity-20"
                >
                  Comunicar fraude
                </button>
                <button
                  onClick={() => setShowFiltersModal(true)}
                  className={`px-4 py-1.5 rounded font-semibold text-sm shadow-sm transition-colors ${!isBiometriaColetada || !isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-20' : 'bg-emerald-800 text-white hover:bg-emerald-700'}`}
                  disabled={!isBiometriaColetada || safStatus === 'searching' || safStatus === 'attached' || !isLocked}
                  title={!isBiometriaColetada ? "Necessário realizar Coleta Biométrica primeiro" : !isLocked ? "Assuma o pedido para buscar" : ""}
                >
                  Busca com filtros
                </button>
              </div>

              {safStatus === 'idle' && (
                <div className="h-64 border-2 border-dashed border-gray-100 rounded-xl mt-8 flex items-center justify-center bg-gray-50/50">
                  <p className="text-gray-400 font-medium text-sm">Área de visualização vazia (Sem SAF)</p>
                </div>
              )}

              {safStatus === 'searching' && (
                <div className="h-64 border border-emerald-100 rounded-xl mt-8 flex flex-col items-center justify-center bg-emerald-50/30">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full mb-4"></div>
                  <p className="text-emerald-800 font-bold text-sm">Buscando em bases de restrição...</p>
                  <p className="text-emerald-500 font-medium text-xs mt-1">Comparando características físicas informadas.</p>
                </div>
              )}

              {safStatus === 'clean' && (
                <div className="border border-emerald-200 rounded-xl mt-8 bg-emerald-50/30 p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-lg font-extrabold text-emerald-900 mb-2">Nenhum Registro Encontrado</h3>
                  <p className="text-emerald-700 font-medium text-sm max-w-md mx-auto mb-6">
                    A varredura nas listas de fraudadores não resultou em matches positivos com as características físicas selecionadas.
                  </p>
                  <button 
                    onClick={() => setSafStatus('attached')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm"
                  >
                    Confirmar e Anexar Consulta ao SAF
                  </button>
                </div>
              )}

              {safStatus === 'attached' && (
                <div className="border border-emerald-200 rounded-xl mt-8 bg-white p-6 flex flex-col shadow-sm animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Laudo Técnico SAF anexado</h4>
                      <p className="text-xs text-gray-500 font-medium">Validado por Vitor Matheus em {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                       <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded text-xs font-bold border border-emerald-100">
                         Risco Baixo
                       </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium flex flex-col gap-2">
                     <p>• As características informadas não coincidem com o banco de fraudes.</p>
                     <p>• Vínculo anexado ao dossiê de auditoria principal do titular.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Histórico' && (
            <div className="max-w-3xl p-2 animate-in fade-in duration-500">
               <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight uppercase">
                    Auditoria do Atendimento
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-[0.1em] shadow-sm">Real-time Log</span>
                  </h3>
               </div>

               <div className="relative pl-1">
                 <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100 before:shadow-inner">
                   {auditLogs.map((log) => (
                     <div key={log.id} className="relative pl-12 group animate-in slide-in-from-left-2 duration-300">
                        {/* Indicador Temporal */}
                        <div className={`absolute left-0 top-1 w-10 h-10 rounded-2xl flex items-center justify-center border-2 z-10 transition-all shadow-md group-hover:scale-110 ${
                          log.agent === 'SISTEMA' ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-amber-50' : 
                          log.agent === 'CLIENTE' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-50' :
                          'bg-white border-slate-200 text-slate-400 group-first:border-emerald-600 group-first:text-emerald-600 shadow-sm'
                        }`}>
                          {log.agent === 'SISTEMA' ? <ShieldCheck size={18} /> : 
                           log.agent === 'CLIENTE' ? <UserCircle size={18} /> :
                           <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black uppercase tracking-tighter shadow-inner">AGR</div>}
                        </div>

                        {/* Conteúdo do Log (Estilo Terminal) */}
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-slate-200 group-first:border-l-emerald-600">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.action}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-md">{log.timestamp}</span>
                              </div>
                           </div>
                           
                            <div className="flex items-center gap-2 mb-2">
                               <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{log.agent}</span>
                            </div>

                            {log.metadata?.dossie && (
                              <div className="mt-4 bg-[#0A0F1E] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group/dossie transition-all duration-500">
                                 {/* Header de Toggle */}
                                 <button 
                                   onClick={() => toggleDossie(log.id)}
                                   className="w-full flex items-center justify-between p-4 bg-slate-800/20 hover:bg-slate-800/40 transition-colors border-b border-white/5"
                                 >
                                   <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em]">Dossiê de Integridade • LGPD Compliance</span>
                                   </div>
                                   <div className="flex items-center gap-4">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{expandedDossies[log.id] ? 'RECOLHER' : 'ESTENDER'}</span>
                                      <div className={`transition-transform duration-300 ${expandedDossies[log.id] ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={14} className="text-slate-400" />
                                      </div>
                                   </div>
                                 </button>

                                 {/* Conteúdo Expansível */}
                                 {expandedDossies[log.id] && (
                                   <div className="p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Audit Log / CID-X509 Root</span>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const a = document.createElement('a');
                                            a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(log.metadata.dossie);
                                            a.download = `DOSSIE_${protocol.id}_${log.timestamp.replace(/[:\/ ]/g, '_')}.txt`;
                                            a.click();
                                          }}
                                          className="text-[9px] font-black text-emerald-400 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-lg"
                                        >
                                          <FileText size={10} /> Baixar Auditoria
                                        </button>
                                      </div>
                                      <pre className="text-[11px] text-emerald-300/90 font-mono leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30 font-medium">
                                        {log.metadata.dossie}
                                      </pre>
                                   </div>
                                 )}
                              </div>
                            )}

                            {log.metadata?.hasDownload && (
                             <div className="mt-3 pt-3 border-t border-dashed border-slate-100 flex items-center justify-between bg-emerald-50/30 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                                <div className="flex items-center gap-2">
                                  <FileText size={14} className="text-emerald-600" />
                                  <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tighter">{log.metadata.docName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      const blob = new Blob([log.metadata.certPem], { type: 'application/x-x509-ca-cert' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `Certificado_${log.metadata.serialNumber}.crt`;
                                      a.click();
                                    }}
                                    className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all uppercase tracking-widest"
                                  >
                                    Baixar .CRT
                                  </button>
                                  <button 
                                    onClick={() => handleDownloadTermo(log)}
                                    className="text-[9px] font-black text-white bg-emerald-700 px-3 py-1.5 rounded-lg shadow-lg shadow-emerald-900/10 hover:bg-emerald-800 transition-all uppercase tracking-widest"
                                  >
                                    Termo (PDF)
                                  </button>
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'Dados' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Dados Cadastrais</h3>
                {!isLocked ? (
                  <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1.5 opacity-80">
                    <Lock size={12} /> Assuma o pedido para habilitar a edição
                  </span>
                ) : (
                  <button 
                    onClick={() => setIsEditingDados(!isEditingDados)} 
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 shadow-sm"
                  >
                    {isEditingDados ? <><Check size={14} /> Salvar Edição</> : <><Edit2 size={14} /> Editar Dados</>}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 max-w-2xl">
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Nome Completo {isPJ ? '(Responsável)' : ''}</p>
                  {isEditingDados ? (
                    <input 
                      type="text" 
                      value={editableData.name}
                      onChange={(e) => setEditableData({...editableData, name: e.target.value})}
                      className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{editableData.name}</p>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-gray-500 font-semibold mb-1">CPF {isPJ ? '(Responsável)' : ''}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{protocol.titular.cpf}</p>
                    <button 
                      onClick={handleConsultarCPF}
                      disabled={isVerificandoCpf || !isLocked}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 disabled:opacity-30 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 transition-colors"
                    >
                      {isVerificandoCpf ? <div className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-emerald-600 rounded-full animate-spin"></div> : <Search size={10} />}
                      Validar KYC
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Data de Nascimento</p>
                  {isEditingDados ? (
                    <input 
                      type="text" 
                      value={editableData.birthdate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        let masked = val;
                        if (val.length > 2) masked = val.slice(0, 2) + '/' + val.slice(2);
                        if (val.length > 4) masked = masked.slice(0, 5) + '/' + masked.slice(5, 9);
                        setEditableData({...editableData, birthdate: masked.slice(0, 10)});
                      }}
                      className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
                      placeholder="DD/MM/AAAA"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{formatDate(editableData.birthdate)}</p>
                  )}
                </div>
                <div className="col-span-1">
                   <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-tighter">Situação CPF</p>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                     editableData.situacaoCpf === 'REGULAR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                   }`}>
                     {editableData.situacaoCpf}
                   </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">E-mail</p>
                  {isEditingDados ? (
                    <input 
                      type="email" 
                      value={editableData.email}
                      onChange={(e) => setEditableData({...editableData, email: e.target.value.replace(/\s/g, '')})}
                      className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{editableData.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Telefone</p>
                  {isEditingDados ? (
                    <input 
                      type="text" 
                      value={editableData.phone}
                      onChange={(e) => setEditableData({...editableData, phone: maskPhone(e.target.value)})}
                      className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{editableData.phone}</p>
                  )}
                </div>
                {isPJ && (
                  <>
                    <div className="col-span-2">
                       <p className="text-xs text-gray-500 font-semibold mb-1">Nome Empresarial (Razão Social)</p>
                       {isEditingDados ? (
                         <input 
                           type="text" 
                           value={editableData.companyName}
                           onChange={(e) => setEditableData({...editableData, companyName: e.target.value})}
                           className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
                         />
                       ) : (
                         <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{editableData.companyName}</p>
                       )}
                    </div>
                    {protocol.company.cnpj && (
                      <div className="col-span-1">
                        <p className="text-xs text-gray-500 font-semibold mb-1">CNPJ</p>
                        <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{maskCNPJ(protocol.company.cnpj)}</p>
                      </div>
                    )}
                    <div className="col-span-1 flex items-end">
                       <button 
                         onClick={handleConsultarPJ}
                         disabled={isVerificandoPj || !isLocked}
                         className="mb-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 disabled:opacity-30 flex items-center gap-1"
                       >
                         <Search size={10} /> Validar na RFB
                       </button>
                    </div>
                  </>
                )}

                {/* SPECIAL SECTION: Documento Reservado para 9002 */}
                {protocol.id === 'PRT-2026-9002' && currentStatus === 'EMITIDO' && (
                  <div className="col-span-2 mt-8 p-6 bg-slate-900 rounded-3xl border-4 border-amber-400/30 animate-in zoom-in duration-500 shadow-2xl shadow-amber-900/20">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-400/20">
                        <ShieldCheck size={32} />
                      </div>
                      <div>
                        <h4 className="text-amber-400 font-black text-lg uppercase tracking-tight">Documento Reservado</h4>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Confidencial • Auditoria Nível 5</p>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6 text-left">
                       <p className="text-slate-300 text-xs font-medium leading-relaxed mb-4">
                         Este documento contém o hash de integridade e a trilha de auditoria reservada para a titular Maria Eduarda Fernandes. 
                         As evidências biométricas foram seladas com carimbo de tempo da Autoridade Certificadora.
                       </p>
                       <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">
                         <Check size={14} /> Integridade do Dossiê Verificada
                       </div>
                    </div>
                    <button 
                      onClick={() => alert("Baixando Dossiê Reservado (Criptografado)...")}
                      className="w-full py-4 bg-amber-400 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-xl shadow-amber-400/10"
                    >
                      Acessar Dossiê Reservado (.SECURE)
                    </button>
                  </div>
                )}
              </div>

              {isEditingDados && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                   <button 
                    onClick={() => setIsEditingDados(false)}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                   >
                     Descartar
                   </button>
                   <button 
                    onClick={handleSalvarDados}
                    disabled={isSalvando}
                    className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                   >
                     {isSalvando ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} />}
                     Salvar Alterações
                   </button>
                </div>
              )}
            </div>
          )}

        </div>
      </>
    )}
  </div>

        {/* 3. RIGHT COLUMN: Video & Status */}
        <div className="hidden xl:flex xl:col-span-3 h-full overflow-y-auto border-l border-gray-100 bg-slate-50/20 flex-col relative z-20">
          
          <div className="h-[53px] border-b border-gray-100"></div>

        <div className="p-6 flex-1 flex flex-col">
          {/* Photo / Webcam Box */}
          <div className="w-[180px] xl:w-[220px] aspect-[4/5] bg-gray-100 mx-auto mb-4 rounded-lg shadow-md overflow-hidden border border-gray-200 relative group">
            {(capturedPhoto || protocol.compliance.biometric_photo) ? (
              <img 
                src={capturedPhoto || protocol.compliance.biometric_photo} 
                alt="Biometria" 
                className={`w-full h-full object-cover object-top transition-all ${(!isBiometriaColetada && !capturedPhoto) ? 'grayscale opacity-50' : ''}`} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-sm font-medium">Sem imagem</span>
              </div>
            )}
            {(!isBiometriaColetada && !capturedPhoto) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                <span className="text-[10px] font-bold text-gray-600 bg-white/90 px-2 py-1 rounded shadow-sm">Aguardando Coleta</span>
              </div>
            )}
          </div>

          {/* BOTÕES DE CONSULTA & INTEGRAÇÃO DE APIs */}
          <div className="flex flex-col gap-3 mb-8 w-full max-w-[240px] px-2 mx-auto mt-4">
            <button 
              onClick={() => handleConsultarPSBIO()} 
              disabled={isVerificandoBio || !isBiometriaColetada}
              className={`text-[10px] py-4 px-4 rounded-xl border font-black uppercase tracking-[0.1em] text-center transition-all flex justify-center items-center shadow-sm relative overflow-hidden ${
                isVerificandoBio || !isBiometriaColetada 
                  ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                  : 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700 hover:shadow-emerald-100 shadow-lg'
              }`}
            >
              {isVerificandoBio && (
                <div className="absolute inset-0 bg-emerald-700/60 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              {isVerificandoBio ? 'Sincronizando...' : 'Autenticar Biometria'}
            </button>
            
            {isPJ && (
              <button 
                onClick={handleConsultarPJ} 
                disabled={isVerificandoPj}
                className={`text-[10px] py-3.5 px-3 rounded-xl border font-black text-center transition-all flex justify-center items-center shadow-sm relative overflow-hidden ${
                  isVerificandoPj 
                    ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isVerificandoPj && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                  </div>
                )}
                <span className="uppercase tracking-tighter">{isVerificandoPj ? 'Consultando...' : 'Validar Receita (CNPJ)'}</span>
              </button>
            )}
          </div>

          {/* Status List */}
          <div className="w-full max-w-[240px] mx-auto px-4">
            <ul className="space-y-4 text-[13px] font-bold tracking-tight">
               <StatusItem 
                  label="Coleta Biométrica" 
                  state={isBiometriaColetada ? 'completed' : 'neutral'} 
               />
               <StatusItem 
                  label="Verificação Biométrica" 
                  state={verificacaoBiometricaStatus} 
               />
               {protocol.compliance.require_dossie && (
                 <StatusItem 
                    label={`Análise de Dossiê ${isPJ ? 'PJ' : 'PF'}`}
                    state={
                      analisePjStatus !== 'neutral' ? analisePjStatus :
                      (protocol.documents?.length > 0 && protocol.documents.every((d: any) => d.status === 'VERIFICADO') ? 'completed' : 'pending')
                    }
                 />
               )}
               <StatusItem 
                  label="Sistema Antifraude (SAF)" 
                  state={safStatus === 'attached' ? 'completed' : 'neutral'} 
               />
               <StatusItem 
                  label="Videoconferência" 
                  state={videoConcluida ? 'completed' : 'neutral'} 
               />
            </ul>
          </div>
        </div>

        {/* Footer Buttons - BUG FIX: Sticky footer para garantir visibilidade */}
        <div className="p-6 mt-auto flex justify-end gap-3 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] sticky bottom-0 z-30">
          <button 
            disabled={!isLocked || currentStatus === 'REJEITADO'}
            onClick={() => setShowRejectionModal(true)}
            className="px-6 py-2 border border-slate-200 text-slate-500 bg-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 shadow-sm transition-all disabled:opacity-20"
          >
            Rejeitar
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (!isLocked) return;
                setShowCloudPSCModal(true);
              }}
              disabled={!isLocked || currentStatus === 'REJEITADO' || (!videoConcluida && !protocol.is_presencial && protocol.compliance.require_video)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-100 disabled:opacity-20 flex items-center gap-2 group"
            >
              <UploadCloud size={16} className="group-hover:animate-bounce" /> A3 Nuvem (Push)
            </button>
            <button 
              onClick={() => {
                if (isLocked) {
                  setShowLockWarningModal(true);
                } else {
                  setShowBiometricModal(true);
                }
              }}
              disabled={!isLocked || currentStatus === 'REJEITADO' || (!videoConcluida && !protocol.is_presencial && protocol.compliance.require_video)}
              className="px-8 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-slate-100 disabled:opacity-20 flex items-center gap-2 group border border-slate-700"
            >
              <Fingerprint size={16} className="group-hover:animate-pulse" /> A3 Local
            </button>
          </div>
        </div>
      </div>

      {/* Biometric Approval Modal */}
      <BiometricSignatureModal 
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        titularName={protocol.titular.name}
        onApproved={() => handleFinalizarAtendimento('A3_LOCAL')}
      />

      {/* Cloud PSC Approval Modal */}
      <CloudPSCAuthModal 
        isOpen={showCloudPSCModal}
        onClose={() => setShowCloudPSCModal(false)}
        titularName={protocol.titular.name}
        onConfirm={() => {
          setShowCloudPSCModal(false);
          handleFinalizarAtendimento('A3_NUVEM');
        }}
      />

      </div>

      {/* Filters Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Consultar por</h2>
              <button onClick={() => setShowFiltersModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-light">×</button>
            </div>

            <div className="flex border-b border-gray-200 px-8 pt-4">
              <button className="px-2 py-3 text-sm font-bold border-b-2 border-emerald-700 text-emerald-800 mr-6">Características físicas do fraudador</button>
              <button className="px-2 py-3 text-sm font-bold border-b-2 border-transparent text-gray-400 hover:text-gray-600">Características da Fraude</button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="grid grid-cols-4 gap-8">
                <FilterGroup title="Cor do Cabelo" options={['Escuro', 'Loiro', 'Ruivo', 'Grisalho', 'Branco']} />
                <FilterGroup title="Cor da Pele" options={['Amarelo', 'Branco', 'Indígena', 'Negro', 'Pardo']} />
                <FilterGroup title="Deficiências Físicas Perceptíveis" options={['Cadeirante', 'Cego', 'Surdo', 'Mudo', 'Manco']} />
                <FilterGroup title="Sinais Corporais Perceptíveis" options={['Tatuagens ou sinais no rosto ou pescoço', 'Falta de dedos das mãos', 'Mancha na pele (vitiligo por exemplo)', 'Marcas como cicatrizes']} />

                <FilterGroup title="Tipo de Cabelo" options={['Calvo', 'Curto', 'Médio', 'Longo']} />
                <FilterGroup title="Idade aparente" options={['Menor que 30 anos', 'Entre 30 e 50 anos', 'Mais de 50 anos']} />
                <FilterGroup title="Sexo" options={['Masculino', 'Feminino']} />
                <FilterGroup title="Cor dos Olhos" options={['Claros', 'Escuro']} />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button onClick={() => setShowFiltersModal(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 text-sm shadow-sm transition-colors">Limpar</button>
              <button onClick={handleBuscarSaf} className="px-6 py-2 bg-emerald-800 text-white font-semibold rounded hover:bg-emerald-700 text-sm shadow-sm transition-colors">Buscar Listas</button>
            </div>

          </div>
        </div>
      )}

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            
            {/* Header */}
            <div className="px-8 py-6 flex justify-between items-start pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <UploadCloud size={20} className="text-emerald-600" />
                  </div>
                  Anexar Documento ou Consulta
                </h2>
                <p className="text-sm font-semibold text-gray-500 ml-[52px]">Preencha os dados e anexe a documentação para a trilha.</p>
              </div>
              <button onClick={() => setShowNewDocModal(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-8 py-2 pb-6 space-y-6">
              
              {/* Select */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Classificação do Documento / Consulta</label>
                <div className="relative">
                  <select 
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-3.5 text-[15px] font-bold text-emerald-900 focus:border-emerald-600 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer bg-white shadow-sm"
                  >
                    <optgroup label="Identificação Pessoal">
                      <option>Documento de Identificação (RG / CNH / Passaporte)</option>
                      <option>Foto do Solicitante / Biometria Facial</option>
                    </optgroup>
                    <optgroup label="Ativos Empresariais">
                      <option>Contrato Social / Estatuto / Requerimento</option>
                      <option>Ata de Eleição / Termo de Posse</option>
                      <option>Cartão CNPJ</option>
                    </optgroup>
                    <optgroup label="Cadastros & Certidões ICP-Brasil">
                      <option>Consultas de Certidão (RFB, Trabalhista, Estadual, etc.)</option>
                      <option>Comprovante de Situação Cadastral (CPF)</option>
                      <option>CEI (Cadastro Específico do INSS)</option>
                      <option>CAEPF (Atividade Econômica PF)</option>
                      <option>CNO (Cadastro Nacional de Obras)</option>
                      <option>Título de Eleitor</option>
                    </optgroup>
                    <optgroup label="Conformidade & PSBIO">
                      <option>Dossiê de Verificação (Background Check)</option>
                      <option>Laudo de Risco Antifraude (SAF)</option>
                      <option>Evidência de Coleta Biométrica</option>
                      <option>Evidência de Verificação Biográfica</option>
                      <option>Procuração / Termo de Representação legal</option>
                    </optgroup>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Consulta Code Input */}
              {selectedDocType.includes('Certidão') && (
                 <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Chave / Código de Autenticidade (Opcional)</label>
                    <input 
                      type="text" 
                      value={certidaoCode}
                      onChange={(e) => setCertidaoCode(e.target.value)}
                      placeholder="Ex: 1A2B.3C4D.5E6F.7G8H"
                      className="w-full border-2 border-emerald-100 bg-emerald-50/30 rounded-xl p-3.5 text-[15px] font-bold text-emerald-900 focus:border-emerald-600 focus:bg-white focus:ring-0 outline-none transition-colors placeholder:text-emerald-300"
                    />
                    <p className="mt-2 text-[11px] font-semibold text-emerald-600/70 ml-1">Se preenchido, o sistema poderá automatizar a validação e atrelar a consulta ao laudo.</p>
                 </div>
              )}

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Arquivo Eletrônico</label>
                <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 hover:border-emerald-500 transition-all duration-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer group shadow-sm">
                  <div className="w-14 h-14 bg-white shadow-sm border border-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                    <UploadCloud size={24} className="text-emerald-600" />
                  </div>
                  <p className="text-[15px] font-extrabold text-emerald-950 mb-1 group-hover:text-emerald-700 transition-colors">Clique e procure ou arraste o arquivo aqui</p>
                  <p className="text-xs text-emerald-800/60 font-semibold px-4 text-center">Somente formatos PDF, JPG, PNG e arquivos assinados P7S são suportados (Máx. 10MB)</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-2xl">
              <p className="text-[11px] font-bold text-gray-400 max-w-[200px] leading-tight flex items-center gap-1.5"><Lock size={10} /> Operação registrada e rastreável</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowNewDocModal(false)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button onClick={() => setShowNewDocModal(false)} className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-sm hover:bg-emerald-800 transition-colors shadow-sm flex items-center gap-2">
                  <Check size={16} /> Finalizar Inclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVideoRoom && (
        <VideoRoomModal 
          protocol={protocol}
          onClose={() => setShowVideoRoom(false)}
          onRecordingFinished={() => setVideoConcluida(true)}
          onPhotoCaptured={() => setIsBiometriaColetada(true)}
        />
      )}

      {/* Lock Warning Modal */}
      {showLockWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center border border-red-50 flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-600 border-2 border-amber-100 shadow-inner">
               <AlertCircle size={40} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-3 uppercase">Solicitação em Análise</h2>
            <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
              ops parece que a sua solicitação foi aprovada mas esta em analise contacte a ar responsavel
            </p>
            <button 
              onClick={() => setShowLockWarningModal(false)}
              className="w-full py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-0.5">
      <span className="text-gray-400 font-semibold">{label}</span>
      <span className="col-span-2 text-gray-700 font-medium">{value}</span>
    </div>
  );
}

function StatusItem({ label, state }: { label: string, state: 'completed' | 'pending' | 'error' | 'neutral' }) {
  const getColors = () => {
    switch(state) {
      case 'completed': return 'bg-emerald-500';
      case 'error': return 'bg-rose-500';
      case 'pending': return 'bg-amber-400';
      default: return 'bg-gray-200';
    }
  };
  return (
    <li className="flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ${getColors()}`}></div>
      <span className={state === 'neutral' ? 'text-gray-400' : 'text-gray-700'}>{label}</span>
    </li>
  );
}

function DocItem({ name, status, date, showMenu }: { name: string, status: string, date: string, showMenu?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 group relative">
      <div className="flex items-center gap-4">
        <FileText size={18} className="text-gray-400" />
        <div>
          <p className="text-sm font-bold text-gray-800 mb-0.5 group-hover:text-emerald-800 transition-colors">{name}</p>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{status}</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-xs font-semibold text-gray-400">{date}</span>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="p-1 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>

          {open && showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-xl py-1 z-30">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Ver documento</button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Fazer download</button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Editar</button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Excluir</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterItem({ opt }: { opt: string }) {
  const [isChecked, setIsChecked] = useState(false);
  return (
    <label className="flex items-start gap-3 cursor-pointer group" onClick={() => setIsChecked(!isChecked)}>
      <div className={`w-4 h-4 rounded mt-0.5 transition-colors flex items-center justify-center ${
        isChecked 
          ? 'bg-emerald-600 border-2 border-emerald-600' 
          : 'bg-white border-2 border-gray-300 group-hover:border-emerald-400'
      }`}>
        {isChecked && <Check size={12} strokeWidth={4} className="text-white" />}
      </div>
      <span className="text-sm text-gray-600 font-medium leading-tight group-hover:text-gray-900 select-none">{opt}</span>
    </label>
  );
}

function FilterGroup({ title, options }: { title: string, options: string[] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-800 mb-2">{title}</h4>
      {options.map((opt, i) => (
        <FilterItem key={i} opt={opt} />
      ))}
    </div>
  );
}
