/**
 * USDA Hardiness Zone Data
 *
 * Zone lookup by ZIP code prefix and estimated data.
 * Full ZIP-level data would be loaded from USDA API in production.
 */

export interface ZoneInfo {
  zone: string;
  min_temp_f: number;
  avg_first_frost?: string;
  avg_last_frost?: string;
}

// Sample ZIP to zone mappings - in production, this would be a full database
// or API lookup to the USDA Plant Hardiness Zone database
export const ZIP_TO_ZONE: Record<string, ZoneInfo> = {
  // Northeast
  '10001': { zone: '7a', min_temp_f: 0, avg_first_frost: 'Nov 15', avg_last_frost: 'Apr 1' },
  '10002': { zone: '7a', min_temp_f: 0 },
  '10003': { zone: '7a', min_temp_f: 0 },
  '02101': { zone: '6b', min_temp_f: -5, avg_first_frost: 'Oct 25', avg_last_frost: 'Apr 20' },
  '02102': { zone: '6b', min_temp_f: -5 },
  '19101': { zone: '7a', min_temp_f: 0 },
  '06101': { zone: '6b', min_temp_f: -5 },

  // Southeast
  '30301': { zone: '7b', min_temp_f: 5, avg_first_frost: 'Nov 10', avg_last_frost: 'Mar 25' },
  '33101': { zone: '10b', min_temp_f: 35, avg_first_frost: 'Never', avg_last_frost: 'Never' },
  '33301': { zone: '10b', min_temp_f: 35 },
  '27601': { zone: '7b', min_temp_f: 5 },
  '28201': { zone: '7b', min_temp_f: 5 },

  // Midwest
  '60601': { zone: '5b', min_temp_f: -15, avg_first_frost: 'Oct 15', avg_last_frost: 'May 1' },
  '60602': { zone: '5b', min_temp_f: -15 },
  '55401': { zone: '4b', min_temp_f: -25 },
  '48201': { zone: '6a', min_temp_f: -10 },
  '43201': { zone: '6a', min_temp_f: -10 },
  '63101': { zone: '6b', min_temp_f: -5 },

  // Southwest
  '85001': { zone: '9b', min_temp_f: 25, avg_first_frost: 'Dec 15', avg_last_frost: 'Feb 15' },
  '87101': { zone: '7a', min_temp_f: 0 },
  '79901': { zone: '8a', min_temp_f: 10 },
  '73301': { zone: '7b', min_temp_f: 5 },
  '78201': { zone: '8b', min_temp_f: 15 },
  '75201': { zone: '8a', min_temp_f: 10 },

  // Pacific Northwest
  '98101': { zone: '8b', min_temp_f: 15, avg_first_frost: 'Nov 25', avg_last_frost: 'Mar 10' },
  '98102': { zone: '8b', min_temp_f: 15 },
  '97201': { zone: '8b', min_temp_f: 15 },

  // California
  '90001': { zone: '10a', min_temp_f: 30, avg_first_frost: 'Dec 15', avg_last_frost: 'Feb 1' },
  '90002': { zone: '10a', min_temp_f: 30 },
  '94101': { zone: '10a', min_temp_f: 30 },
  '92101': { zone: '10b', min_temp_f: 35 },
  '95814': { zone: '9b', min_temp_f: 25 },

  // Mountain West
  '80201': { zone: '5b', min_temp_f: -15, avg_first_frost: 'Oct 10', avg_last_frost: 'May 5' },
  '84101': { zone: '6b', min_temp_f: -5 },
  '59601': { zone: '4b', min_temp_f: -25 },
  '83701': { zone: '6b', min_temp_f: -5 },

  // Great Plains
  '66101': { zone: '6a', min_temp_f: -10 },
  '68101': { zone: '5b', min_temp_f: -15 },
  '73101': { zone: '7a', min_temp_f: 0 },
  '57501': { zone: '4b', min_temp_f: -25 },
  '58501': { zone: '4a', min_temp_f: -30 },
};

// Zone temperature ranges
export const ZONE_TEMPS: Record<string, { min: number; max: number }> = {
  '1a': { min: -60, max: -55 },
  '1b': { min: -55, max: -50 },
  '2a': { min: -50, max: -45 },
  '2b': { min: -45, max: -40 },
  '3a': { min: -40, max: -35 },
  '3b': { min: -35, max: -30 },
  '4a': { min: -30, max: -25 },
  '4b': { min: -25, max: -20 },
  '5a': { min: -20, max: -15 },
  '5b': { min: -15, max: -10 },
  '6a': { min: -10, max: -5 },
  '6b': { min: -5, max: 0 },
  '7a': { min: 0, max: 5 },
  '7b': { min: 5, max: 10 },
  '8a': { min: 10, max: 15 },
  '8b': { min: 15, max: 20 },
  '9a': { min: 20, max: 25 },
  '9b': { min: 25, max: 30 },
  '10a': { min: 30, max: 35 },
  '10b': { min: 35, max: 40 },
  '11a': { min: 40, max: 45 },
  '11b': { min: 45, max: 50 },
  '12a': { min: 50, max: 55 },
  '12b': { min: 55, max: 60 },
  '13a': { min: 60, max: 65 },
  '13b': { min: 65, max: 70 },
};

// Regional zone estimates by first 3 digits of ZIP
export const ZIP_PREFIX_ZONES: Record<string, string> = {
  // Northeast
  '100': '7a', '101': '6b', '102': '6b', '103': '6a', '104': '6b',
  '021': '6b', '022': '6b', '023': '6a', '024': '6a',
  '191': '7a', '061': '6b', '062': '6a',

  // Southeast
  '303': '7b', '331': '10b', '332': '10a', '333': '10a',
  '276': '7b', '282': '7b',

  // Midwest
  '606': '5b', '607': '5b', '608': '5b',
  '554': '4b', '482': '6a', '432': '6a', '631': '6b',

  // Southwest
  '850': '9b', '871': '7a', '799': '8a', '733': '7b',
  '782': '8b', '752': '8a',

  // Pacific Northwest
  '981': '8b', '972': '8b',

  // California
  '900': '10a', '941': '10a', '921': '10b', '958': '9b',

  // Mountain West
  '802': '5b', '841': '6b', '596': '4b', '837': '6b',

  // Great Plains
  '661': '6a', '681': '5b', '731': '7a', '575': '4b', '585': '4a',
};
