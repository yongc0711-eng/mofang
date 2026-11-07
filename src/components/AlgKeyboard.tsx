import { ALG_KEY_TOKENS, type AlgKeyboardEdit } from '../lib/algKeyboard';

export function AlgKeyboard({ id, empty, onEdit }: {
  id: string;
  empty: boolean;
  onEdit: (edit: AlgKeyboardEdit) => void;
}) {
  return (
    <div id={id} className="alg-keyboard" role="group" aria-label="公式键盘">
      <div className="alg-keyboard-moves">
        {ALG_KEY_TOKENS.map((token) => (
          <button type="button" key={token} onClick={() => onEdit({ type: 'append', token })}>{token}</button>
        ))}
      </div>
      <div className="alg-keyboard-actions">
        <button type="button" disabled={empty} onClick={() => onEdit({ type: 'backspace' })} title="删除末尾一个字符">退格</button>
        <button type="button" disabled={empty} onClick={() => onEdit({ type: 'clear' })}>清空</button>
      </div>
    </div>
  );
}
