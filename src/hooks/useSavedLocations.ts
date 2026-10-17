import { useState, useEffect } from 'react';
import { locationById, resolveLocation } from '../utils/locations';
import { readPreference, writePreference } from '../utils/storage';
export const SAVED_KEY = 'weather-lang-saved-locations-v1';
export function normalizeSavedLocations(input: unknown): string[] {
  if(!Array.isArray(input)) return [];
  return [...new Set(input.filter((id): id is string => typeof id==='string').map(id=>locationById(id)?.id ?? resolveLocation(id)?.id).filter((id): id is string=>Boolean(id)))].slice(0,12);
}
function load(): string[] {
  try { return normalizeSavedLocations(JSON.parse(readPreference(SAVED_KEY) ?? readPreference('ph-rain-favorites') ?? '[]')); } catch { return []; }
}
export function useSavedLocations() {
  const [ids,setIds] = useState(load);
  const [notice,setNotice] = useState<string | null>(null);
  useEffect(()=>{writePreference(SAVED_KEY,JSON.stringify(ids));},[ids]);
  function toggle(id: string) {
    if(!locationById(id)) return;
    setNotice(null);
    if(ids.includes(id)) setIds(ids.filter(item=>item!==id));
    else if(ids.length>=12) setNotice('Up to 12 saved locations. Remove one before adding another.');
    else setIds([...ids,id]);
  }
  return {locations:ids.map(id=>locationById(id)!), isSaved:(id:string)=>ids.includes(id), toggle, notice};
}
