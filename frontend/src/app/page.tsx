'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/services/api';
import { CellTraceLogo } from '@/components/CellTraceLogo';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Database,
  Link as LinkIcon,
  RefreshCw,
  FileText,
  Zap,
  Lock,
  BarChart3,
  Layers,
  Mail,
  ArrowRight,
  ChevronDown,
  Activity,
  Terminal,
  Server,
  Globe,
  ExternalLink,
  Sliders,
  Check
} from 'lucide-react';

const GithubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export default function LandingPage() {
  const [reportText, setReportText] = useState('');
  const [batteryId, setBatteryId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sampleOptimal = {
    battery_id: 'CS2_21',
    soh_percent: 98.0,
    rul_fraction: 0.936,
    rul_cycles: 731,
    has_knee_point: false,
    model_version: 'v1.0-rf-calce-mit-nasa-snl',
    cycle_number: 50,
    soh_input: 0.98,
    cathode: 'LCO'
  };

  const sampleAltered = {
    battery_id: 'CS2_21',
    soh_percent: 99.9,
    rul_fraction: 0.936,
    rul_cycles: 731,
    has_knee_point: false,
    model_version: 'v1.0-rf-calce-mit-nasa-snl',
    cycle_number: 50,
    soh_input: 0.98,
    cathode: 'LCO'
  };

  const loadSample = (type: 'optimal' | 'altered') => {
    const payload = type === 'optimal' ? sampleOptimal : sampleAltered;
    setReportText(JSON.stringify(payload, null, 2));
    setBatteryId(payload.battery_id);
    setVerifyResult(null);
    setVerifyError('');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText) {
      setVerifyError('Please enter or load a report JSON payload.');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setVerifyResult(null);

    try {
      const parsedData = JSON.parse(reportText);
      if (!batteryId) {
        setVerifyError('Please enter a Battery ID corresponding to this report.');
        setVerifying(false);
        return;
      }

      const res = await api.verifyReport(batteryId, parsedData);
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed. Ensure report content is valid JSON.');
    } finally {
      setTimeout(() => setVerifying(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col relative overflow-hidden font-sans">
      {/* ── ON.energy Style Floating Translucent Pill Navbar ─────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-8 ${
          scrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="bg-[#121218]/80 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-8 shadow-2xl shadow-black/80 w-full justify-between sm:w-auto">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <CellTraceLogo className="w-7 h-7" />
              <span className="font-extrabold tracking-wider text-white text-sm font-mono uppercase">
                CELL<span className="text-[#deff00]">TRACE</span>
              </span>
            </Link>

            {/* Menu items */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-mono text-zinc-300">
              <a href="#verify" className="hover:text-white transition-colors">
                Verification
              </a>
              <a href="#solutions" className="hover:text-white transition-colors">
                Solutions
              </a>
              <a href="#technology" className="hover:text-white transition-colors">
                Technology Stack
              </a>
              <a href="#impact" className="hover:text-white transition-colors">
                Grid Resilience
              </a>
            </nav>
          </div>

          {/* Right Action Button (ON.energy High-Contrast Neon Button) */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="bg-[#deff00] hover:bg-[#cbe800] text-black text-xs font-extrabold py-2.5 px-6 rounded-full transition-all duration-300 shadow-lg shadow-[#deff00]/20 hover:scale-105 uppercase tracking-wider font-mono flex items-center gap-2"
            >
              Console Operations <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── ON.energy Hero Section with Full-Bleed EV Battery Rack Image Background ── */}
      <section className="relative min-h-[92vh] flex flex-col justify-between pt-28 pb-12 px-6 sm:px-12 overflow-hidden border-b border-graphite-border/60">
        {/* Background EV Battery Storage Racks Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-rack.png"
            alt="EV Battery Storage Racks"
            fill
            priority
            className="object-cover object-center brightness-[0.75] contrast-[1.1] filter opacity-90"
          />
          {/* Subtle Dark Gradients for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/30 to-[#070709]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070709]/70 via-transparent to-[#070709]/40" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between pt-12">
          {/* Main Headline overlayed over battery rack background (Exact ON.energy layout) */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#121218]/90 border border-white/15 px-3.5 py-1.5 rounded-full text-zinc-300 text-[11px] font-mono mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#deff00] animate-ping" />
              HYPERSCALE BATTERY PROVENANCE ENGINE &bull; POLYGON AMOY ANCHORED
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-[0.98] font-sans">
              Perfect Power <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                for AI &amp; EV Grids.
              </span>
            </h1>
          </div>

          {/* Bottom Hero Controls & Floating Card (Exact ON.energy layout) */}
          <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            {/* Left Subtitle & Call to Action */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <p className="text-zinc-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
                CellTrace builds and operates machine-learning battery provenance systems to solve the toughest SOH verification and remaining-useful-life challenges.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="#verify"
                  className="bg-[#deff00] hover:bg-[#cbe800] text-black font-extrabold py-3.5 px-8 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-xl shadow-[#deff00]/15"
                >
                  Tamper-Check SOH Report
                </a>
                <a
                  href="#technology"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-3.5 px-8 rounded-full text-xs font-mono transition-all"
                >
                  Explore Tech Stack
                </a>
              </div>
            </div>

            {/* Right Bottom Floating Feature Card (ON.energy Discover Widget Style) */}
            <div className="md:col-span-5">
              <div className="bg-[#0e0e14]/90 backdrop-blur-xl border border-white/15 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xl hover:border-white/30 transition-all group">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-[#deff00] uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#deff00]" /> DISCOVER SOH VERIFICATION
                  </span>
                  <p className="text-xs text-white font-semibold leading-snug">
                    The first Polygon-anchored battery provenance engine purpose-built for grid-safe data centers &amp; EV fleets.
                  </p>
                </div>

                {/* Battery Module Preview Thumbnail */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
                  <Image
                    src="/images/tech-module.png"
                    alt="Battery Module"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ON.energy Performance Metrics Banner Bar ────────────────────────────── */}
      <section className="bg-[#0a0a0e] border-b border-graphite-border/70 py-10 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col border-l-2 border-[#deff00] pl-4">
            <span className="text-4xl sm:text-5xl font-black text-white font-mono">100%</span>
            <span className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">Cryptographic Match</span>
            <span className="text-[11px] text-zinc-500 mt-0.5">Keccak-256 canonical hashing</span>
          </div>

          <div className="flex flex-col border-l-2 border-white/40 pl-4">
            <span className="text-4xl sm:text-5xl font-black text-white font-mono">80002</span>
            <span className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">Polygon Amoy Testnet</span>
            <span className="text-[11px] text-zinc-500 mt-0.5">Zero-cost calldata self-send</span>
          </div>

          <div className="flex flex-col border-l-2 border-teal-400 pl-4">
            <span className="text-4xl sm:text-5xl font-black text-white font-mono">&gt;96%</span>
            <span className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">ML SOH Accuracy</span>
            <span className="text-[11px] text-zinc-500 mt-0.5">CALCE &amp; MIT trained RF model</span>
          </div>

          <div className="flex flex-col border-l-2 border-violet-400 pl-4">
            <span className="text-4xl sm:text-5xl font-black text-white font-mono">0ms</span>
            <span className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">Public Verification</span>
            <span className="text-[11px] text-zinc-500 mt-0.5">Instant client-side hash audit</span>
          </div>
        </div>
      </section>

      {/* ── Public Verification Engine Terminal (ON.energy High-Tech Style) ────── */}
      <section id="verify" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 text-[#deff00] text-xs font-mono font-bold uppercase tracking-widest mb-2">
            <Shield className="w-4 h-4" /> Public Verification Gateway
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Verify Any Battery SOH Payload
          </h2>
          <p className="mt-3 text-zinc-400 text-sm max-w-2xl">
            Inspect raw JSON telemetry payloads against real immutable blockchain records stored on Polygon Amoy. 
            Test with our verified baseline sample or load an intentionally altered payload to test tamper detection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Panel */}
          <div className="lg:col-span-7 bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border shadow-2xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-graphite-border/70">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#deff00]" />
                <h3 className="font-semibold text-white text-sm font-mono">SOH Report JSON Input</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadSample('optimal')}
                  type="button"
                  className="bg-[#deff00]/10 hover:bg-[#deff00]/20 border border-[#deff00]/30 text-[#deff00] text-[11px] font-mono font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Load Sample Match
                </button>
                <button
                  onClick={() => loadSample('altered')}
                  type="button"
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-mono font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Load Sample Tampered
                </button>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Battery Serial / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS2_21"
                  required
                  value={batteryId}
                  onChange={(e) => setBatteryId(e.target.value)}
                  className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Telemetry Payload JSON
                </label>
                <textarea
                  rows={8}
                  placeholder="Paste report JSON payload here..."
                  required
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full bg-[#060608] border border-graphite-border rounded-xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-[#deff00] transition-colors font-mono leading-relaxed resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full bg-[#deff00] hover:bg-[#cbe800] text-black py-3.5 px-6 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#deff00]/15 uppercase tracking-wider font-mono"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Querying Ledger &amp; Computing Keccak-256...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Execute Tamper Verification Check
                  </>
                )}
              </button>
            </form>

            {verifyError && (
              <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{verifyError}</span>
              </div>
            )}
          </div>

          {/* Verification Results Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border shadow-2xl min-h-[380px] flex flex-col justify-center items-center text-center">
              {!verifyResult ? (
                <div className="flex flex-col items-center gap-4 text-zinc-500 py-12">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-graphite-border flex items-center justify-center text-zinc-600">
                    <Shield className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-mono max-w-[260px] text-zinc-400 leading-relaxed">
                    Waiting for telemetry report payload. Click <strong className="text-[#deff00]">Load Sample Match</strong> above to test verification.
                  </p>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-5 text-left">
                  <div className="flex items-center gap-3 pb-4 border-b border-graphite-border/70">
                    {verifyResult.is_match ? (
                      <div className="w-10 h-10 rounded-xl bg-[#deff00]/10 border border-[#deff00]/30 flex items-center justify-center text-[#deff00] shrink-0">
                        <CheckCircle className="w-6 h-6 animate-bounce" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                        <AlertTriangle className="w-6 h-6 animate-pulse" />
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold text-white text-sm font-mono uppercase tracking-wider">Integrity Audit Result</h4>
                      <p className={`text-xs font-mono font-bold mt-0.5 ${verifyResult.is_match ? 'text-[#deff00]' : 'text-amber-400'}`}>
                        {verifyResult.is_match ? '✓ INTEGRITY VERIFIED (100% MATCH)' : '⚠ INTEGRITY COMPROMISED OR UNANCHORED'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed font-mono bg-zinc-900/60 p-3 rounded-lg border border-graphite-border/50">
                    {verifyResult.message}
                  </p>

                  <div className="space-y-3 bg-[#060608] p-4 rounded-xl border border-graphite-border">
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Computed Keccak-256 Hash</span>
                      <code className="text-[11px] font-mono text-[#deff00] break-all block mt-1">{verifyResult.computed_hash}</code>
                    </div>

                    <div className="pt-2 border-t border-graphite-border/50">
                      <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">On-Chain Ledger Hash</span>
                      <code className="text-[11px] font-mono text-zinc-300 break-all block mt-1">
                        {verifyResult.on_chain_hash || 'No matching on-chain record found'}
                      </code>
                    </div>
                  </div>

                  {verifyResult.is_match && verifyResult.tx_hash && (
                    <div className="bg-[#deff00]/5 border border-[#deff00]/20 p-3.5 rounded-xl flex flex-col gap-1.5">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Polygon Scan Amoy Explorer</span>
                        <span className="text-[#deff00] font-bold">Confirmed</span>
                      </div>
                      <a
                        href={verifyResult.block_explorer_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-[#deff00] hover:underline flex items-center gap-1.5 break-all font-semibold"
                      >
                        <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                        {verifyResult.tx_hash}
                        <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0b0b10] p-4 rounded-xl border border-graphite-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Primary Network</span>
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#deff00] animate-ping" />
                  Polygon Amoy Testnet
                </span>
              </div>

              <div className="bg-[#0b0b10] p-4 rounded-xl border border-graphite-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Database Parity</span>
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5 mt-1">
                  <Database className="w-3.5 h-3.5 text-violet-400" />
                  Neon Serverless PostgreSQL
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Technical Stack Section (ON.energy Grid Layout) ────────────────────── */}
      <section id="technology" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full border-t border-graphite-border/50">
        <div className="flex flex-col items-center text-center mb-14">
          <div className="inline-flex items-center gap-2 text-white text-xs font-mono font-bold uppercase tracking-widest mb-2">
            <Layers className="w-4 h-4 text-[#deff00]" /> Technology Stack
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Built for Zero-Trust Audits
          </h2>
          <p className="mt-3 text-zinc-400 text-sm max-w-2xl">
            CellTrace combines hardware-aware ML modeling, cross-language canonical JSON hashing, and automated Polygon testnet anchoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0b0b10] p-8 rounded-2xl border border-graphite-border hover:border-[#deff00]/40 transition-all duration-300 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#deff00]/10 border border-[#deff00]/30 flex items-center justify-center text-[#deff00]">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg font-mono">1. ML Predictive Engine</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Random Forest regressor trained on CALCE, MIT, NASA, and SNL battery cycling datasets. Predicts SOH% and RUL (Remaining Useful Life) cycles with early knee-point degradation detection.
            </p>
            <div className="mt-auto pt-4 border-t border-graphite-border/50 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Model: Scikit-learn RF</span>
              <span className="text-[#deff00] font-semibold">FastAPI Engine</span>
            </div>
          </div>

          <div className="bg-[#0b0b10] p-8 rounded-2xl border border-graphite-border hover:border-violet-400/40 transition-all duration-300 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center text-violet-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg font-mono">2. Canonical Hashing</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Cross-platform payload normalization ensures identical Keccak-256 (SHA3) hashes between Python backend serialization and JS frontend validation, preventing false-positive tamper alerts.
            </p>
            <div className="mt-auto pt-4 border-t border-graphite-border/50 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Hash: Keccak-256</span>
              <span className="text-violet-400 font-semibold">Ethers v6 &amp; Web3</span>
            </div>
          </div>

          <div className="bg-[#0b0b10] p-8 rounded-2xl border border-graphite-border hover:border-teal-400/40 transition-all duration-300 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-400/10 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg font-mono">3. Polygon Amoy Anchoring</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Report hashes are embedded into zero-value self-send transactions on Polygon Amoy testnet (`tx.data` calldata field), making predictions immutable without complex smart contract overhead.
            </p>
            <div className="mt-auto pt-4 border-t border-graphite-border/50 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Chain ID: 80002</span>
              <span className="text-teal-400 font-semibold">PolygonScan Linked</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact & Use Cases Section (ON.energy Grid Layout) ────────────────── */}
      <section id="impact" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full border-t border-graphite-border/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <span className="text-[#deff00] text-xs font-mono font-bold uppercase tracking-widest">
              Grid &amp; Mobility Resilience
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              Solving Battery Fraud &amp; Degradation Uncertainty
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              As EV adoption accelerates and grid-scale BESS (Battery Energy Storage Systems) proliferate, 
              verifying real battery degradation history is paramount for safety, residual valuation, and second-life deployment.
            </p>

            <div className="mt-4 flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center gap-2.5 text-zinc-200">
                <Check className="w-4 h-4 text-[#deff00] shrink-0" />
                <span>Second-Life Battery Asset Qualification</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-200">
                <Check className="w-4 h-4 text-[#deff00] shrink-0" />
                <span>Tamper-proof Fleet Warranty Compliance</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-200">
                <Check className="w-4 h-4 text-[#deff00] shrink-0" />
                <span>Decentralized EV Residual Value Auditing</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border flex flex-col gap-2">
              <Zap className="w-6 h-6 text-[#deff00] mb-2" />
              <h4 className="font-bold text-white text-base">BESS Storage Integrators</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Ensure used EV battery packs repurposed for stationary storage have verifiable cycle degradation records anchored on-chain.
              </p>
            </div>

            <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border flex flex-col gap-2">
              <Activity className="w-6 h-6 text-violet-400 mb-2" />
              <h4 className="font-bold text-white text-base">EV Fleet Management</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Monitor SOH degradation curves across hundreds of commercial vehicles with automated knee-point alerts.
              </p>
            </div>

            <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border flex flex-col gap-2">
              <Shield className="w-6 h-6 text-teal-400 mb-2" />
              <h4 className="font-bold text-white text-base">EV Buyers &amp; Insurers</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Verify used EV battery health instantly with zero third-party trust required — just input the report JSON.
              </p>
            </div>

            <div className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border flex flex-col gap-2">
              <Server className="w-6 h-6 text-[#deff00] mb-2" />
              <h4 className="font-bold text-white text-base">Regulators &amp; Recyclers</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Maintain immutable battery passport logs compliant with international battery passport regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer with Developer Credentials ──────────────────────────────────── */}
      <footer className="relative z-10 border-t border-graphite-border/70 bg-[#040406] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Branding Column */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <CellTraceLogo className="w-8 h-8" />
                <span className="font-extrabold text-xl tracking-tight text-white font-mono">
                  CELL<span className="text-[#deff00]">TRACE</span>
                </span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                Open-source EV battery provenance &amp; SOH prediction engine. Combining Random Forest predictive modeling with Polygon blockchain anchoring.
              </p>
              <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#deff00] animate-ping" />
                  Polygon Amoy 80002
                </span>
                <span>&bull;</span>
                <span>FastAPI + Next.js 16</span>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-3 flex flex-col gap-3">
              <h4 className="text-white font-mono font-bold text-xs uppercase tracking-wider mb-1">
                Navigation &amp; Resources
              </h4>
              <a href="#verify" className="text-xs text-zinc-400 hover:text-[#deff00] transition-colors font-mono">
                Verification Gateway
              </a>
              <a href="#technology" className="text-xs text-zinc-400 hover:text-[#deff00] transition-colors font-mono">
                System Architecture
              </a>
              <a href="#impact" className="text-xs text-zinc-400 hover:text-[#deff00] transition-colors font-mono">
                Grid &amp; Mobility Resilience
              </a>
              <Link href="/login" className="text-xs text-zinc-400 hover:text-[#deff00] transition-colors font-mono">
                Operator Console
              </Link>
            </div>

            {/* Developer Contact & Credentials Column */}
            <div className="md:col-span-4 flex flex-col gap-3 bg-graphite-panel/60 p-5 rounded-2xl border border-graphite-border">
              <h4 className="text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#deff00]" /> Developer Credentials
              </h4>
              <p className="text-zinc-300 text-xs font-semibold">Kritika Benjwal</p>

              <div className="flex flex-col gap-2.5 mt-1 font-mono text-xs">
                <a
                  href="https://www.linkedin.com/in/kritika-benjwal"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-zinc-400 hover:text-[#deff00] transition-colors"
                >
                  <LinkedinIcon />
                  <span className="truncate">linkedin.com/in/kritika-benjwal</span>
                </a>

                <a
                  href="https://github.com/Kritika11052005"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-zinc-400 hover:text-[#deff00] transition-colors"
                >
                  <GithubIcon />
                  <span className="truncate">github.com/Kritika11052005</span>
                </a>

                <a
                  href="mailto:ananya.benjwal@gmail.com"
                  className="flex items-center gap-2.5 text-zinc-400 hover:text-[#deff00] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#deff00] shrink-0" />
                  <span className="truncate">ananya.benjwal@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-graphite-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-[11px] font-mono text-zinc-500">
            <p>© {new Date().getFullYear()} CellTrace Platform &bull; Engineered by Kritika Benjwal</p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All Systems Operational &bull; Polygon Amoy Network Connected
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
