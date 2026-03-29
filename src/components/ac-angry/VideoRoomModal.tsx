import React, { useState, useEffect } from 'react';
import { 
  Video, Mic, MicOff, VideoOff, PhoneMissed, 
  Camera, Copy, Link, Check, StopCircle, Circle
} from 'lucide-react';

export default function VideoRoomModal({ protocol, onClose, onRecordingFinished, onPhotoCaptured }: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [timer, setTimer] = useState(0);

  const [dailyRoomUrl, setDailyRoomUrl] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);

  const isPJ = !!protocol.company;

  useEffect(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setAccessCode(code);

    const fetchRealRoom = async () => {
      setIsLoadingRoom(true);
      try {
        const res = await fetch('/api/video', { method: 'POST' });
        const data = await res.json();
        if (data.roomUrl) {
          setDailyRoomUrl(data.roomUrl);
        }
      } catch (err) {
        console.warn("Sem chave API configurada no .env. Fallback para visual Mock.");
      } finally {
        setIsLoadingRoom(false);
      }
    };
    
    fetchRealRoom();
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://lyve.vemapi.com/join/${accessCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (onRecordingFinished) onRecordingFinished();
    } else {
      setIsRecording(true);
    }
  };

  const handleTakePhoto = () => {
    setPhotoTaken(true);
    if (onPhotoCaptured) onPhotoCaptured();
    setTimeout(() => setPhotoTaken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] text-white flex flex-col font-sans animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#111]">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 font-bold text-sm px-3 py-1.5 rounded-md border ${isRecording ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-gray-400 bg-gray-800 border-gray-700'}`}>
            <Circle size={14} className={isRecording ? "animate-pulse fill-rose-500" : "fill-gray-500"} />
            {isRecording ? <span className="animate-pulse">REC {formatTime(timer)}</span> : <span>GRAVAÇÃO PAUSADA</span>}
          </div>
          <div className="h-4 w-px bg-gray-700"></div>
          <h1 className="text-sm font-semibold text-gray-300">
            Sessão: <span className="text-white font-bold">{protocol.id}</span>
          </h1>
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-medium ml-2">
            Titular: {protocol.titular.name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 text-xs font-bold text-gray-400 border-r border-gray-700 bg-gray-800">
              Código de Acesso
            </div>
            <div className="px-3 py-1.5 text-sm font-mono font-bold text-indigo-400 tracking-wider">
              {accessCode}
            </div>
            <button 
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center border-l border-indigo-700"
              title="Copiar Link para Cliente"
            >
              {copied ? <Check size={14} className="text-white" /> : <Link size={14} className="text-white" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Videos Grid */}
        <div className="flex-1 p-6 flex flex-col gap-4 relative">
          
          {/* Main Video (Client ou Daily.co Iframe) */}
          <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative border border-gray-800 shadow-2xl flex items-center justify-center">
            
            {isLoadingRoom ? (
               <div className="flex flex-col items-center justify-center">
                 <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-gray-400 font-bold text-sm">Contatando Media Server...</p>
               </div>
            ) : dailyRoomUrl ? (
               /* REAL DAILY.CO PREBUILT I-FRAME */
               <iframe 
                 src={dailyRoomUrl}
                 title="Videoconferência Segura VEMAPI"
                 className="w-full h-full border-0 absolute inset-0 z-40 bg-gray-900"
                 allow="camera; microphone; fullscreen; display-capture"
               />
            ) : (
               /* MOCK CLIENT VIDEO FALLBACK */
               <img 
                 src={protocol.compliance.biometric_photo || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=1200&auto=format&fit=crop"} 
                 alt="Client Feed (Mock)" 
                 className="w-full h-full object-cover opacity-80 absolute inset-0 z-10"
               />
            )}
            
            {/* OVERLAYS VISUAIS DO MOCK E CAPTURA */}
            {photoTaken && (
              <div className="absolute inset-0 bg-white/80 z-50 animate-out fade-out duration-1000 flex items-center justify-center pointer-events-none">
                <Camera size={64} className="text-indigo-600" />
              </div>
            )}
            {!dailyRoomUrl && !isLoadingRoom && (
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold flex items-center gap-2 z-10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                {protocol.titular.name} (Cliente - Ambiente Simulado)
              </div>
            )}
          </div>

          {/* Picture in Picture (Agent) - Mostra SÓ no Mock, pois o Daily.co já tem PIP nativo */}
          {!dailyRoomUrl && !isLoadingRoom && (
          <div className="absolute top-10 right-10 w-48 h-64 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl z-20 pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=400&auto=format&fit=crop" 
              alt="Agent Feed" 
              className={`w-full h-full object-cover transition-opacity ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`}
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                  <VideoOff size={20} className="text-gray-500" />
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/10 text-[10px] font-bold">
              Você (AGR)
            </div>
            {!isMicOn && (
              <div className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg">
                <MicOff size={12} />
              </div>
            )}
          </div>
          )}

        </div>

        {/* Side Panel (Tools & Scripts) */}
        <div className="w-80 border-l border-gray-800 bg-[#111] flex flex-col">
          <div className="p-5 border-b border-gray-800 pb-4">
            <h3 className="text-sm font-bold text-gray-200 mb-1">Controles de Auditoria</h3>
            <p className="text-xs text-gray-500 leading-relaxed">As capturas realizadas aqui serão indexadas diretamente no dossiê do titular.</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Botão de Gravação */}
            <button 
              onClick={handleToggleRecording}
              className={`w-full flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all group ${
                isRecording 
                  ? 'bg-rose-500/10 border-rose-500/50 hover:bg-rose-500/20 text-rose-500' 
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-300'
              }`}
            >
              {isRecording ? <StopCircle size={28} className="mb-2" /> : <div className="w-7 h-7 rounded-full bg-rose-500 mb-2 flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-full"></div></div>}
              <span className="text-sm font-bold">{isRecording ? 'Parar Gravação e Salvar' : 'Iniciar Gravação'}</span>
              <span className="text-[10px] font-semibold mt-1 opacity-70">{isRecording ? 'A auditoria está sendo gravada.' : 'Obrigatório para emissão remota VIP.'}</span>
            </button>

            {/* Botão de Captura Biométrica */}
            <button 
              onClick={handleTakePhoto}
              className="w-full flex flex-col items-center justify-center py-4 rounded-xl border-2 bg-indigo-600/10 border-indigo-500/30 hover:bg-indigo-600/20 hover:border-indigo-500/60 transition-all text-indigo-400 group"
            >
              <Camera size={28} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">Captura Biométrica Face</span>
              <span className="text-[10px] font-semibold mt-1 opacity-70 text-center px-4">Peça para o cliente centralizar o rosto na câmera central.</span>
            </button>
          </div>

          {/* Roteiro de Leitura */}
          <div className="flex-1 overflow-y-auto p-5 border-t border-gray-800">
             <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Roteiro de Validação Oficial</h4>
             <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs font-medium text-gray-300 leading-relaxed space-y-3">
                <p>1. O(A) Sr(a) <strong className="text-white">{protocol.titular.name}</strong> portador(a) do CPF <strong className="text-white">{protocol.titular.cpf}</strong> confirma a solicitação do Certificado Digital?</p>
                <p>2. Confirma que o endereço de e-mail <strong className="text-white">{protocol.titular.email}</strong> está correto?</p>
                <p>3. {isPJ ? 'Confirma que a empresa solicitante possui atividade regular?' : 'Confirma que o uso do certificado será de sua inteira responsabilidade?'}</p>
             </div>
          </div>
        </div>

      </main>

      {/* Footer Controls */}
      <footer className="h-20 bg-black flex items-center justify-center gap-4 px-6 border-t border-gray-900">
        <button 
          onClick={() => setIsMicOn(!isMicOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
          title={isMicOn ? "Mutar Microfone" : "Desmutar Microfone"}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button 
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
          title={isVideoOn ? "Desativar Câmera" : "Ativar Câmera"}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <div className="w-px h-8 bg-gray-800 mx-2"></div>

        <button 
          onClick={onClose}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full flex items-center gap-2 shadow-lg shadow-rose-900/20 transition-all hover:scale-105"
        >
          <PhoneMissed size={18} />
          Encerrar Videochamada
        </button>
      </footer>
    </div>
  );
}
