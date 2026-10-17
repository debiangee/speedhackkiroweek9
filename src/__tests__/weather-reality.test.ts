import { describe, it, expect } from 'vitest';
import {
  mapWeatherToSimulation,
  calculateWindEffect,
  calculateSolarPhase,
  interpolateSimulationStates,
  deriveExperienceReport,
  isRainCondition,
} from '../utils/weatherSimulation';
import { HourlyData } from '../hooks/useWeatherData';

const mockBaseHourly: HourlyData = {
  time: '2026-08-31T14:00',
  date: '2026-08-31',
  hour: 14,
  temperature: 29,
  humidity: 78,
  precipitation: 0,
  precipitation_probability: 10,
  wind_speed: 12,
  wind_gusts: 18,
  weather_code: 1,
  cloud_cover: 30,
  dew_point: 24,
  visibility: 10000,
  uv_index: 6,
};

describe('Weather Reality Simulation Engine — Strict Meteorological Accuracy', () => {
  describe('Absolute Rain Safety Rules (NO RAIN DATA = NO RAIN)', () => {
    it('TEST A — SUNNY: returns zero rain effects and dry road when weather is Clear and 0 mm precip', () => {
      const sunnyEntry: HourlyData = {
        ...mockBaseHourly,
        weather_code: 0,
        precipitation: 0,
        cloud_cover: 5,
      };
      const sim = mapWeatherToSimulation(sunnyEntry);

      expect(sim.condition).toBe('clear');
      expect(sim.shouldShowRain).toBe(false);
      expect(sim.rainParticleCount).toBe(0);
      expect(sim.rainIntensity).toBe(0);
      expect(sim.wetness).toBe(0);
      expect(sim.puddleIntensity).toBe(0);
      expect(sim.stormIntensity).toBe(0);
    });

    it('TEST B — CLOUDY: returns zero rain when Overcast but 0 mm precipitation', () => {
      const cloudyEntry: HourlyData = {
        ...mockBaseHourly,
        weather_code: 3,
        precipitation: 0,
        cloud_cover: 95,
      };
      const sim = mapWeatherToSimulation(cloudyEntry);

      expect(sim.condition).toBe('cloudy');
      expect(sim.weatherCondition).toBe('Overcast');
      expect(sim.shouldShowRain).toBe(false);
      expect(sim.rainParticleCount).toBe(0);
      expect(sim.rainIntensity).toBe(0);
      expect(sim.wetness).toBe(0);
    });

    it('TEST C — LIGHT RAIN: activates subtle rain visualization when actual light precipitation is reported', () => {
      const lightRainEntry: HourlyData = {
        ...mockBaseHourly,
        weather_code: 61,
        precipitation: 1.2,
      };
      const sim = mapWeatherToSimulation(lightRainEntry);

      expect(sim.condition).toBe('light-rain');
      expect(sim.shouldShowRain).toBe(true);
      expect(sim.rainParticleCount).toBeGreaterThan(0);
      expect(sim.rainIntensity).toBeGreaterThan(0);
      expect(sim.rainIntensity).toBeLessThanOrEqual(0.4);
      expect(sim.wetness).toBeGreaterThan(0);
    });

    it('TEST D — HEAVY RAIN: scales rain particles and wetness for heavy precipitation', () => {
      const heavyRainEntry: HourlyData = {
        ...mockBaseHourly,
        weather_code: 65,
        precipitation: 12.0,
      };
      const sim = mapWeatherToSimulation(heavyRainEntry);

      expect(sim.condition).toBe('heavy-rain');
      expect(sim.shouldShowRain).toBe(true);
      expect(sim.rainParticleCount).toBeGreaterThan(150);
      expect(sim.rainIntensity).toBeGreaterThan(0.7);
      expect(sim.wetness).toBeGreaterThan(0.7);
    });

    it('TEST E — THUNDERSTORM: enables thunderstorm classification and storm intensity', () => {
      const stormEntry: HourlyData = {
        ...mockBaseHourly,
        weather_code: 95,
        precipitation: 15.0,
      };
      const sim = mapWeatherToSimulation(stormEntry);

      expect(sim.condition).toBe('thunderstorm');
      expect(sim.shouldShowRain).toBe(true);
      expect(sim.stormIntensity).toBeGreaterThan(0.7);
      expect(sim.lightningProbability).toBeGreaterThan(0);
    });

    it('TEST F — FORECAST TRANSITION: preserves zero rain between dry hours and only introduces rain at rainy hour', () => {
      const nowDry = mapWeatherToSimulation({ ...mockBaseHourly, precipitation: 0, weather_code: 0 });
      const plus1HDry = mapWeatherToSimulation({ ...mockBaseHourly, precipitation: 0, weather_code: 1 });
      const plus2HRain = mapWeatherToSimulation({ ...mockBaseHourly, precipitation: 3.5, weather_code: 63 });

      // Between NOW and +1H (both dry)
      const interpolatedDry = interpolateSimulationStates(nowDry, plus1HDry, 0.5);
      expect(interpolatedDry.shouldShowRain).toBe(false);
      expect(interpolatedDry.rainParticleCount).toBe(0);
      expect(interpolatedDry.precipitationMm).toBe(0);

      // Between +1H (dry) and +2H (rain)
      const interpolatedTransition = interpolateSimulationStates(plus1HDry, plus2HRain, 0.5);
      expect(interpolatedTransition.precipitationMm).toBeGreaterThan(0);
      expect(interpolatedTransition.shouldShowRain).toBe(true);
      expect(interpolatedTransition.rainParticleCount).toBeGreaterThan(0);
    });
  });

  describe('isRainCondition helper', () => {
    it('correctly identifies valid rain conditions vs dry codes', () => {
      expect(isRainCondition(0, 0)).toBe(false);
      expect(isRainCondition(1, 0)).toBe(false);
      expect(isRainCondition(3, 0)).toBe(false);
      expect(isRainCondition(61, 0)).toBe(false); // Rain code but 0 mm -> false!
      expect(isRainCondition(61, 0.5)).toBe(true); // Rain code + precipitation -> true
      expect(isRainCondition(95, 10)).toBe(true);
    });
  });

  describe('Wind & Solar Calculations', () => {
    it('calculates wind deflection angle and strength', () => {
      const calm = calculateWindEffect(5, 45);
      const strong = calculateWindEffect(45, 45);

      expect(calm.windStrength).toBeLessThan(strong.windStrength);
      expect(Math.abs(strong.angleX)).toBeGreaterThan(Math.abs(calm.angleX));
    });

    it('identifies solar phases accurately', () => {
      expect(calculateSolarPhase(6, 30).phase).toBe('morning');
      expect(calculateSolarPhase(12, 0).phase).toBe('midday');
      expect(calculateSolarPhase(18, 0).phase).toBe('sunset');
      expect(calculateSolarPhase(22, 0).phase).toBe('night');
    });
  });

  describe('deriveExperienceReport', () => {
    it('generates truthful human experience descriptions', () => {
      const sunnySim = mapWeatherToSimulation({ ...mockBaseHourly, weather_code: 0, precipitation: 0 });
      const sunnyExp = deriveExperienceReport(sunnySim);
      expect(sunnyExp.roadStatus).toContain('Dry');
      expect(sunnyExp.travelSafety).toContain('road conditions unknown');

      const stormSim = mapWeatherToSimulation({ ...mockBaseHourly, weather_code: 95, precipitation: 15 });
      const stormExp = deriveExperienceReport(stormSim);
      expect(stormExp.roadStatus).toContain('standing water unverified');
      expect(stormExp.travelSafety).toContain('High risk');
    });
  });
});
