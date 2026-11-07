import { useRef, useState } from 'react';
import { ALL_CASES } from '../data';
import { setDevicePrefs, useDevicePrefs } from '../store/devicePrefs';
import { exportUserData, importUserData, statusOf, useUserData } from '../store/userStore';

/** 本地日期 YYYY-MM-DD（toISOString 是 UTC，东八区凌晨会差一天） */
function localDate(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function MePage() {
  const user = useUserData();
  const prefs = useDevicePrefs();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const count = (s: 'learning' | 'mastered') => ALL_CASES.filter((c) => statusOf(c, user) === s).length;
  const favorites = ALL_CASES.filter((c) => user.cases[c.id]?.favorite).length;

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportUserData()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mofang-backup-${localDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      importUserData(await f.text());
      setMessage('已导入');
    } catch (e) {
      setMessage(`导入失败：${(e as Error).message}`);
    }
    if (file.current) file.current.value = '';
  };

  return (
    <div className="page">
      <h1 className="page-title">我的</h1>
      <div className="stats">
        <div><strong>{count('mastered')}</strong><span className="muted small">已掌握</span></div>
        <div><strong>{count('learning')}</strong><span className="muted small">学习中</span></div>
        <div><strong>{favorites}</strong><span className="muted small">收藏</span></div>
      </div>
      <h2>魔方表面</h2>
      <div className="segmented" role="group" aria-label="魔方表面">
        <span className="seg-thumb seg-thumb-2" aria-hidden="true" style={{ transform: `translateX(${prefs.finish === 'uv' ? 0 : 100}%)` }} />
        <button className={prefs.finish === 'uv' ? 'seg-on' : ''} aria-pressed={prefs.finish === 'uv'} onClick={() => setDevicePrefs({ finish: 'uv' })}>
          UV 亮面
        </button>
        <button className={prefs.finish === 'matte' ? 'seg-on' : ''} aria-pressed={prefs.finish === 'matte'} onClick={() => setDevicePrefs({ finish: 'matte' })}>
          普通面
        </button>
      </div>
      <p className="muted small setting-note">只对这台设备生效。手机卡顿或发热时可以选普通面。</p>

      <h2>OLL 识别视图</h2>
      <div className="segmented" role="group" aria-label="OLL 识别视图">
        <span className="seg-thumb seg-thumb-2" aria-hidden="true" style={{ transform: `translateX(${prefs.ollView === 'top' ? 0 : 100}%)` }} />
        <button className={prefs.ollView === 'top' ? 'seg-on' : ''} aria-pressed={prefs.ollView === 'top'} onClick={() => setDevicePrefs({ ollView: 'top' })}>
          顶面 9 格
        </button>
        <button className={prefs.ollView === 'full' ? 'seg-on' : ''} aria-pressed={prefs.ollView === 'full'} onClick={() => setDevicePrefs({ ollView: 'full' })}>
          顶层 21 格
        </button>
      </div>
      <p className="muted small setting-note">只对这台设备生效，只影响 OLL 公式详情页的图解和 3D。</p>

      <h2>备份和迁移</h2>
      <p className="muted">进度和自定义公式只保存在这台设备的浏览器里。换设备时先导出，再到另一台设备导入。导入会覆盖那台设备上现有的数据。</p>
      <div className="button-row">
        <button className="btn" onClick={download}>导出备份</button>
        <button className="btn" onClick={() => file.current?.click()}>导入备份</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {message && <p className="muted" role="status">{message}</p>}
    </div>
  );
}
