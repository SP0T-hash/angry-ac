import { UserCircle, Zap, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/auth/login');
  };

  return (
    <header className="h-[65px] bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-[0_1px_10px_-5px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 animate-in fade-in zoom-in duration-500">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">AC</span>
            <h1 className="text-emerald-900 font-black text-sm tracking-[0.2em] uppercase leading-none">ANGRY</h1>
          </div>
          <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-1">Central de Emissão Digital</span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 h-9">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Ambiente Seguro (AGR)</span>
        </div>

        <div className="h-8 w-[1px] bg-gray-100 hidden md:block"></div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] font-black text-gray-800 tracking-tight uppercase leading-none mb-1">VITOR MATHEUS</span>
            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider leading-none">Agente de Registro</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-rose-500 transition-all group p-1.5 hover:bg-rose-50 rounded-full"
            title="Sair do Sistema"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
