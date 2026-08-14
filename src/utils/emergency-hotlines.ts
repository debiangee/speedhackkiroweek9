/**
 * Philippine Emergency Hotlines by Region
 * 
 * Sources:
 * - NDRRMC Operations Center (ndrrmc.gov.ph)
 * - Office of Civil Defense (OCD) regional offices
 * - Philippine government e-hotlines portal (ehotlines.e.gov.ph)
 * 
 * Content was rephrased for compliance with licensing restrictions.
 * For the most current numbers, visit: https://ehotlines.e.gov.ph/
 */

export interface Hotline {
  name: string;
  number: string;
  type: 'disaster' | 'police' | 'fire' | 'medical' | 'rescue' | 'general';
}

export interface RegionalHotlines {
  region: string;
  label: string;
  hotlines: Hotline[];
}

// National hotlines available everywhere
export const NATIONAL_HOTLINES: Hotline[] = [
  { name: 'National Emergency', number: '911', type: 'general' },
  { name: 'Red Cross', number: '143', type: 'rescue' },
  { name: 'NDRRMC Operations Center', number: '(02) 8911-1406', type: 'disaster' },
  { name: 'PAGASA Storm Watch', number: '(02) 8284-0800', type: 'disaster' },
  { name: 'PNP Hotline', number: '117', type: 'police' },
  { name: 'BFP Fire Hotline', number: '(02) 8426-0219', type: 'fire' },
  { name: 'DSWD Disaster Response', number: '(02) 8856-3665', type: 'rescue' },
];

// Regional OCD (Office of Civil Defense) hotlines mapped to app region IDs
const REGIONAL_HOTLINES: Record<string, RegionalHotlines> = {
  'NCR': {
    region: 'NCR',
    label: 'National Capital Region',
    hotlines: [
      { name: 'OCD NCR', number: '(02) 8421-1918', type: 'disaster' },
      { name: 'OCD NCR (Alt)', number: '(02) 8913-2786', type: 'disaster' },
      { name: 'MMDA Flood Control', number: '(02) 8882-4150', type: 'disaster' },
      { name: 'Manila DRRMO', number: '(02) 8527-7929', type: 'rescue' },
    ],
  },
  'CAR': {
    region: 'CAR',
    label: 'Cordillera Administrative Region',
    hotlines: [
      { name: 'OCD CAR', number: '(074) 8619-0986', type: 'disaster' },
      { name: 'OCD CAR (Alt)', number: '(074) 5304-2256', type: 'disaster' },
      { name: 'OCD CAR (Alt 2)', number: '(074) 8444-5298', type: 'disaster' },
      { name: 'Baguio CDRRMO', number: '(074) 442-2525', type: 'rescue' },
    ],
  },
  'Ilocos': {
    region: 'Ilocos',
    label: 'Region I – Ilocos',
    hotlines: [
      { name: 'OCD Region I', number: '(072) 8607-6528', type: 'disaster' },
      { name: 'OCD Region I (Alt)', number: '(072) 700-4747', type: 'disaster' },
      { name: 'OCD Region I Mobile', number: '0917-300-5096', type: 'disaster' },
    ],
  },
  'Cagayan Valley': {
    region: 'Cagayan Valley',
    label: 'Region II – Cagayan Valley',
    hotlines: [
      { name: 'OCD Region II', number: '(078) 5304-1630', type: 'disaster' },
      { name: 'OCD Region II (Alt)', number: '(078) 5304-1631', type: 'disaster' },
      { name: 'OCD Region II Mobile', number: '0927-425-1954', type: 'disaster' },
    ],
  },
  'Central Luzon': {
    region: 'Central Luzon',
    label: 'Region III – Central Luzon',
    hotlines: [
      { name: 'OCD Region III', number: '(045) 455-1526', type: 'disaster' },
      { name: 'OCD Region III (Alt)', number: '(045) 455-0033', type: 'disaster' },
      { name: 'OCD Region III Mobile', number: '0939-939-3051', type: 'disaster' },
    ],
  },
  'CALABARZON': {
    region: 'CALABARZON',
    label: 'Region IV-A – CALABARZON',
    hotlines: [
      { name: 'OCD Region IV-A', number: '(049) 8531-7279', type: 'disaster' },
      { name: 'OCD Region IV-A (Alt)', number: '(049) 8531-7266', type: 'disaster' },
      { name: 'OCD Region IV-A Mobile', number: '0908-889-8948', type: 'disaster' },
    ],
  },
  'MIMAROPA': {
    region: 'MIMAROPA',
    label: 'Region IV-B – MIMAROPA',
    hotlines: [
      { name: 'OCD Region IV-B', number: '(043) 723-4248', type: 'disaster' },
      { name: 'OCD Region IV-B (Alt)', number: '(043) 702-9361', type: 'disaster' },
    ],
  },
  'Bicol': {
    region: 'Bicol',
    label: 'Region V – Bicol',
    hotlines: [
      { name: 'OCD Region V', number: '(052) 742-1176', type: 'disaster' },
      { name: 'OCD Region V Mobile (Globe)', number: '0917-574-7880', type: 'disaster' },
      { name: 'OCD Region V Mobile (Smart)', number: '0928-505-3861', type: 'disaster' },
    ],
  },
  'Western Visayas': {
    region: 'Western Visayas',
    label: 'Region VI – Western Visayas',
    hotlines: [
      { name: 'OCD Region VI', number: '(033) 336-9353', type: 'disaster' },
      { name: 'OCD Region VI (Alt)', number: '(033) 337-6671', type: 'disaster' },
      { name: 'OCD Region VI (Alt 2)', number: '(033) 509-7319', type: 'disaster' },
    ],
  },
  'Central Visayas': {
    region: 'Central Visayas',
    label: 'Region VII – Central Visayas',
    hotlines: [
      { name: 'OCD Region VII', number: '(032) 416-5025', type: 'disaster' },
      { name: 'OCD Region VII (Alt)', number: '(032) 253-6162', type: 'disaster' },
      { name: 'OCD Region VII Mobile', number: '0917-947-5666', type: 'disaster' },
    ],
  },
  'Eastern Visayas': {
    region: 'Eastern Visayas',
    label: 'Region VIII – Eastern Visayas',
    hotlines: [
      { name: 'OCD Region VIII', number: '(053) 832-0599', type: 'disaster' },
      { name: 'OCD Region VIII (Alt)', number: '(053) 321-2832', type: 'disaster' },
    ],
  },
  'Zamboanga Peninsula': {
    region: 'Zamboanga Peninsula',
    label: 'Region IX – Zamboanga Peninsula',
    hotlines: [
      { name: 'OCD Region IX', number: '(062) 991-1456', type: 'disaster' },
      { name: 'OCD Region IX (Alt)', number: '(062) 215-3382', type: 'disaster' },
    ],
  },
  'Northern Mindanao': {
    region: 'Northern Mindanao',
    label: 'Region X – Northern Mindanao',
    hotlines: [
      { name: 'OCD Region X', number: '(088) 858-5816', type: 'disaster' },
      { name: 'OCD Region X (Alt)', number: '(08822) 72-5298', type: 'disaster' },
    ],
  },
  'Davao': {
    region: 'Davao',
    label: 'Region XI – Davao',
    hotlines: [
      { name: 'OCD Region XI', number: '(082) 233-0295', type: 'disaster' },
      { name: 'Davao CDRRMO (911)', number: '(082) 911', type: 'rescue' },
      { name: 'Davao CDRRMO', number: '(082) 241-1555', type: 'rescue' },
    ],
  },
  'SOCCSKSARGEN': {
    region: 'SOCCSKSARGEN',
    label: 'Region XII – SOCCSKSARGEN',
    hotlines: [
      { name: 'OCD Region XII', number: '(083) 228-2031', type: 'disaster' },
      { name: 'OCD Region XII (Alt)', number: '(083) 552-5765', type: 'disaster' },
    ],
  },
  'Caraga': {
    region: 'Caraga',
    label: 'Region XIII – Caraga',
    hotlines: [
      { name: 'OCD Caraga', number: '(085) 342-5604', type: 'disaster' },
      { name: 'OCD Caraga (Alt)', number: '(085) 815-4229', type: 'disaster' },
    ],
  },
  'BARMM': {
    region: 'BARMM',
    label: 'BARMM',
    hotlines: [
      { name: 'OCD BARMM', number: '(064) 421-2362', type: 'disaster' },
      { name: 'BARMM Rapid Emergency', number: '(064) 552-2295', type: 'rescue' },
    ],
  },
};

/**
 * Get hotlines for a specific region.
 * Returns both the regional and national hotlines.
 */
export function getHotlinesForRegion(regionId: string): {
  regional: RegionalHotlines | null;
  national: Hotline[];
} {
  return {
    regional: REGIONAL_HOTLINES[regionId] || null,
    national: NATIONAL_HOTLINES,
  };
}

/**
 * Get the icon label for a hotline type.
 */
export function getHotlineTypeLabel(type: Hotline['type']): string {
  switch (type) {
    case 'disaster': return '🌀 Disaster';
    case 'police': return '🚔 Police';
    case 'fire': return '🚒 Fire';
    case 'medical': return '🏥 Medical';
    case 'rescue': return '🚑 Rescue';
    case 'general': return '📞 Emergency';
  }
}
