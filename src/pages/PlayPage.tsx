import { CubeSandbox } from '../components/CubeSandbox';
import { useState } from 'react';

export function PlayPage() {
  const [size, setSize] = useState<2 | 3>(3);
  return <div className="page play-page">
    <header className="play-head">
      <div className="play-title-row">
        <h1 className="page-title">试转</h1>
        <div className="segmented sandbox-size" role="group" aria-label="魔方阶数">
          {([3, 2] as const).map(n => <button type="button" key={n} className={size === n ? 'seg-on' : ''}
            aria-pressed={size === n} title="切换后复原魔方" onClick={() => setSize(n)}>{n === 2 ? '二阶' : '三阶'}</button>)}
        </div>
      </div>
      <p className="muted small">点字母转一步；拖动魔方换视角，双击回正</p>
    </header>
    <CubeSandbox size={size} />
  </div>;
}
