// Wrap compact notation too, while retaining the exact text and group suffixes for copying.
function displayParts(text: string) {
  const tokens = text.match(/[（(]*(?:[RLUDFB]w?|[MESrludfbxyz])\d*['’‘`´]?(?:[)）]\d*['’‘`´]?)*|\s+|\S/gu) ?? [];
  const parts: (string | string[])[] = [];
  let group: string[] | undefined;
  let depth = 0;
  for (const token of tokens) {
    const opens = token.match(/[（(]/g)?.length ?? 0;
    const closes = token.match(/[)）]/g)?.length ?? 0;
    if (opens && !group) {
      group = [];
      parts.push(group);
    }
    if (group) {
      group.push(token);
      depth += opens - closes;
      if (depth <= 0) group = undefined;
    } else {
      parts.push(token);
    }
  }
  return parts;
}

function renderTurn(token: string, key: number) {
  return /^\s+$/.test(token) ? token : <span key={key} className="alg-turn">{token}</span>;
}

export function AlgText({ text }: { text: string }) {
  return <code className="alg">{displayParts(text).map((part, i) => typeof part === 'string'
    ? renderTurn(part, i)
    : <span key={i} className="alg-phrase">{part.map(renderTurn)}</span>)}</code>;
}
