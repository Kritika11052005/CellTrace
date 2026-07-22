'use client';

import React from 'react';
import { Zap, ShieldCheck, ThermometerSnowflake, Gauge, Sliders } from 'lucide-react';

interface OptimalChargingProtocol {
  max_recommended_c_rate: number;
  optimal_soc_window: string;
  thermal_preconditioning: string;
  fast_charge_throttling: string;
}

interface OptimalChargingPanelProps {
  protocol?: OptimalChargingProtocol;
}

export default function OptimalChargingPanel({
  protocol = {
    max_recommended_c_rate: 0.8,
    optimal_soc_window: '20% - 80%',
    thermal_preconditioning: 'Pre-cool pack to 22°C before initiating fast charge',
    fast_charge_throttling: 'Derate charge current by 40% above 75% SOC',
  },
}: OptimalChargingPanelProps) {
  return (
    <div className="bg-[#0b0b10] border border-graphite-border rounded-2xl p-5 shadow-xl font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-graphite-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-400/10 border border-violet-400/30 rounded-xl text-violet-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm font-mono">Optimal Charge-Discharge Recommendation</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Gemini AI Adaptive Envelope</span>
          </div>
        </div>
        <span className="bg-[#deff00]/10 text-[#deff00] border border-[#deff00]/30 text-[10px] font-mono px-2 py-0.5 rounded-lg flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Life Extension
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 my-4">
        {/* Recommended C-Rate */}
        <div className="bg-[#121218] p-3.5 rounded-xl border border-graphite-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Max Charge Rate</span>
            <Gauge className="w-3.5 h-3.5 text-[#deff00]" />
          </div>
          <span className="text-xl font-bold text-white font-mono">{protocol.max_recommended_c_rate}C</span>
          <span className="block text-[9px] text-zinc-400 mt-0.5">Cap current to prevent plating</span>
        </div>

        {/* Optimal SOC Window */}
        <div className="bg-[#121218] p-3.5 rounded-xl border border-graphite-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Optimal SOC Band</span>
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono">{protocol.optimal_soc_window}</span>
          <span className="block text-[9px] text-zinc-400 mt-0.5">Minimizes mechanical strain</span>
        </div>
      </div>

      {/* Rules Details */}
      <div className="space-y-2.5">
        <div className="p-3 bg-[#121218] rounded-xl border border-graphite-border flex items-start gap-3">
          <div className="p-1.5 bg-blue-400/10 text-blue-400 rounded-lg shrink-0 mt-0.5">
            <ThermometerSnowflake className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-400 uppercase font-semibold">
              Thermal Pre-conditioning Protocol
            </span>
            <p className="text-xs text-zinc-200 mt-0.5">{protocol.thermal_preconditioning}</p>
          </div>
        </div>

        <div className="p-3 bg-[#121218] rounded-xl border border-graphite-border flex items-start gap-3">
          <div className="p-1.5 bg-amber-400/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-400 uppercase font-semibold">
              Fast-Charge Throttling Curve
            </span>
            <p className="text-xs text-zinc-200 mt-0.5">{protocol.fast_charge_throttling}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
