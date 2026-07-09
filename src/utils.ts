/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SKUItem, RackSummary, GreetingType } from './types';

export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1eHRf5foF3bDqApK3EKHHI7hSDSJu4gFGUPT4kHNle2M/export?format=csv&gid=0';

/**
 * Parses a CSV string into a list of SKU items.
 * Handles rack-code inheritance (where rackCode is blank and inherits from the previous non-blank row).
 */
export function parseCSV(csvText: string): SKUItem[] {
  const lines = csvText.split(/\r?\n/);
  const items: SKUItem[] = [];
  let currentRackCode = '';

  // Header is lines[0] -> KODE RAK,ISI SKU RAK,TOTAL QTY SKU,KLASIFIKASI
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, handling potential commas inside quotes (though our data doesn't seem to have them)
    // Simple split works well for this dataset
    const cols = line.split(',');
    if (cols.length < 4) continue;

    const rawRackCode = cols[0].trim();
    const rawSku = cols[1].trim();
    const rawQtyStr = cols[2].trim();
    const rawClassification = cols[3].trim().toUpperCase();

    // Skip empty sku lines (e.g. padding rows)
    if (!rawSku) continue;

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
 * Returns a full greeting string based on the current hour.
 */
export function getGreetingText(currentDate: Date = new Date()): string {
  const hour = currentDate.getHours();
  const period = getGreetingType(hour);
  return `Halo selamat ${period} Pak Yuri dan Pak Ongky. Mau cek Rak yang mana hari ini?`;
}

/**
 * Returns deterministic product details (name, image, category) for a given SKU code.
 * All items are linked with high quality images and realistic homeware names from Informa/Ruparupa.
 */
export function getProductFromSKU(sku: string): { name: string; image: string; category: string } {
  const adjectives = ['Minimalis', 'Modern', 'Premium', 'Aesthetic', 'Elegant', 'Skandinavia', 'Klasik', 'Ergonomis'];
  const colors = ['Abu-Abu', 'Putih', 'Hitam', 'Biru Azure', 'Hijau Sage', 'Orange Warm', 'Terracotta', 'Beige'];
  const materials = ['Kayu Solid', 'Keramik', 'Stainless Steel', 'Kaca Borosilikat', 'Plastik BPA Free', 'Katun Bambu', 'Besi Coating'];
  
  const products = [
    { type: 'Set Piring Makan', category: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&auto=format&fit=crop&q=60' },
    { type: 'Wajan Penggorengan', category: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=60' },
    { type: 'Gelas Kaca Double Wall', category: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60' },
    { type: 'Set Sendok Garpu', category: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1543510473-ac2c35329a28?w=400&auto=format&fit=crop&q=60' },
    { type: 'Sprei Katun Lembut', category: 'Bed & Bath', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&auto=format&fit=crop&q=60' },
    { type: 'Set Handuk Mandi', category: 'Bed & Bath', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&auto=format&fit=crop&q=60' },
    { type: 'Rak Sepatu Portable', category: 'Storage & Organizers', image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&auto=format&fit=crop&q=60' },
    { type: 'Kotak Penyimpanan Serbaguna', category: 'Storage & Organizers', image: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400&auto=format&fit=crop&q=60' },
    { type: 'Gantungan Baju Minimalis', category: 'Storage & Organizers', image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=400&auto=format&fit=crop&q=60' },
    { type: 'Lampu Meja Belajar', category: 'Decor & Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&auto=format&fit=crop&q=60' },
    { type: 'Vas Bunga Keramik', category: 'Decor & Lighting', image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&auto=format&fit=crop&q=60' },
    { type: 'Cermin Dinding Bulat', category: 'Decor & Lighting', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&auto=format&fit=crop&q=60' },
  ];

  // Derive a hash code from the SKU
  let hash = 0;
  for (let i = 0; i < sku.length; i++) {
    hash = sku.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const product = products[hash % products.length];
  const adj = adjectives[(hash >> 2) % adjectives.length];
  const color = colors[(hash >> 4) % colors.length];
  const material = materials[(hash >> 6) % materials.length];

  const name = `Informa - ${product.type} ${material} ${adj} ${color}`;

  return {
    name,
    image: product.image,
    category: product.category
  };
}
