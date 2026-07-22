'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Shield, Battery, Terminal, Cpu, Clock, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Bot, Sparkles, Wrench, Zap, Activity } from 'lucide-react';
import APMCopilot from '@/components/APMCopilot';
import DegradationTrajectoryChart from '@/components/DegradationTrajectoryChart';
import PredictiveMaintenanceFeed from '@/components/PredictiveMaintenanceFeed';
import OptimalChargingPanel from '@/components/OptimalChargingPanel';

export default function DashboardSummaryPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);
  const [telemetryStream, setTelemetryStream] = useState<any>(null);
  const [apmDiagnosis, setApmDiagnosis] = useState<any>(null);
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

        // Fetch sample APM telemetry & diagnosis
        const sampleBatteryId = json.predictions[0]?.battery_id || 'BAT-NMC-8821';
        const telemetry = await api.getTelemetryStream(sampleBatteryId);
        setTelemetryStream(telemetry);

        const diag = await api.getAPMDiagnosis({
          battery_id: sampleBatteryId,
          cycle_number: 420,
          soh_percent: json.predictions[0]?.soh_percent || 86.4,
          rul_cycles: json.predictions[0]?.rul_cycles || 340,
          has_knee_point: json.predictions[0]?.has_knee_point || false,
          cathode: 'NMC',
          avg_temp_c: 34.5,
          peak_temp_c: 46.2,
          avg_c_rate: 1.2,
          voltage_delta_mv: 18.4,
        });
        setApmDiagnosis(diag);

        let onChainCount = 0;
        let totalPredictionsCount = json.total;

        const mappedRecent = json.predictions.map((p: any) => {
          if (p.chain_status === 'confirmed') {
            onChainCount++;
          }
          return p;
        });

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">APM Operations Console</h1>
            <span className="bg-[#deff00]/15 text-[#deff00] border border-[#deff00]/30 text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 font-bold">
              <Bot className="w-3.5 h-3.5" /> Gemini AI Agent Active
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Real-time battery asset health monitoring, predictive maintenance triggers, and Polygon ledger provenance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/predict"
            className="bg-[#deff00] hover:bg-[#cbe800] text-black px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-[#deff00]/20 font-mono uppercase tracking-wider"
          >
            <Terminal className="w-4 h-4" /> Run SOH Inference
          </Link>
        </div>
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
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">APM Risk Status</span>
            <span className="block text-2xl font-bold text-amber-400 mt-1 font-mono">
              {apmDiagnosis?.severity || 'WARNING'}
            </span>
            <span className="block text-[10px] text-zinc-400 mt-1">14-day service window</span>
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

      {/* ─── Trajectory Chart & Copilot Grid ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          {telemetryStream && (
            <DegradationTrajectoryChart
              data={telemetryStream.trajectory_curve}
              extensionCycles={telemetryStream.extension_benefit_cycles}
            />
          )}
        </div>
        <div className="lg:col-span-5">
          <APMCopilot
            batteryId={recentPredictions[0]?.battery_id || 'BAT-NMC-8821'}
            sohPercent={recentPredictions[0]?.soh_percent || 86.4}
            rulCycles={recentPredictions[0]?.rul_cycles || 340}
          />
        </div>
      </div>

      {/* ─── Predictive Maintenance & Optimal Charging ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <PredictiveMaintenanceFeed
            severity={apmDiagnosis?.severity || 'WARNING'}
            healthStatusLabel={apmDiagnosis?.health_status_label}
            rootCauseAnalysis={apmDiagnosis?.root_cause_analysis}
            failureProbability={apmDiagnosis?.failure_probability_percent || 34.2}
            daysToMaintenance={apmDiagnosis?.estimated_days_to_maintenance || 14}
            triggers={apmDiagnosis?.predictive_maintenance_triggers}
            aiEngine={apmDiagnosis?.ai_engine || 'Gemini 2.5 Flash'}
          />
        </div>
        <div className="lg:col-span-5">
          <OptimalChargingPanel protocol={apmDiagnosis?.optimal_charging_protocol} />
        </div>
      </div>

      {/* ─── Recent Telemetry Logs ──────────────────────────── */}
      <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border shadow-xl">
        <div className="flex justify-between items-center pb-4 border-b border-graphite-border/50">
          <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            Recent Asset Telemetry Logs
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
  );
}
