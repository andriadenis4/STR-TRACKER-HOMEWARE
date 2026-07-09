/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SKUItem {
  rackCode: string;
  sku: string;
  qty: number;
  classification: 'AMAN' | 'DANGER' | 'PERLU STR' | string;
}

export interface RackSummary {
  rackCode: string;
  totalItems: number;
  amanCount: number;
  dangerCount: number;
  perluStrCount: number;
  items: SKUItem[];
}

export type GreetingType = 'pagi' | 'siang' | 'sore' | 'malam';
