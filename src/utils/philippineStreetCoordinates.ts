// Curated Philippine Landmark Coordinates
// Coordinates represent prominent Philippine streets and landmarks.
// Actual street-level imagery availability depends on provider coverage at each coordinate.

export interface StreetLandmark {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  heading: number;
  pitch?: number;
}

export interface CityStreetProfile {
  cityName: string;
  region: string;
  defaultSpot: StreetLandmark;
  landmarks: StreetLandmark[];
}

export const PHILIPPINE_STREET_LOCATIONS: Record<string, CityStreetProfile> = {
  'NCR': {
    cityName: 'Metro Manila',
    region: 'NCR',
    defaultSpot: {
      id: 'ncr-manila-luneta',
      name: 'Rizal Park (Luneta), Manila',
      description: 'Iconic national park and historical promenade along Roxas Boulevard',
      lat: 14.5831,
      lon: 120.9794,
      heading: 90,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'ncr-manila-luneta',
        name: 'Rizal Park / Roxas Blvd',
        description: 'National park along Manila Bay',
        lat: 14.5831,
        lon: 120.9794,
        heading: 90,
      },
      {
        id: 'ncr-manila-intramuros',
        name: 'Intramuros (Plaza Roma)',
        description: 'Historic walled city and Manila Cathedral',
        lat: 14.5916,
        lon: 120.9734,
        heading: 180,
      },
      {
        id: 'ncr-qc-circle',
        name: 'Quezon Memorial Circle',
        description: 'Elliptical Road in central Quezon City',
        lat: 14.6516,
        lon: 121.0494,
        heading: 45,
      },
      {
        id: 'ncr-qc-morato',
        name: 'Tomas Morato Ave, QC',
        description: 'Vibrant dining and entertainment district',
        lat: 14.6347,
        lon: 121.0368,
        heading: 120,
      },
      {
        id: 'ncr-makati-ayala',
        name: 'Ayala Avenue, Makati',
        description: 'Central business district financial avenue',
        lat: 14.5547,
        lon: 121.0244,
        heading: 220,
      },
      {
        id: 'ncr-taguig-bgc',
        name: 'Bonifacio High Street, BGC',
        description: 'Walkable commercial avenue in Taguig',
        lat: 14.5507,
        lon: 121.0509,
        heading: 110,
      },
      {
        id: 'ncr-pasig-ortigas',
        name: 'Emerald Avenue, Ortigas',
        description: 'Urban center in Pasig City',
        lat: 14.5869,
        lon: 121.0601,
        heading: 340,
      },
    ],
  },
  'CAR': {
    cityName: 'Baguio City',
    region: 'CAR',
    defaultSpot: {
      id: 'car-baguio-session',
      name: 'Session Road, Baguio',
      description: 'Famous mountain city main thoroughfare with pine breeze',
      lat: 16.4124,
      lon: 120.5973,
      heading: 150,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'car-baguio-session',
        name: 'Session Road',
        description: 'Baguio central commercial street',
        lat: 16.4124,
        lon: 120.5973,
        heading: 150,
      },
      {
        id: 'car-baguio-burnham',
        name: 'Burnham Park Lake',
        description: 'Famous urban park and promenade',
        lat: 16.4109,
        lon: 120.5936,
        heading: 90,
      },
      {
        id: 'car-baguio-minesview',
        name: 'Mines View / Outlook Dr',
        description: 'Scenic ridge overlooking Cordillera mountains',
        lat: 16.4239,
        lon: 120.6272,
        heading: 70,
      },
    ],
  },
  'Ilocos': {
    cityName: 'Vigan City',
    region: 'Ilocos',
    defaultSpot: {
      id: 'ilocos-vigan-crisologo',
      name: 'Calle Crisologo, Vigan',
      description: 'UNESCO World Heritage cobblestone street with Spanish-era ancestral homes',
      lat: 17.5724,
      lon: 120.3888,
      heading: 180,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'ilocos-vigan-crisologo',
        name: 'Calle Crisologo',
        description: 'Heritage Spanish colonial street',
        lat: 17.5724,
        lon: 120.3888,
        heading: 180,
      },
      {
        id: 'ilocos-laoag-belltower',
        name: 'Laoag Sinking Bell Tower',
        description: 'Historic landmark in Laoag City center',
        lat: 18.1969,
        lon: 120.5933,
        heading: 210,
      },
    ],
  },
  'Cagayan Valley': {
    cityName: 'Tuguegarao City',
    region: 'Cagayan Valley',
    defaultSpot: {
      id: 'cagayan-tuguegarao-cathedral',
      name: 'Rizal Street, Tuguegarao',
      description: 'Central thoroughfare near St. Peter Metropolitan Cathedral',
      lat: 17.6132,
      lon: 121.7270,
      heading: 90,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'cagayan-tuguegarao-cathedral',
        name: 'Tuguegarao City Center',
        description: 'Main commercial corridor in Cagayan',
        lat: 17.6132,
        lon: 121.7270,
        heading: 90,
      },
    ],
  },
  'Central Luzon': {
    cityName: 'Clark / Angeles City',
    region: 'Central Luzon',
    defaultSpot: {
      id: 'cl-clark-roxas',
      name: 'M.A. Roxas Highway, Clark',
      description: 'Spacious avenue through Clark Freeport Zone, Pampanga',
      lat: 15.1860,
      lon: 120.5460,
      heading: 135,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'cl-clark-roxas',
        name: 'Clark Freeport Ave',
        description: 'Clark business and leisure corridor',
        lat: 15.1860,
        lon: 120.5460,
        heading: 135,
      },
      {
        id: 'cl-subic-waterfront',
        name: 'Subic Bay Waterfront Rd',
        description: 'Coastal road along Subic Bay',
        lat: 14.8292,
        lon: 120.2824,
        heading: 240,
      },
    ],
  },
  'CALABARZON': {
    cityName: 'Tagaytay City',
    region: 'CALABARZON',
    defaultSpot: {
      id: 'calabarzon-tagaytay-ridge',
      name: 'Tagaytay-Nasugbu Highway',
      description: 'Scenic ridge highway overlooking Taal Volcano and Lake',
      lat: 14.1153,
      lon: 120.9621,
      heading: 190,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'calabarzon-tagaytay-ridge',
        name: 'Tagaytay Ridge View',
        description: 'Taal lake view ridge road',
        lat: 14.1153,
        lon: 120.9621,
        heading: 190,
      },
      {
        id: 'calabarzon-antipolo-sumulong',
        name: 'Sumulong Highway, Antipolo',
        description: 'Overlooking Metro Manila skyline',
        lat: 14.6258,
        lon: 121.1245,
        heading: 260,
      },
    ],
  },
  'MIMAROPA': {
    cityName: 'Puerto Princesa, Palawan',
    region: 'MIMAROPA',
    defaultSpot: {
      id: 'mimaropa-puerto-rizal',
      name: 'Rizal Avenue, Puerto Princesa',
      description: 'Main coastal city avenue leading toward the baywalk',
      lat: 9.7392,
      lon: 118.7353,
      heading: 120,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'mimaropa-puerto-rizal',
        name: 'Puerto Princesa Baywalk',
        description: 'Seaside promenade in Palawan',
        lat: 9.7392,
        lon: 118.7353,
        heading: 120,
      },
    ],
  },
  'Bicol': {
    cityName: 'Legazpi City',
    region: 'Bicol',
    defaultSpot: {
      id: 'bicol-legazpi-mayon',
      name: 'Cagsawa / Mayon Viewpoint, Albay',
      description: 'Historical viewpoint showcasing Mayon Volcano',
      lat: 13.1979,
      lon: 123.6847,
      heading: 330,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'bicol-legazpi-mayon',
        name: 'Mayon Volcano Vista',
        description: 'Scenic view toward Mayon',
        lat: 13.1979,
        lon: 123.6847,
        heading: 330,
      },
      {
        id: 'bicol-legazpi-boulevard',
        name: 'Legazpi Boulevard',
        description: 'Coastal coastal road in Albay Gulf',
        lat: 13.1391,
        lon: 123.7438,
        heading: 110,
      },
    ],
  },
  'Western Visayas': {
    cityName: 'Iloilo City',
    region: 'Western Visayas',
    defaultSpot: {
      id: 'wv-iloilo-callereal',
      name: 'Calle Real (J.M. Basa St), Iloilo',
      description: 'Preserved heritage commercial street with art deco buildings',
      lat: 10.6928,
      lon: 122.5684,
      heading: 120,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'wv-iloilo-callereal',
        name: 'Calle Real Heritage St',
        description: 'Historic Iloilo downtown street',
        lat: 10.6928,
        lon: 122.5684,
        heading: 120,
      },
      {
        id: 'wv-iloilo-esplanade',
        name: 'Iloilo River Esplanade',
        description: 'Award-winning pedestrian river parkway',
        lat: 10.7011,
        lon: 122.5518,
        heading: 90,
      },
      {
        id: 'wv-bacolod-lacson',
        name: 'Lacson Street, Bacolod',
        description: 'Main culinary and festival avenue in Bacolod',
        lat: 10.6765,
        lon: 122.9509,
        heading: 180,
      },
    ],
  },
  'Central Visayas': {
    cityName: 'Cebu City',
    region: 'Central Visayas',
    defaultSpot: {
      id: 'cv-cebu-fuente',
      name: 'Fuente Osmeña Circle, Cebu',
      description: 'Iconic roundabout and heart of uptown Cebu City',
      lat: 10.3114,
      lon: 123.8920,
      heading: 45,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'cv-cebu-fuente',
        name: 'Fuente Osmeña Circle',
        description: 'Uptown Cebu City center',
        lat: 10.3114,
        lon: 123.8920,
        heading: 45,
      },
      {
        id: 'cv-cebu-colon',
        name: 'Colon Street (Oldest Street)',
        description: 'Oldest national road in the Philippines',
        lat: 10.2975,
        lon: 123.9014,
        heading: 240,
      },
      {
        id: 'cv-cebu-itpark',
        name: 'Cebu IT Park',
        description: 'Modern business & lifestyle hub in Lahug',
        lat: 10.3292,
        lon: 123.9061,
        heading: 180,
      },
    ],
  },
  'Eastern Visayas': {
    cityName: 'Tacloban City',
    region: 'Eastern Visayas',
    defaultSpot: {
      id: 'ev-tacloban-bridge',
      name: 'San Juanico Bridge View, Tacloban',
      description: 'Longest bridge connecting Samar and Leyte islands',
      lat: 11.2985,
      lon: 124.9664,
      heading: 60,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'ev-tacloban-bridge',
        name: 'San Juanico Strait Rd',
        description: 'Connecting Leyte and Samar',
        lat: 11.2985,
        lon: 124.9664,
        heading: 60,
      },
    ],
  },
  'Zamboanga Peninsula': {
    cityName: 'Zamboanga City',
    region: 'Zamboanga Peninsula',
    defaultSpot: {
      id: 'zp-zamboanga-paseo',
      name: 'Paseo del Mar / Fort Pilar',
      description: 'Scenic seafront promenade near historical Fort Pilar',
      lat: 6.9014,
      lon: 122.0819,
      heading: 160,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'zp-zamboanga-paseo',
        name: 'Paseo del Mar Promenade',
        description: 'Seafront walkway overlooking Basilan Strait',
        lat: 6.9014,
        lon: 122.0819,
        heading: 160,
      },
    ],
  },
  'Northern Mindanao': {
    cityName: 'Cagayan de Oro',
    region: 'Northern Mindanao',
    defaultSpot: {
      id: 'nm-cdo-divisoria',
      name: 'Plaza Divisoria, CDO',
      description: 'Vibrant historical city center and Golden Friendship park',
      lat: 8.4772,
      lon: 124.6459,
      heading: 90,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'nm-cdo-divisoria',
        name: 'Plaza Divisoria',
        description: 'Historic central plaza in Cagayan de Oro',
        lat: 8.4772,
        lon: 124.6459,
        heading: 90,
      },
    ],
  },
  'Davao': {
    cityName: 'Davao City',
    region: 'Davao',
    defaultSpot: {
      id: 'davao-peoples-park',
      name: "People's Park / Palma Gil St",
      description: 'Cultural park and central urban street in downtown Davao',
      lat: 7.0644,
      lon: 125.6074,
      heading: 180,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'davao-peoples-park',
        name: "People's Park Center",
        description: 'Cultural downtown Davao park',
        lat: 7.0644,
        lon: 125.6074,
        heading: 180,
      },
      {
        id: 'davao-san-pedro',
        name: 'San Pedro Cathedral / City Hall',
        description: 'Historic city square and oldest cathedral in Davao',
        lat: 7.0653,
        lon: 125.6094,
        heading: 120,
      },
    ],
  },
  'SOCCSKSARGEN': {
    cityName: 'General Santos City',
    region: 'SOCCSKSARGEN',
    defaultSpot: {
      id: 'soc-gensan-pioneer',
      name: 'Pioneer Avenue, GenSan',
      description: 'Main commercial avenue in the Tuna Capital of the Philippines',
      lat: 6.1164,
      lon: 125.1716,
      heading: 90,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'soc-gensan-pioneer',
        name: 'Pioneer Avenue',
        description: 'Downtown General Santos city street',
        lat: 6.1164,
        lon: 125.1716,
        heading: 90,
      },
    ],
  },
  'Caraga': {
    cityName: 'Butuan City',
    region: 'Caraga',
    defaultSpot: {
      id: 'caraga-butuan-montilla',
      name: 'Montilla Boulevard, Butuan',
      description: 'Central avenue in the Timber City of the South',
      lat: 8.9475,
      lon: 125.5406,
      heading: 180,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'caraga-butuan-montilla',
        name: 'Montilla Boulevard',
        description: 'Butuan City central commercial avenue',
        lat: 8.9475,
        lon: 125.5406,
        heading: 180,
      },
    ],
  },
  'BARMM': {
    cityName: 'Cotabato City',
    region: 'BARMM',
    defaultSpot: {
      id: 'barmm-cotabato-sinsuat',
      name: 'Governor Gutierrez Ave, Cotabato',
      description: 'Prominent avenue leading to the Bangsamoro Government Center',
      lat: 7.2150,
      lon: 124.2460,
      heading: 45,
      pitch: 0,
    },
    landmarks: [
      {
        id: 'barmm-cotabato-sinsuat',
        name: 'Bangsamoro Gov Center',
        description: 'Cotabato City regional center avenue',
        lat: 7.2150,
        lon: 124.2460,
        heading: 45,
      },
    ],
  },
};

/**
 * Returns the best street landmark coordinates for a given region and optional city.
 */
export function getStreetLocationForRegion(region: string, city?: string | null): StreetLandmark {
  // If specific city is given, check for landmark name match
  const profile = PHILIPPINE_STREET_LOCATIONS[region] || PHILIPPINE_STREET_LOCATIONS['NCR'];
  if (city && profile.landmarks.length > 0) {
    const matched = profile.landmarks.find(
      (l) => l.name.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(l.name.toLowerCase())
    );
    if (matched) return matched;
  }
  return profile.defaultSpot;
}
