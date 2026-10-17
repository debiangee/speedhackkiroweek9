import {it,expect} from 'vitest';
import {parseRadar} from '../services/radar';
const now=Date.parse('2026-10-18T04:00:00Z');
const frame={time:now/1000-600,path:'/v2/radar/1792295400'};
it('accepts bounded provider frames and preserves timestamps',()=>{expect(parseRadar({host:'https://tilecache.rainviewer.com',radar:{past:[frame]}},now).radar.past[0]).toEqual(frame);});
it.each(['https://evil.example','javascript:alert(1)'])('rejects untrusted tile hosts %s',host=>{expect(()=>parseRadar({host,radar:{past:[frame]}},now)).toThrow();});
it('rejects expired frames and path traversal',()=>{
 expect(()=>parseRadar({host:'https://tilecache.rainviewer.com',radar:{past:[{...frame,time:now/1000-86400}]}},now)).toThrow();
 expect(()=>parseRadar({host:'https://tilecache.rainviewer.com',radar:{past:[{...frame,path:'/v2/radar/../../x'}]}},now)).toThrow();
});
