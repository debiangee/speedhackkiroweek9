import { useState, useEffect, useMemo } from 'react';
import {
  runOptimization,
  optimizeWeek,
  GOALS,
  type GoalType,
  type OptimizationResult,
  type ReasoningStep,
} from '../utils/optimization-engine';
import type { HourlyData, DailySummary } from '../hooks/useWeatherData';
import { CheckCircleIcon, AlertCircleIcon, ClockIcon, TrendingUpIcon } from './Icons';
import './OptimizationPanel.css';

interface Props {
  hourly: HourlyData[];
  daily: DailySummary[];
  region: string;
}

function ImpactDot({ impact }: { impact: ReasoningStep['impact'] }) {
  const colors = { positive: '#2e7d32', neutral: '#f57c00', negative: '#c62828' };
  return (
    <span
      className="impact-dot"
      style={{ background: colors[impact] }}
      aria-label={impact}
    />
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 70 ? '#2e7d32' : value >= 45 ? '#f57c00' : '#c62828';
  return (
    <div className="confidence-meter" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="confidence-label" style={{ color }}>{value}/100</span>
    </div>
  );
}

export function OptimizationPanel({ hourly, daily, region: _region }: Props) {
  const [selectedGoal, setSelectedGoal] = useState<GoalType>('commute');
  const [showReasoning, setShowReasoning] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Run the optimization loop whenever data or goal changes
  const result: OptimizationResult = useMemo(
    () => runOptimization(hourly, selectedGoal),
    [hourly, selectedGoal]
  );

  const weekResult = useMemo(
    () => optimizeWeek(daily, selectedGoal),
    [daily, selectedGoal]
  );

  // Animate on result change
  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [result.iterationCount, selectedGoal]);

  const bestDayLabel = weekResult.bestDay
    ? new Date(weekResult.bestDay + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
    : '—';

  return (
    <div className="optimization-panel" aria-label="Smart Optimization">
      {/* Goal selector */}
      <div className="opt-goals" role="radiogroup" aria-label="Select your goal">
        {GOALS.map((g) => (
          <button
            key={g.type}
            className={`opt-goal-btn ${selectedGoal === g.type ? 'active' : ''}`}
            onClick={() => setSelectedGoal(g.type)}
            role="radio"
            aria-checked={selectedGoal === g.type}
            title={g.description}
          >
            <span className="opt-goal-icon">{g.icon}</span>
            <span className="opt-goal-label">{g.label}</span>
          </button>
        ))}
      </div>

      {/* Result card */}
      <div className={`opt-result ${animateIn ? 'visible' : ''}`}>
        {/* Verdict */}
        <div className="opt-verdict-row">
          <div className="opt-verdict-icon">
            {result.confidence >= 60
              ? <CheckCircleIcon size={22} color="#2e7d32" />
              : <AlertCircleIcon size={22} color="#e65100" />}
          </div>
          <div className="opt-verdict-text">
            <strong className="opt-verdict">{result.verdict}</strong>
            <span className="opt-meta">
              Iteration #{result.iterationCount} · {result.lastUpdated}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div className="opt-confidence-section">
          <span className="opt-section-label">Confidence Score</span>
          <ConfidenceMeter value={result.confidence} />
        </div>

        {/* Best window */}
        {result.bestWindow && (
          <div className="opt-window opt-window-best">
            <ClockIcon size={16} color="#2e7d32" />
            <div>
              <span className="opt-window-label">Best Window</span>
              <strong className="opt-window-time">{result.bestWindow.label}</strong>
              <span className="opt-window-score">Score: {result.bestWindow.score}/100</span>
            </div>
          </div>
        )}

        {/* Avoid windows */}
        {result.avoidWindows.length > 0 && (
          <div className="opt-window opt-window-avoid">
            <AlertCircleIcon size={16} color="#c62828" />
            <div>
              <span className="opt-window-label">Avoid</span>
              {result.avoidWindows.map((w, i) => (
                <span key={i} className="opt-window-time avoid">{w.label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Best day this week */}
        <div className="opt-best-day">
          <TrendingUpIcon size={16} color="var(--accent)" />
          <span>Best day this week: <strong>{bestDayLabel}</strong></span>
        </div>

        {/* Suggestions */}
        <ul className="opt-suggestions">
          {result.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>

        {/* Reasoning toggle */}
        <button
          className="opt-reasoning-toggle"
          onClick={() => setShowReasoning(!showReasoning)}
          aria-expanded={showReasoning}
        >
          {showReasoning ? 'Hide' : 'Show'} reasoning ({result.reasoning.length} signals)
        </button>

        {showReasoning && (
          <div className="opt-reasoning" role="list" aria-label="Optimization reasoning steps">
            {result.reasoning.map((step, i) => (
              <div key={i} className="opt-reason-row" role="listitem">
                <ImpactDot impact={step.impact} />
                <div className="opt-reason-content">
                  <div className="opt-reason-header">
                    <span className="opt-reason-signal">{step.signal}</span>
                    <span className="opt-reason-value">{step.value}</span>
                  </div>
                  <p className="opt-reason-explain">{step.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
