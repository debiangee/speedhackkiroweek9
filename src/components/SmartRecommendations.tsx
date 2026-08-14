import type { HourlyData } from '../hooks/useWeatherData';
import { UmbrellaIcon, WindIcon, DropletIcon, AlertCircleIcon, CheckCircleIcon, CloudRainIcon } from './Icons';
import './SmartRecommendations.css';

interface Props {
  hourly: HourlyData[];
  region: string;
}

interface Recommendation {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  severity: 'safe' | 'caution' | 'warning' | 'danger';
}

function getUmbrellaRec(hourly: HourlyData[]): Recommendation {
  const maxProb = Math.max(...hourly.map((h) => h.precipitation_probability));
  const avgProb = hourly.reduce((s, h) => s + h.precipitation_probability, 0) / hourly.length;

  if (maxProb < 20) {
    return {
      id: 'umbrella',
      icon: <CheckCircleIcon size={20} color="#2e7d32" />,
      title: 'No umbrella needed',
      description: 'Very low chance of rain today. Leave the payong at home.',
      severity: 'safe',
    };
  }
  if (avgProb < 40) {
    return {
      id: 'umbrella',
      icon: <UmbrellaIcon size={20} color="#f57c00" />,
      title: 'Keep an umbrella handy',
      description: 'Light rain possible. A foldable umbrella in your bag is enough.',
      severity: 'caution',
    };
  }
  if (avgProb < 70) {
    return {
      id: 'umbrella',
      icon: <UmbrellaIcon size={20} color="#e65100" />,
      title: 'Bring your umbrella',
      description: 'Rain is likely today. Don\'t leave without it.',
      severity: 'warning',
    };
  }
  return {
    id: 'umbrella',
    icon: <CloudRainIcon size={20} color="#c62828" />,
    title: 'Heavy rain gear needed',
    description: 'Expect strong rain. Umbrella + waterproof bag recommended.',
    severity: 'danger',
  };
}

function getFloodRisk(hourly: HourlyData[]): Recommendation {
  const totalRain = hourly.reduce((s, h) => s + h.precipitation, 0);
  const maxHourlyRain = Math.max(...hourly.map((h) => h.precipitation));

  if (totalRain < 10 && maxHourlyRain < 5) {
    return {
      id: 'flood',
      icon: <CheckCircleIcon size={20} color="#2e7d32" />,
      title: 'No flood risk',
      description: 'Rainfall too light to cause flooding.',
      severity: 'safe',
    };
  }
  if (totalRain < 30 && maxHourlyRain < 15) {
    return {
      id: 'flood',
      icon: <DropletIcon size={20} color="#f57c00" />,
      title: 'Low flood risk',
      description: 'Minor puddles possible in low-lying areas. Avoid underpasses.',
      severity: 'caution',
    };
  }
  if (totalRain < 60) {
    return {
      id: 'flood',
      icon: <DropletIcon size={20} color="#e65100" />,
      title: 'Moderate flood risk',
      description: 'Streets may flood in known flood-prone areas. Plan alternate routes.',
      severity: 'warning',
    };
  }
  return {
    id: 'flood',
    icon: <AlertCircleIcon size={20} color="#c62828" />,
    title: 'High flood risk',
    description: 'Heavy rainfall expected. Avoid low areas and watch for flood advisories.',
    severity: 'danger',
  };
}

function getMotorcycleConditions(hourly: HourlyData[]): Recommendation {
  const avgProb = hourly.reduce((s, h) => s + h.precipitation_probability, 0) / hourly.length;
  const maxWind = Math.max(...hourly.map((h) => h.wind_speed));
  const maxRain = Math.max(...hourly.map((h) => h.precipitation));

  if (avgProb < 25 && maxWind < 30) {
    return {
      id: 'motorcycle',
      icon: <CheckCircleIcon size={20} color="#2e7d32" />,
      title: 'Good riding conditions',
      description: 'Roads should be dry. Safe for motorcycles and bikes.',
      severity: 'safe',
    };
  }
  if (avgProb < 50 && maxWind < 40) {
    return {
      id: 'motorcycle',
      icon: <WindIcon size={20} color="#f57c00" />,
      title: 'Ride with caution',
      description: 'Wet roads possible. Reduce speed and watch for slippery surfaces.',
      severity: 'caution',
    };
  }
  if (maxRain < 15 && maxWind < 50) {
    return {
      id: 'motorcycle',
      icon: <WindIcon size={20} color="#e65100" />,
      title: 'Risky riding conditions',
      description: 'Heavy rain and wind expected. Consider four-wheeled transport today.',
      severity: 'warning',
    };
  }
  return {
    id: 'motorcycle',
    icon: <AlertCircleIcon size={20} color="#c62828" />,
    title: 'Do not ride',
    description: 'Dangerous conditions for two-wheelers. Strong winds and heavy rain.',
    severity: 'danger',
  };
}

function getWindAlert(hourly: HourlyData[]): Recommendation | null {
  const maxWind = Math.max(...hourly.map((h) => h.wind_speed));

  if (maxWind < 30) return null;
  if (maxWind < 50) {
    return {
      id: 'wind',
      icon: <WindIcon size={20} color="#f57c00" />,
      title: 'Moderate winds',
      description: `Gusts up to ${Math.round(maxWind)} km/h. Secure loose items outdoors.`,
      severity: 'caution',
    };
  }
  return {
    id: 'wind',
    icon: <WindIcon size={20} color="#c62828" />,
    title: 'Strong wind warning',
    description: `Gusts up to ${Math.round(maxWind)} km/h. Avoid open areas and tall structures.`,
    severity: 'danger',
  };
}

export function SmartRecommendations({ hourly }: Props) {
  if (hourly.length === 0) return null;

  const recommendations: Recommendation[] = [
    getUmbrellaRec(hourly),
    getFloodRisk(hourly),
    getMotorcycleConditions(hourly),
  ];

  const windAlert = getWindAlert(hourly);
  if (windAlert) recommendations.push(windAlert);

  return (
    <div className="smart-recs" role="list" aria-label="Weather recommendations">
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className={`rec-card rec-${rec.severity}`}
          role="listitem"
          aria-label={`${rec.title}: ${rec.description}`}
        >
          <div className="rec-icon">{rec.icon}</div>
          <div className="rec-content">
            <strong className="rec-title">{rec.title}</strong>
            <p className="rec-desc">{rec.description}</p>
          </div>
          <div className={`rec-badge rec-badge-${rec.severity}`}>
            {rec.severity === 'safe' && 'Safe'}
            {rec.severity === 'caution' && 'Caution'}
            {rec.severity === 'warning' && 'Warning'}
            {rec.severity === 'danger' && 'Danger'}
          </div>
        </div>
      ))}
    </div>
  );
}
