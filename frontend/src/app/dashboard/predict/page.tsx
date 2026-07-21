'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { LivingCell } from '@/components/LivingCell';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Terminal, Shield, Play, Link as LinkIcon, CheckCircle, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';

export default function PredictPage() {
  const [batteries, setBatteries] = useState<any[]>([]);
  const [batteryId, setBatteryId] = useState('');
  const [isCustomBattery, setIsCustomBattery] = useState(false);
  const [customBatteryId, setCustomBatteryId] = useState('');
  const [cycleNumber, setCycleNumber] = useState(120);
  const [sohCurrent, setSohCurrent] = useState(94.5);
  const [cathode, setCathode] = useState('LFP');
  
  // Advanced features
  const [earlyMean, setEarlyMean] = useState('');
  const [earlyStd, setEarlyStd] = useState('');
  const [earlyMin, setEarlyMin] = useState('');

  // Results
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);

  // Blockchain Anchoring
  const [anchoring, setAnchoring] = useState(false);
  const [anchorResult, setAnchorResult] = useState<any>(null);
  const [anchorError, setAnchorError] = useState('');

  useEffect(() => {
    const loadBatteries = async () => {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const paramBatteryId = searchParams?.get('battery_id') || searchParams?.get('battery') || searchParams?.get('id');

      try {
        const res = await api.getBatteries('', 0, 100);
        setBatteries(res.batteries);

        if (paramBatteryId) {
          const matched = res.batteries.find((b: any) => b.id === paramBatteryId);
          if (matched) {
            setBatteryId(matched.id);
            if (matched.chemistry) {
              setCathode(matched.chemistry);
            }
          } else {
            // Battery serial ID passed in URL is custom or newly registered
            setIsCustomBattery(true);
            setCustomBatteryId(paramBatteryId);
          }
        } else if (res.batteries.length > 0) {
          setBatteryId(res.batteries[0].id);
          if (res.batteries[0].chemistry) {
            setCathode(res.batteries[0].chemistry);
          }
        } else {
          setIsCustomBattery(true);
        }
      } catch (err) {
        console.error('Failed to load batteries:', err);
        if (paramBatteryId) {
          setIsCustomBattery(true);
          setCustomBatteryId(paramBatteryId);
        } else {
          setIsCustomBattery(true);
        }
      }
    };
    loadBatteries();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    setError('');
    setPredictionResult(null);
    setAnchorResult(null);
    setAnchorError('');

    const targetId = (isCustomBattery ? customBatteryId : batteryId).trim();
    if (!targetId) {
      setError('Please provide a Battery ID.');
      setRunning(false);
      return;
    }

    try {
      const data: any = {
        battery_id: targetId,
        cycle_number: Number(cycleNumber),
        soh_current: Number(sohCurrent) / 100, // API expects fraction (0 to 1)
        cathode,
      };

      if (earlyMean) data.early_fade_rate_mean = Number(earlyMean);
      if (earlyStd) data.early_fade_rate_std = Number(earlyStd);
      if (earlyMin) data.early_fade_rate_min = Number(earlyMin);

      const res = await api.runPrediction(data);
      setPredictionResult(res);

      // Fetch all real database predictions for this battery cell
      try {
        const pData = await api.getBatteryPredictions(targetId);
        if (pData.predictions && pData.predictions.length > 0) {
          const realHistory = pData.predictions
            .map((p: any) => ({
              cycle: p.cycle_number,
              soh: Number(p.soh_percent.toFixed(2)),
              rul: p.rul_cycles || 0,
            }))
            .sort((a: any, b: any) => a.cycle - b.cycle);
          setPredictionHistory(realHistory);
        } else {
          setPredictionHistory([
            {
              cycle: res.cycle_number || Number(cycleNumber),
              soh: res.soh_percent,
              rul: res.rul_cycles,
            },
          ]);
        }
      } catch {
        setPredictionHistory([
          {
            cycle: res.cycle_number || Number(cycleNumber),
            soh: res.soh_percent,
            rul: res.rul_cycles,
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing predictive model inference.');
    } finally {
      setRunning(false);
    }
  };

  const handleAnchor = async () => {
    if (!predictionResult?.id) return;
    setAnchoring(true);
    setAnchorError('');
    setAnchorResult(null);

    try {
      const res = await api.writeToChain(predictionResult.id, 'SOH_UPDATE');
      setAnchorResult(res);
    } catch (err: any) {
      setAnchorError(err.message || 'Failed to anchor data on-chain.');
    } finally {
      setAnchoring(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Inference Terminal</h1>
        <p className="text-zinc-400 text-xs mt-1">Run state-of-health predictions and log findings to the blockchain provenance layer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Form */}
        <form onSubmit={handlePredict} className="lg:col-span-5 bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border space-y-5 shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-graphite-border/50">
            <h3 className="font-bold text-white text-xs font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#deff00]" />
              Inference Inputs
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-zinc-500">Custom Cell ID:</span>
              <input
                type="checkbox"
                checked={isCustomBattery}
                onChange={(e) => setIsCustomBattery(e.target.checked)}
                className="rounded bg-[#060608] border-graphite-border focus:ring-0 text-[#deff00]"
              />
            </div>
          </div>

          {isCustomBattery ? (
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">New Battery Serial / ID</label>
              <input
                type="text"
                placeholder="e.g. CS2_99"
                required
                value={customBatteryId}
                onChange={(e) => setCustomBatteryId(e.target.value)}
                className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Target Battery</label>
              <select
                value={batteryId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setBatteryId(selectedId);
                  const matched = batteries.find((b) => b.id === selectedId);
                  if (matched?.chemistry) {
                    setCathode(matched.chemistry);
                  }
                }}
                className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
              >
                {batteries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} ({b.chemistry || 'LCO'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Cycle Number</label>
              <input
                type="number"
                required
                min={0}
                value={cycleNumber}
                onChange={(e) => setCycleNumber(Number(e.target.value))}
                className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Current SOH (%)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                max="100"
                value={sohCurrent}
                onChange={(e) => setSohCurrent(Number(e.target.value))}
                className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Cathode Chemistry</label>
            <select
              value={cathode}
              onChange={(e) => setCathode(e.target.value)}
              className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
            >
              <option value="LCO">LCO — Lithium Cobalt Oxide</option>
              <option value="LFP">LFP — Lithium Iron Phosphate</option>
              <option value="NMC">NMC — Nickel Manganese Cobalt</option>
              <option value="NCA">NCA — Nickel Cobalt Aluminum</option>
            </select>
          </div>

          {/* Advanced Section */}
          <div className="border-t border-graphite-border/40 pt-4 space-y-4">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-zinc-300 font-mono">Advanced Cycle Parameters</span>
              <span className="text-zinc-500 cursor-help" title="Optional parameters derived from cycle capacity curve fitting. If omitted, default values for the cathode chemistry are automatically loaded.">
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="block text-[9px] font-mono text-zinc-500 mb-1">FADE RATE MEAN</span>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Auto"
                  value={earlyMean}
                  onChange={(e) => setEarlyMean(e.target.value)}
                  className="w-full bg-[#060608] border border-graphite-border rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-[#deff00] font-mono"
                />
              </div>
              <div>
                <span className="block text-[9px] font-mono text-zinc-500 mb-1">FADE RATE STD</span>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Auto"
                  value={earlyStd}
                  onChange={(e) => setEarlyStd(e.target.value)}
                  className="w-full bg-[#060608] border border-graphite-border rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-[#deff00] font-mono"
                />
              </div>
              <div>
                <span className="block text-[9px] font-mono text-zinc-500 mb-1">FADE RATE MIN</span>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Auto"
                  value={earlyMin}
                  onChange={(e) => setEarlyMin(e.target.value)}
                  className="w-full bg-[#060608] border border-graphite-border rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-[#deff00] font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={running}
            className="w-full bg-[#deff00] hover:bg-[#cbe800] text-black py-3.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#deff00]/15 uppercase tracking-wider font-mono"
          >
            {running ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Executing Random Forest Solver…
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Model Inference
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-200 text-xs font-mono">
              {error}
            </div>
          )}
        </form>

        {/* Right Side: R3F Canvas & Results */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dynamic 3D Visualization */}
          <div className="bg-[#0b0b10] p-5 rounded-2xl border border-graphite-border relative overflow-hidden flex flex-col items-center shadow-xl">
            <h3 className="w-full font-bold text-white text-xs font-mono mb-4 text-left">3D Living Cell Telemetry Model</h3>
            <div className="w-full max-w-[320px] aspect-square rounded-2xl bg-[#060608] border border-graphite-border/60 overflow-hidden relative">
              <LivingCell 
                soh={predictionResult ? predictionResult.soh_percent : sohCurrent} 
                hasKneePoint={predictionResult ? predictionResult.has_knee_point : false} 
              />
            </div>
          </div>

          {/* Results Summary Box */}
          {predictionResult && (
            <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border space-y-5 shadow-xl animate-fade-in">
              <div className="flex justify-between items-center pb-3 border-b border-graphite-border/50">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Telemetry Prediction Output</span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">MODEL: {predictionResult.model_version}</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#060608] p-3.5 rounded-xl border border-graphite-border/60">
                  <span className="block text-[9px] font-mono text-zinc-500 uppercase">PREDICTED SOH</span>
                  <span className="text-base font-bold text-[#deff00] font-mono mt-1 block">
                    {predictionResult.soh_percent}%
                  </span>
                </div>
                <div className="bg-[#060608] p-3.5 rounded-xl border border-graphite-border/60">
                  <span className="block text-[9px] font-mono text-zinc-500 uppercase">RUL FRACTION</span>
                  <span className="text-base font-bold text-violet-400 font-mono mt-1 block">
                    {Math.round(predictionResult.rul_fraction * 100)}%
                  </span>
                </div>
                <div className="bg-[#060608] p-3.5 rounded-xl border border-graphite-border/60">
                  <span className="block text-[9px] font-mono text-zinc-500 uppercase">RUL CYCLES</span>
                  <span className="text-base font-bold text-white font-mono mt-1 block">
                    {predictionResult.rul_cycles}
                  </span>
                </div>
              </div>



              {predictionResult.has_knee_point && (
                <div className="p-3.5 bg-red-950/40 border border-red-900/60 text-red-200 rounded-xl text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div>
                    <strong>Accelerated Capacity Fade (Knee Point) Reached.</strong> Internal resistance spike &amp; rapid lithium plating expected.
                  </div>
                </div>
              )}

              {/* Anchoring Options */}
              <div className="border-t border-graphite-border/40 pt-4 flex flex-col gap-4">
                <div className="space-y-1">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">CRYPTOGRAPHIC REPORT HASH</span>
                  <code className="block text-[10px] font-mono text-[#deff00] break-all p-2.5 bg-[#060608] rounded-xl border border-graphite-border/50">
                    {predictionResult.report_hash}
                  </code>
                </div>

                {!anchorResult ? (
                  <button
                    onClick={handleAnchor}
                    disabled={anchoring}
                    className="w-full bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg font-mono uppercase tracking-wider"
                  >
                    {anchoring ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Awaiting Polygon Blockchain confirmation (Amoy network)…
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" />
                        Anchor Prediction Report on Blockchain
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-4 bg-[#deff00]/10 border border-[#deff00]/30 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-[#deff00] text-xs font-mono font-bold uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4" /> Cryptographic Ledger Record Anchor Confirmed!
                    </div>
                    <div className="text-[10px] font-mono text-zinc-300 space-y-1">
                      <div>
                        Transaction: <a href={`https://amoy.polygonscan.com/tx/${anchorResult.tx_hash}`} target="_blank" rel="noreferrer" className="text-[#deff00] underline break-all font-mono">{anchorResult.tx_hash}</a>
                      </div>
                      <div>
                        Block Number: <strong className="text-white font-mono">{anchorResult.block_number}</strong>
                      </div>
                      <div>
                        Contract Address: <code className="text-zinc-300 break-all font-mono">{anchorResult.contract_address}</code>
                      </div>
                    </div>
                  </div>
                )}

                {anchorError && (
                  <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-200 text-xs font-mono">
                    {anchorError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
