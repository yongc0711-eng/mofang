import { ALG_BASE_KEYS, ALG_MOVE_KEYS, type AlgKeyboardEdit } from '../lib/algKeyboard';

export function AlgKeyboard({ id, empty, onEdit, size = 3 }: {
  id: string;
  empty: boolean;
  onEdit: (edit: AlgKeyboardEdit) => void;
  size?: 2 | 3;
}) {
  return (
    <div id={id} className="alg-keyboard" role="group" aria-label="公式键盘">
      <p className="muted small">{size === 2 ? "先点转法，再点 '、2 或 3；二阶公式只使用六个面的转动。" : "先点转法，再点 '、2 或 3；小写表示宽转。"}</p>
      <div className="alg-keyboard-moves">
        {(size === 2 ? ALG_BASE_KEYS : ALG_MOVE_KEYS).map((token) => (
          <button type="button" key={token} onClick={() => onEdit({ type: 'append', token })}>{token}</button>
        ))}
      </div>
      <div className="alg-keyboard-actions">
        {(["'", '2', '3'] as const).map((suffix) => (
          <button type="button" key={suffix} disabled={empty} title="修改最后一个转法的后缀" onClick={() => onEdit({ type: 'suffix', suffix })}>{suffix}</button>
        ))}
        <button type="button" disabled={empty} onClick={() => onEdit({ type: 'backspace' })} title="删除末尾一个字符">退格</button>
        <button type="button" disabled={empty} onClick={() => onEdit({ type: 'clear' })}>清空</button>
      </div>
    </div>
  );
}
