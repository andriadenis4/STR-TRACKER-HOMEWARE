/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import { RackSummary } from '../types';
import { getGreetingText } from '../utils';

interface RackSearchProps {
  rackSummaries: Record<string, RackSummary>;
  allRacks: string[];
  onSelectRack: (rackCode: string) => void;
}

export default function RackSearch({ rackSummaries, allRacks, onSelectRack }: RackSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [greeting, setGreeting] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(getGreetingText());
    // Update greeting every minute just in case the period transitions while open
    const interval = setInterval(() => {
      setGreeting(getGreetingText());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = inputValue.trim().toUpperCase();
    
    if (!cleanValue) {
      setError('Silakan masukkan Kode Rak terlebih dahulu.');
      return;
    }

    if (allRacks.includes(cleanValue)) {
      setError(null);
      onSelectRack(cleanValue);
    } else {
      setError(`Rak "${cleanValue}" tidak ditemukan. Silakan masukkan kode rak yang valid.`);
    }
  };

  const currentHour = new Date().getHours();
  let periodText = 'pagi';
  if (currentHour >= 4 && currentHour < 11) {
    periodText = 'pagi';
  } else if (currentHour >= 11 && currentHour < 18) {
    periodText = 'siang';
  } else {
    periodText = 'malam';
  }

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6" id="rack-search-container">
      {/* Welcome Banner */}
      <div className="text-left mb-10" id="welcome-banner">
        <h2 className="text-3xl sm:text-4xl font-light text-slate-700 leading-tight">
          Halo selamat <span className="font-bold text-[#0f4372]">{periodText}</span> <span className="font-bold text-[#0f4372]">Pak Yuri</span> dan <span className="font-bold text-[#0f4372]">Pak Ongky</span>. 
          <br/>Mau cek Rak yang mana hari ini?
        </h2>
        <p className="mt-3 text-sm text-gray-400 font-mono uppercase tracking-wider">
          STR Operations & Verification Portal
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-10 shadow-sm transition-all duration-300" id="search-box-card">
        <form onSubmit={handleSubmit} className="relative" id="search-form">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Masukkan Kode Rak (contoh: SW01, DN01)..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#f6b742] focus:ring-0 outline-none transition-all text-lg shadow-sm placeholder:text-gray-300 bg-white"
                id="rack-input-field"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0f4372] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#0a3255] transition-colors shadow-md flex items-center justify-center gap-2"
              id="search-submit-btn"
            >
              SUBMIT DATA
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center text-sm text-[#e55541]" id="search-error-msg">
              <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
