import { summarizeHours } from '../utils/daily';
import { criticalHazard, hasCriticalData } from '../utils/trip-verdict';
import { useState, useMemo } from 'react';
import { type HourlyData, type DailySummary } from '../hooks/useWeatherData';
import { SunIcon, CheckCircleIcon, AlertCircleIcon, BeachIcon, HikingIcon, CarIcon, EventIcon, BicycleIcon } from './Icons';
import './ActivityPlanner.css';

interface ActivityPlannerProps {
  hourly: HourlyData[];
  daily: DailySummary[];
}

type Activity = 'beach' | 'hiking' | 'commute' | 'outdoor-event' | 'cycling';

const ACTIVITIES: { id: Activity; label: string; renderIcon: () => JSX.Element }[] = [
  { id: 'beach', label: 'Beach', renderIcon: () => <BeachIcon size={18} color="currentColor" /> },
  { id: 'hiking', label: 'Hiking', renderIcon: () => <HikingIcon size={18} color="currentColor" /> },
  { id: 'commute', label: 'Commute', renderIcon: () => <CarIcon size={18} color="currentColor" /> },
  { id: 'outdoor-event', label: 'Outdoor Event', renderIcon: () => <EventIcon size={18} color="currentColor" /> },
  { id: 'cycling', label: 'Cycling', renderIcon: () => <BicycleIcon size={18} color="currentColor" /> },
];

interface DayScore {
  date: string;
  label: string;
  score: number; // 0-100, higher is better
  reason: string;
  verdict: 'great' | 'okay' | 'avoid';
}

export function scoreDay(activity: Activity, day: DailySummary, dayHourly: HourlyData[]): DayScore {
  const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
  
  if (!dayHourly.length || dayHourly.some(h => !hasCriticalData(h))) return { date: day.date, label: dateLabel, score: 0, reason: 'Weather suitability unavailable', verdict: 'avoid' };
  const hazard = dayHourly.map(criticalHazard).find(Boolean);
  if (hazard) return { date: day.date, label: dateLabel, score: 0, reason: `${hazard}; consult official sources`, verdict: 'avoid' };
  day = summarizeHours(dayHourly)[0];
  let score = 100;
  let reason = '';

  // Rain penalty (universal)
  score -= day.avg_prob * 0.6;
  score -= day.total_rain * 2;

  switch (activity) {
    case 'beach':
      // Prefer high temps, low wind
      if (day.max_temp < 28) score -= 15;
      if (day.max_temp >= 32) score += 5;
      const avgWind = dayHourly.length > 0 ? dayHourly.reduce((s, h) => s + h.wind_speed, 0) / dayHourly.length : 0;
      if (avgWind > 30) score -= 20;
      reason = day.avg_prob < 20 ? 'Clear skies, warm weather' :
        day.avg_prob < 50 ? 'Some clouds but manageable' : 'High rain risk';
      break;

    case 'hiking':
      // Prefer cooler temps, absolutely no heavy rain
      if (day.max_temp > 34) score -= 10;
      if (day.avg_prob > 50) score -= 30;
      reason = day.avg_prob < 30 ? 'Lower forecast disruption; trails unverified' :
        day.avg_prob < 60 ? 'Trails may be slippery' : 'Too risky — slippery trails';
      break;

    case 'commute':
      // Moderate rain is main concern (flooding)
      if (day.total_rain > 20) score -= 40;
      else if (day.total_rain > 10) score -= 20;
      reason = day.total_rain < 5 ? 'Lower forecast rainfall; traffic unknown' :
        day.total_rain < 15 ? 'Forecast rain may affect plans; traffic unknown' : 'Higher forecast rainfall; flood conditions unknown';
      break;

    case 'outdoor-event':
      // No rain is critical
      if (day.avg_prob > 40) score -= 40;
      if (day.total_rain > 5) score -= 20;
      reason = day.avg_prob < 20 ? 'Lower forecast rain probability' :
        day.avg_prob < 50 ? 'Have a backup plan' : 'Consider indoor venue';
      break;

    case 'cycling':
      // Wind + rain combo is worst
      const windAvg = dayHourly.length > 0 ? dayHourly.reduce((s, h) => s + h.wind_speed, 0) / dayHourly.length : 0;
      if (windAvg > 25) score -= 25;
      if (day.total_rain > 10) score -= 30;
      reason = day.avg_prob < 25 && windAvg < 20 ? 'Lower forecast rain and wind; roads unverified' :
        day.avg_prob < 50 ? 'Bring rain gear' : 'Higher forecast rain probability';
      break;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const verdict: 'great' | 'okay' | 'avoid' =
    score >= 70 ? 'great' : score >= 40 ? 'okay' : 'avoid';

  return { date: day.date, label: dateLabel, score, reason, verdict };
}

export function ActivityPlanner({ hourly, daily }: ActivityPlannerProps) {
  const [selected, setSelected] = useState<Activity>('beach');

  const recommendations = useMemo(() => {
    return daily.map((day) => {
      const dayHourly = hourly.filter((h) => h.date === day.date);
      return scoreDay(selected, day, dayHourly);
    }).filter(day => hourly.some(h => h.date === day.date)).sort((a, b) => b.score - a.score);
  }, [selected, daily, hourly]);

  const bestDay = recommendations[0];

  return (
    <div className="activity-planner">
      <p>Ranks remaining forecast hours by rain, wind and temperature. Scores are product heuristics, not safety probabilities. Waves, trails, roads and flood conditions are unknown.</p>
      <div className="activity-selector">
        {ACTIVITIES.map((a) => (
          <button
            key={a.id}
            className={`activity-chip ${selected === a.id ? 'active' : ''}`}
            onClick={() => setSelected(a.id)}
            aria-pressed={selected === a.id}
          >
            <span className="activity-icon" aria-hidden="true">{a.renderIcon()}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {bestDay && (
        <div className="activity-best-day">
          <SunIcon size={16} color="#f59e0b" />
          <span>Best day: <strong>{bestDay.label}</strong> — {bestDay.reason}</span>
        </div>
      )}

      <div className="activity-days">
        {recommendations.map((day) => (
          <div key={day.date} className={`activity-day-row verdict-${day.verdict}`}>
            <div className="day-verdict-icon">
              {day.verdict === 'great' && <CheckCircleIcon size={16} color="#16a34a" />}
              {day.verdict === 'okay' && <AlertCircleIcon size={16} color="#d97706" />}
              {day.verdict === 'avoid' && <AlertCircleIcon size={16} color="#dc2626" />}
            </div>
            <span className="day-label">{day.label}</span>
            <div className="day-score-bar">
              <div
                className={`day-score-fill verdict-fill-${day.verdict}`}
                style={{ width: `${day.score}%` }}
              />
            </div>
            <span className={`day-score-badge verdict-badge-${day.verdict}`}>{day.score}</span>
            <span className="day-reason">{day.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
