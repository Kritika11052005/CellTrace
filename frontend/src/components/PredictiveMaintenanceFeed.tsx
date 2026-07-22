'use client';

import React from 'react';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle, ArrowUpRight, Wrench, Thermometer, Zap } from 'lucide-react';

interface MaintenanceTrigger {
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timeframe: string;
}

interface PredictiveMaintenanceFeedProps {
  severity?: 'CRITICAL' | 'WARNING' | 'OPTIMAL';
  healthStatusLabel?: string;
  rootCauseAnalysis?: string;
  failureProbability?: number;
  daysToMaintenance?: number;
  triggers?: MaintenanceTrigger[];
  aiEngine?: string;
  onExecuteAction?: (action: string) => void;
}

export default function PredictiveMaintenanceFeed({
  severity = 'WARNING',
  healthStatusLabel = 'APM WARNING Status (86.4% SOH)',
  rootCauseAnalysis = 'Accelerated SEI breakdown and micro-lithium plating caused by high thermal peaks (46.2°C) and repeated fast charging (1.4C).',
  failureProbability = 34.2,
  daysToMaintenance = 14,
  triggers = [
    { action: 'Execute active cell re-balancing cycle during overnight dwell', priority: 'HIGH', timeframe: 'Within 48 hours' },
    { action: 'Inspect coolant line flow rate and clean radiator fins', priority: 'MEDIUM', timeframe: 'Within 5 days' },
    { action: 'Derate maximum fast charging C-rate to 0.8C', priority: 'HIGH', timeframe: 'Immediate' },
  ],
  aiEngine = 'Gemini 3.5 Flash',
  onExecuteAction,
}: PredictiveMaintenanceFeedProps) {
  const getBadgeStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950/40 text-red-400 border-red-800/60';
      case 'WARNING':
        return 'bg-amber-950/40 text-amber-400 border-amber-800/60';
      default:
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
    }
  };

  return (
    <div className="bg-[#0b0b10] border border-graphite-border rounded-2xl p-5 shadow-xl font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-graphite-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm font-mono">Predictive Maintenance Triggers</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Engineered by {aiEngine}</span>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold font-mono ${getBadgeStyle(severity)}`}>
          {severity} ALERT
        </span>
      </div>

      {/* Failure Risk & Time Metrics */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="bg-[#121218] p-3 rounded-xl border border-graphite-border flex items-center gap-3">
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-mono text-zinc-500 uppercase">Failure Risk Prob.</span>
            <span className="text-sm font-bold text-red-400 font-mono">{failureProbability}%</span>
          </div>
        </div>

        <div className="bg-[#121218] p-3 rounded-xl border border-graphite-border flex items-center gap-3">
          <div className="p-2 bg-violet-400/10 text-violet-400 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-mono text-zinc-500 uppercase">Service Window</span>
            <span className="text-sm font-bold text-violet-400 font-mono">{daysToMaintenance} Days</span>
          </div>
        </div>
      </div>

      {/* Root Cause Analysis */}
      <div className="bg-[#121218] p-3.5 rounded-xl border border-graphite-border mb-4">
        <span className="block text-[10px] font-mono text-zinc-400 uppercase font-semibold mb-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#deff00]" /> Root Cause Diagnostics
        </span>
        <p className="text-xs text-zinc-300 leading-relaxed">{rootCauseAnalysis}</p>
      </div>

      {/* Action Triggers Feed */}
      <div className="space-y-2">
        <span className="block text-[10px] font-mono text-zinc-400 uppercase font-semibold">
          Recommended Work Orders ({triggers.length})
        </span>
        {triggers.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-[#121218] hover:bg-[#191924] border border-graphite-border rounded-xl flex items-center justify-between gap-3 transition-all"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
                  item.priority === 'HIGH'
                    ? 'bg-red-950/50 text-red-400 border-red-800/60'
                    : item.priority === 'MEDIUM'
                    ? 'bg-amber-950/50 text-amber-400 border-amber-800/60'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {item.priority}
              </span>
              <div>
                <p className="text-xs text-zinc-200 font-medium">{item.action}</p>
                <span className="text-[10px] text-zinc-500 font-mono">{item.timeframe}</span>
              </div>
            </div>

            <button
              onClick={() => onExecuteAction && onExecuteAction(item.action)}
              className="bg-[#deff00]/10 hover:bg-[#deff00]/20 text-[#deff00] border border-[#deff00]/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1"
            >
              Dispatch <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
