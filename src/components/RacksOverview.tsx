/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { LayoutGrid, AlertTriangle, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { RackSummary } from '../types';

interface RacksOverviewProps {
  rackSummaries: Record<string, RackSummary>;
  allRacks: string[];
  onSelectRack: (rackCode: string) => void;
}

export default function RacksOverview({ rackSummaries, allRacks, onSelectRack }: RacksOverviewProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'SAFE'>('ALL');

  // Compute stats for all racks and sort them by risk (highest danger + perlu STR count first)
  const sortedRacks = useMemo(() => {
    const list = allRacks.map(rack => {
      const summary = rackSummaries[rack] || {
        rackCode: rack,
        totalItems: 0,
        amanCount: 0,
        dangerCount: 0,
        perluStrCount: 0,
        items: [],
      };

      const issueCount = summary.dangerCount + summary.perluStrCount;
      const healthPercent = summary.totalItems > 0 
        ? Math.round((summary.amanCount / summary.totalItems) * 100) 
        : 100;

      return {
        ...summary,
        issueCount,
        healthPercent,
      };
    });

    // Filter by type
    let filtered = list;
    if (filterType === 'CRITICAL') {
      filtered = list.filter(r => r.issueCount > 0);
    } else if (filterType === 'SAFE') {
      filtered = list.filter(r => r.issueCount === 0);
    }

    // Sort by: Danger count DESC, then Perlu STR count DESC, then totalItems DESC
    return filtered.sort((a, b) => {
      if (b.dangerCount !== a.dangerCount) {
        return b.dangerCount - a.dangerCount;
      }
      if (b.perluStrCount !== a.perluStrCount) {
        return b.perluStrCount - a.perluStrCount;
      }
      return b.totalItems - a.totalItems;
    });
  }, [rackSummaries, allRacks, filterType]);

  // Aggregate stats across the whole spreadsheet
  const globalStats = useMemo(() => {
    let totalItems = 0;
    let totalAman = 0;
    let totalDanger = 0;
    let totalPerluStr = 0;

    allRacks.forEach(rack => {
      const s = rackSummaries[rack];
      if (s) {
        totalItems += s.totalItems;
        totalAman += s.amanCount;
        totalDanger += s.dangerCount;
        totalPerluStr += s.perluStrCount;
      }
    });

    const globalHealth = totalItems > 0 ? Math.round((totalAman / totalItems) * 100) : 100;

    return {
      totalItems,
      totalAman,
      totalDanger,
      totalPerluStr,
      globalHealth,
    };
  }, [rackSummaries, allRacks]);

  return (
    <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6" id="racks-overview-container">
      
      {/* Global Stock Health Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8 border-l-4 border-l-[#0f4372]" id="global-stats-card">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center mb-4 font-mono">
          <TrendingUp className="w-5 h-5 mr-1.5 text-[#0f4372]" />
          Kondisi Stok Lantai Informa (Keseluruhan)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          {/* Circular Health Meter */}
          <div className="flex flex-col items-center justify-center p-5 bg-gray-50 rounded-xl border border-gray-200 text-center col-span-1">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer circular indicator */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={globalStats.globalHealth > 80 ? '#83baa3' : globalStats.globalHealth > 50 ? '#f6b742' : '#e55541'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * globalStats.globalHealth) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute font-sans font-black text-2xl text-gray-900">
                {globalStats.globalHealth}%
              </div>
            </div>
            <span className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wider">Indeks Kesehatan</span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="col-span-1 md:col-span-3 grid grid-cols-3 gap-4">
            
            {/* Danger Stats */}
            <div className="bg-white border border-gray-200 border-l-4 border-l-[#e55541] p-4 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block font-mono">Total Danger</span>
              <span className="text-3xl font-black text-[#e55541] mt-1 block">{globalStats.totalDanger}</span>
              <span className="text-[10px] text-[#e55541] font-bold uppercase tracking-wider font-mono">SKU Kritis</span>
            </div>

            {/* Perlu STR Stats */}
            <div className="bg-white border border-gray-200 border-l-4 border-l-[#f6b742] p-4 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block font-mono">Total Perlu STR</span>
              <span className="text-3xl font-black text-[#f6b742] mt-1 block">{globalStats.totalPerluStr}</span>
              <span className="text-[10px] text-[#f6b742] font-bold uppercase tracking-wider font-mono">SKU Terjadwal</span>
            </div>

            {/* Aman Stats */}
            <div className="bg-white border border-gray-200 border-l-4 border-l-[#83baa3] p-4 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block font-mono">Total Aman</span>
              <span className="text-3xl font-black text-[#83baa3] mt-1 block">{globalStats.totalAman}</span>
              <span className="text-[10px] text-[#83baa3] font-bold uppercase tracking-wider font-mono">SKU Aman</span>
            </div>

          </div>
        </div>
      </div>

      {/* Racks List Section */}
      <div className="space-y-4" id="racks-list-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center">
            <LayoutGrid className="w-5 h-5 mr-2 text-[#0f4372]" />
            Daftar Seluruh Rak ({sortedRacks.length})
          </h2>

          {/* Dashboard Filters */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs" id="dashboard-rack-filters">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all duration-150 ${
                filterType === 'ALL' ? 'bg-white text-[#0f4372] shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Semua Rak
            </button>
            <button
              onClick={() => setFilterType('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1 ${
                filterType === 'CRITICAL' ? 'bg-white text-[#e55541] shadow-sm' : 'text-gray-500 hover:text-[#e55541]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-0.5" />
              <span>Butuh Tindakan ({allRacks.filter(r => (rackSummaries[r]?.dangerCount || 0) + (rackSummaries[r]?.perluStrCount || 0) > 0).length})</span>
            </button>
            <button
              onClick={() => setFilterType('SAFE')}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1 ${
                filterType === 'SAFE' ? 'bg-white text-[#83baa3] shadow-sm' : 'text-gray-500 hover:text-[#83baa3]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
              <span>Aman ({allRacks.filter(r => (rackSummaries[r]?.dangerCount || 0) + (rackSummaries[r]?.perluStrCount || 0) === 0).length})</span>
            </button>
          </div>
        </div>

        {/* Grid of Racks Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="racks-overview-grid">
          {sortedRacks.map(rack => {
            const hasDanger = rack.dangerCount > 0;
            const hasPerlu = rack.perluStrCount > 0;

            return (
              <div
                key={rack.rackCode}
                onClick={() => onSelectRack(rack.rackCode)}
                className={`bg-white rounded-2xl border-2 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                  hasDanger 
                    ? 'border-[#e55541]/40 border-l-4 border-l-[#e55541] hover:border-[#e55541]' 
                    : hasPerlu 
                      ? 'border-[#f6b742]/40 border-l-4 border-l-[#f6b742] hover:border-[#f6b742]' 
                      : 'border-gray-200 border-l-4 border-l-[#83baa3] hover:border-[#0f4372]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-gray-900 group-hover:text-[#0f4372] transition-colors duration-150">
                      Rak {rack.rackCode}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      hasDanger 
                        ? 'bg-red-100 text-[#e55541]' 
                        : hasPerlu 
                          ? 'bg-amber-100 text-[#f6b742]' 
                          : 'bg-green-100 text-[#83baa3]'
                    }`}>
                      {rack.healthPercent}% Aman
                    </span>
                  </div>

                  {/* Health Bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4" title="Persentase Stok Aman">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        rack.healthPercent > 80 
                          ? 'bg-[#83baa3]' 
                          : rack.healthPercent > 50 
                            ? 'bg-[#f6b742]' 
                            : 'bg-[#e55541]'
                      }`}
                      style={{ width: `${rack.healthPercent}%` }}
                    />
                  </div>

                  {/* Issue Breakdown */}
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
                    <div className="bg-gray-50 py-2 px-1 rounded-lg border border-gray-100">
                      <span className="text-gray-400 block text-[9px] font-bold uppercase">SKU</span>
                      <span className="font-bold text-gray-800 text-sm">{rack.totalItems}</span>
                    </div>
                    <div className={`py-2 px-1 rounded-lg border ${rack.dangerCount > 0 ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`${rack.dangerCount > 0 ? 'text-[#e55541] font-bold' : 'text-gray-400'} block text-[9px] uppercase`}>DGR</span>
                      <span className={`font-bold text-sm ${rack.dangerCount > 0 ? 'text-[#e55541]' : 'text-gray-700'}`}>{rack.dangerCount}</span>
                    </div>
                    <div className={`py-2 px-1 rounded-lg border ${rack.perluStrCount > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`${rack.perluStrCount > 0 ? 'text-[#f6b742] font-bold' : 'text-gray-400'} block text-[9px] uppercase`}>STR</span>
                      <span className={`font-bold text-sm ${rack.perluStrCount > 0 ? 'text-[#f6b742]' : 'text-gray-700'}`}>{rack.perluStrCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#0f4372] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>Periksa Detail SKU</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
