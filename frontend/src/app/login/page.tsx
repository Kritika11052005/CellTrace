'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/services/api';
import { CellTraceLogo } from '@/components/CellTraceLogo';
import { Shield, Mail, Lock, ArrowRight, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col relative overflow-hidden font-sans select-none">
      {/* ── Background Image & Dark Ambient Overlays ─────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-rack.png"
          alt="Battery Storage Facility"
          fill
          priority
          className="object-cover object-center brightness-[0.22] contrast-[1.2] filter opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/80 to-[#050508]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-transparent to-[#050508]" />
      </div>

      {/* ── Glowing Cyber Spheres ───────────────────────────────────────── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#deff00]/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ── Top Header Navigation Bar ───────────────────────────────────── */}
      <header className="relative z-20 px-6 sm:px-12 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <CellTraceLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
          <span className="font-extrabold tracking-wider text-white text-base font-mono uppercase">
            CELL<span className="text-[#deff00]">TRACE</span>
          </span>
        </Link>

        <Link
          href="/"
          className="bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white px-4 py-2 rounded-full text-xs font-mono transition-all backdrop-blur-md flex items-center gap-1.5"
        >
          ← Public Gateway
        </Link>
      </header>

      {/* ── Center Login Card Container ──────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md relative">
          {/* Outer Glass Card */}
          <div className="relative rounded-3xl bg-[#0d0d14]/90 backdrop-blur-2xl border border-white/15 p-8 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden group">
            {/* Top Glowing Neon Gradient Border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#deff00] to-transparent opacity-80" />

            {/* Brand Logo & Heading Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-2xl bg-[#deff00]/10 border border-[#deff00]/30 flex items-center justify-center shadow-lg shadow-[#deff00]/20">
                  <CellTraceLogo className="w-9 h-9" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#deff00] border-2 border-[#0d0d14] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[#deff00]/10 border border-[#deff00]/25 px-3 py-1 rounded-full text-[10px] font-mono text-[#deff00] font-bold uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#deff00] animate-ping" />
                OPERATOR CONSOLE AUTHENTICATION
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white font-mono">
                CellTrace Operations
              </h1>
              <p className="text-zinc-400 text-xs mt-1">
                Enter your credentials to access battery telemetry &amp; blockchain logs.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Operator Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@celltrace.com"
                    className="w-full bg-[#060609] border border-white/15 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#deff00] focus:ring-1 focus:ring-[#deff00]/40 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060609] border border-white/15 rounded-xl py-3 pl-10 pr-11 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#deff00] focus:ring-1 focus:ring-[#deff00]/40 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-[#deff00]" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#deff00] hover:bg-[#cbe800] text-black py-3.5 px-6 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xl shadow-[#deff00]/20 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider font-mono"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating Operator Session…
                  </>
                ) : (
                  <>
                    <span>Enter Console Operations</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <Link href="/" className="hover:text-[#deff00] transition-colors">
                ← Return to Public Site
              </Link>
              <span className="text-zinc-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#deff00]" /> Polygon Amoy Ready
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Security Badges Footer ───────────────────────────────────────── */}
      <footer className="relative z-20 py-6 px-4 text-center text-[11px] font-mono text-zinc-500 flex flex-col sm:flex-row justify-center items-center gap-3">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#deff00]" /> Keccak-256 Canonical Auth
        </span>
        <span className="hidden sm:inline">&bull;</span>
        <span>Polygon Amoy Testnet 80002</span>
        <span className="hidden sm:inline">&bull;</span>
        <span>Neon Serverless PostgreSQL</span>
      </footer>
    </div>
  );
}
