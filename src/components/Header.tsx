/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, CloudLightning, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  isSyncing: boolean;
  onSync: () => void;
  syncSource: 'live' | 'fallback';
  lastSynced: Date | null;
}

export default function Header({ isSyncing, onSync, syncSource, lastSynced }: HeaderProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm" id="app-header">
      {/* Top Branding Bar */}
      <nav className="h-2 w-full flex">
        <div className="flex-1 bg-[#0f4372]"></div>
        <div className="flex-1 bg-[#f6b742]"></div>
        <div className="flex-1 bg-[#e55541]"></div>
        <div className="flex-1 bg-[#83baa3]"></div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-12 py-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Logo & Branding */}
          <div>
            <h1 className="text-[#0f4372] text-xl sm:text-2xl font-black tracking-tighter flex flex-wrap items-center gap-x-1.5 leading-tight">
              INFORMA <span className="text-[#f6b742] font-black">ALAM SUTERA</span> <span className="font-light text-gray-400">HOMEWARE STR TRACKER</span>
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-mono">Operations Dashboard v2.4</p>
          </div>

          {/* Sync & Time Controls */}
          <div className="flex items-center space-x-4 self-stretch sm:self-auto justify-between sm:justify-end">
            
            {/* Sync Status Badge */}
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-xs">
              {syncSource === 'live' ? (
                <span className="flex items-center text-informa-green font-semibold">
                  <Database className="w-3.5 h-3.5 mr-1" />
                  Live Sync Active
                </span>
              ) : (
                <span className="flex items-center text-amber-600 font-semibold" title="Menggunakan data offline cadangan karena hambatan CORS atau jaringan">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                  Offline Mode
                </span>
              )}
              
              <span className="text-gray-300">|</span>
              
              <span className="text-gray-500 font-mono text-[10px]">
                {lastSynced ? `Sync: ${lastSynced.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Belum sync'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Sync Button */}
              <button
                onClick={onSync}
                disabled={isSyncing}
                className={`p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-informa-azure hover:bg-gray-50 hover:border-informa-azure/30 transition-all duration-200 focus:outline-none flex items-center justify-center relative ${isSyncing ? 'cursor-not-allowed text-gray-300' : ''}`}
                title="Sinkronisasi Ulang Data Google Sheets"
                id="sync-button"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#0f4372]' : 'text-gray-600'}`} />
              </button>

              {/* Local Clock */}
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-gray-700">
                <span className="w-2 h-2 rounded-full bg-[#83baa3] animate-pulse"></span>
                <span className="font-mono text-xs font-bold tracking-wider">{time}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
