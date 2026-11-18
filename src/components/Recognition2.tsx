import { useMemo } from 'react';
import type { AlgCase } from '../types';
import type { Palette } from '../lib/colorScheme';
import { recognitionText2 } from '../lib/recognition2';

export function Recognition2({ c, palette, showHeading = true }: { c: AlgCase; palette: Palette; showHeading?: boolean }) {
  const text = useMemo(() => recognitionText2(c, palette), [c, palette]);
  return <section className="recognition recognition-2" aria-label="二阶识别提示">
    {showHeading && <h2>识别提示</h2>}
    <p><strong>先看底层</strong>{text.bottom}</p>
    <p><strong>再看顶色</strong>{text.orientation}</p>
    <div><strong>区分相似情形</strong><ul>{text.cues.map(cue => <li key={cue}>{cue}</li>)}</ul></div>
    <p className="muted small recognition-guide">{text.guide}</p>
  </section>;
}
