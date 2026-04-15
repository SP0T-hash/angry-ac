import React, { useState } from 'react';
import { FileText, MoreHorizontal, Check } from 'lucide-react';

export const StatusItem = ({ label, state }: { label: string, state: 'completed' | 'pending' | 'error' | 'neutral' }) => {
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
};

export const DocItem = ({ name, status, date, showMenu }: { name: string, status: string, date: string, showMenu?: boolean }) => {
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
};

export const FilterItem = ({ opt }: { opt: string }) => {
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
};

export const FilterGroup = ({ title, options }: { title: string, options: string[] }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-800 mb-2">{title}</h4>
      {options.map((opt, i) => (
        <FilterItem key={i} opt={opt} />
      ))}
    </div>
  );
};
