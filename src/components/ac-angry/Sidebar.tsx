import { 
  Users, 
  FileText, 
  Video, 
  ShieldCheck, 
  MessageSquare,
  PlusCircle,
  Camera
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'protocolos', icon: FileText, label: 'Protocolos de Emissão' },
  { id: 'novo-pedido', icon: PlusCircle, label: 'Lançar Novo Pedido' },
  { id: 'clientes', icon: Users, label: 'Base de Titulares' },
  { id: 'video', icon: Video, label: 'Videoconferência AC' },
  { id: 'conformidade', icon: ShieldCheck, label: 'Auditoria & Compliance' },
  { id: 'mensagens', icon: MessageSquare, label: 'Suporte Técnico AC' },
];

export default function Sidebar({ activeView, onChangeView }: { activeView: string, onChangeView: (view: string) => void }) {
  return (
    <aside className="hidden md:flex w-[65px] bg-white/70 backdrop-blur-lg border-r border-gray-100 h-full flex flex-col items-center py-4 shrink-0 transition-all duration-300 z-40 shadow-[1px_0_10px_-5px_rgba(0,0,0,0.05)]">
      <nav className="flex-1 space-y-4 w-full px-2 mt-4">
        {NAV_ITEMS.map((item) => (
          <button 
            key={item.id}
            title={item.label}
            onClick={() => onChangeView(item.id)}
            className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300 relative group ${
              activeView === item.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-50' 
                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/80 transition-all hover:scale-105'
            }`}
          >
            <item.icon size={20} strokeWidth={activeView === item.id ? 2.5 : 2} />
            
            {/* Indicador Ativo Lateral */}
            {activeView === item.id && (
              <div className="absolute -left-2 top-1/4 bottom-1/4 w-1 bg-emerald-600 rounded-r-full"></div>
            )}
            
            {/* Tooltip Custom (Opcional, usando title por enquanto) */}
          </button>
        ))}
      </nav>
      
      {/* Versão do Sistema */}
      <div className="mb-4">
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">V 2.0</span>
      </div>
    </aside>
  );
}
