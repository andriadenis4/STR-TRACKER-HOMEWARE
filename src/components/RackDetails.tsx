/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, CheckCircle2, AlertTriangle, XCircle, Copy, Check, Filter, ExternalLink } from 'lucide-react';
import { RackSummary, SKUItem } from '../types';
import { getProductFromSKU } from '../utils';

interface RackDetailsProps {
  summary: RackSummary;
  onBack: () => void;
}

export default function RackDetails({ summary, onBack }: RackDetailsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DANGER' | 'PERLU STR' | 'AMAN'>('ALL');
  const [copiedType, setCopiedType] = useState<'danger' | 'perlu' | null>(null);

  // Filter items based on local search & active classification tab
  const filteredItems = useMemo(() => {
    return summary.items.filter(item => {
      const matchesSearch = item.sku.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const matchesFilter = activeFilter === 'ALL' || item.classification === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [summary.items, searchTerm, activeFilter]);

  // Copy comma-separated SKU codes helper
  const handleCopySKUs = (classification: 'DANGER' | 'PERLU STR', type: 'danger' | 'perlu') => {
    const skuList = summary.items
      .filter(item => item.classification === classification)
      .map(item => item.sku)
      .join(', ');

    if (!skuList) return;

    navigator.clipboard.writeText(skuList).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  // Get total list count of Danger/Perlu STR SKU
  const dangerSkus = useMemo(() => summary.items.filter(i => i.classification === 'DANGER'), [summary.items]);
  const perluStrSkus = useMemo(() => summary.items.filter(i => i.classification === 'PERLU STR'), [summary.items]);

  // Overall status evaluation
  const overallStatus = useMemo(() => {
    const danger = summary.dangerCount;
    const needStr = summary.perluStrCount;

    if (danger > 0) {
      return {
        variant: 'red',
        title: `Rak memerlukan tindakan kritis!`,
        message: `Terdapat ${danger} SKU berstatus DANGER dan ${needStr} SKU berstatus PERLU STR di rak ini yang membutuhkan tindakan Stock Transfer Order sesegera mungkin.`,
        icon: <XCircle className="w-6 h-6 text-informa-red shrink-0" />,
      };
    } else if (needStr > 0) {
      return {
        variant: 'orange',
        title: `Rak membutuhkan perhatian!`,
        message: `Ada ${needStr} SKU berstatus PERLU STR di rak ini. Silakan jadwalkan transfer stock untuk mencegah stok kosong atau menumpuk.`,
        icon: <AlertTriangle className="w-6 h-6 text-informa-orange shrink-0 animate-bounce" />,
      };
    } else {
      return {
        variant: 'green',
        title: `Semua SKU Aman!`,
        message: `Luar biasa! Seluruh ${summary.amanCount} SKU di rak ini dalam status AMAN. Tidak ada tindakan STR yang diperlukan saat ini.`,
        icon: <CheckCircle2 className="w-6 h-6 text-informa-green shrink-0" />,
      };
    }
  }, [summary]);

  return (
    <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6" id="rack-details-container">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="group inline-flex items-center space-x-2 text-sm font-semibold text-gray-500 hover:text-informa-azure mb-6 transition-all duration-150 focus:outline-none"
        id="back-to-search-btn"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Kembali ke Pencarian</span>
      </button>

      {/* Title & Metadata Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5 mb-6" id="details-header">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans">
              Rak {summary.rackCode}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              summary.dangerCount > 0 
                ? 'bg-red-100 text-informa-red border border-red-200' 
                : summary.perluStrCount > 0 
                  ? 'bg-amber-100 text-informa-orange border border-amber-200' 
                  : 'bg-green-100 text-informa-green border border-green-200'
            }`}>
              {summary.dangerCount > 0 ? 'Kritis' : summary.perluStrCount > 0 ? 'Perlu STR' : 'Aman'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Menampilkan daftar artikel (SKU) beserta klasifikasi tindakan transfer.
          </p>
        </div>

        {/* Copy Fast Utilities */}
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0" id="quick-copy-utilities">
          {dangerSkus.length > 0 && (
            <button
              onClick={() => handleCopySKUs('DANGER', 'danger')}
              className="inline-flex items-center px-4 py-2 text-xs font-bold bg-red-50 hover:bg-red-100 text-informa-red border border-red-200 rounded-lg shadow-sm transition-all duration-150 focus:outline-none"
              title="Salin semua SKU dengan status Danger untuk di-input langsung"
            >
              {copiedType === 'danger' ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Berhasil Disalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Salin {dangerSkus.length} SKU Danger
                </>
              )}
            </button>
          )}

          {perluStrSkus.length > 0 && (
            <button
              onClick={() => handleCopySKUs('PERLU STR', 'perlu')}
              className="inline-flex items-center px-4 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-informa-orange border border-amber-200 rounded-lg shadow-sm transition-all duration-150 focus:outline-none"
              title="Salin semua SKU yang Perlu STR untuk mempermudah transfer"
            >
              {copiedType === 'perlu' ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Berhasil Disalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Salin {perluStrSkus.length} SKU Perlu STR
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="details-bento-grid">
        {/* Card Total SKU */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 border-l-4 border-l-[#0f4372] shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Artikel (SKU)</p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-4xl font-black text-gray-900">{summary.totalItems}</span>
            <span className="text-xs text-gray-500 font-medium ml-1">sku</span>
          </div>
        </div>

        {/* Card Danger */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 border-l-4 border-l-[#e55541] shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Danger Class</p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-4xl font-black text-[#e55541]">{summary.dangerCount}</span>
            <span className="text-xs text-gray-500 font-medium ml-1">sku</span>
          </div>
        </div>

        {/* Card Perlu STR */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 border-l-4 border-l-[#f6b742] shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Perlu STR</p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-4xl font-black text-[#f6b742]">{summary.perluStrCount}</span>
            <span className="text-xs text-gray-500 font-medium ml-1">sku</span>
          </div>
        </div>

        {/* Card Aman */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 border-l-4 border-l-[#83baa3] shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Aman</p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-4xl font-black text-[#83baa3]">{summary.amanCount}</span>
            <span className="text-xs text-gray-500 font-medium ml-1">sku</span>
          </div>
        </div>
      </div>

      {/* Action Banner */}
      <div className={`p-5 rounded-2xl border flex items-start space-x-4 mb-8 ${
        overallStatus.variant === 'red' 
          ? 'bg-red-50/40 border-red-200 text-red-950' 
          : overallStatus.variant === 'orange' 
            ? 'bg-amber-50/40 border-amber-200 text-amber-950' 
            : 'bg-green-50/40 border-green-200 text-green-950'
      }`} id="rack-action-banner">
        {overallStatus.icon}
        <div>
          <h3 className="font-bold text-base">{overallStatus.title}</h3>
          <p className="text-sm mt-1 opacity-90 leading-relaxed">{overallStatus.message}</p>
        </div>
      </div>

      {/* Search & Filter Bar Inside Selected Rack */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8" id="rack-items-card">
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Inner Search SKU */}
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0f4372] focus:border-[#0f4372] focus:bg-white transition-all duration-150"
            />
          </div>

          {/* Classification Filtering Tabs */}
          <div className="flex flex-wrap gap-1.5" id="classification-filter-tabs">
            {/* Filter ALL */}
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                activeFilter === 'ALL'
                  ? 'bg-[#0f4372] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({summary.totalItems})
            </button>

            {/* Filter DANGER */}
            <button
              onClick={() => setActiveFilter('DANGER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1 ${
                activeFilter === 'DANGER'
                  ? 'bg-[#e55541] text-white'
                  : 'bg-red-50 text-[#e55541] hover:bg-red-100'
              }`}
            >
              <span>Danger ({summary.dangerCount})</span>
            </button>

            {/* Filter PERLU STR */}
            <button
              onClick={() => setActiveFilter('PERLU STR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1 ${
                activeFilter === 'PERLU STR'
                  ? 'bg-[#f6b742] text-white'
                  : 'bg-amber-50 text-[#f6b742] hover:bg-amber-100'
              }`}
            >
              <span>Perlu STR ({summary.perluStrCount})</span>
            </button>

            {/* Filter AMAN */}
            <button
              onClick={() => setActiveFilter('AMAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center space-x-1 ${
                activeFilter === 'AMAN'
                  ? 'bg-[#83baa3] text-white'
                  : 'bg-green-50 text-[#83baa3] hover:bg-green-100'
              }`}
            >
              <span>Aman ({summary.amanCount})</span>
            </button>
          </div>
        </div>

        {/* SKU Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm" id="sku-data-table">
            <thead className="bg-gray-50 font-bold text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-16 text-center border-b border-gray-200">No</th>
                <th className="px-6 py-4 border-b border-gray-200 w-24">Foto</th>
                <th className="px-6 py-4 border-b border-gray-200 w-44">Kode SKU (Artikel)</th>
                <th className="px-6 py-4 border-b border-gray-200">Nama Barang</th>
                <th className="px-6 py-4 text-center border-b border-gray-200 w-24">Qty SKU</th>
                <th className="px-6 py-4 text-center border-b border-gray-200 w-36">Klasifikasi Status</th>
                <th className="px-6 py-4 text-right border-b border-gray-200 w-56">Rekomendasi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  let badgeStyle = 'bg-green-100 text-[#83baa3]';
                  let recommendation = 'Tidak ada tindakan (Stok Stabil)';

                  if (item.classification === 'DANGER') {
                    badgeStyle = 'bg-red-100 text-[#e55541]';
                    recommendation = 'Kritis! Lakukan STR Segera (Stok Minim)';
                  } else if (item.classification === 'PERLU STR') {
                    badgeStyle = 'bg-orange-100 text-[#f6b742]';
                    recommendation = 'Jadwalkan STR (Stok Menipis)';
                  }

                  const productInfo = getProductFromSKU(item.sku);
                  const ruparupaUrl = `https://www.ruparupa.com/search?q=${item.sku}`;

                  return (
                    <tr 
                      key={item.sku + index} 
                      className={`hover:bg-gray-50/50 transition-colors duration-150 ${
                        item.classification === 'DANGER' ? 'bg-red-50/5' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-center text-xs font-mono text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <a 
                          href={ruparupaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="block relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group/image"
                          title="Buka di ruparupa.com"
                        >
                          <img 
                            src={productInfo.image} 
                            alt={productInfo.name} 
                            className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 flex items-center justify-center transition-opacity duration-200">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <span className="font-mono text-sm font-bold tracking-wider text-gray-900">
                            {item.sku}
                          </span>
                          <a 
                            href={ruparupaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            className="inline-flex items-center text-[10px] font-bold text-[#0f4372] hover:text-[#0a3255] hover:underline"
                            title="Buka pencarian produk di ruparupa.com"
                          >
                            <span>ruparupa.com ↗</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm">{productInfo.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">{productInfo.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-lg bg-gray-100 text-gray-800">
                          {item.qty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
                          {item.classification}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs">
                        <span className={`font-semibold ${
                          item.classification === 'DANGER' 
                            ? 'text-[#e55541]' 
                            : item.classification === 'PERLU STR' 
                              ? 'text-[#f6b742]' 
                              : 'text-gray-400'
                        }`}>
                          {recommendation}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Tidak ada SKU yang cocok dengan filter atau kata kunci pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
