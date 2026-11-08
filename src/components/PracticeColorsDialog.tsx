import { useState, type Dispatch, type SetStateAction } from 'react';
import { ColorDialog } from './ColorDialog';
import { BOTTOM_COLORS, PAIRS, validPairs } from '../lib/colorScheme';
import { COLOR_LABEL, COLOR_VAR } from '../lib/colorNames';
import { togglePoolBottom, togglePoolPair, type PracticeColorPools } from '../lib/practiceColors';
import type { MethodId } from '../types';

export function PracticeColorPanel({ method, colorPools, onChange }: {
  method: MethodId; colorPools: PracticeColorPools; onChange: Dispatch<SetStateAction<PracticeColorPools>>;
}) {
  const { cfopBottoms, rouxBottoms, rouxPairsByBottom } = colorPools;
  return <>
    <section className="practice-colors">
      <h3>{method === 'cfop' ? 'CFOP 练习底色' : 'Roux 练习底色'}</h3>
      <div className="practice-color-grid" role="group" aria-label={`${method} 练习底色`}>
        {BOTTOM_COLORS.map(color => <button type="button" key={color} className="chip"
          aria-pressed={(method === 'cfop' ? cfopBottoms : rouxBottoms).includes(color)} aria-label={`${method} 练习底色${COLOR_LABEL[color]}色`}
          onClick={() => onChange(current => togglePoolBottom(current, method, color))}>
          <span className="swatch-dot" aria-hidden="true" style={{ background: COLOR_VAR[color] }} />{COLOR_LABEL[color]}
        </button>)}
      </div>
    </section>
    {method === 'roux' && <div className="practice-bridge-pools">
      {rouxBottoms.map(bottom => <section key={bottom}>
        <h3>{COLOR_LABEL[bottom]}底桥色</h3>
        <div className="practice-pair-grid" role="group" aria-label={`${COLOR_LABEL[bottom]}底桥色`}>
          {validPairs(bottom).map(pair => <button type="button" className="chip" key={pair} aria-pressed={rouxPairsByBottom[bottom]!.includes(pair)}
            onClick={() => onChange(current => togglePoolPair(current, bottom, pair))}>{PAIRS[pair].map(c => COLOR_LABEL[c]).join(' / ')}桥</button>)}
        </div>
      </section>)}
    </div>}
    <p className="muted small">可多选；每题按所属方法随机一个已选完整配色。Roux 两个左右方向都包含；新增底色会带入上方显示的默认桥对，每底至少一对。</p>
  </>;
}
export function PracticeColorsDialog({ colorPools, onChange }: {
  colorPools: PracticeColorPools; onChange: Dispatch<SetStateAction<PracticeColorPools>>;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="chip color-dialog-entry" id="practice-colors" aria-haspopup="dialog" aria-expanded={open} onClick={e => { e.currentTarget.focus(); setOpen(true); }}>练习配色</button>
    <ColorDialog open={open} title="练习配色" onClose={() => setOpen(false)}>{method => <PracticeColorPanel method={method} colorPools={colorPools} onChange={onChange} />}</ColorDialog>
  </>;
}
