import { useRef, useState } from 'react';
import { ALL_CASES } from '../data';
import { exportUserData, importUserData, statusOf, useUserData } from '../store/userStore';

export function MePage() {
  const user = useUserData();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const count = (s: 'learning' | 'mastered') => ALL_CASES.filter((c) => statusOf(c, user) === s).length;
  const favorites = ALL_CASES.filter((c) => user.cases[c.id]?.favorite).length;

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportUserData()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mofang-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
