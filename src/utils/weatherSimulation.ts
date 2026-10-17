import { HourlyData } from '../hooks/useWeatherData';

export type QualityLevel = 'low' | 'medium' | 'high';

export type RealityCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'foggy'
  | 'light-rain'
  | 'moderate-rain'
  | 'heavy-rain'
  | 'thunderstorm';

export interface WeatherSimulationState {
  // Single Source of Truth: Weather condition classification
  condition: RealityCondition;
  weatherCondition: string; // Human-readable label: 'Clear' | 'Partly Cloudy' | 'Overcast' | 'Light Rain' | etc.
  weatherCode: number;
  
  // Strict Rain Control Flags
  shouldShowRain: boolean;
  rainParticleCount: number; // 0 when dry, 15-350 when rainy
  
  // Precipitation & Particles
  precipitationMm: number; // mm/h
  rainIntensity: number; // 0.0 (bone dry) to 1.0 (torrential)
  particleDensity: number;
  particleSpeed: number; // Fall velocity multiplier
  rainAngleX: number; // Wind tilt on X axis (radians)
  rainAngleZ: number; // Wind tilt on Z axis (radians)
  
  // Wind
  windSpeedKmh: number;
  windDirectionDeg: number;
  windStrength: number; // 0 to 1
  
  // Surface Wetness & Reflection (strictly 0 when no rain)
  wetness: number; // 0 (dry) to 1.0 (waterlogged)
  puddleIntensity: number; // 0 (none) to 1.0
  roadRoughness: number;
  
  // Atmospheric & Visibility
  visibilityMeters: number;
  fogDensity: number;
  cloudCoverage: number; // 0 to 100%
  
  // Lighting & Solar cycle
  solarPhase: 'morning' | 'midday' | 'afternoon' | 'sunset' | 'night';
  sunAltitude: number; // -90 to +90 degrees
  sunAzimuth: number; // degrees
  ambientLightIntensity: number;
  sunLightIntensity: number;
  skyColor: string;
  ambientColor: string;
  sunColor: string;
  streetlightsOn: boolean;
  
  // Storm & Lightning (strictly 0 unless actual thunderstorm)
  stormIntensity: number; // 0 to 1
  lightningProbability: number;
  
  // Telemetry metadata
  temperatureC: number;
  apparentTempC: number;
  relativeHumidity: number;
  localHour: number;
  formattedTime: string;
  timestamp: string;
}

/**
 * Validates if the meteorological data genuinely indicates raining conditions.
 * Rule: Must have a rain-capable WMO code AND measurable precipitation > 0.05 mm.
 */
export function isRainCondition(code: number, precipMm: number): boolean {
  if (precipMm <= 0.05) return false;
  
  // WMO Rain codes:
  // 51, 53, 55: Drizzle
  // 56, 57: Freezing Drizzle
  // 61, 63, 65: Rain (Light, Moderate, Heavy)
  // 66, 67: Freezing Rain
  // 80, 81, 82: Rain Showers
  // 95, 96, 99: Thunderstorm
  const isRainCode =
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99);

  return isRainCode;
}

/**
 * Categorizes standard WMO weather codes and precipitation into a strict RealityCondition.
 */
export function classifyWeatherCondition(code: number, precipMm: number): {
  condition: RealityCondition;
  label: string;
  shouldShowRain: boolean;
} {
  const raining = isRainCondition(code, precipMm);

  if (code >= 95) {
    return {
      condition: 'thunderstorm',
      label: 'Thunderstorm',
      shouldShowRain: precipMm > 0.05,
    };
  }

  if (raining) {
    if (code === 65 || code === 82 || precipMm >= 7.5) {
      return { condition: 'heavy-rain', label: 'Heavy Rain', shouldShowRain: true };
    }
    if (code === 63 || code === 81 || precipMm >= 2.5) {
      return { condition: 'moderate-rain', label: 'Moderate Rain', shouldShowRain: true };
    }
    if (code === 51 || code === 53 || code === 55) {
      return { condition: 'light-rain', label: 'Drizzle', shouldShowRain: true };
    }
    return { condition: 'light-rain', label: 'Light Rain', shouldShowRain: true };
  }

  // Non-rain conditions (Absolute zero rain)
  if (code >= 45 && code <= 48) {
    return { condition: 'foggy', label: 'Foggy', shouldShowRain: false };
  }
  if (code === 3) {
    return { condition: 'cloudy', label: 'Overcast', shouldShowRain: false };
  }
  if (code === 1 || code === 2) {
    return { condition: 'partly-cloudy', label: 'Partly Cloudy', shouldShowRain: false };
  }
  
  // Default to clear if code is 0 or any unrecognized non-rain code with 0 precipitation
  return { condition: 'clear', label: 'Clear', shouldShowRain: false };
}

/**
 * Calculates rain intensity (0.0 to 1.0).
 * Strictly returns 0 if precipMm <= 0.05 or not a rain code.
 */
export function calculateRainIntensity(precipMm: number, weatherCode: number): number {
  if (!isRainCondition(weatherCode, precipMm)) {
    return 0;
  }

  if (weatherCode >= 95) {
    // Thunderstorm with precipitation
    return Math.min(1.0, Math.max(0.5, precipMm / 15));
  }

  if (precipMm < 1.0) {
    return 0.15 + (precipMm / 1.0) * 0.2; // 0.15 - 0.35 (Light / Drizzle)
  }
  if (precipMm < 7.5) {
    return 0.35 + ((precipMm - 1.0) / 6.5) * 0.35; // 0.35 - 0.70 (Moderate)
  }
  return Math.min(1.0, 0.70 + ((precipMm - 7.5) / 25) * 0.30); // 0.70 - 1.0 (Heavy / Torrential)
}

/**
 * Calculates rain deflection angles based on wind speed (km/h) and direction (degrees).
 */
export function calculateWindEffect(windSpeedKmh: number, windDirDeg: number): {
  angleX: number;
  angleZ: number;
  windStrength: number;
} {
  const windStrength = Math.min(1.0, windSpeedKmh / 70);
  const rad = (windDirDeg * Math.PI) / 180;
  
  const maxDeflection = 0.65 * windStrength;
  const angleX = Math.sin(rad) * maxDeflection;
  const angleZ = Math.cos(rad) * maxDeflection;

  return { angleX, angleZ, windStrength };
}

/**
 * Calculates fog density based on real visibility (meters) and cloud cover.
 */
export function calculateFog(visibilityMeters: number, cloudCover: number, rainIntensity: number): number {
  const clampedVis = Math.max(200, Math.min(25000, visibilityMeters || 10000));
  const baseDensity = 1.8 / clampedVis;

  const rainHaze = rainIntensity * 0.015;
  const cloudHaze = (cloudCover / 100) * 0.002;

  return Math.min(0.045, baseDensity + rainHaze + cloudHaze);
}

/**
 * Calculates solar position and atmospheric lighting for a given Philippine local hour/minute.
 * Timezone: Asia/Manila (UTC+8).
 */
export function calculateSolarPhase(hour: number, minute = 0): {
  phase: 'morning' | 'midday' | 'afternoon' | 'sunset' | 'night';
  altitude: number;
  azimuth: number;
  baseAmbient: number;
  baseSun: number;
  skyColor: string;
  ambientColor: string;
  sunColor: string;
  streetlightsOn: boolean;
} {
  const timeFraction = (hour + minute / 60) / 24; // 0 to 1

  let phase: 'morning' | 'midday' | 'afternoon' | 'sunset' | 'night';
  let altitude = 0;
  let azimuth = 0;
  let baseAmbient = 0.2;
  let baseSun = 0.0;
  let skyColor = '#060a14';
  let ambientColor = '#1a2238';
  let sunColor = '#ffffff';
  let streetlightsOn = true;

  if (timeFraction >= 0.24 && timeFraction < 0.30) {
    // 05:45 - 07:15: Dawn / Sunrise
    phase = 'morning';
    altitude = ((timeFraction - 0.24) / 0.06) * 18;
    azimuth = 90;
    baseAmbient = 0.45;
    baseSun = 0.6;
    skyColor = '#ffaa77';
    ambientColor = '#e0c8b0';
    sunColor = '#ff8844';
    streetlightsOn = false;
  } else if (timeFraction >= 0.30 && timeFraction < 0.45) {
    // 07:15 - 10:45: Morning
    phase = 'morning';
    altitude = 18 + ((timeFraction - 0.30) / 0.15) * 45;
    azimuth = 105;
    baseAmbient = 0.75;
    baseSun = 1.1;
    skyColor = '#87ceeb';
    ambientColor = '#d9e9f5';
    sunColor = '#fffbe8';
    streetlightsOn = false;
  } else if (timeFraction >= 0.45 && timeFraction < 0.60) {
    // 10:45 - 14:30: Midday
    phase = 'midday';
    altitude = 63 + (1 - Math.abs((timeFraction - 0.525) / 0.075)) * 25;
    azimuth = 180;
    baseAmbient = 0.95;
    baseSun = 1.4;
    skyColor = '#70b9e8';
    ambientColor = '#ffffff';
    sunColor = '#fffff0';
    streetlightsOn = false;
  } else if (timeFraction >= 0.60 && timeFraction < 0.73) {
    // 14:30 - 17:30: Late Afternoon
    phase = 'afternoon';
    altitude = 60 - ((timeFraction - 0.60) / 0.13) * 48;
    azimuth = 250;
    baseAmbient = 0.75;
    baseSun = 1.1;
    skyColor = '#80b5dc';
    ambientColor = '#faecd6';
    sunColor = '#ffddaa';
    streetlightsOn = false;
  } else if (timeFraction >= 0.73 && timeFraction < 0.78) {
    // 17:30 - 18:45: Sunset / Twilight
    phase = 'sunset';
    altitude = 12 - ((timeFraction - 0.73) / 0.05) * 16;
    azimuth = 270;
    baseAmbient = 0.4;
    baseSun = 0.5;
    skyColor = '#cc5533';
    ambientColor = '#aa5544';
    sunColor = '#ff5522';
    streetlightsOn = true;
  } else {
    // Night
    phase = 'night';
    altitude = -30;
    azimuth = 0;
    baseAmbient = 0.18;
    baseSun = 0.0;
    skyColor = '#060a14';
    ambientColor = '#121828';
    sunColor = '#223355';
    streetlightsOn = true;
  }

  return {
    phase,
    altitude,
    azimuth,
    baseAmbient,
    baseSun,
    skyColor,
    ambientColor,
    sunColor,
    streetlightsOn,
  };
}

/**
 * Maps an HourlyData object to a complete deterministic WeatherSimulationState.
 * Guarantees that if precipitation is 0, rain effects and wet roads are strictly zero.
 */
export function mapWeatherToSimulation(entry: HourlyData, customHour?: number): WeatherSimulationState {
  const hour = customHour !== undefined ? customHour : entry.hour ?? new Date(entry.time).getHours();
  const precipMm = Math.max(0, entry.precipitation ?? 0);
  const weatherCode = entry.weather_code ?? 0;
  const windSpeedKmh = entry.wind_speed ?? 5;
  const windDirDeg = 45; // Default NE wind angle
  const cloudCover = entry.cloud_cover ?? (weatherCode === 0 ? 5 : weatherCode <= 2 ? 35 : 85);
  const visibility = entry.visibility ?? (weatherCode >= 45 && weatherCode <= 48 ? 800 : 10000);
  const humidity = entry.humidity ?? 75;
  const temp = entry.temperature ?? 28;

  const classification = classifyWeatherCondition(weatherCode, precipMm);
  const shouldShowRain = classification.shouldShowRain;
  const rainIntensity = calculateRainIntensity(precipMm, weatherCode);
  const { angleX, angleZ, windStrength } = calculateWindEffect(windSpeedKmh, windDirDeg);
  const fogDensity = calculateFog(visibility, cloudCover, rainIntensity);
  const solar = calculateSolarPhase(hour);

  // Surface Wetness: Strictly 0 if no rain
  const wetness = shouldShowRain ? Math.min(1.0, 0.25 + rainIntensity * 0.75) : 0.0;
  const puddleIntensity = shouldShowRain ? Math.min(1.0, Math.max(0, (rainIntensity - 0.2) / 0.8)) : 0.0;
  const roadRoughness = shouldShowRain ? Math.max(0.15, 0.85 - wetness * 0.7) : 0.85;

  // Particle Count: Strictly 0 if shouldShowRain is false
  const rainParticleCount = shouldShowRain ? Math.floor(rainIntensity * 320) + 15 : 0;

  // Lighting attenuation
  const cloudDimming = 1 - (cloudCover / 100) * 0.45;
  const rainDimming = 1 - rainIntensity * 0.45;
  const ambientLightIntensity = Math.max(0.12, solar.baseAmbient * cloudDimming * rainDimming);
  const sunLightIntensity = Math.max(0.0, solar.baseSun * cloudDimming * (1 - rainIntensity * 0.8));

  // Storm properties (strictly 0 unless WMO 95+ and thunderstorm condition)
  const isThunderstorm = classification.condition === 'thunderstorm';
  const stormIntensity = isThunderstorm ? 0.9 : 0;
  const lightningProbability = isThunderstorm ? 0.008 : 0;

  const streetlightsOn = solar.streetlightsOn || (ambientLightIntensity < 0.22 && shouldShowRain);

  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const formattedTime = `${h12}:00 ${ampm}`;

  return {
    condition: classification.condition,
    weatherCondition: classification.label,
    weatherCode,
    shouldShowRain,
    rainParticleCount,
    precipitationMm: Math.round(precipMm * 10) / 10,
    rainIntensity,
    particleDensity: rainIntensity,
    particleSpeed: 1.0 + rainIntensity * 0.8 + windStrength * 0.4,
    rainAngleX: angleX,
    rainAngleZ: angleZ,
    windSpeedKmh: Math.round(windSpeedKmh),
    windDirectionDeg: windDirDeg,
    windStrength,
    wetness,
    puddleIntensity,
    roadRoughness,
    visibilityMeters: Math.round(visibility),
    fogDensity,
    cloudCoverage: cloudCover,
    solarPhase: solar.phase,
    sunAltitude: solar.altitude,
    sunAzimuth: solar.azimuth,
    ambientLightIntensity,
    sunLightIntensity,
    skyColor: solar.skyColor,
    ambientColor: solar.ambientColor,
    sunColor: solar.sunColor,
    streetlightsOn,
    stormIntensity,
    lightningProbability,
    temperatureC: Math.round(temp * 10) / 10,
    apparentTempC: Math.round(temp * 10) / 10,
    relativeHumidity: Math.round(humidity),
    localHour: hour,
    formattedTime,
    timestamp: entry.time || new Date().toISOString(),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smoothly interpolates between two WeatherSimulationStates.
 * Critical Safeguard: NEVER generates rain if both states have zero precipitation.
 */
export function interpolateSimulationStates(
  stateA: WeatherSimulationState,
  stateB: WeatherSimulationState,
  t: number
): WeatherSimulationState {
  const clampedT = Math.max(0, Math.min(1, t));
  const dominantState = clampedT < 0.5 ? stateA : stateB;

  const interpolatedPrecip = lerp(stateA.precipitationMm, stateB.precipitationMm, clampedT);
  const bothDry = stateA.precipitationMm <= 0.05 && stateB.precipitationMm <= 0.05;

  const shouldShowRain = bothDry ? false : dominantState.shouldShowRain && interpolatedPrecip > 0.05;
  const rainIntensity = shouldShowRain ? lerp(stateA.rainIntensity, stateB.rainIntensity, clampedT) : 0;
  const rainParticleCount = shouldShowRain ? Math.floor(rainIntensity * 320) + 15 : 0;

  return {
    condition: dominantState.condition,
    weatherCondition: dominantState.weatherCondition,
    weatherCode: dominantState.weatherCode,
    shouldShowRain,
    rainParticleCount,
    precipitationMm: Math.round(interpolatedPrecip * 10) / 10,
    rainIntensity,
    particleDensity: rainIntensity,
    particleSpeed: lerp(stateA.particleSpeed, stateB.particleSpeed, clampedT),
    rainAngleX: lerp(stateA.rainAngleX, stateB.rainAngleX, clampedT),
    rainAngleZ: lerp(stateA.rainAngleZ, stateB.rainAngleZ, clampedT),
    windSpeedKmh: lerp(stateA.windSpeedKmh, stateB.windSpeedKmh, clampedT),
    windDirectionDeg: lerp(stateA.windDirectionDeg, stateB.windDirectionDeg, clampedT),
    windStrength: lerp(stateA.windStrength, stateB.windStrength, clampedT),
    wetness: shouldShowRain ? lerp(stateA.wetness, stateB.wetness, clampedT) : 0,
    puddleIntensity: shouldShowRain ? lerp(stateA.puddleIntensity, stateB.puddleIntensity, clampedT) : 0,
    roadRoughness: shouldShowRain ? lerp(stateA.roadRoughness, stateB.roadRoughness, clampedT) : 0.85,
    visibilityMeters: lerp(stateA.visibilityMeters, stateB.visibilityMeters, clampedT),
    fogDensity: lerp(stateA.fogDensity, stateB.fogDensity, clampedT),
    cloudCoverage: lerp(stateA.cloudCoverage, stateB.cloudCoverage, clampedT),
    solarPhase: dominantState.solarPhase,
    sunAltitude: lerp(stateA.sunAltitude, stateB.sunAltitude, clampedT),
    sunAzimuth: lerp(stateA.sunAzimuth, stateB.sunAzimuth, clampedT),
    ambientLightIntensity: lerp(stateA.ambientLightIntensity, stateB.ambientLightIntensity, clampedT),
    sunLightIntensity: lerp(stateA.sunLightIntensity, stateB.sunLightIntensity, clampedT),
    skyColor: dominantState.skyColor,
    ambientColor: dominantState.ambientColor,
    sunColor: dominantState.sunColor,
    streetlightsOn: dominantState.streetlightsOn,
    stormIntensity: isRainCondition(dominantState.weatherCode, interpolatedPrecip) && dominantState.condition === 'thunderstorm'
      ? lerp(stateA.stormIntensity, stateB.stormIntensity, clampedT)
      : 0,
    lightningProbability: isRainCondition(dominantState.weatherCode, interpolatedPrecip) && dominantState.condition === 'thunderstorm'
      ? lerp(stateA.lightningProbability, stateB.lightningProbability, clampedT)
      : 0,
    temperatureC: lerp(stateA.temperatureC, stateB.temperatureC, clampedT),
    apparentTempC: lerp(stateA.apparentTempC, stateB.apparentTempC, clampedT),
    relativeHumidity: lerp(stateA.relativeHumidity, stateB.relativeHumidity, clampedT),
    localHour: lerp(stateA.localHour, stateB.localHour, clampedT),
    formattedTime: dominantState.formattedTime,
    timestamp: dominantState.timestamp,
  };
}

export interface ExperienceReport {
  roadStatus: string;
  visibilityStatus: string;
  windStatus: string;
  lightingStatus: string;
  travelSafety: string;
}

export function deriveExperienceReport(sim: WeatherSimulationState): ExperienceReport {
  let roadStatus = 'Dry-weather simulation; actual pavement unknown';
  if (sim.wetness > 0.75) roadStatus = 'Heavy-rain simulation; standing water unverified';
  else if (sim.wetness > 0.45) roadStatus = 'Slick & very wet asphalt';
  else if (sim.wetness > 0.15) roadStatus = 'Damp surface, light spray';

  let visibilityStatus = 'Clear & high visibility';
  if (sim.visibilityMeters < 1000 || sim.fogDensity > 0.02) visibilityStatus = 'Severely reduced by precipitation';
  else if (sim.visibilityMeters < 3000 || sim.fogDensity > 0.008) visibilityStatus = 'Moderate haze / reduced sightlines';
  else if (sim.visibilityMeters < 6000) visibilityStatus = 'Slight atmospheric haze';

  let windStatus = 'Calm / gentle air';
  if (sim.windSpeedKmh > 50) windStatus = 'Gale gusts — difficult walking';
  else if (sim.windSpeedKmh > 30) windStatus = 'Strong gusty winds';
  else if (sim.windSpeedKmh > 15) windStatus = 'Moderate breeze';

  let lightingStatus = 'Daylight';
  if (sim.solarPhase === 'night') lightingStatus = 'Night (illuminated by streetlights)';
  else if (sim.solarPhase === 'sunset') lightingStatus = 'Golden sunset twilight';
  else if (sim.solarPhase === 'morning') lightingStatus = 'Morning daylight';
  else if (sim.cloudCoverage > 80 || sim.stormIntensity > 0.5) lightingStatus = 'Dim / overcast storm lighting';

  let travelSafety = 'Lower modeled weather impact; road conditions unknown';
  if (sim.stormIntensity > 0.7 || sim.windSpeedKmh > 55 || sim.rainIntensity > 0.8) {
    travelSafety = 'High risk — stay indoors if possible';
  } else if (sim.rainIntensity > 0.4 || sim.windSpeedKmh > 35) {
    travelSafety = 'Caution — slow down, prepare rain gear';
  } else if (sim.rainIntensity > 0.1) {
    travelSafety = 'Light rain — bring umbrella';
  }

  return {
    roadStatus,
    visibilityStatus,
    windStatus,
    lightingStatus,
    travelSafety,
  };
}
