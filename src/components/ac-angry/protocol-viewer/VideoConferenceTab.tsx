import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Check, Shield, FileText, Fingerprint, Download, Play, Square } from 'lucide-react';
import { VideoConferenceEngine, RecordingResult } from '@/lib/ac-angry/video-conference-engine';

interface VideoConferenceTabProps {
  protocol: any;
  isLocked: boolean;
  addAuditLog: (action: string, metadata?: any) => void;
  setVideoConcluida: (val: boolean) => void;
  setIsBiometriaColetada: (val: boolean) => void;
  setCapturedPhoto: (val: string | null) => void;
  capturedPhoto: string | null;
  videoConcluida: boolean;
  isCodigoComCliente: boolean;
  setIsCodigoComCliente: (val: boolean) => void;
  handleFinalizarEGerarDossie: () => Promise<void>;
  isSendingEmail: boolean;
  setShowVideoRoom: (val: boolean) => void;
  handleConsultarPSBIO: (template?: string) => Promise<void>;
}

export const VideoConferenceTab: React.FC<VideoConferenceTabProps> = ({
  protocol,
  isLocked,
  addAuditLog,
  setVideoConcluida,
  setIsBiometriaColetada,
  setCapturedPhoto,
  capturedPhoto,
  videoConcluida,
  isCodigoComCliente,
  setIsCodigoComCliente,
  handleFinalizarEGerarDossie,
  isSendingEmail,
  setShowVideoRoom,
  handleConsultarPSBIO
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<VideoConferenceEngine | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      engineRef.current = new VideoConferenceEngine(mediaStream);
    } catch (err) {
      console.error("Erro ao acessar webcam:", err);
      alert("Erro ao acessar webcam/microfone. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        setIsBiometriaColetada(true);
        if (protocol.is_presencial) {
          setVideoConcluida(true);
        }
        addAuditLog("Foto capturada via Webcam REAL (Conformidade Biográfica)");
      }
    }
  };

  const handleToggleRecording = async () => {
    if (!engineRef.current) return;

    if (!recording) {
      engineRef.current.start();
      setRecording(true);
      addAuditLog("Gravação de Videoconferência INICIADA localmente.");
    } else {
      const result = await engineRef.current.stop();
      setRecording(false);
      setRecordingResult(result);
      setVideoConcluida(true);
      addAuditLog("Gravação de Videoconferência CONCLUÍDA.", { 
        duration: result.duration,
        type: 'LOCAL_RECORDING'
      });
    }
  };

  const downloadRecording = () => {
    if (!recordingResult) return;
    const a = document.createElement('a');
    a.href = recordingResult.url;
    a.download = `GRAVACAO_${protocol.id}_${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center justify-center mt-2 space-y-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="font-black text-xs uppercase tracking-widest">
              {protocol.is_presencial ? 'Captura Presencial' : 'Videoconferência ao Vivo'}
            </span>
          </div>
          {recording && (
             <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
               REC ● GRAVANDO LOCALMENTE
             </div>
          )}
        </div>

        <div className="p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="aspect-video bg-slate-950 rounded-2xl mb-6 relative overflow-hidden ring-8 ring-slate-50 group shadow-inner">
              {capturedPhoto ? (
                <img src={capturedPhoto} alt="Captura" className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              )}
              
              <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 z-20"></div>
              
              {recording && (
                <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                   <span className="text-[9px] font-black text-white tracking-widest">AO VIVO</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleCapturePhoto}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Camera size={16} /> Tirar Foto
              </button>
              
              <button 
                onClick={handleToggleRecording}
                className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  recording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {recording ? <><Square size={16} fill="currentColor" /> Parar Gravação</> : <><Video size={16} /> Iniciar Gravação</>}
              </button>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-4">
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 italic">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Checklist de Auditoria</p>
                <ul className="space-y-2">
                   <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${capturedPhoto ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Check size={10} />
                      </div>
                      Foto capturada
                   </li>
                   <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${videoConcluida ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Check size={10} />
                      </div>
                      Vídeo gravado
                   </li>
                </ul>
             </div>

             {recordingResult && (
               <button 
                 onClick={downloadRecording}
                 className="w-full py-4 bg-white border-2 border-emerald-600 text-emerald-700 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm"
               >
                 <Download size={16} /> Baixar Vídeo (.webm)
               </button>
             )}

             <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <Shield size={12} /> Fluxo de Emissão
                </h5>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={isCodigoComCliente}
                      onChange={() => setIsCodigoComCliente(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] font-black text-slate-700 uppercase">Enviar ao Cliente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={!isCodigoComCliente}
                      onChange={() => setIsCodigoComCliente(false)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] font-black text-slate-700 uppercase">Reter Código</span>
                  </label>
                </div>
             </div>

             <button 
                onClick={handleFinalizarEGerarDossie}
                disabled={isSendingEmail || !videoConcluida}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-100 transition-all disabled:opacity-30 disabled:shadow-none"
             >
                {isSendingEmail ? 'Processando...' : 'Finalizar Atendimento'}
             </button>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Conformidade ISO/IEC 27001 • Gravado no Navegador</p>
    </div>
  );
};
