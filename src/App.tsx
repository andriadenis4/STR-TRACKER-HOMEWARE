/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import RackSearch from './components/RackSearch';
import RackDetails from './components/RackDetails';
import RacksOverview from './components/RacksOverview';
import { SKUItem, RackSummary } from './types';
import { parseCSV, groupItemsByRack, SHEET_CSV_URL } from './utils';
import { FALLBACK_SKU_ITEMS } from './fallbackData';
import { AlertCircle, HelpCircle, FileText, CheckCircle, Smartphone } from 'lucide-react';

export default function App() {
  // Primary datasets
  const [items, setItems] = useState<SKUItem[]>(FALLBACK_SKU_ITEMS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSource, setSyncSource] = useState<'live' | 'fallback'>('fallback');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Layout navigation state
  const [selectedRackCode, setSelectedRackCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'overview'>('search');

  // Load live data from Google Sheet on start
  const handleSync = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setIsSyncing(true);
    }
    setSyncError(null);

    try {
      const response = await fetch(SHEET_CSV_URL);
      if (!response.ok) {
        throw new Error(`Gagal mengunduh file (HTTP ${response.status})`);
      }
      const csvText = await response.text();
      const parsed = parseCSV(csvText);

      if (parsed.length > 0) {
        setItems(parsed);
        setSyncSource('live');
        setLastSynced(new Date());
        setSyncError(null);
      } else {
        throw new Error('Data CSV kosong atau tidak valid.');
      }
    } catch (err: any) {
      console.warn('Sync gagal. Menggunakan data offline cadangan:', err.message);
      setSyncError('Koneksi Google Sheets dibatasi oleh CORS/jaringan. Menggunakan data lokal (offline).');
      
      // Ensure we are utilizing fallback data if nothing is set
      if (items.length === 0) {
        setItems(FALLBACK_SKU_ITEMS);
        setSyncSource('fallback');
        setLastSynced(new Date());
      }
    } finally {
      setIsSyncing(false);
    }
  }, [items.length]);

  // Sync silently once on startup
  useEffect(() => {
    handleSync(true);
  }, []);

  // Compute summary grouping
  const rackSummaries = useMemo(() => {
    return groupItemsByRack(items);
  }, [items]);

  // Extract sorted unique racks
  const allRacks = useMemo(() => {
    return Object.keys(rackSummaries).sort((a, b) => {
      // Natural sort for alphanumeric racks
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [rackSummaries]);

  // Selected Rack summary
  const selectedRackSummary = useMemo(() => {
    if (!selectedRackCode) return null;
    return rackSummaries[selectedRackCode] || null;
  }, [selectedRackCode, rackSummaries]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans selection:bg-informa-azure/10 selection:text-informa-azure">
      
      {/* App Header */}
      <Header 
        isSyncing={isSyncing} 
        onSync={() => handleSync(false)} 
        syncSource={syncSource} 
        lastSynced={lastSynced} 
      />

      {/* Main Content Area */}
      <main className="flex-grow pb-16">
        
        {/* Sync Warn/Success Banner */}
        {syncError && (
          <div className="bg-amber-50 border-b border-amber-100 text-amber-800 text-xs py-2 px-4 text-center flex items-center justify-center space-x-1.5" id="sync-warning-banner">
            <AlertCircle className="w-3.5 h-3.5 text-informa-orange" />
            <span>{syncError}</span>
            <button 
              onClick={() => handleSync(false)} 
              className="underline font-bold hover:text-amber-950 ml-1 focus:outline-none"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Selected Rack Detail View */}
        {selectedRackSummary ? (
          <RackDetails 
            summary={selectedRackSummary} 
            onBack={() => setSelectedRackCode(null)} 
          />
        ) : (
          /* Main Tabbed Landing Screen */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            
            {/* Tab Controller */}
            <div className="flex justify-center mb-8" id="main-tab-bar">
              <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'search'
                      ? 'bg-[#0f4372] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  id="tab-search-btn"
                >
                  Cek Rak Tunggal
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-[#0f4372] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  id="tab-overview-btn"
                >
                  Dashboard Seluruh Rak
                </button>
              </div>
            </div>

            {/* Render Tab Content */}
            {activeTab === 'search' ? (
              <RackSearch 
                rackSummaries={rackSummaries} 
                allRacks={allRacks} 
                onSelectRack={setSelectedRackCode} 
              />
            ) : (
              <RacksOverview 
                rackSummaries={rackSummaries} 
                allRacks={allRacks} 
                onSelectRack={setSelectedRackCode} 
              />
            )}

          </div>
        )}

      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-white border-t border-gray-200 py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400 font-mono">
            &copy; {new Date().getFullYear()} INFORMA ALAM SUTERA HOMEWARE STR TRACKER. Terhubung dengan Google Sheets.
          </p>
          <div className="flex justify-center space-x-6 mt-3 text-xs text-gray-500 font-bold uppercase tracking-wider font-mono">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0f4372] mr-1.5"></span>
              Dark Azure
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f6b742] mr-1.5"></span>
              Orange
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e55541] mr-1.5"></span>
              Red
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#83baa3] mr-1.5"></span>
              Grey Green
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
