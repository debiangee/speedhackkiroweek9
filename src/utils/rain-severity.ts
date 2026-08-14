// Rain severity color system
// Colors are universally understood faster than numbers

export type SeverityLevel = 'none' | 'light' | 'moderate' | 'heavy' | 'extreme';

export interface SeverityInfo {
  level: SeverityLevel;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export function getRainSeverity(precipMm: number, probability: number): SeverityInfo {
  if (precipMm <= 0 && probability < 20) {
    return { level: 'none', label: 'Clear', color: '#4caf50', bgColor: '#f1f8e9', textColor: '#2e7d32' };
  }
  if (precipMm <= 2.5 || probability < 40) {
    return { level: 'light', label: 'Light', color: '#66bb6a', bgColor: '#e8f5e9', textColor: '#2e7d32' };
  }
  if (precipMm <= 7.5 || probability < 65) {
    return { level: 'moderate', label: 'Moderate', color: '#ffa726', bgColor: '#fff3e0', textColor: '#e65100' };
  }
  if (precipMm <= 15 || probability < 85) {
    return { level: 'heavy', label: 'Heavy', color: '#ef5350', bgColor: '#fce4ec', textColor: '#c62828' };
  }
  return { level: 'extreme', label: 'Extreme', color: '#b71c1c', bgColor: '#ffebee', textColor: '#b71c1c' };
}

// Severity for hourly probability only
export function getProbabilitySeverity(probability: number): SeverityInfo {
  if (probability < 20) {
    return { level: 'none', label: 'Clear', color: '#4caf50', bgColor: '#f1f8e9', textColor: '#2e7d32' };
  }
  if (probability < 40) {
    return { level: 'light', label: 'Light', color: '#66bb6a', bgColor: '#e8f5e9', textColor: '#2e7d32' };
  }
  if (probability < 65) {
    return { level: 'moderate', label: 'Moderate', color: '#ffa726', bgColor: '#fff3e0', textColor: '#e65100' };
  }
  if (probability < 85) {
    return { level: 'heavy', label: 'Heavy', color: '#ef5350', bgColor: '#fce4ec', textColor: '#c62828' };
  }
  return { level: 'extreme', label: 'Extreme', color: '#b71c1c', bgColor: '#ffebee', textColor: '#b71c1c' };
}
