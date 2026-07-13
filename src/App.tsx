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
import { 
  parseCSV, 
  parseInvenLookup, 
  groupItemsByRack, 
  SHEET_RACKS_WEB_URL, 
  SHEET_RACKS_EXPORT_URL, 
  SHEET_INVEN_WEB_URL, 
  SHEET_INVEN_EXPORT_URL 
} from './utils';
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

    let lookupDict: Record<string, string> = {};

    // 1. Fetch the lookup names sheet (INVEN sheet)
    try {
      let invenResponse = await fetch(SHEET_INVEN_WEB_URL);
      if (!invenResponse.ok) {
        invenResponse = await fetch(SHEET_INVEN_EXPORT_URL);
      }
      if (invenResponse.ok) {
        const invenCsvText = await invenResponse.text();
        lookupDict = parseInvenLookup(invenCsvText);
        console.log(`Successfully loaded ${Object.keys(lookupDict).length} SKU names from lookup list.`);
      }
    } catch (err: any) {
      console.warn('Gagal memuat lookup nama produk dari Google Sheet:', err.message);
    }

    // 2. Fetch the primary rack layout sheet (gid=0)
    try {
      let racksResponse = await fetch(SHEET_RACKS_WEB_URL);
      if (!racksResponse.ok) {
        racksResponse = await fetch(SHEET_RACKS_EXPORT_URL);
      }

      if (!racksResponse.ok) {
        throw new Error(`HTTP ${racksResponse.status}`);
      }

      const racksCsvText = await racksResponse.text();
      if (racksCsvText.trim().startsWith('<!DOCTYPE html>')) {
        throw new Error('Google Sheets mengembalikan halaman login. Pastikan lembar kerja dipublikasikan ke web (Entire Document / Seluruh Dokumen).');
      }

      const parsed = parseCSV(racksCsvText, lookupDict);

      if (parsed.length > 0) {
        setItems(parsed);
        setSyncSource('live');
        setLastSynced(new Date());
        setSyncError(null);
      } else {
        throw new Error('Data rak kosong atau tidak ada SKU valid yang cocok.');
      }
    } catch (err: any) {
      console.warn('Sync gagal. Menggunakan data offline cadangan:', err.message);
      
      let errMsg = 'Koneksi Google Sheets dibatasi atau file belum dipublikasikan ke web.';
      if (err.message && err.message.includes('login')) {
        errMsg = 'Harap publikasikan Google Sheets Anda sebagai "Entire Document" di menu File -> Share -> Publish to Web agar data Rack & Nama Produk terbaca live di Vercel.';
      }
      setSyncError(errMsg);
      
      if (items.length === 0 || syncSource === 'fallback') {
        setItems(FALLBACK_SKU_ITEMS);
        setSyncSource('fallback');
        setLastSynced(new Date());
      }
    } finally {
      setIsSyncing(false);
    }
  }, [items.length, syncSource]);

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
