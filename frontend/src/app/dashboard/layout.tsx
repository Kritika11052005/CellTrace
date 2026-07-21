'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { CellTraceLogo } from '@/components/CellTraceLogo';
import { LayoutDashboard, Terminal, Battery, ShieldAlert, LogOut, Shield, Database, Activity, RefreshCw } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState<any>(null);
  
  // API Health status indicators
  const [dbStatus, setDbStatus] = useState<boolean | null>(null);
  const [chainStatus, setChainStatus] = useState<boolean | null>(null);
  const [mlStatus, setMlStatus] = useState<boolean | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const fetchHealth = async () => {
    setCheckingHealth(true);
    try {
      const stats = await api.getDashboardStats();
      setDbStatus(stats.db_connected);
      setChainStatus(stats.chain_active);
      setMlStatus(stats.ml_loaded);
    } catch {
      setDbStatus(false);
      setChainStatus(false);
      setMlStatus(false);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    // 1. Check Auth
    if (!api.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // 2. Fetch User Profile & Health
    const loadProfile = async () => {
      try {
        const user = await api.getMe();
        setOperator(user);
        await fetchHealth();
      } catch (err) {
        console.error('Failed to load dashboard auth:', err);
        api.logout();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    // Refresh health status every 20 seconds
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center gap-4 text-zinc-400 font-mono text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-[#deff00]" />
        Securing cryptographically verified connection…
      </div>
    );
  }

  const menuItems = [
    { name: 'Console Summary', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inference Terminal', path: '/dashboard/predict', icon: Terminal },
    { name: 'Battery Fleet', path: '/dashboard/fleet', icon: Battery },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex font-sans">
      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside className="w-64 bg-[#0b0b10] border-r border-graphite-border/70 flex flex-col z-20">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-graphite-border/50 gap-2.5">
          <CellTraceLogo className="w-7 h-7" />
          <span className="font-bold tracking-tight text-white text-sm font-mono uppercase">
            CELL<span className="text-[#deff00]">TRACE</span>
          </span>
        </div>

        {/* Operator Profile */}
        {operator && (
          <div className="p-4 mx-4 mt-4 bg-[#121218] rounded-xl border border-graphite-border/60">
            <span className="block text-[10px] font-mono text-zinc-500">OPERATOR ATTACHED</span>
            <span className="block text-xs font-bold text-white truncate font-mono">{operator.email}</span>
            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-[#deff00]/10 text-[#deff00] text-[9px] font-mono border border-[#deff00]/20 capitalize">
              Role: {operator.role}
            </span>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium font-mono transition-all ${
                  isActive
                    ? 'bg-[#deff00]/10 border-l-2 border-[#deff00] text-white font-semibold'
                    : 'text-zinc-400 hover:bg-[#15151c] hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#deff00]' : 'text-zinc-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Connectivity Status Indicators */}
        <div className="p-4 border-t border-graphite-border/50 flex flex-col gap-3 bg-[#060608]">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-zinc-500">SYSTEM HEALTH</span>
            <button 
              onClick={fetchHealth} 
              disabled={checkingHealth}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${checkingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-zinc-500" /> Neon Database
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                dbStatus ? 'bg-[#deff00]/10 text-[#deff00] border border-[#deff00]/20' : 'bg-red-950/20 text-red-400 border border-red-900/30'
              }`}>
                {dbStatus === null ? 'Pinging…' : dbStatus ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-zinc-500" /> ML Predictors
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                mlStatus ? 'bg-[#deff00]/10 text-[#deff00] border border-[#deff00]/20' : 'bg-amber-950/20 text-amber-400 border border-amber-900/30'
              }`}>
                {mlStatus === null ? 'Pinging…' : mlStatus ? 'LOADED' : 'UNLOADED'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-zinc-500" /> Polygon Ledger
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                chainStatus ? 'bg-[#deff00]/10 text-[#deff00] border border-[#deff00]/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
              }`}>
                {chainStatus === null ? 'Pinging…' : chainStatus ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-graphite-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono text-zinc-500 hover:bg-red-950/10 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-zinc-600" />
            Detach Operator
          </button>
        </div>
      </aside>

      {/* ─── Main Content Wrapper ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-6 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
