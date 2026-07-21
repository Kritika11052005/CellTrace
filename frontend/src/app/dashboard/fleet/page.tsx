'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { Battery, Search, RefreshCw, Cpu, Link as LinkIcon, Plus, ArrowRight } from 'lucide-react';

export default function FleetPage() {
  const [batteries, setBatteries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // New battery form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [manufacturer, setManufacturer] = useState('MIT Consortium');
  const [model, setModel] = useState('Pouch Cell');
  const [chemistry, setChemistry] = useState('LFP');
  const [capacity, setCapacity] = useState(1.1);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const res = await api.getBatteries(search);
      setBatteries(res.batteries);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, [search]);

  const handleAddBattery = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      await api.createBattery({
        id: newId,
        manufacturer,
        model,
        chemistry,
        nominal_capacity_ah: Number(capacity),
      });
      setNewId('');
      setShowAddForm(false);
      fetchFleet();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create battery record.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Battery Fleet</h1>
          <p className="text-zinc-400 text-xs mt-1">Audit tracked cells, capacity specifications, and database records</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#deff00] hover:bg-[#cbe800] text-black text-xs font-black py-3 px-5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#deff00]/15 uppercase tracking-wider font-mono cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Register New Cell
        </button>
      </div>

      {/* New Cell Form Box */}
      {showAddForm && (
        <form onSubmit={handleAddBattery} className="bg-[#0b0b10] p-6 rounded-2xl border border-graphite-border space-y-4 animate-fade-in max-w-xl shadow-2xl">
          <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wider pb-2 border-b border-graphite-border/50">
            Register Battery Cell Parameters
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Cell Serial / ID</label>
              <input
                type="text"
                placeholder="e.g. CS2_35"
                required
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Nominal Capacity (Ah)</label>
              <input
                type="number"
                step="0.01"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Manufacturer</label>
              <input
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Model</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">Chemistry</label>
            <select
              value={chemistry}
              onChange={(e) => setChemistry(e.target.value)}
              className="w-full bg-[#060608] border border-graphite-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
            >
              <option value="LFP">Lithium Iron Phosphate (LFP)</option>
              <option value="LCO">Lithium Cobalt Oxide (LCO)</option>
              <option value="NMC">Nickel Manganese Cobalt (NMC)</option>
              <option value="NCA">Nickel Cobalt Aluminum (NCA)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-transparent hover:bg-zinc-800 text-zinc-400 text-xs font-mono py-2 px-4 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="bg-[#deff00] hover:bg-[#cbe800] text-black text-xs font-black py-2 px-4 rounded-xl transition-all font-mono uppercase tracking-wider"
            >
              {formSubmitting ? 'Registering Cell…' : 'Register Cell'}
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-200 text-xs font-mono">
              {formError}
            </div>
          )}
        </form>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search fleet by battery serial ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0b0b10] border border-graphite-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#deff00] transition-colors font-mono"
        />
      </div>

      {/* Fleet Table */}
      <div className="bg-[#0b0b10] rounded-2xl border border-graphite-border overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-zinc-500 font-mono text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#deff00]" />
            Fetching fleet registry logs…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-graphite-border bg-[#060608] text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Battery Serial ID</th>
                  <th className="py-4 px-6">Specs</th>
                  <th className="py-4 px-6">Chemistry</th>
                  <th className="py-4 px-6 text-center">Prediction Logs</th>
                  <th className="py-4 px-6 text-center">On-Chain Anchors</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-border/50 text-xs">
                {batteries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono">
                      No tracked batteries found.
                    </td>
                  </tr>
                ) : (
                  batteries.map((b) => (
                    <tr key={b.id} className="hover:bg-[#121218] transition-all">
                      <td className="py-4 px-6 font-bold text-white font-mono">{b.id}</td>
                      <td className="py-4 px-6 font-mono text-zinc-400">
                        {b.manufacturer || 'Unknown'} - {b.model || 'Unknown'} ({b.nominal_capacity_ah || 1.1} Ah)
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#060608] text-zinc-300 font-mono text-[10px] border border-graphite-border">
                          {b.chemistry || 'LFP'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-[#deff00] font-bold">
                        {b.prediction_count}
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-violet-400 font-bold">
                        {b.chain_record_count}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/dashboard/fleet/${b.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#deff00] hover:underline font-semibold"
                        >
                          View Logs
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
