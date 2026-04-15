import React from 'react';
import { ShieldCheck, UserCircle, ChevronDown, FileText } from 'lucide-react';

interface AuditTabProps {
  auditLogs: any[];
  expandedDossies: Record<string, boolean>;
  toggleDossie: (id: string) => void;
  protocol: any;
  handleDownloadTermo: (log: any) => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  auditLogs,
  expandedDossies,
  toggleDossie,
  protocol,
  handleDownloadTermo
}) => {
  return (
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
  );
};
