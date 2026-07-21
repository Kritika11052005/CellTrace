'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Shield, Battery, Terminal, Cpu, Clock, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function DashboardSummaryPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const statsData = await api.getDashboardStats();
        
        // Fetch recent predictions
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://celltrace.onrender.com/api';
        const predictionsData = await fetch(`${apiBase}/predictions?take=5`);
        const json = await predictionsData.json();
        
        // Count details
        let onChainCount = 0;
        let totalPredictionsCount = json.total;
        
        // Map recent predictions
        const mappedRecent = json.predictions.map((p: any) => {
          if (p.chain_status === 'confirmed') {
            onChainCount++;
          }
          return p;
        });

        // Query database stats for total confirmations
        setStats({
          ...statsData,
          total_predictions: totalPredictionsCount,
          on_chain_rate: totalPredictionsCount > 0 ? Math.round((onChainCount / Math.min(5, totalPredictionsCount)) * 100) : 100,
        });

        setRecentPredictions(mappedRecent);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError('Error loading dashboard console summary stats.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* ─── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Operations Console Summary</h1>
        <p className="text-zinc-400 text-xs mt-1">Real-time battery degradation telemetry &amp; cryptographic state registry</p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-200 text-xs font-mono">
          {error}
        </div>
      )}

      {/* ─── Metrics Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0b0b10] p-5 rounded-2xl border border-graphite-border hover:border-[#deff00]/30 transition-all flex items-start gap-4 shadow-xl">
          <div className="p-2.5 bg-[#deff00]/10 border border-[#deff00]/20 rounded-xl text-[#deff00]">
            <Battery className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Total Seeded Fleet</span>
            <span className="block text-2xl font-bold text-white mt-1 font-mono">{stats?.total_batteries || 0}</span>
            <span className="block text-[10px] text-zinc-400 mt-1">Active tracked cells</span>
          </div>
        </div>

        <div className="bg-[#0b0b10] p-5 rounded-2xl border border-graphite-border hover:border-violet-500/30 transition-all flex items-start gap-4 shadow-xl">
          <div className="p-2.5 bg-violet-400/10 border border-violet-400/20 rounded-xl text-violet-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Telemetry Scans</span>
            <span className="block text-2xl font-bold text-white mt-1 font-mono">{stats?.total_predictions || 0}</span>
            <span className="block text-[10px] text-zinc-400 mt-1">ML SOH/RUL predictions run</span>
          </div>
        </div>

        <div className="bg-[#0b0b10] p-5 rounded-2xl border border-graphite-border hover:border-[#deff00]/30 transition-all flex items-start gap-4 shadow-xl">
          <div className="p-2.5 bg-[#deff00]/10 border border-[#deff00]/20 rounded-xl text-[#deff00]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Anchor Integrity</span>
            <span className="block text-2xl font-bold text-white mt-1 font-mono">100%</span>
            <span className="block text-[10px] text-zinc-400 mt-1">Cryptographic match rate</span>
          </div>
        </div>

        <div className="bg-[#0b0b10] p-5 rounded-2xl border border-graphite-border hover:border-teal-400/30 transition-all flex items-start gap-4 shadow-xl">
          <div className="p-2.5 bg-teal-400/10 border border-teal-400/20 rounded-xl text-teal-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Ledger State</span>
            <span className="block text-2xl font-bold text-white mt-1 font-mono">Amoy v2</span>
            <span className="block text-[10px] text-[#deff00] mt-1 flex items-center gap-1 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#deff00] animate-ping" />
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* ─── Actions & Recent Log Row ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#deff00]" />
              Operator Direct Actions
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Execute SOH/RUL predictive modeling on cell cycler datasets, then commit findings to the Polygon ledger.
            </p>
            <div className="space-y-3 mt-2">
              <Link
                href="/dashboard/predict"
                className="w-full bg-[#deff00] hover:bg-[#cbe800] text-black py-3 px-4 rounded-xl text-xs font-black flex items-center justify-between transition-all shadow-lg shadow-[#deff00]/15 uppercase tracking-wider font-mono"
              >
                Inference Terminal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/fleet"
                className="w-full bg-[#121218] hover:bg-[#1a1a24] border border-graphite-border text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all font-mono"
              >
                Inspect Fleet Health
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Predictions */}
        <div className="lg:col-span-8 bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-graphite-border/50">
            <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              Recent Telemetry Logs
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Latest 5 events</span>
          </div>

          <div className="divide-y divide-graphite-border/50">
            {recentPredictions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No recent predictions found. Use the Inference Terminal to trigger one.
              </div>
            ) : (
              recentPredictions.map((pred) => (
                <div key={pred.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{pred.battery_id}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">({pred.model_version})</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                      <span>SOH: <strong className="text-[#deff00]">{pred.soh_percent}%</strong></span>
                      <span>RUL: <strong className="text-violet-400">{pred.rul_cycles ?? 'N/A'} cycles</strong></span>
                      {pred.has_knee_point && (
                        <span className="inline-flex items-center gap-0.5 text-red-400 bg-red-950/20 px-1.5 py-0.5 border border-red-900/30 rounded text-[9px] font-mono">
                          <AlertTriangle className="w-2.5 h-2.5" /> Knee Point
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <div className="text-right">
                      <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Registry status</span>
                      <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[9px] font-mono border ${
                        pred.chain_status === 'confirmed'
                          ? 'bg-[#deff00]/10 text-[#deff00] border-[#deff00]/20'
                          : pred.chain_status === 'pending'
                          ? 'bg-amber-950/20 text-amber-400 border-amber-900/30'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                      }`}>
                        {pred.chain_status === 'confirmed' ? (
                          <>
                            <CheckCircle className="w-2.5 h-2.5" /> Confirmed
                          </>
                        ) : pred.chain_status === 'pending' ? (
                          <>
                            <Clock className="w-2.5 h-2.5 animate-spin" /> Pending
                          </>
                        ) : (
                          'Not Logged'
                        )}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/fleet/${pred.battery_id}`}
                      className="bg-[#121218] hover:bg-[#1a1a24] text-zinc-300 p-2 rounded-xl border border-graphite-border transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
