import { expect, it } from 'vitest';
import { initializeColorPools, snapshotPools, togglePoolBottom, togglePoolPair, colorCandidates, pickPracticeColors, colorKey, type PracticeColorPools } from './practiceColors';
import { BOTTOM_COLORS, PAIRS, validPairs } from './colorScheme';
const prefs={cfop:{bottomColor:'green' as const},roux:{bottomColor:'white' as const,bridgePair:'green-blue' as const,leftColor:'green' as const}};
it.each(['cmll', 'lse', 'sbls', 'f2l', 'oll', 'pll', 'coll'])('%s samples its independent method pool (T71)', set => {
  const pools = initializeColorPools({}, prefs);
  expect(pickPracticeColors({ set }, pools, null, () => 0)).toEqual(
    ['cmll', 'lse', 'sbls'].includes(set)
      ? { method: 'roux', bottomColor: 'white', bridgePair: 'green-blue', leftColor: 'green' }
      : { method: 'cfop', bottom: 'green' },
  );
});
it('defaults use independent browsing prefs once; subsequent preference edits do not overwrite pools',()=>{
  const pools=initializeColorPools({},prefs);
  expect(pools).toEqual({cfopBottoms:['green'],rouxBottoms:['white'],rouxPairsByBottom:{white:['green-blue']}});
  expect(initializeColorPools(pools,{cfop:{bottomColor:'red'},roux:{bottomColor:'yellow',bridgePair:'red-orange',leftColor:'red'}})).toEqual(pools);
});
it('old T52 bottoms are copied into both pools and each bottom has a visible legal default pair',()=>{
  const old={bottoms:['white','green'] as const};
  const pools=initializeColorPools({bottoms:[...old.bottoms]},prefs);
  expect(pools).toEqual({cfopBottoms:['white','green'],rouxBottoms:['white','green'],rouxPairsByBottom:{white:['green-blue'],green:['red-orange']}});
  expect(pools.cfopBottoms).not.toBe(pools.rouxBottoms);
});
it('invalid/empty persisted pools and pair arrays clean independently',()=>{
  const pools=initializeColorPools({cfopBottoms:[],rouxBottoms:['white'],rouxPairsByBottom:{white:['white-yellow','red-orange','red-orange']}},prefs);
  expect(pools).toEqual({cfopBottoms:['green'],rouxBottoms:['white'],rouxPairsByBottom:{white:['red-orange']}});
});
it('each method retains one bottom; adding/removing in one never changes the other',()=>{
  const original=initializeColorPools({},prefs);
  expect(togglePoolBottom(original,'cfop','green')).toEqual(original);
  const added=togglePoolBottom(original,'cfop','blue');
  expect(added.cfopBottoms).toEqual(['green','blue']);expect(added.rouxBottoms).toEqual(['white']);
  expect(togglePoolBottom(added,'cfop','green').cfopBottoms).toEqual(['blue']);
  expect(original.cfopBottoms).toEqual(['green']);
  const roux=togglePoolBottom(original,'roux','green');expect(roux.rouxPairsByBottom).toEqual({white:['green-blue'],green:['red-orange']});
  expect(togglePoolBottom(original,'roux','white')).toEqual(original);
});
it('pair selection is per bottom, retains one and rejects illegal pairs or unselected bottoms',()=>{
  let pools=togglePoolBottom(initializeColorPools({},prefs),'roux','green');
  expect(togglePoolPair(pools,'white','green-blue')).toEqual(pools);
  pools=togglePoolPair(pools,'white','red-orange');
  expect(pools.rouxPairsByBottom).toEqual({white:['green-blue','red-orange'],green:['red-orange']});
  expect(togglePoolPair(pools,'white','green-blue').rouxPairsByBottom).toEqual({white:['red-orange'],green:['red-orange']});
  expect(()=>togglePoolPair(pools,'white','white-yellow')).toThrow();
  expect(()=>togglePoolPair(pools,'red','white-yellow')).toThrow();
});
it('Roux expansion produces every selected legal pair and both directions exactly once',()=>{
  const pools:PracticeColorPools={cfopBottoms:['white'],rouxBottoms:[...BOTTOM_COLORS],rouxPairsByBottom:Object.fromEntries(BOTTOM_COLORS.map(b=>[b,validPairs(b)]))};
  const candidates=colorCandidates('roux',pools);
  expect(candidates).toHaveLength(24);expect(new Set(candidates.map(colorKey)).size).toBe(24);
  for(const bottom of BOTTOM_COLORS)for(const pair of validPairs(bottom))for(const left of PAIRS[pair])
    expect(candidates).toContainEqual({method:'roux',bottomColor:bottom,bridgePair:pair,leftColor:left});
});
it('uniform injectable sampling covers each fully expanded candidate bin, not a bottom-first draw',()=>{
  const pools=initializeColorPools({},prefs);pools.rouxPairsByBottom.white=['red-orange','green-blue'];
  const candidates=colorCandidates('roux',pools);
  expect(Array.from({length:4},(_,i)=>pickPracticeColors({set:'cmll'},pools,null,()=>(i+.5)/4))).toEqual(candidates);
});
it('CFOP sampling is uniform, singleton works, and multiple colors avoid the last full configuration',()=>{
  const pools=initializeColorPools({},prefs);pools.cfopBottoms=['white','green'];
  expect(pickPracticeColors({set:'oll'},pools,null,()=>0)).toEqual({method:'cfop',bottom:'white'});
  expect(pickPracticeColors({set:'pll'},pools,null,()=>.75)).toEqual({method:'cfop',bottom:'green'});
  expect(pickPracticeColors({set:'f2l'},pools,{method:'cfop',bottom:'white'},()=>0)).toEqual({method:'cfop',bottom:'green'});
  pools.cfopBottoms=['white'];expect(pickPracticeColors({set:'oll'},pools,{method:'cfop',bottom:'white'},()=>1)).toEqual({method:'cfop',bottom:'white'});
});
it('Roux excludes only the previous complete configuration, and mixed sets use their own method pool',()=>{
  const pools=initializeColorPools({},prefs),last=pickPracticeColors({set:'cmll'},pools,null,()=>0);
  expect(pickPracticeColors({set:'lse'},pools,last,()=>0)).not.toEqual(last);
  for(const set of ['oll','pll','f2l']) expect(pickPracticeColors({set},pools,last,()=>0)).toEqual({method:'cfop',bottom:'green'});
  for(const set of ['cmll','lse']) expect(pickPracticeColors({set},pools,null,()=>0).method).toBe('roux');
});
it('invalid candidate pools fail rather than dropping a bottom or guessing a legal scheme',()=>{
  const pools=initializeColorPools({},prefs);pools.rouxPairsByBottom.white=[];
  expect(()=>colorCandidates('roux',pools)).toThrow('至少选择一对');
  pools.rouxPairsByBottom.white=['white-yellow'];expect(()=>colorCandidates('roux',pools)).toThrow('没有合法');
  pools.cfopBottoms=[];expect(()=>colorCandidates('cfop',pools)).toThrow();
});
it('a session pool snapshot and sampled frozen colors are independent of future setting edits',()=>{
  const pools=initializeColorPools({},prefs),copy=snapshotPools(pools),colors=pickPracticeColors({set:'cmll'},copy,null,()=>0);
  pools.rouxBottoms.push('green');pools.rouxPairsByBottom.white!.push('red-orange');
  expect(copy).toEqual({cfopBottoms:['green'],rouxBottoms:['white'],rouxPairsByBottom:{white:['green-blue']}});
  expect(colors).toEqual({method:'roux',bottomColor:'white',bridgePair:'green-blue',leftColor:'green'});
  expect(Object.isFrozen(colors)).toBe(true);
});
it('random index boundaries clamp without selecting outside the valid set',()=>{
  const pools=initializeColorPools({},prefs),candidates=colorCandidates('roux',pools);
  expect(pickPracticeColors({set:'lse'},pools,null,()=>1)).toEqual(candidates.at(-1));
  expect(pickPracticeColors({set:'lse'},pools,null,()=>-1)).toEqual(candidates[0]);
  expect(pickPracticeColors({set:'lse'},pools,null,()=>NaN)).toEqual(candidates[0]);
});
