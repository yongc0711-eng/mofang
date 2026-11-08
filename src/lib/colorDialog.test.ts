import { expect, it } from 'vitest';
import { colorTabIndex, trappedFocusIndex } from './colorDialog';
it.each(['ArrowLeft','ArrowRight'])('%s cycles exactly between both tabs',key=>{
  expect(colorTabIndex(0,key)).toBe(1);expect(colorTabIndex(1,key)).toBe(0);
});
it('Home/End choose exact endpoints and unrelated keys are left alone',()=>{
  expect(colorTabIndex(1,'Home')).toBe(0);expect(colorTabIndex(0,'End')).toBe(1);expect(colorTabIndex(0,'Enter')).toBeNull();
});
it('Tab wraps only at the last control, Shift-Tab at the first, and escaped focus is recaptured',()=>{
  expect(trappedFocusIndex(2,3,false)).toBe(0);expect(trappedFocusIndex(0,3,true)).toBe(2);
  expect(trappedFocusIndex(1,3,false)).toBeNull();expect(trappedFocusIndex(1,3,true)).toBeNull();
  expect(trappedFocusIndex(-1,3,false)).toBe(0);expect(trappedFocusIndex(-1,3,true)).toBe(2);
});
it('empty and singleton focus lists do not escape or index outside the dialog',()=>{
  expect(trappedFocusIndex(0,0,false)).toBeNull();expect(trappedFocusIndex(0,1,false)).toBe(0);expect(trappedFocusIndex(0,1,true)).toBe(0);
});
