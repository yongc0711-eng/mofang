import { useState } from 'react';
import { BOTTOM_COLORS, PAIRS, cleanBrowse, defaultLeft, withRouxBottom, swapRoux, validPairs } from '../lib/colorScheme';
import { COLOR_LABEL, COLOR_VAR } from '../lib/colorNames';
import { setDevicePrefs, useDevicePrefs } from '../store/devicePrefs';
import { ColorDialog } from './ColorDialog';
import type { MethodId } from '../types';

export function BrowseColorPanel({ method }: { method: MethodId }) {
  const prefs = useDevicePrefs();
  const colors = cleanBrowse(prefs, prefs.bottomColor);
  const current = colors[method];
  return <div className="formula-colors-panel">
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
  </div>;
}

export function FormulaColors() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="chip color-dialog-entry" id="browse-colors" aria-label="浏览配色" aria-haspopup="dialog" aria-expanded={open} onClick={e => { e.currentTarget.focus(); setOpen(true); }}>配色</button>
    <ColorDialog open={open} title="浏览配色" onClose={() => setOpen(false)}>{method => <BrowseColorPanel method={method} />}</ColorDialog>
  </>;
}
