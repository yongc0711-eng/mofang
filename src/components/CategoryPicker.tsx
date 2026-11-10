import { useEffect, useId, useRef, useState } from 'react';

export function CategoryPicker({ groups, value, onChange }: {
  groups: { name: string; count: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const el = dialog.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    el.showModal();
    el.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    return () => {
      el.close();
      document.body.style.overflow = overflow;
      if (trigger.current?.isConnected) trigger.current.focus();
    };
  }, [open]);
  return (
    <>
      <button ref={trigger} className="category-trigger" aria-label={value === '全部' ? '按分组筛选：全部分类' : `按分组筛选：${value}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 5h14M6 10h8M8 15h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        {value === '全部' ? '全部分类' : value}
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <dialog ref={dialog} className="category-dialog" aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); setOpen(false); }} onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) setOpen(false);
      }}>
        <header className="category-dialog-head">
          <div><h2 id={titleId}>选择分类</h2><p>按情形分类，快速找到公式</p></div>
          <button className="category-close" aria-label="关闭分类" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="category-options" role="group" aria-label="情形分类">
          {groups.map(({ name, count }) => (
            <button key={name} aria-label={`${name === '全部' ? '全部分类' : name}，${count} 个情形`} aria-pressed={value === name} onClick={() => { onChange(name); setOpen(false); }}>
              <span className="category-option-name">{name === '全部' ? '全部分类' : name}</span>
              <span className="category-option-count">{count}</span>
              <span className="category-check" aria-hidden="true">{value === name ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      </dialog>
    </>
  );
}
