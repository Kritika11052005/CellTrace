'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { LivingCell } from '@/components/LivingCell';
import { Shield, Battery, RefreshCw, Link as LinkIcon, AlertTriangle, CheckCircle, ArrowLeft, Terminal, Activity, Cpu, KeyRound } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BatteryDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const batteryId = decodeURIComponent(resolvedParams.id);
  const [mounted, setMounted] = useState(false);
  const [battery, setBattery] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetails = async () => {
    try {
      // 1. Fetch general battery metadata
      const bData = await api.getBattery(batteryId);
      setBattery(bData);

      // 2. Fetch blockchain records
      try {
        const hData = await api.getBatteryHistory(batteryId);
        setHistory(hData.records || []);
      } catch {
        setHistory([]);
      }

      // 3. Fetch real database prediction records for this cell
      try {
        const pData = await api.getBatteryPredictions(batteryId);
        if (pData.predictions && pData.predictions.length > 0) {
          const sorted = [...pData.predictions].sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setPredictions(sorted);
        } else {
          setPredictions([]);
        }
      } catch {
        setPredictions([]);
      }
    } catch (err: any) {
      console.error('Failed to load battery details:', err);
      const msg = err.message || '';
      if (msg.includes('not found')) {
        setError(`Battery "${batteryId}" was not found in the fleet registry.`);
      } else {
        setError(`Error loading battery data: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDetails();
  }, [batteryId]);

  if (!mounted || loading) {
    return (
      <div className="space-y-6 animate-pulse font-sans">
        <div className="h-6 bg-zinc-800 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 h-96 bg-zinc-800 rounded-2xl" />
          <div className="lg:col-span-7 h-96 bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Latest real prediction log
  const latestPred = predictions.length > 0 ? predictions[0] : null;
  const latestSoh = latestPred ? latestPred.soh_percent : 100;
  const isKneePoint = latestPred ? latestPred.has_knee_point : false;

  return (
    <div className="space-y-8 font-sans">
      {/* Back to Fleet */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/fleet"
          className="text-zinc-400 hover:text-[#deff00] text-xs font-mono inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet Registry
        </Link>
      </div>

      {/* Header Title */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
            <Battery className="w-6 h-6 text-[#deff00]" />
            Cell: <span>{batteryId}</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">Provenance trail, material chemistry, and telemetry prediction logs</p>
        </div>
        <button
          onClick={loadDetails}
          className="bg-[#0b0b10] hover:bg-[#15151c] border border-graphite-border text-zinc-300 p-2.5 rounded-xl transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-red-200 text-sm font-mono space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          {!battery && (
            <Link
              href="/dashboard/fleet"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#deff00] transition-colors mt-2"
            >
              <ArrowLeft className="w-3 h-3" /> Return to Fleet Registry
            </Link>
          )}
        </div>
      )}

      {battery && (
        <>
          {/* Main Layout Row: Left 3D Visualizer & Right Numerical Telemetry Outputs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Card: 3D Telemetry Cell Model */}
            <div className="lg:col-span-5 bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wider pb-3 border-b border-graphite-border/50 flex items-center justify-between">
                  <span>3D Telemetry Cell Model</span>
                  <span className="text-[10px] text-zinc-500 font-mono">LIVE STATE</span>
                </h3>
                <div className="w-full max-w-[280px] aspect-square mx-auto my-4 rounded-2xl overflow-hidden relative border border-graphite-border/60 bg-[#060608]">
                  <LivingCell soh={latestSoh} hasKneePoint={isKneePoint} />
                </div>
              </div>

              <div className="space-y-2.5 mt-4 bg-[#060608] p-4 rounded-xl border border-graphite-border/50 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Manufacturer</span>
                  <span className="text-white font-bold">{battery?.manufacturer || 'MIT Consortium'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cell Model</span>
                  <span className="text-white">{battery?.model || '18650 Cylindrical'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cathode Chemistry</span>
                  <span className="text-[#deff00] font-bold">{battery?.chemistry || 'LFP'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nominal Capacity</span>
                  <span className="text-white">{battery?.nominal_capacity_ah || 1.1} Ah</span>
                </div>
              </div>
            </div>

            {/* Right Card: Numerical Telemetry Outcomes & Inference Logs */}
            <div className="lg:col-span-7 bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-graphite-border/50">
                  <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#deff00]" />
                    Inference Engine Output &amp; Telemetry Outcomes
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {predictions.length} Inference Run{predictions.length !== 1 ? 's' : ''} Executed
                  </span>
                </div>

                {predictions.length === 0 ? (
                  /* No Predictions Executed Yet */
                  <div className="py-16 px-6 flex flex-col items-center justify-center text-center bg-[#060608] rounded-2xl border border-graphite-border/60 my-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold font-mono text-white">No Telemetry Inferences Executed</h4>
                    <p className="text-xs text-zinc-400 font-sans max-w-sm leading-relaxed">
                      No ML inference runs have been executed for battery cell <strong className="text-[#deff00] font-mono">{batteryId}</strong> yet. Run a prediction on the Inference Terminal to compute SOH &amp; RUL.
                    </p>
                    <Link
                      href={`/dashboard/predict?battery_id=${encodeURIComponent(batteryId)}`}
                      className="mt-2 bg-[#deff00] hover:bg-[#cbe800] text-black font-extrabold text-xs py-2.5 px-5 rounded-xl uppercase tracking-wider font-mono transition-all shadow-lg shadow-[#deff00]/15 flex items-center gap-1.5"
                    >
                      <Terminal className="w-4 h-4" /> Run Inference for {batteryId}
                    </Link>
                  </div>
                ) : (
                  /* Numerical Telemetry Metrics Grid */
                  <div className="space-y-5 mt-5">
                    {/* Top Summary Banner */}
                    <div className="p-4 bg-[#060608] rounded-xl border border-graphite-border/60 flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#deff00]" />
                        <span className="text-zinc-400">Model Engine:</span>
                        <strong className="text-white">{latestPred?.model_version || 'celltrace-v1.0-mit-calce'}</strong>
                      </div>
                      <div className="text-zinc-500">
                        Inspected Cycle: <strong className="text-[#deff00]">{latestPred?.cycle_number}</strong>
                      </div>
                    </div>

                    {/* Numerical Metric Outcome Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#060608] p-4 rounded-xl border border-graphite-border/60">
                        <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">PREDICTED SOH</span>
                        <span className="text-2xl font-black text-[#deff00] font-mono mt-1 block">
                          {latestPred?.soh_percent}%
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-1 block">State of Health</span>
                      </div>

                      <div className="bg-[#060608] p-4 rounded-xl border border-graphite-border/60">
                        <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">ESTIMATED RUL</span>
                        <span className="text-2xl font-black text-violet-400 font-mono mt-1 block">
                          {latestPred?.rul_cycles} <span className="text-xs font-normal text-zinc-400">cycles</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-1 block">Remaining Useful Life</span>
                      </div>

                      <div className="bg-[#060608] p-4 rounded-xl border border-graphite-border/60">
                        <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">USEFUL CAPACITY</span>
                        <span className="text-2xl font-black text-white font-mono mt-1 block">
                          {Math.round((latestPred?.rul_fraction || 0) * 100)}%
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-1 block">Capacity Fraction</span>
                      </div>
                    </div>

                    {/* Knee Point / Degradation Diagnostic Status */}
                    {latestPred?.has_knee_point ? (
                      <div className="p-4 bg-red-950/40 border border-red-900/60 text-red-200 rounded-xl text-xs font-mono flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <div>
                          <strong className="block text-red-400 font-bold uppercase">Accelerated Fade (Knee Point) Reached</strong>
                          <span className="text-zinc-300 text-[11px]">Internal resistance spike &amp; rapid lithium plating expected. Maintenance recommended.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-[#deff00]/10 border border-[#deff00]/25 text-zinc-200 rounded-xl text-xs font-mono flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-[#deff00] shrink-0" />
                        <div>
                          <strong className="text-[#deff00] font-bold uppercase">Nominal Degradation Rate.</strong> Cell operating within normal safety tolerances.
                        </div>
                      </div>
                    )}

                    {/* Historical Inference Runs Log Table */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                          Logged Inference Runs for Cell {batteryId}
                        </span>
                        <Link href={`/dashboard/predict?battery_id=${encodeURIComponent(batteryId)}`} className="text-[10px] font-mono text-[#deff00] hover:underline flex items-center gap-1">
                          + Run New Inference
                        </Link>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-graphite-border/60 bg-[#060608]">
                        <table className="w-full text-left border-collapse text-xs font-mono">
                          <thead>
                            <tr className="border-b border-graphite-border/60 text-[9px] text-zinc-500 uppercase bg-[#0d0d14]">
                              <th className="py-2.5 px-3">Cycle #</th>
                              <th className="py-2.5 px-3">Predicted SOH</th>
                              <th className="py-2.5 px-3">RUL Cycles</th>
                              <th className="py-2.5 px-3">Knee Point</th>
                              <th className="py-2.5 px-3">Logged Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-graphite-border/40 text-[11px]">
                            {predictions.map((p) => (
                              <tr key={p.id} className="hover:bg-[#121218] transition-colors">
                                <td className="py-2.5 px-3 font-bold text-white">Cycle {p.cycle_number}</td>
                                <td className="py-2.5 px-3 text-[#deff00] font-bold">{p.soh_percent}%</td>
                                <td className="py-2.5 px-3 text-violet-400 font-bold">{p.rul_cycles} cyc</td>
                                <td className="py-2.5 px-3">
                                  {p.has_knee_point ? (
                                    <span className="text-red-400 font-bold">YES</span>
                                  ) : (
                                    <span className="text-zinc-500">NO</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-400">
                                  {new Date(p.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Blockchain Provenance Ledger Table */}
          <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-graphite-border/50">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#deff00] animate-pulse" />
                Immutable Blockchain Provenance Log
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Polygon Amoy Anchors</span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-graphite-border/60 text-[10px] font-mono text-zinc-500 uppercase">
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Block #</th>
                    <th className="py-3 px-4">Report Hash</th>
                    <th className="py-3 px-4">Transaction hash</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-border/40 font-mono">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-500 font-mono">
                        No transactions anchored on-chain for this cell.
                      </td>
                    </tr>
                  ) : (
                    history.map((record) => (
                      <tr key={record.id} className="hover:bg-[#121218] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{record.event_type}</td>
                        <td className="py-3.5 px-4 text-zinc-400">{record.block_number ?? 'Pending'}</td>
                        <td className="py-3.5 px-4 text-zinc-400 select-all" title={record.data_hash}>
                          {record.data_hash.substring(0, 12)}…
                        </td>
                        <td className="py-3.5 px-4">
                          {record.tx_hash.startsWith('pending') ? (
                            <span className="text-zinc-500">{record.tx_hash}</span>
                          ) : (
                            <a
                              href={record.block_explorer_url || `https://amoy.polygonscan.com/tx/${record.tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#deff00] hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <LinkIcon className="w-3 h-3 flex-shrink-0" />
                              {record.tx_hash.substring(0, 16)}…
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            record.status === 'confirmed'
                              ? 'bg-[#deff00]/10 text-[#deff00] border border-[#deff00]/20'
                              : record.status === 'pending'
                              ? 'bg-amber-950/20 text-amber-400 border border-amber-900/30'
                              : 'bg-red-950/20 text-red-400 border border-red-900/30'
                          }`}>
                            {record.status === 'confirmed' ? (
                              <>
                                <CheckCircle className="w-2.5 h-2.5" /> Confirmed
                              </>
                            ) : record.status === 'pending' ? (
                              <>
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Pending
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-2.5 h-2.5" /> Failed
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
