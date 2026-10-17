import { manilaDate } from '../utils/time';
import { type ReactNode } from 'react';
import { StormIcon, CloudRainIcon, CloudSunRainIcon, CloudSunIcon, SunIcon } from './Icons';
import type { DailySummary } from '../hooks/useWeatherData';
import './DayCards.css';

interface Props {
  daily: DailySummary[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function getWeekday(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase();
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function getRainVerdict(avgProb: number): { text: string; icon: ReactNode; className: string } {
  if (avgProb >= 70) {
    return {
      text: 'Heavy rain',
      icon: <StormIcon size={26} className="day-weather-svg storm" />,
      className: 'verdict-heavy-rain',
    };
  }
  if (avgProb >= 50) {
    return {
      text: 'Rain likely',
      icon: <CloudRainIcon size={26} className="day-weather-svg rain" />,
      className: 'verdict-rain-likely',
    };
  }
  if (avgProb >= 30) {
    return {
      text: 'Showers',
      icon: <CloudSunRainIcon size={26} className="day-weather-svg showers" />,
      className: 'verdict-showers',
    };
  }
  if (avgProb >= 15) {
    return {
      text: 'Mostly dry',
      icon: <CloudSunIcon size={26} className="day-weather-svg mostly-dry" />,
      className: 'verdict-mostly-dry',
    };
  }
  return {
    text: 'Clear skies',
    icon: <SunIcon size={26} className="day-weather-svg clear" />,
    className: 'verdict-clear',
  };
}

export function DayCards({ daily, selectedDate, onSelectDate }: Props) {
  if (daily.length === 0) return null;

  return (
    <div className="day-cards" role="tablist" aria-label="7-day weather forecast">
      {daily.map((day) => {
        const verdict = getRainVerdict(day.avg_prob);
        const isSelected = day.date === selectedDate;
        const isToday = day.date === manilaDate();
        const maxTemp = Math.round(day.max_temp ?? day.avg_temp);
        const minTemp = Math.round(day.min_temp ?? day.avg_temp - 4);

        return (
          <button
            key={day.date}
            className={`day-card ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
            onClick={() => onSelectDate(day.date)}
            role="tab"
            tabIndex={isSelected ? 0 : -1}
            id={`forecast-day-${day.date}`}
            aria-controls="forecast-day-panel"
            onKeyDown={e => {
              const directions = ['ArrowLeft','ArrowRight','Home','End'];
              if (!directions.includes(e.key)) return;
              e.preventDefault();
              const index = daily.findIndex(d=>d.date===day.date);
              const next = e.key === 'Home' ? 0 : e.key === 'End' ? daily.length-1 : (index+(e.key==='ArrowRight'?1:-1)+daily.length)%daily.length;
              onSelectDate(daily[next].date);
              e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}
            aria-selected={isSelected}
            aria-label={`${isToday ? 'Today, ' : ''}${getWeekday(day.date)} ${getDateLabel(day.date)}: ${verdict.text}, High ${maxTemp}°C, Low ${minTemp}°C, Rain ${day.avg_prob}%`}
          >
            {/* Header: Weekday + Date + Today Badge */}
            <div className="day-card-header">
              <div className="day-name-row">
                <span className="day-weekday">{getWeekday(day.date)}</span>
                {isToday && <span className="today-badge">TODAY</span>}
              </div>
              <span className="day-date">{getDateLabel(day.date)}</span>
            </div>

            {/* Weather SVG Icon */}
            <div className="day-icon-wrapper" aria-hidden="true">
              {verdict.icon}
            </div>

            {/* Temperatures: High / Low */}
            <div className="day-temps-row">
              <span className="temp-high">{maxTemp}°</span>
              <span className="temp-low">{minTemp}°</span>
            </div>

            {/* Rain Prob & Verdict */}
            <div className="day-card-footer">
              <span className={`day-verdict-pill ${verdict.className}`}>
                {verdict.text}
              </span>
              <span className="day-rain-prob">Rain {day.avg_prob}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
