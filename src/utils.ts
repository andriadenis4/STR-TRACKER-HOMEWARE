/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SKUItem, RackSummary, GreetingType } from './types';

export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1eHRf5foF3bDqApK3EKHHI7hSDSJu4gFGUPT4kHNle2M/export?format=csv&gid=0';

/**
 * Splits a CSV line by commas while correctly handling double-quoted fields
 */
export function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses a CSV string into a list of SKU items.
 * Handles rack-code inheritance (where rackCode is blank and inherits from the previous non-blank row).
 * Specifically maps Column C (NAME), Column D (TOTAL QTY), and Column E (KLASIFIKASI).
 */
export function parseCSV(csvText: string): SKUItem[] {
  const lines = csvText.split(/\r?\n/);
  const items: SKUItem[] = [];
  let currentRackCode = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCSVLine(line);
    // Expecting at least: KODE RAK, ISI SKU RAK, NAME, TOTAL QTY SKU, KLASIFIKASI
    if (cols.length < 5) continue;

    const rawRackCode = cols[0].trim();
    const rawSku = cols[1].trim();
    const rawName = cols[2].trim();
    const rawQtyStr = cols[3].trim();
    const rawClassification = cols[4].trim().toUpperCase();

    // Skip empty sku lines
    if (!rawSku) continue;

    // Skip "NOT FOUND" items
    if (rawName.toUpperCase() === 'NOT FOUND' || rawClassification === 'NOT FOUND') {
      continue;
    }

    if (rawRackCode) {
      currentRackCode = rawRackCode;
    }

    const qty = parseInt(rawQtyStr, 10) || 0;

    // Normalise classification to expected values
    let classification: 'AMAN' | 'DANGER' | 'PERLU STR' | string = 'AMAN';
    if (rawClassification.includes('DANGER')) {
      classification = 'DANGER';
    } else if (rawClassification.includes('STR') || rawClassification.includes('PERLU')) {
      classification = 'PERLU STR';
    } else {
      classification = 'AMAN';
    }

    items.push({
      rackCode: currentRackCode,
      sku: rawSku,
      name: rawName,
      qty,
      classification,
    });
  }

  return items;
}

/**
 * Groups an array of SKU items by rack code to create summaries.
 */
export function groupItemsByRack(items: SKUItem[]): Record<string, RackSummary> {
  const summaries: Record<string, RackSummary> = {};

  for (const item of items) {
    const rack = item.rackCode || 'UNKNOWN';
    if (!summaries[rack]) {
      summaries[rack] = {
        rackCode: rack,
        totalItems: 0,
        amanCount: 0,
        dangerCount: 0,
        perluStrCount: 0,
        items: [],
      };
    }

    const summary = summaries[rack];
    summary.items.push(item);
    summary.totalItems += 1;

    if (item.classification === 'AMAN') {
      summary.amanCount += 1;
    } else if (item.classification === 'DANGER') {
      summary.dangerCount += 1;
    } else if (item.classification === 'PERLU STR') {
      summary.perluStrCount += 1;
    }
  }

  return summaries;
}

/**
 * Returns the Indonesian greeting period ('pagi', 'siang', or 'malam') based on local hours.
 */
export function getGreetingType(hour: number): GreetingType {
  if (hour >= 4 && hour < 11) {
    return 'pagi';
  } else if (hour >= 11 && hour < 18) {
    return 'siang';
  } else {
    return 'malam';
  }
}

/**
 * Returns a full greeting string based on the current hour with the exact requested spelling,
 * capitalization, and names.
 */
export function getGreetingText(currentDate: Date = new Date()): string {
  const hour = currentDate.getHours();
  const rawPeriod = getGreetingType(hour);
  const period = rawPeriod.charAt(0).toUpperCase() + rawPeriod.slice(1);
  return `Halo Selamat ${period} Pak Yuri dan Pak Onky. Mau cek rak yang mana hari ini?`;
}

/**
 * Returns deterministic product details (name, image, category) for a given SKU code.
 * Matches keywords dynamically from the product name to display highly relevant product photos.
 */
export function getProductFromSKU(sku: string, customName?: string): { name: string; image: string; category: string } {
  // Pre-defined database of real Informa Appetite homeware products
  const fixedProducts: Record<string, { name: string; image: string; category: string }> = {
    '10657070': {
      name: 'Appetite Lennox Mangkuk Saji Porcelain Square 29 cm - Putih/Gold',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1574483767531-dfc6a656ac9f?w=400&auto=format&fit=crop&q=80'
    },
    '10657071': {
      name: 'Appetite Lennox Piring Saji Porcelain Oval 32 cm - Putih/Gold',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&auto=format&fit=crop&q=80'
    },
    '10657072': {
      name: 'Appetite Lennox Set Cangkir & Tatakan Porcelain 12 Pcs - Putih/Gold',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=400&auto=format&fit=crop&q=80'
    },
    '10657073': {
      name: 'Appetite Lennox Teko Teh Porcelain 1.2 Ltr - Putih/Gold',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80'
    },
    '10657077': {
      name: 'Appetite Lennox Wadah Saji Prasmanan Porcelain - Putih/Gold',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80'
    },
    '10657068': {
      name: 'Appetite Lennox Mangkuk Sup Porcelain 15 cm - Putih/Gold',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&auto=format&fit=crop&q=80'
    },
    '10667074': {
      name: 'Appetite Lennox Mangkuk Salad Porcelain - Putih/Gold',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80'
    },
    '10675291': {
      name: 'Appetite Delicia Set Piring Makan Keramik 4 Pcs - Hijau Sage',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1589307004173-0943f07a4a85?w=400&auto=format&fit=crop&q=80'
    },
    '10675289': {
      name: 'Appetite Delicia Mangkuk Saji Keramik - Hijau Sage',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&auto=format&fit=crop&q=80'
    },
    '10675292': {
      name: 'Appetite Delicia Gelas Mug Keramik 350ml - Hijau Sage',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=400&auto=format&fit=crop&q=80'
    },
    '10675288': {
      name: 'Appetite Delicia Set Perlengkapan Minum Teh - Hijau Sage',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cdd9?w=400&auto=format&fit=crop&q=80'
    },
    '10675290': {
      name: 'Appetite Delicia Wadah Saji Oval - Hijau Sage',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&auto=format&fit=crop&q=80'
    },
    '10445960': {
      name: 'Appetite Gourmet Wajan Penggorengan Teflon Non-Stick 26cm',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80'
    },
    '10445959': {
      name: 'Appetite Gourmet Panci Susu Stainless Steel 18cm',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80'
    },
    '10445961': {
      name: 'Appetite Gourmet Set Pisau Dapur Blok 5 Pcs - Hitam',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&auto=format&fit=crop&q=80'
    },
    '10445962': {
      name: 'Appetite Gourmet Spatula Silikon Tahan Panas - Merah',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=400&auto=format&fit=crop&q=80'
    },
    '10606309': {
      name: 'Appetite Vetro Gelas Kaca Double Wall 250ml',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80'
    },
    '10606305': {
      name: 'Appetite Vetro Teko Air Kaca Borosilikat 1.5 Ltr',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80'
    },
    '10606307': {
      name: 'Appetite Vetro Set Gelas Kaca Wine 4 Pcs',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop&q=80'
    },
    '10593213': {
      name: 'Appetite Amara Set Alat Makan Sendok & Garpu Stainless Steel 24 Pcs',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1543510473-ac2c35329a28?w=400&auto=format&fit=crop&q=80'
    },
    '10556192': {
      name: 'Appetite Classy Wadah Bumbu Dapur Keramik Dengan Rak Kayu',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1533512900305-66c3021af93b?w=400&auto=format&fit=crop&q=80'
    },
    '10556193': {
      name: 'Appetite Classy Botol Minyak & Cuka Kaca 500ml',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80'
    },
    '10642406': {
      name: 'Appetite Bloom Mangkuk Saji Melamin Motif Bunga 9 Inci',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1574483767531-dfc6a656ac9f?w=400&auto=format&fit=crop&q=80'
    },
    '10555573': {
      name: 'Appetite Organise Rak Pengering Piring Plastik Wash & Dry',
      category: 'Kitchen & Dining',
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&auto=format&fit=crop&q=80'
    },
  };

  // 1. Resolve product name
  let resolvedName = '';
  if (customName && customName.trim()) {
    resolvedName = customName.trim();
  } else if (fixedProducts[sku]) {
    resolvedName = fixedProducts[sku].name;
  } else {
    // Generate a realistic fallback name if none is provided
    const typesFallback = [
      { type: 'Mangkuk Saji Keramik' },
      { type: 'Piring Makan Porcelain' },
      { type: 'Gelas Kaca Double Wall' },
      { type: 'Cangkir Kopi & Saucer' },
      { type: 'Teko Teh Keramik' },
      { type: 'Wajan Frying Pan' },
      { type: 'Set Sendok & Garpu' },
      { type: 'Panci Saucepan Stainless' },
      { type: 'Wadah Saji Prasmanan' },
    ];

    const brandsFallback = ['Appetite', 'Informa', 'Appetite Delicia', 'Appetite Gourmet', 'Appetite Vetro'];
    const variantsFallback = ['Nordic', 'Classic', 'Elegant', 'Minimalis', 'Aesthetic', 'Modern', 'Premium'];
    const colorsFallback = ['Putih', 'Abu-Abu', 'Sage Green', 'Hitam', 'Biru', 'Gold Accent', 'Clear Kaca'];

    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
      hash = sku.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const t = typesFallback[hash % typesFallback.length];
    const b = brandsFallback[(hash >> 2) % brandsFallback.length];
    const v = variantsFallback[(hash >> 4) % variantsFallback.length];
    const c = colorsFallback[(hash >> 6) % colorsFallback.length];

    resolvedName = `${b} ${v} ${t.type} - ${c}`;
  }

  // 2. Map image beautifully based on keywords in the product name
  let resolvedImage = '';
  const upperName = resolvedName.toUpperCase();

  if (upperName.includes('PLATE') || upperName.includes('PIRING')) {
    resolvedImage = 'https://images.unsplash.com/photo-1535850456172-1a2a07b24f5d?w=400&auto=format&fit=crop&q=80'; // Stacked elegant plates
  } else if (upperName.includes('BOWL') || upperName.includes('MANGKUK') || upperName.includes('MANGKOK')) {
    resolvedImage = 'https://images.unsplash.com/photo-1574483767531-dfc6a656ac9f?w=400&auto=format&fit=crop&q=80'; // Beautiful ceramic bowl
  } else if (upperName.includes('CASSEROLE') || upperName.includes('SAJI') || upperName.includes('WADAH')) {
    resolvedImage = 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80'; // Ceramic cookware / casserole
  } else if (upperName.includes('PAN') || upperName.includes('FRYING') || upperName.includes('WAJAN') || upperName.includes('COOKWARE') || upperName.includes('PANCI')) {
    resolvedImage = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80'; // Frying pan
  } else if (upperName.includes('CUP') || upperName.includes('MUG') || upperName.includes('CANGKIR') || upperName.includes('SAUCER') || upperName.includes('TATAKAN')) {
    resolvedImage = 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=400&auto=format&fit=crop&q=80'; // Beautiful mug
  } else if (upperName.includes('TEA') || upperName.includes('TEKO') || upperName.includes('INFUSER') || upperName.includes('COFFEE')) {
    resolvedImage = 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80'; // Teapot
  } else if (upperName.includes('GLASS') || upperName.includes('TUMBLER') || upperName.includes('GELAS') || upperName.includes('VETRO')) {
    resolvedImage = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80'; // Elegant glass
  } else if (upperName.includes('SPOON') || upperName.includes('SENDOK') || upperName.includes('GARPU') || upperName.includes('FORK') || upperName.includes('KNIFE') || upperName.includes('PISAU') || upperName.includes('CUTLERY')) {
    resolvedImage = 'https://images.unsplash.com/photo-1543510473-ac2c35329a28?w=400&auto=format&fit=crop&q=80'; // Silverware cutlery
  } else if (upperName.includes('SET') || upperName.includes('TRAY')) {
    resolvedImage = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80'; // Serving platter set
  } else {
    // If there is a fixed product default image, use it, otherwise fall back to elegant kitchenware setting
    resolvedImage = fixedProducts[sku]?.image || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80';
  }

  return {
    name: resolvedName,
    image: resolvedImage,
    category: 'Kitchen & Dining',
  };
}
