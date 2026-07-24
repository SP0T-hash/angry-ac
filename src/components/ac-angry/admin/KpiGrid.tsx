'use client';

import React from 'react';
import { Card, Text, Metric, Flex, ProgressBar, Grid } from "@tremor/react";
import { Shield, Users, Fingerprint, Activity } from "lucide-react";

export interface KpiData {
  totalProtocols: number;
  issuedProtocols: number;
  activeAgents: number;
}

export default function KpiGrid({ data }: { data: KpiData }) {
  const kpiItems = [
    {
      title: "Protocolos Total",
      metric: data.totalProtocols.toLocaleString("pt-BR"),
      icon: Shield,
      color: "slate",
    },
    {
      title: "Certificados Emitidos",
      metric: data.issuedProtocols.toLocaleString("pt-BR"),
      icon: Fingerprint,
      color: "emerald",
    },
    {
      title: "AGRs Ativos",
      metric: data.activeAgents.toLocaleString("pt-BR"),
      icon: Users,
      color: "indigo",
    },
    {
      title: "Uptime Hardware",
      metric: "99.9%",
      icon: Activity,
      color: "indigo",
    },
  ];

  return (
    <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
      {kpiItems.map((item) => (
        <Card key={item.title} decoration="top" decorationColor={item.color as any} className="bg-[#0f172a]/50 border-white/10 backdrop-blur-xl">
          <Flex alignItems="start">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${item.color}-500/10 text-${item.color}-500`}>
                <item.icon size={20} />
              </div>
              <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{item.title}</Text>
            </div>
          </Flex>
          <Flex justifyContent="start" alignItems="baseline" className="mt-4">
            <Metric className="text-white font-black tracking-tight">{item.metric}</Metric>
          </Flex>
        </Card>
      ))}
    </Grid>
  );
}
