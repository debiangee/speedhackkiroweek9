import {it,expect} from 'vitest';
import {forecastContext,forecastUrl,validForecastDate} from '../utils/forecast-context';
import {normalizeSavedLocations} from '../hooks/useSavedLocations';
import {findNearestLocation} from '../hooks/useGeolocation';
const now=new Date('2026-10-17T16:30:00Z');
it('shared context resolves exact city and date without frozen forecast claims',()=>{
 const context=forecastContext('?location=NCR%3AMakati&date=2026-10-20',now);
 expect(context.location.id).toBe('NCR:Makati');expect(context.date).toBe('2026-10-20');
 expect(context.notice).toContain('not frozen');
 const url=new URL(forecastUrl('https://example.com/?token=unrelated#old',context.location.id,context.date));
 expect(url.searchParams.get('location')).toBe('NCR:Makati');expect(url.searchParams.has('token')).toBe(false);expect(url.hash).toBe('#forecast');
});
it('rejects unknown IDs, malformed dates and old or distant forecast links',()=>{
 for(const date of ['2026-10-17','2026-10-25','2026-02-30','hello'])expect(validForecastDate(date,now)).toBe(false);
 const context=forecastContext('?location=unknown&date=2020-01-01',now);
 expect(context.location.id).toBe('NCR:reference');expect(context.date).toBe('2026-10-18');expect(context.notice).toContain('unavailable');
});
it('migrates region favorites, retains cities, deduplicates and ignores removed IDs',()=>{
 expect(normalizeSavedLocations(['NCR','NCR:reference','NCR:Makati','deleted',null])).toEqual(['NCR:reference','NCR:Makati']);
 expect(normalizeSavedLocations({bad:'shape'})).toEqual([]);
});
it('geolocation rejects unsupported countries rather than inventing a nearby Philippine location',()=>{
 expect(findNearestLocation(51.5,-.1)).toBeNull();expect(findNearestLocation(NaN,121)).toBeNull();
 expect(findNearestLocation(14.5547,121.0244)).toEqual({region:'NCR',city:'Makati'});
});
