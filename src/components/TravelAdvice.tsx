import {
  CheckCircleIcon,
  AlertCircleIcon,
  UmbrellaIcon,
  CloudLightningIcon,
  ThermometerIcon,
  DropletIcon,
  WindIcon,
  CloudRainIcon,
} from './Icons';
import { getRegionLabel } from '../utils/regions';
import type { HourlyData } from '../hooks/useWeatherData';
import './TravelAdvice.css';

interface Props {
  hourly: HourlyData[];
  region: string;
}

function getAdvice(avgProb: number, totalRain: number) {
  if (avgProb >= 70) {
    return {
      verdict: 'Not a good day to go out',
      subtext: 'Heavy rain makes outdoor plans risky',
      Icon: CloudLightningIcon,
      color: '#c62828',
      bg: 'var(--danger-light)',
      level: 'danger' as const,
      tips: [
        'Heavy rain expected — stay indoors if possible',
        'If you must travel, bring heavy rain gear',
        'Watch out for flooding in low areas',
        'Consider rescheduling outdoor plans',
      ],
    };
  }
  if (avgProb >= 50) {
    return {
      verdict: 'Bring your umbrella!',
      subtext: 'Rain is likely — plan around dry windows',
      Icon: UmbrellaIcon,
      color: '#e65100',
      bg: 'var(--warning-light)',
      level: 'warning' as const,
      tips: [
        'Rain is likely, especially in the afternoon',
        'Pack a waterproof bag for electronics',
        'Wear shoes that can handle puddles',
        'Have an indoor backup plan ready',
      ],
    };
  }
  if (avgProb >= 30) {
    return {
      verdict: 'Might rain — be prepared',
      subtext: totalRain > 5 ? 'Some showers expected, but manageable' : 'Light chance, keep an umbrella handy',
      Icon: AlertCircleIcon,
      color: '#f57c00',
      bg: 'var(--warning-light)',
      level: 'caution' as const,
      tips: [
        'Light showers are possible',
        'Keep a small umbrella in your bag',
        'Morning hours are usually drier',
        'Outdoor plans should be okay with backup',
      ],
    };
  }
  return {
    verdict: 'Great day to go out!',
    subtext: 'Clear skies and low rain probability',
    Icon: CheckCircleIcon,
    color: '#2e7d32',
    bg: 'var(--success-light)',
    level: 'safe' as const,
    tips: [
      'Low chance of rain — enjoy your day!',
      'Don\'t forget sunscreen if outdoors',
      'Stay hydrated in the heat',
      'Perfect for outdoor activities',
    ],
  };
}

export function TravelAdvice({ hourly, region }: Props) {
  if (hourly.length === 0) return null;

  const avgProb = Math.round(hourly.reduce((s, h) => s + h.precipitation_probability, 0) / hourly.length);
  const avgTemp = Math.round((hourly.reduce((s, h) => s + h.temperature, 0) / hourly.length) * 10) / 10;
  const avgHumidity = Math.round(hourly.reduce((s, h) => s + h.humidity, 0) / hourly.length);
  const avgWind = Math.round((hourly.reduce((s, h) => s + h.wind_speed, 0) / hourly.length) * 10) / 10;
  const totalRain = Math.round(hourly.reduce((s, h) => s + h.precipitation, 0) * 10) / 10;

  const advice = getAdvice(avgProb, totalRain);
  const AdviceIcon = advice.Icon;

  return (
    <div className={`travel-advice travel-advice-${advice.level}`} style={{ borderLeftColor: advice.color }}>
      {/* Primary verdict — largest, most visible element */}
      <div className="advice-header">
        <div className="advice-icon-wrap" style={{ background: advice.color }}>
          <AdviceIcon size={24} color="white" />
        </div>
        <div className="advice-header-text">
          <h3 className="advice-verdict" style={{ color: advice.color }}>
            {advice.verdict}
          </h3>
          <span className="advice-subtext">{advice.subtext}</span>
          <span className="advice-region">{getRegionLabel(region)} · {avgProb}% avg rain chance</span>
        </div>
      </div>

      {/* At-a-glance stats — secondary info layer */}
      <div className="advice-stats" role="group" aria-label="Current conditions summary">
        <div className="stat" aria-label={`Temperature: ${avgTemp} degrees Celsius`}>
          <ThermometerIcon size={18} color="#e65100" />
          <span className="stat-value">{avgTemp}°C</span>
          <span className="stat-label">Temp</span>
        </div>
        <div className="stat" aria-label={`Humidity: ${avgHumidity} percent`}>
          <DropletIcon size={18} color="#1565c0" />
          <span className="stat-value">{avgHumidity}%</span>
          <span className="stat-label">Humidity</span>
        </div>
        <div className="stat" aria-label={`Wind speed: ${avgWind} kilometers per hour`}>
          <WindIcon size={18} color="#546e7a" />
          <span className="stat-value">{avgWind}</span>
          <span className="stat-label">Wind km/h</span>
        </div>
        <div className="stat" aria-label={`Total rainfall: ${totalRain} millimeters`}>
          <CloudRainIcon size={18} color="#1976d2" />
          <span className="stat-value">{totalRain}</span>
          <span className="stat-label">Rain mm</span>
        </div>
      </div>

      {/* Actionable tips — tertiary info */}
      <ul className="advice-tips" aria-label="Practical tips for today">
        {advice.tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
