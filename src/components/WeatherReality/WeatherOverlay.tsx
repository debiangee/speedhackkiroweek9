import { useEffect, useRef, useState } from 'react';
import { WeatherSimulationState } from '../../utils/weatherSimulation';

interface WeatherOverlayProps {
  simState: WeatherSimulationState;
  enabled?: boolean;
}

export function WeatherOverlay({ simState, enabled = true }: WeatherOverlayProps) {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media?.matches ?? true);
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // CRITICAL REQUIREMENT: NO RAIN DATA = NO RAIN PARTICLES
    // If overlay is disabled or weather is dry (0 mm precipitation / non-rain condition):
    // Clear canvas immediately and do NOT run particle loop!
    if (!enabled || reduced) {
      ctx.clearRect(0, 0, width, height);
      return () => window.removeEventListener('resize', handleResize);
    }

    const hasRain = simState.shouldShowRain && simState.rainParticleCount > 0 && simState.precipitationMm > 0.05;
    const hasAtmosphericEffect = simState.fogDensity > 0.006 || simState.solarPhase === 'night' || simState.solarPhase === 'sunset';

    // If completely clear/sunny with no active atmospheric effects, keep canvas clean
    if (!hasRain && !hasAtmosphericEffect && simState.stormIntensity === 0) {
      ctx.clearRect(0, 0, width, height);
      return () => window.removeEventListener('resize', handleResize);
    }

    // Only create particles if actual rain is confirmed by meteorological data
    const particleCount = hasRain ? simState.rainParticleCount : 0;
    const drops = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * (10 + simState.rainIntensity * 12),
      speed: 16 + Math.random() * 10 + simState.rainIntensity * 12,
      opacity: 0.25 + Math.random() * 0.45,
    }));

    let lightningAlpha = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Atmospheric Haze only if real visibility is reduced (< 6000m)
      if (simState.visibilityMeters < 6000 || (simState.fogDensity > 0.006 && simState.shouldShowRain)) {
        const hazeOpacity = Math.min(0.25, (1 - simState.visibilityMeters / 10000) * 0.25);
        if (hazeOpacity > 0.02) {
          ctx.fillStyle = `rgba(180, 200, 220, ${hazeOpacity})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // 2. Night / Sunset subtle ambient tint (transparent)
      if (simState.solarPhase === 'night') {
        ctx.fillStyle = 'rgba(8, 14, 30, 0.22)';
        ctx.fillRect(0, 0, width, height);
      } else if (simState.solarPhase === 'sunset') {
        ctx.fillStyle = 'rgba(230, 110, 50, 0.08)';
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Rain Streak Particles — ONLY rendered if hasRain is true
      if (hasRain && drops.length > 0) {
        const windDrift = Math.sin(simState.rainAngleX) * 14;

        for (const d of drops) {
          ctx.strokeStyle = `rgba(220, 238, 255, ${d.opacity * (0.5 + simState.rainIntensity * 0.5)})`;
          ctx.lineWidth = simState.rainIntensity > 0.7 ? 1.5 : 1.0;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + windDrift, d.y + d.length);
          ctx.stroke();

          d.y += d.speed;
          d.x += windDrift;

          if (d.y > height) {
            d.y = -20;
            d.x = Math.random() * (width + Math.abs(windDrift) * 2) - Math.abs(windDrift);
          }
        }
      }

      // 4. Thunderstorm Lightning Flash — ONLY if actual thunderstorm condition
      if (simState.condition === 'thunderstorm' && simState.stormIntensity > 0 && Math.random() < simState.lightningProbability) {
        lightningAlpha = 0.7;
      }

      if (lightningAlpha > 0) {
        ctx.fillStyle = `rgba(240, 248, 255, ${lightningAlpha})`;
        ctx.fillRect(0, 0, width, height);
        lightningAlpha -= 0.09;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [simState, enabled, reduced]);

  if (!enabled) return null;

  return (
    <div className="weather-overlay-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="weather-overlay-canvas" />
    </div>
  );
}
