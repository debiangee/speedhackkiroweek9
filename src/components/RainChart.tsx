import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { DailySummary } from '../hooks/useWeatherData';

interface Props {
  daily: DailySummary[];
}

export function RainChart({ daily }: Props) {
  if (daily.length === 0) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading...</p>;

  const data = daily.map((d) => ({
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }),
    rain_probability: d.avg_prob,
    rainfall: d.total_rain,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
          formatter={(value: number, name: string) => [
            name === 'rain_probability' ? `${value}%` : `${value} mm`,
            name === 'rain_probability' ? 'Rain Chance' : 'Rainfall',
          ]}
        />
        <ReferenceLine
          y={50}
          stroke="#ff9800"
          strokeDasharray="5 5"
          label={{ value: 'Likely rain', position: 'insideTopRight', fontSize: 9, fill: '#ff9800' }}
        />
        <Area
          type="monotone"
          dataKey="rain_probability"
          stroke="#1a73e8"
          fillOpacity={1}
          fill="url(#rainGrad)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#1a73e8', strokeWidth: 2, stroke: 'white' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
