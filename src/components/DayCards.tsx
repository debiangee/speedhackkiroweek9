import { type ReactNode } from 'react';
import { StormIcon, CloudRainIcon, CloudSunRainIcon, CloudSunIcon, SunIcon } from './Icons';
import type { DailySummary } from '../hooks/useWeatherData';
import './DayCards.css';

interface Props {
  daily: DailySummary[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function getDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-PH', { weekday: 'short' });
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function getRainVerdict(avgProb: number): { text: string; icon: ReactNode; color: string } {
  if (avgProb >= 70) return { text: 'Heavy rain', icon: <StormIcon size={28} color="#1565c0" />, color: '#1565c0' };
  if (avgProb >= 50) return { text: 'Rain likely', icon: <CloudRainIcon size={28} color="#1976d2" />, color: '#1976d2' };
  if (avgProb >= 30) return { text: 'Possible showers', icon: <CloudSunRainIcon size={28} color="#42a5f5" />, color: '#42a5f5' };
  if (avgProb >= 15) return { text: 'Mostly dry', icon: <CloudSunIcon size={28} color="#ff9800" />, color: '#ff9800' };
  return { text: 'Clear skies', icon: <SunIcon size={28} color="#4caf50" />, color: '#4caf50' };
}

export function DayCards({ daily, selectedDate, onSelectDate }: Props) {
  if (daily.length === 0) return null;

  return (
    <div className="day-cards">
      {daily.map((day, i) => {
        const verdict = getRainVerdict(day.avg_prob);
        const isSelected = day.date === selectedDate;
        return (
          <button
            key={day.date}
            className={`day-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectDate(day.date)}
            aria-pressed={isSelected}
          >
            <div className="day-card-header">
              <span className="day-name">{getDayName(day.date, i)}</span>
              <span className="day-date">{getDateLabel(day.date)}</span>
            </div>
            <span className="day-icon">{verdict.icon}</span>
            <div className="day-card-info">
              <span className="day-verdict" style={{ color: verdict.color }}>
                {verdict.text}
              </span>
              <span className="day-prob">{day.avg_prob}% rain</span>
              <span className="day-temp">{day.avg_temp}{'\u00B0'}C</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
