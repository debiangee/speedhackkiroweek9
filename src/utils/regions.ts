// Official Philippine region naming with short IDs for data queries
// Format: Region number + official name

export interface RegionInfo {
  id: string;           // Short ID used in database queries
  label: string;        // Full display label
  number: string;       // Region number/designation
  keywords: string;     // Search keywords
}

export const REGIONS: RegionInfo[] = [
  { id: 'NCR', label: 'NCR - National Capital Region', number: 'NCR', keywords: 'manila quezon makati pasig taguig ncr metro manila' },
  { id: 'CAR', label: 'CAR - Cordillera Administrative Region', number: 'CAR', keywords: 'baguio benguet mountain province ifugao abra kalinga apayao' },
  { id: 'Ilocos', label: 'Region I - Ilocos Region', number: 'Region I', keywords: 'laoag vigan pangasinan la union ilocos norte sur' },
  { id: 'Cagayan Valley', label: 'Region II - Cagayan Valley', number: 'Region II', keywords: 'tuguegarao isabela nueva vizcaya cagayan quirino batanes' },
  { id: 'Central Luzon', label: 'Region III - Central Luzon', number: 'Region III', keywords: 'angeles clark pampanga bulacan tarlac zambales nueva ecija aurora' },
  { id: 'CALABARZON', label: 'Region IV-A - CALABARZON', number: 'Region IV-A', keywords: 'batangas laguna cavite rizal quezon antipolo calamba' },
  { id: 'MIMAROPA', label: 'Region IV-B - MIMAROPA', number: 'Region IV-B', keywords: 'palawan puerto princesa mindoro marinduque romblon occidental oriental' },
  { id: 'Bicol', label: 'Region V - Bicol Region', number: 'Region V', keywords: 'legazpi naga mayon albay sorsogon camarines catanduanes' },
  { id: 'Western Visayas', label: 'Region VI - Western Visayas', number: 'Region VI', keywords: 'iloilo bacolod boracay aklan antique capiz negros occidental guimaras' },
  { id: 'Central Visayas', label: 'Region VII - Central Visayas', number: 'Region VII', keywords: 'cebu bohol lapu-lapu tagbilaran dumaguete siquijor mandaue' },
  { id: 'Eastern Visayas', label: 'Region VIII - Eastern Visayas', number: 'Region VIII', keywords: 'tacloban leyte samar ormoc eastern northern biliran' },
  { id: 'Zamboanga Peninsula', label: 'Region IX - Zamboanga Peninsula', number: 'Region IX', keywords: 'zamboanga dipolog pagadian sibugay norte sur' },
  { id: 'Northern Mindanao', label: 'Region X - Northern Mindanao', number: 'Region X', keywords: 'cagayan de oro iligan bukidnon misamis camiguin lanao norte' },
  { id: 'Davao', label: 'Region XI - Davao Region', number: 'Region XI', keywords: 'davao city tagum digos samal panabo compostela' },
  { id: 'SOCCSKSARGEN', label: 'Region XII - SOCCSKSARGEN', number: 'Region XII', keywords: 'general santos koronadal kidapawan south cotabato sultan kudarat sarangani' },
  { id: 'Caraga', label: 'Region XIII - Caraga', number: 'Region XIII', keywords: 'butuan surigao siargao agusan dinagat' },
  { id: 'BARMM', label: 'BARMM - Bangsamoro', number: 'BARMM', keywords: 'cotabato marawi lanao maguindanao tawi-tawi sulu basilan' },
];

// Get a region's display label from its ID
export function getRegionLabel(id: string): string {
  return REGIONS.find((r) => r.id === id)?.label || id;
}

// Get a region's short number from its ID
export function getRegionNumber(id: string): string {
  return REGIONS.find((r) => r.id === id)?.number || id;
}
