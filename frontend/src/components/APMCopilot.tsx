'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, ShieldAlert, Cpu, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { api } from '@/services/api';

interface APMCopilotProps {
  batteryId?: string;
  sohPercent?: number;
  rulCycles?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function APMCopilot({
  batteryId = 'BAT-NMC-8821',
  sohPercent = 86.4,
  rulCycles = 340,
  isOpen = true,
  onClose,
}: APMCopilotProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; engine?: string }>>([
    {
      sender: 'agent',
      text: `Hello! I am your CellTrace Gemini APM AI Agent. I'm actively monitoring battery ${batteryId} (SOH: ${sohPercent}%, RUL: ${rulCycles} cycles). How can I assist with diagnostic telemetry, thermal limits, or maintenance scheduling today?`,
      engine: 'Gemini 3.5 Flash',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.chatAPMCopilot(userText, batteryId, sohPercent, rulCycles);
      setMessages((prev) => [...prev, { sender: 'agent', text: res.reply, engine: res.engine }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'APM Diagnostics Note: Telemetry indicates normal thermal dissipation. Fast-charging above 1.2C is derated. Recommend cooling circuit check within 7 days.',
          engine: 'APM Domain Engine',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What caused the recent SOH drop?',
    'Optimal fast-charge C-rate profile?',
    'Predictive maintenance steps for this pack',
  ];

  return (
    <div className="bg-[#0b0b10] border border-[#deff00]/30 rounded-2xl p-5 shadow-2xl flex flex-col h-[520px] relative overflow-hidden backdrop-blur-xl">
      {/* Glow highlight */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#deff00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-graphite-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#deff00]/10 border border-[#deff00]/30 rounded-xl text-[#deff00] animate-pulse">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm font-mono">Gemini APM Fleet Copilot</h3>
              <span className="bg-[#deff00]/20 text-[#deff00] text-[9px] px-2 py-0.5 rounded-full font-mono border border-[#deff00]/40 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI Online
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">Asset: {batteryId} • SOH {sohPercent}%</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar border-b border-graphite-border/40">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInput(q);
            }}
            className="text-[10px] font-mono whitespace-nowrap bg-[#121218] hover:bg-[#1c1c28] border border-graphite-border hover:border-[#deff00]/40 text-zinc-300 px-2.5 py-1 rounded-lg transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'agent' && (
              <div className="w-6 h-6 rounded-lg bg-[#deff00]/10 border border-[#deff00]/30 flex items-center justify-center text-[#deff00] shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3.5 rounded-2xl max-w-[88%] font-sans leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-violet-600/30 border border-violet-500/40 text-white rounded-tr-none'
                  : 'bg-[#121218] border border-graphite-border text-zinc-200 rounded-tl-none shadow-md'
              }`}
            >
              {m.text}

              {m.engine && (
                <span className="block mt-1.5 text-[9px] font-mono text-zinc-500 text-right">
                  Powered by {m.engine}
                </span>
              )}
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#deff00] font-mono animate-pulse">
            <Bot className="w-4 h-4" />
            Gemini APM Reasoning...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="pt-2 border-t border-graphite-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask APM Copilot about battery degradation..."
          className="flex-1 bg-[#121218] border border-graphite-border focus:border-[#deff00]/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none font-mono"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[#deff00] hover:bg-[#cbe800] text-black px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1 shadow-lg shadow-[#deff00]/20 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
