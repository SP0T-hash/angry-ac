'use client';

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Card, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Text, Badge } from "@tremor/react";
import { ShieldCheck, Clock, User, Fingerprint } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  agente: string;
  entidade: string;
  status: 'SUCESSO' | 'PENDENTE' | 'ALERTA';
  timestamp: string;
  hash: string;
}

const mockData: AuditLog[] = [
  { id: '1', action: 'ASSINATURA_CSR', agente: 'Carlos AGR', entidade: 'João Silva (CPF)', status: 'SUCESSO', timestamp: '2026-03-31 10:24:12', hash: 'e3b0c442...8b1a' },
  { id: '2', action: 'COLETA_BIOMETRIA', agente: 'Ana Maria', entidade: 'Empresa XPTO (CNPJ)', status: 'SUCESSO', timestamp: '2026-03-31 10:25:33', hash: 'd9e8f7a6...5c4b' },
  { id: '3', action: 'DIVERGENCIA_SAF', agente: 'Sistema', entidade: 'Pedro Oliveira', status: 'ALERTA', timestamp: '2026-03-31 10:26:05', hash: 'a1b2c3d4...e5f6' },
  { id: '4', action: 'EMISSAO_A1', agente: 'Ricardo Adm', entidade: 'Maria Souza', status: 'SUCESSO', timestamp: '2026-03-31 10:27:18', hash: 'f5e4d3c2...1b0a' },
  { id: '5', action: 'REVISAO_DOSSIE', agente: 'Auditoria AC', entidade: 'Tiago Santos', status: 'PENDENTE', timestamp: '2026-03-31 10:28:44', hash: 'c5b4a3d2...8e9f' },
];

const ch = createColumnHelper<AuditLog>();

export default function SecurityAuditTable() {
  const columns = useMemo(() => [
    ch.accessor('timestamp', {
      header: 'Timestamp',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-slate-500" />
          <Text className="text-[10px] font-mono text-slate-400">{info.getValue()}</Text>
        </div>
      ),
    }),
    ch.accessor('action', {
      header: 'Ação Realizada',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#10b981]" />
          <Text className="text-xs font-bold text-white uppercase tracking-tight">{info.getValue()}</Text>
        </div>
      ),
    }),
    ch.accessor('agente', {
      header: 'Agente / AGR',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <User size={12} className="text-blue-400" />
          <Text className="text-xs font-medium text-slate-300">{info.getValue()}</Text>
        </div>
      ),
    }),
    ch.accessor('entidade', {
      header: 'Titular',
      cell: (info) => <Text className="text-xs font-medium text-slate-400">{info.getValue()}</Text>,
    }),
    ch.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <Badge 
          color={info.getValue() === 'SUCESSO' ? 'emerald' : info.getValue() === 'PENDENTE' ? 'amber' : 'red'} 
          size="xs"
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    ch.accessor('hash', {
      header: 'Dígito de Auditoria (Hash)',
      cell: (info) => (
        <div className="flex items-center gap-2 pr-4">
          <Fingerprint size={12} className="text-slate-600" />
          <Text className="text-[9px] font-mono text-slate-600 truncate max-w-[100px]">{info.getValue()}</Text>
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: mockData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Card className="bg-[#0f172a]/50 border-white/10 backdrop-blur-xl p-0 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#10b981]">Log de Auditoria em Tempo Real</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Conformidade ICP-Brasil e Segurança Transacional</p>
        </div>
        <Badge color="emerald">LIVE FEED</Badge>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHead className="bg-[#020617]/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeaderCell key={header.id} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 py-4 px-6 border-white/5">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHeaderCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody className="divide-y divide-white/5">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-white/5 transition-all">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-4 px-6 border-white/5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="p-4 border-t border-white/5 bg-[#020617]/30 flex items-center justify-between">
        <Text className="text-[10px] text-slate-600 font-bold uppercase">Auditoria AC Angry v1.2</Text>
        <div className="flex gap-2">
            <button className="px-3 py-1 bg-white/5 text-[9px] font-black text-slate-400 rounded-md border border-white/10">Anterior</button>
            <button className="px-3 py-1 bg-white/5 text-[9px] font-black text-slate-400 rounded-md border border-white/10">Próximo</button>
        </div>
      </div>
    </Card>
  );
}
