import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { colorTabIndex, trappedFocusIndex } from '../lib/colorDialog';
import type { MethodId } from '../types';

export function ColorDialog({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: (method: MethodId) => ReactNode;
}) {
  const [method, setMethod] = useState<MethodId>('cfop');
  const id = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLButtonElement>('[aria-label="关闭配色"]')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeRef.current(); }
      if (e.key === 'Tab') {
        const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), a[href], input:not([disabled]), [tabindex="0"]') ?? [])];
        const target = trappedFocusIndex(controls.indexOf(document.activeElement as HTMLElement), controls.length, e.shiftKey);
        if (target !== null) { e.preventDefault(); controls[target].focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
  if (!open) return null;
  const content = <div className="color-dialog-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="color-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={dialog}>
      <header className="color-dialog-head">
        <h2 id={`${id}-title`}>{title}</h2>
        <button type="button" className="link-btn" aria-label="关闭配色" onClick={onClose}>×</button>
      </header>
      <div className="color-dialog-tabs" role="tablist" aria-label="配色方法">
        {(['cfop', 'roux'] as const).map((m, index) => <button type="button" className="chip" role="tab" key={m}
          id={`${id}-${m}`} aria-controls={`${id}-panel`} aria-selected={method === m} tabIndex={method === m ? 0 : -1}
          onClick={() => setMethod(m)} onKeyDown={e => {
            const next = colorTabIndex(index, e.key);
            if (next === null) return;
            e.preventDefault();
            const target = next === 0 ? 'cfop' : 'roux'; setMethod(target);
            document.getElementById(`${id}-${target}`)?.focus();
          }}>{m === 'cfop' ? 'CFOP' : 'Roux'}</button>)}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${method}`}>{children(method)}</div>
    </div>
  </div>;
  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
