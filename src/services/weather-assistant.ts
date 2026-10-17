import { LOCATION_CATALOG, resolveLocation, type WeatherLocation } from '../utils/locations';
import { requestForecast } from './forecast-provider';
import { currentForecastIndex, remainingForecast } from '../utils/time';
import { computeVerdict } from '../utils/trip-verdict';
export type Intent = 'compare' | 'forecast' | 'rain' | 'travel' | 'heat' | 'flood' | 'current' | 'unknown';
export interface Message { role: 'bot' | 'user'; text: string; followUps?: string[]; realityAction?: { region: string; city?: string; hourOffset?: number; label: string } }
export interface BotResponseResult { text: string; followUps: string[]; realityAction?: Message['realityAction'] }
export function detectIntent(input: string): Intent {
  const text = input.toLowerCase();
  if (/\b(compare|vs|kumpara|ihambing)\b/.test(text)) return 'compare';
  if (/\b(baha|flood|evacuation|shelter)\b/.test(text)) return 'flood';
  if (/\b(init|mainit|heat|temperature|temp|feels)\b/.test(text)) return 'heat';
  if (/\b(travel|byahe|biyahe|commute|drive|safe|lakad|trip)\b/.test(text)) return 'travel';
  if (/\b(bukas|tomorrow|week|forecast|linggo)\b/.test(text)) return 'forecast';
  if (/\b(ulan|rain|uulan|bagyo|storm)\b/.test(text)) return 'rain';
  if (/\b(weather|panahon|ngayon|current|today|now)\b/.test(text)) return 'current';
  return 'unknown';
}
/** Catalog coordinates only. Longest names win before broader overlapping aliases. */
export function assistantLocations(input: string): WeatherLocation[] {
  const text = input.toLowerCase();
  const aliases: [string,WeatherLocation][] = LOCATION_CATALOG.map(l => [l.source === 'catalog-city' ? l.name.toLowerCase() : l.region.toLowerCase(),l]);
  for (const [alias,region,city] of [['cebu','Central Visayas','Cebu City'],['baguio','CAR','Baguio'],['qc','NCR','Quezon City'],['metro manila','NCR',''],['davao','Davao','Davao City']] as const) {
    const loc = resolveLocation(region,city || null); if(loc) aliases.push([alias,loc]);
  }
  const matches = aliases.filter(([alias]) => {
    const index = text.indexOf(alias); return index >= 0 && !/[a-z]/.test(text[index-1] || '') && !/[a-z]/.test(text[index+alias.length] || '');
  }).sort((a,b)=>b[0].length-a[0].length);
  const chosen: WeatherLocation[] = []; const used: string[] = [];
  for(const [alias,location] of matches) {
    if(used.some(long => long.includes(alias)) || chosen.some(l=>l.id===location.id)) continue;
    chosen.push(location); used.push(alias);
  }
  return chosen.slice(0,2);
}
export async function generateBotResponse(input: string, selectedRegion: string, selectedCity?: string | null): Promise<BotResponseResult> {
  const intent = detectIntent(input);
  const followUps = [`Weather ngayon sa ${selectedRegion}`, `Forecast sa ${selectedRegion}`, 'Compare Manila vs Cebu'];
  if(intent === 'unknown') return { text: 'I can explain current-hour forecasts, rain, weekly forecasts, trip suitability and location comparisons. Subukan: “Uulan ba sa Baguio?” This is a rule-based guide, not generative AI.', followUps };
  if(intent === 'flood') return { text: 'Flood conditions and evacuation operations are unknown. Hindi sapat ang rain forecast para matukoy ang baha. Consult PAGASA and your local DRRMO/LGU through Official Sources. Never cross floodwater.', followUps };
  const locations = assistantLocations(input);
  const location = locations[0] ?? resolveLocation(selectedRegion, selectedCity);
  if(!location) return { text: 'Unknown location. Please choose a catalog city or region.', followUps };
  try {
    if(intent === 'compare') {
      if(locations.length < 2) return {text:'Please name two catalog locations, for example “Compare Manila vs Cebu”.',followUps};
      const results = await Promise.all(locations.map(l=>requestForecast(l)));
      return {text:results.map((data,i)=>{const hour=data.hourly[currentForecastIndex(data.hourly)];return `${locations[i].name}: ${hour.temperature}°C, rain probability ${hour.precipitation_probability}%, hourly rain ${hour.precipitation} mm, wind ${hour.wind_speed} km/h. Valid ${hour.time} PHT.`;}).join('\n')+'\nOpen-Meteo model forecasts; this comparison does not verify road safety.',followUps};
    }
    const data = await requestForecast(location);
    const future = remainingForecast(data.hourly); const hour = future[0];
    const source = `\nSource: Open-Meteo forecast. Valid ${hour.time} PHT. Retrieved ${new Date(data.metadata.retrievedAt).toLocaleString('en-PH',{timeZone:'Asia/Manila'})} PHT. ${data.metadata.delivery === 'cache' ? `Cached ${Math.floor(data.metadata.cacheAgeMs/60000)} min.` : ''}\nRepresentative point; hindi ito obserbasyon o opisyal na babala.`;
    let response: string;
    if(intent === 'forecast') response = data.daily.map(d=>`${d.date}: ${d.min_temp}–${d.max_temp}°C; mean hourly rain probability ${d.avg_prob}%; forecast total ${d.total_rain} mm.`).join('\n');
    else if(intent === 'travel') { const verdict=computeVerdict(future.slice(0,3)); response=verdict ? `Next up to 3 hours: ${verdict.verdict}, heuristic score ${verdict.score}/100. ${verdict.summary}\nMain factor: ${verdict.primaryFactor}. Roads, traffic and flood conditions are unverified.` : 'Trip suitability unavailable: insufficient critical data.'; }
    else if(intent === 'rain') response=`Next up to 6 hours: peak hourly rain probability ${Math.max(...future.slice(0,6).map(h=>h.precipitation_probability))}%; total forecast rain ${future.slice(0,6).reduce((s,h)=>s+h.precipitation,0).toFixed(1)} mm. Flood conditions are unknown.`;
    else if(intent === 'heat') response=`Forecast temperature ${hour.temperature}°C and humidity ${hour.humidity}%. These values are not an official heat-index advisory. Seek shade and hydration, and consult official heat guidance.`;
    else response=`${hour.temperature}°C · humidity ${hour.humidity}%\nRain probability ${hour.precipitation_probability}% · hourly rain ${hour.precipitation} mm\nWind ${hour.wind_speed} km/h · gusts ${hour.wind_gusts} km/h · visibility ${hour.visibility} m`;
    return {text:`${location.name}\n${response}${source}`, followUps, realityAction:{region:location.region, city:location.source==='catalog-city' ? location.name : undefined,label:`Explore ${location.name} visualization`}};
  } catch { return {text:'Forecast unavailable. Walang imbentong datos o expired forecast na ipapalit. Please retry or consult Official Sources.',followUps}; }
}
