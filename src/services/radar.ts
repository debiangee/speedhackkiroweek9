export interface RadarFrame { time:number; path:string }
export interface RadarMetadata {host:string;radar:{past:RadarFrame[];nowcast:RadarFrame[]}}
export function parseRadar(input: unknown, now = Date.now()): RadarMetadata {
  const value=input as Partial<RadarMetadata>;
  if(value?.host!=='https://tilecache.rainviewer.com' || !Array.isArray(value.radar?.past) || !value.radar.past.length) throw new Error('Radar unavailable');
  const frames = (input: unknown): RadarFrame[] => {
    if(!Array.isArray(input) || input.length>50) throw new Error('Invalid radar frames');
    return input.map(frame=>{
      if(!frame || !Number.isInteger(frame.time) || typeof frame.path!=='string' || !/^\/v2\/radar\/[A-Za-z0-9_/-]+$/.test(frame.path) || frame.path.includes('..') || frame.time*1000 < now-4*3600000 || frame.time*1000 > now+2*3600000) throw new Error('Invalid or outdated radar frame');
      return {time:frame.time,path:frame.path};
    });
  };
  return {host:value.host,radar:{past:frames(value.radar.past),nowcast:frames(value.radar.nowcast ?? [])}};
}
