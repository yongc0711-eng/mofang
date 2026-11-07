import { useMemo, useState } from 'react';
import { CubePlayer } from '../components/CubePlayer';
import { CubePlayer3D } from '../components/CubePlayer3D';
import { getCase } from '../data';
import { displayMask } from '../lib/cases';

// 新旧播放器对比用的临时页面，不在导航里，确定去留后删除。覆盖整体转动、M 层、宽层、180° 等情况。
const SAMPLES = ['pll-t', 'pll-aa', 'pll-h', 'oll-36', 'f2l-13', 'cmll-u-3', 'lse-eo-7', 'lse-4c-6'];

export function LabPage() {
  const [id, setId] = useState(SAMPLES[0]);
  const [masked, setMasked] = useState(false);
  const [showOld, setShowOld] = useState(true);
  const [uv, setUv] = useState(true);
  const c = getCase(id)!;
  const mask = useMemo(() => (masked ? displayMask(c) : null), [masked, c]);

  return (
    <div className="page">
      <h1 className="page-title">3D 对比测试</h1>
      <div className="chips wrap">
        {SAMPLES.map((s) => (
          <button key={s} className={`chip ${s === id ? 'chip-on' : ''}`} onClick={() => setId(s)}>
            {getCase(s)!.name}
          </button>
        ))}
      </div>
      <div className="chips wrap">
        <button className={`chip ${masked ? 'chip-on' : ''}`} aria-pressed={masked} onClick={() => setMasked((v) => !v)}>
          只显示相关贴纸
        </button>
        <button className={`chip ${uv ? 'chip-on' : ''}`} aria-pressed={uv} onClick={() => setUv((v) => !v)}>
          UV 钻面
        </button>
        <button className={`chip ${showOld ? 'chip-on' : ''}`} aria-pressed={showOld} onClick={() => setShowOld((v) => !v)}>
          显示旧播放器
        </button>
      </div>
      <p className="muted small">公式：{c.algs[0]}</p>
      <div className="lab-grid">
        <section>
          <h2>新（Three.js）</h2>
          <CubePlayer3D key={id} alg={c.algs[0]} mask={mask} finish={uv ? 'uv' : 'matte'} />
        </section>
        {showOld && (
          <section>
            <h2>旧（cubing.js）</h2>
            <CubePlayer key={id} alg={c.algs[0]} />
          </section>
        )}
      </div>
    </div>
  );
}
