import { useEffect, useId, useRef, useState } from 'react';
import { BOTTOM_COLORS, PAIRS, cleanBrowse, defaultLeft, withRouxBottom, swapRoux, validPairs } from '../lib/colorScheme';
import { COLOR_LABEL, COLOR_VAR } from '../lib/colorNames';
import { setDevicePrefs, useDevicePrefs } from '../store/devicePrefs';
import type { MethodId } from '../types';

export function FormulaColors({ method }: { method: MethodId }) {
  const prefs = useDevicePrefs();
  const colors = cleanBrowse(prefs, prefs.bottomColor);
  const current = colors[method];
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const entry = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    const close = () => { setOpen(false); entry.current?.focus(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close(); };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside); };
  }, [open]);
  return <div className="formula-colors" ref={root}>
    <button type="button" className="chip" id={`colors-${method}`} ref={entry} aria-label={`${method === 'cfop' ? 'CFOP' : 'Roux'} 配色`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(v => !v)}>配色</button>
    {open && <div className="formula-colors-panel" id={id} ref={panel}>
      <p className="small">{method === 'cfop' ? 'CFOP' : '桥式 Roux'} 浏览配色 · 只对这台设备生效</p>
      <div className="formula-color-grid" role="group" aria-label="浏览底色">
        {BOTTOM_COLORS.map(color => <button type="button" className="chip" key={color} aria-label={`底面${COLOR_LABEL[color]}色`} aria-pressed={current.bottomColor === color} onClick={() => {
          if (method === 'cfop') setDevicePrefs({ cfop: { bottomColor: color } });
          else setDevicePrefs({ roux: withRouxBottom(colors.roux, color) });
        }}><span className="swatch-dot" aria-hidden="true" style={{ background: COLOR_VAR[color] }} />{COLOR_LABEL[color]}</button>)}
      </div>
      {method === 'roux' && <>
        <p className="small">桥色对</p>
        <div className="formula-pairs" role="group" aria-label="浏览桥色对">
          {validPairs(colors.roux.bottomColor).map(pair => <button type="button" className="chip" key={pair} aria-pressed={colors.roux.bridgePair === pair} onClick={() => {
            if (pair !== colors.roux.bridgePair) setDevicePrefs({ roux: { bridgePair: pair, leftColor: defaultLeft(pair) } });
          }}>{PAIRS[pair].map(c => COLOR_LABEL[c]).join(' / ')}桥</button>)}
        </div>
        <p className="small">左{COLOR_LABEL[colors.roux.leftColor]} · 右{COLOR_LABEL[swapRoux(colors.roux).leftColor]}</p>
        <button type="button" className="chip" aria-label="交换左右桥色" onClick={() => setDevicePrefs({ roux: swapRoux(colors.roux) })}>交换左右</button>
      </>}
      <button type="button" className="link-btn" onClick={() => { setOpen(false); entry.current?.focus(); }}>收起配色</button>
    </div>}
  </div>;
}
