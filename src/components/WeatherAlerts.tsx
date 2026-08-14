import { useState, useEffect } from 'react';
import { AlertCircleIcon, XIcon, WindIcon } from './Icons';
import './WeatherAlerts.css';

interface WeatherAlert {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  regions: string[];
  expires?: string;
}

// Determine alerts based on current weather data
function generateAlerts(windSpeed: number, rainMm: number, region: string): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (windSpeed > 60) {
    alerts.push({
      id: 'storm-' + region,
      severity: 'danger',
      title: 'Storm Warning Signal #2',
      message: `Winds exceeding ${Math.round(windSpeed)} km/h detected. Avoid travel to coastal areas. Check PAGASA for official storm signals.`,
      regions: [region],
    });
  } else if (windSpeed > 40) {
    alerts.push({
      id: 'wind-' + region,
      severity: 'warning',
      title: 'Strong Wind Advisory',
      message: `Wind speeds of ${Math.round(windSpeed)} km/h expected. Secure loose items and avoid unnecessary outdoor activities.`,
      regions: [region],
    });
  }

  if (rainMm > 30) {
    alerts.push({
      id: 'flood-' + region,
      severity: 'danger',
      title: 'Heavy Rain & Flood Warning',
      message: `${Math.round(rainMm)}mm rainfall recorded. Flash flood risk is HIGH. Avoid low-lying areas and waterways.`,
      regions: [region],
    });
  } else if (rainMm > 15) {
    alerts.push({
      id: 'rain-' + region,
      severity: 'warning',
      title: 'Heavy Rain Advisory',
      message: `${Math.round(rainMm)}mm rainfall expected. Carry rain gear and expect road flooding in low areas.`,
      regions: [region],
    });
  }

  return alerts;
}

interface WeatherAlertsProps {
  windSpeed: number;
  rainMm: number;
  region: string;
}

export function WeatherAlerts({ windSpeed, rainMm, region }: WeatherAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);

  useEffect(() => {
    const newAlerts = generateAlerts(windSpeed, rainMm, region);
    setAlerts(newAlerts);
  }, [windSpeed, rainMm, region]);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  if (visibleAlerts.length === 0) return null;

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <div className="weather-alerts" role="alert" aria-live="polite">
      {visibleAlerts.map((alert) => (
        <div key={alert.id} className={`alert-card alert-${alert.severity}`}>
          <div className="alert-icon">
            {alert.severity === 'danger' ? (
              <WindIcon size={20} color="#dc2626" />
            ) : (
              <AlertCircleIcon size={20} color={alert.severity === 'warning' ? '#e65100' : '#1a73e8'} />
            )}
          </div>
          <div className="alert-body">
            <strong className="alert-title">{alert.title}</strong>
            <p className="alert-message">{alert.message}</p>
          </div>
          <button
            className="alert-dismiss"
            onClick={() => dismiss(alert.id)}
            aria-label={`Dismiss ${alert.title}`}
          >
            <XIcon size={14} color="currentColor" />
          </button>
        </div>
      ))}
    </div>
  );
}
