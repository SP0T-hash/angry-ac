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
import { ShieldCheck, Clock, User, Fingerprint, Loader2 } from "lucide-react";

interface AuditLogRaw {
  id: string;
  event_type: string;
  agr_id: string | null;
  protocol_id: string | null;
  ip_address: string | null;
  severity: string;
  hash: string;
  created_at: string;
}

interface AuditLogRow {
  id: string;
  timestamp: string;
  action: string;
  agente: string;
  ip: string;
  status: 'SUCESSO' | 'PENDENTE' | 'ALERTA';
  hash: string;
}

const severityToStatus = (s: string): 'SUCESSO' | 'PENDENTE' | 'ALERTA' => {
  if (s === 'INFO') return 'SUCESSO';
  if (s === 'WARN') return 'PENDENTE';
  return 'ALERTA';
};

const formatTimestamp = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
};

const truncateHash = (h: string) => (h.length > 16 ? `${h.slice(0, 8)}...${h.slice(-6)}` : h);

const ch = createColumnHelper<AuditLogRow>();

interface SecurityAuditTableProps {
  auditLogs: AuditLogRaw[];
}

export default function SecurityAuditTable({ auditLogs }: SecurityAuditTableProps) {
  const data: AuditLogRow[] = useMemo(
    () =>
      auditLogs.map((log) => ({
        id: log.id,
        timestamp: formatTimestamp(log.created_at),
        action: log.event_type,
        agente: log.agr_id ?? 'Sistema',
        ip: log.ip_address ?? '—',
        status: severityToStatus(log.severity),
        hash: truncateHash(log.hash),
      })),
    [auditLogs],
  );

  const columns = useMemo(
    () => [
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
      ch.accessor('ip', {
        header: 'IP',
        cell: (info) => <Text className="text-[10px] font-mono text-slate-500">{info.getValue()}</Text>,
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
        header: 'Hash de Auditoria',
        cell: (info) => (
          <div className="flex items-center gap-2 pr-4">
            <Fingerprint size={12} className="text-slate-600" />
            <Text className="text-[9px] font-mono text-slate-600 truncate max-w-[100px]">{info.getValue()}</Text>
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const isEmpty = data.length === 0;

  return (
    <Card className="bg-[#0f172a]/50 border-white/10 backdrop-blur-xl p-0 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#10b981]">Log de Auditoria em Tempo Real</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Conformidade ICP-Brasil e Segurança Transacional</p>
        </div>
        <Badge color={isEmpty ? 'gray' : 'emerald'}>{isEmpty ? 'SEM DADOS' : 'LIVE FEED'}</Badge>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={28} className="text-slate-600 animate-spin" />
          <Text className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum registro de auditoria encontrado</Text>
          <Text className="text-[10px] text-slate-600">Os eventos aparecerão aqui conforme as ações são realizadas</Text>
        </div>
      ) : (
        <>
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
            <Text className="text-[10px] text-slate-600 font-bold uppercase">
              Auditoria AC Angry v1.2 · {data.length} registro{data.length !== 1 ? 's' : ''}
            </Text>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 bg-white/5 text-[9px] font-black text-slate-400 rounded-md border border-white/10 disabled:opacity-30"
              >
                Anterior
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 bg-white/5 text-[9px] font-black text-slate-400 rounded-md border border-white/10 disabled:opacity-30"
              >
                Próximo
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
