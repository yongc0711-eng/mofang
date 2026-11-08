import { afterEach, expect, it, vi } from 'vitest';
const KEY='mofang.device.v1';
async function fresh(raw?: string) {
  const memory=new Map(raw ? [[KEY,raw]] : []);
  vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v)});
  vi.resetModules(); return { prefs:await import('./devicePrefs'),memory };
}
afterEach(()=>vi.unstubAllGlobals());
it('persists swaps and independent method preferences without changing legacy bottom or global finish',async()=>{
  const {prefs,memory}=await fresh();
  prefs.setDevicePrefs({cfop:{bottomColor:'green'}});
  prefs.setDevicePrefs({roux:{bottomColor:'white',bridgePair:'green-blue',leftColor:'blue'}});
  const {swapRoux}=await import('../lib/colorScheme');
  prefs.setDevicePrefs({roux:swapRoux(prefs.getDevicePrefs().roux)});
  prefs.setDevicePrefs({finish:'matte'});
  expect(prefs.getDevicePrefs()).toEqual({finish:'matte',focusRelevant:false,bottomColor:'white',cfop:{bottomColor:'green'},roux:{bottomColor:'white',bridgePair:'green-blue',leftColor:'green'}});
  const next=await fresh(memory.get(KEY));expect(next.prefs.getDevicePrefs()).toEqual(prefs.getDevicePrefs());
});
it('cleans invalid stored bridge pairs, preserves the other method, drops unknown fields',async()=>{
  const {prefs}=await fresh(JSON.stringify({finish:'matte',bottomColor:'white',cfop:{bottomColor:'blue'},roux:{bottomColor:'white',bridgePair:'white-yellow',leftColor:'yellow'},junk:9}));
  expect(prefs.getDevicePrefs()).toEqual({finish:'matte',focusRelevant:false,bottomColor:'white',cfop:{bottomColor:'blue'},roux:{bottomColor:'white',bridgePair:'red-orange',leftColor:'red'}});
});
it('unrelated updates keep an explicit direction and legacy edits never overwrite the methods',async()=>{
  const {prefs}=await fresh(JSON.stringify({bottomColor:'white',roux:{bottomColor:'white',bridgePair:'red-orange',leftColor:'orange'}}));
  prefs.setDevicePrefs({bottomColor:'blue',focusRelevant:true});
  expect(prefs.getDevicePrefs()).toEqual({finish:'uv',focusRelevant:true,bottomColor:'blue',cfop:{bottomColor:'white'},roux:{bottomColor:'white',bridgePair:'red-orange',leftColor:'orange'}});
});
it('malformed JSON defaults remain complete; wrong method fields cannot become invalid palettes',async()=>{
  const {prefs}=await fresh('{bad');
  prefs.setDevicePrefs({roux:{bottomColor:'blue'}});
  expect(prefs.getDevicePrefs().roux).toEqual({bottomColor:'blue',bridgePair:'red-orange',leftColor:'red'});
});
