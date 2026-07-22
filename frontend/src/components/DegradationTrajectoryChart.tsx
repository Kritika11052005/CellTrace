'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingUp, ShieldCheck, Activity } from 'lucide-react';

interface TrajectoryData {
  cycle: number;
  observed_soh?: number;
  unmitigated_soh: number;
  optimized_soh: number;
}

interface DegradationTrajectoryChartProps {
  data: TrajectoryData[];
  extensionCycles?: number;
}

export default function DegradationTrajectoryChart({
  data,
  extensionCycles = 340,
}: DegradationTrajectoryChartProps) {
  return (
    <div className="bg-[#0b0b10] border border-graphite-border rounded-2xl p-5 shadow-xl relative font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-2 border-b border-graphite-border/60 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#deff00]" />
            <h3 className="font-bold text-white text-sm font-mono">Battery Degradation Trajectory &amp; APM Optimization</h3>
          </div>
          <p className="text-zinc-400 text-xs mt-0.5">
            Comparing unmitigated capacity fade vs. Gemini AI optimized charging envelope
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#deff00]/10 border border-[#deff00]/30 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-[#deff00]" />
          <div>
            <span className="block text-[9px] font-mono text-zinc-400 uppercase">RUL Life Extension</span>
            <span className="block text-xs font-bold text-[#deff00] font-mono">+{extensionCycles} Cycles</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" vertical={false} />
            <XAxis
              dataKey="cycle"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              unit=" cyc"
            />
            <YAxis
              domain={[60, 100]}
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f0f18',
                borderColor: '#27273a',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#fff',
                fontFamily: 'monospace',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'monospace' }}
            />
            {/* EOL 80% threshold line */}
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'EOL (80% SOH)', fill: '#ef4444', fontSize: 10, position: 'right' }} />

            <Line
              type="monotone"
              dataKey="observed_soh"
              name="Observed Telemetry SOH"
              stroke="#deff00"
              strokeWidth={3}
              dot={{ r: 3, fill: '#deff00' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="unmitigated_soh"
              name="Unmitigated Trajectory"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="optimized_soh"
              name="AI-Optimized APM Trajectory"
              stroke="#a855f7"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-graphite-border/40 grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="bg-[#121218] p-2 rounded-xl border border-graphite-border">
          <span className="block text-[9px] text-zinc-500 uppercase">Observed SOH</span>
          <span className="text-[#deff00] font-bold">86.4%</span>
        </div>
        <div className="bg-[#121218] p-2 rounded-xl border border-graphite-border">
          <span className="block text-[9px] text-zinc-500 uppercase">Unmitigated EOL</span>
          <span className="text-red-400 font-bold">Cycle 620</span>
        </div>
        <div className="bg-[#121218] p-2 rounded-xl border border-graphite-border">
          <span className="block text-[9px] text-zinc-500 uppercase">AI-Optimized EOL</span>
          <span className="text-violet-400 font-bold">Cycle 960</span>
        </div>
      </div>
    </div>
  );
}
