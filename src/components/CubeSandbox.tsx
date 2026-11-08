import { useEffect, useRef, useState } from 'react';
import { Sandbox, MAIN_KEYS, MORE_KEYS, type Suffix } from '../lib/cubeSandbox';
import { easeMove } from '../lib/timeline';
import { useDevicePrefs } from '../store/devicePrefs';
import type { CubeScene } from './CubeScene';

export function CubeSandbox() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CubeScene | null>(null);
  const model = useRef(new Sandbox());
  const raf = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [, refresh] = useState(0);
  const [more, setMore] = useState(false);
  const prefs = useDevicePrefs();
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const draw = () => {
    const f = model.current.tick(0);
    scene.current?.render(f.state, f.move, easeMove(f.fraction));
  };
  useEffect(() => {
    let disposed = false;
    let created: CubeScene | null = null;
    import('./CubeScene').then(({ CubeScene }) => {
      if (disposed || !host.current) return;
      created = new CubeScene(host.current, prefsRef.current.finish);
      scene.current = created; setReady(true); draw();
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; cancelAnimationFrame(raf.current); created?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { draw(); }, [prefs.bottomColor]);
  useEffect(() => { scene.current?.setFinish(prefs.finish); }, [prefs.finish]);
  const run = () => {
    refresh(n => n + 1);
    if (raf.current) return;
    let last = performance.now();
    const tick = (now: number) => {
      const f = model.current.tick(Math.min(now - last, 100)); last = now;
      scene.current?.render(f.state, f.move, easeMove(f.fraction));
      refresh(n => n + 1);
      raf.current = model.current.pending ? requestAnimationFrame(tick) : 0;
    };
    raf.current = requestAnimationFrame(tick);
  };
  const m = model.current;
  return <div className="sandbox-layout">
    <div className="sandbox-stage" ref={host} role="img" aria-label="可拖动的试转魔方" />
    <div className="sandbox-controls">
      {!ready && <p role="status">{error ? '3D 加载失败，请重新打开页面' : '正在加载魔方…'}</p>}
      <div className="sandbox-suffix" aria-label="转动后缀">
        {(['', "'", '2'] as Suffix[]).map(s => <button type="button" className="btn" key={s} aria-label={s ? `后缀 ${s}` : '无后缀'} aria-pressed={m.suffix === s} onClick={() => { m.suffix = s; refresh(n => n + 1); }}>{s || '无'}</button>)}
        <button type="button" className="btn" aria-label="切换更多转法" aria-pressed={more} onClick={() => setMore(!more)}>{more ? '主键' : '更多'}</button>
      </div>
      <div className="sandbox-keys">
        {(more ? MORE_KEYS : MAIN_KEYS).map(key => <button type="button" className="btn" key={key} aria-label={`转动 ${key}`} disabled={!ready || m.pending >= 16} onClick={() => { if (m.press(key)) run(); }}>{key}</button>)}
      </div>
      <div className="sandbox-actions">
        <button type="button" className="btn" aria-label="撤销最后一转" disabled={!ready || !m.canUndo} onClick={() => { if (m.undo()) run(); }}>撤销</button>
        <button type="button" className="btn" aria-label="复原魔方" onClick={() => { cancelAnimationFrame(raf.current); raf.current = 0; m.reset(); draw(); refresh(n => n + 1); }}>复原</button>
      </div>
      <p className="muted small" aria-live="polite">待转 {m.pending} / 16</p>
    </div>
  </div>;
}
