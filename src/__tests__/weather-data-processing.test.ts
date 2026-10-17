import {it,expect} from 'vitest';
import {parseForecast,FORECAST_FIELDS,revalidateHourly} from '../services/forecast-parser';
function fixture(hours=168): {timezone:string;hourly:Record<string,unknown[]>} {
 const time=Array.from({length:hours},(_,i)=>`2026-08-${String(14+Math.floor(i/24)).padStart(2,'0')}T${String(i%24).padStart(2,'0')}:00`);
 return {timezone:'Asia/Manila',hourly:{time,...Object.fromEntries(FORECAST_FIELDS.map(field=>[field,time.map(()=>field==='temperature_2m'?28:field==='visibility'?10000:field==='precipitation_probability'?30:field==='precipitation'?1:0)]))}};
}
it('production parser aggregates seven complete days and preserves metric values',()=>{
 const {hourly,daily}=parseForecast(fixture()); expect(hourly).toHaveLength(168);expect(daily).toHaveLength(7);
 expect(daily[0]).toMatchObject({date:'2026-08-14',avg_prob:30,total_rain:24,min_temp:28,max_temp:28});
 expect(hourly[23].hour).toBe(23);expect(hourly[24].date).toBe('2026-08-15');
});
it('rejects empty, discontinuous, noncalendar and invalid WMO inputs',()=>{
 expect(()=>parseForecast(fixture(0))).toThrow();
 const gap=fixture(2);gap.hourly.time[1]='2026-08-14T05:00';expect(()=>parseForecast(gap)).toThrow();
 const invalid=fixture(1);invalid.hourly.time[0]='2026-02-30T00:00';expect(()=>parseForecast(invalid)).toThrow();
 const code=fixture(1);code.hourly.weather_code[0]=54;expect(()=>parseForecast(code)).toThrow();
});
it('rejects corrupt persisted numeric values and recomputes daily aggregates',()=>{
 const record=parseForecast(fixture(24));expect(revalidateHourly(record.hourly).daily[0].total_rain).toBe(24);
 record.hourly[0].visibility=-1;expect(()=>revalidateHourly(record.hourly)).toThrow();
});
it('rejects incompatible provider units',()=>{
 expect(()=>parseForecast({...fixture(),hourly_units:{temperature_2m:'°F',wind_speed_10m:'mph',precipitation:'inch',visibility:'m'}})).toThrow(/units/);
});
