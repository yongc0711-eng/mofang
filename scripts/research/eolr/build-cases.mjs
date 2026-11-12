/** Reproducible MU completions for the audited Bas catalog. No handwritten cube states. */
import fs from 'node:fs';
import { registerHooks } from 'node:module';
registerHooks({ resolve(s, c, next) { return next(s.startsWith('.') && !/\.[a-z]+$/i.test(s) ? s + '.ts' : s, c); } });
const { solved, applyMoves, invertMoves } = await import('../../../src/lib/cube.ts');
const { parseAlg, movesToString } = await import('../../../src/lib/alg.ts');
const { inspectEolr } = await import('../../../src/lib/eolr.ts');
const catalog = JSON.parse(fs.readFileSync(new URL('./basilio-eolr-verified.json', import.meta.url)));
const names = ['U', "U'", 'U2', 'M', "M'", 'M2'];
const moves = names.map(parseAlg);
const inverse = moves.map(m => movesToString(invertMoves(m)));
const key = s => s.join(',');
const states = [solved()], visited = new Set([key(states[0])]);
const parents = [-1], parentMoves = [0];
for (let i = 0; i < states.length; i++) {
  for (let j = 0; j < moves.length; j++) {
    const m = moves[j];
    const state = applyMoves(states[i], m), k = key(state);
    if (!visited.has(k)) { visited.add(k); states.push(state); parents.push(i); parentMoves.push(j); }
  }
}
if (states.length !== 184320) throw new Error('MU subgroup enumeration failed');
const goals = states.filter(s => inspectEolr(s).tier3);
const nuisanceAlgs = [];
for (let i = 0; i < states.length; i++) {
  const info = inspectEolr(states[i]);
  if (!info.tier3 || info.centerPhase !== 0) continue;
  const path = [];
  for (let n = i; parents[n] !== -1; n = parents[n]) path.push(names[parentMoves[n]]);
  nuisanceAlgs.push(path.reverse().join(' '));
}
if (nuisanceAlgs.length !== 12) throw new Error('Expected 12 even M-edge permutations');
const paths = new Map(goals.map(s => [key(s), '']));
const queue = [...goals];
for (let i = 0; i < queue.length; i++) {
  const suffix = paths.get(key(queue[i]));
  for (let j = 0; j < moves.length; j++) {
    const state = applyMoves(queue[i], moves[j]), k = key(state);
    if (!paths.has(k)) { paths.set(k, [inverse[j], suffix].filter(Boolean).join(' ')); queue.push(state); }
  }
}
const cases = catalog.map(row => {
  const setup = row.verifiedSetup, start = applyMoves(solved(), parseAlg(setup));
  const source = row.boldAlg;
  // Missing per-column algorithms and standard OLL's R/r path are supplemented
  // computationally; they are explicitly NOT attributed to the printed bold text.
  let alg = source ?? '';
  let computed = false;
  if (!source || parseAlg(alg).some(m => !'MU'.includes(m.base))) {
    const solution = paths.get(key(start));
    const split = Math.max(1, parseAlg(solution).length - 5);
    alg = movesToString(parseAlg(solution).slice(0, split)); computed = true;
  }
  const end = applyMoves(start, parseAlg(alg)), info = inspectEolr(end);
  const continuation = paths.get(key(end));
  if (continuation === undefined) throw new Error(row.caseId + ' is outside MU subgroup');
  const targetTier = info.tier3 ? 'tier3' : info.tier2 ? 'tier2' : 'tier1';
  return {
    id: 'eolr-' + row.caseId.replaceAll('/', '-'), set: 'eolr', name: 'EOLR ' + row.caseId,
    group: row.row, algs: [alg], setup, targetTier,
    ...(targetTier === 'tier1' ? { reductionKey: info.key } : {}),
    ...(continuation ? { continuationAlg: continuation } : {}),
    isBadCase: row.isBadCase, sourceCase: row.caseId,
    recognition: `${row.isBadCase ? '不利情形，优先按常规 EO 化归。' : ''}${targetTier === 'tier1' ? '短公式停在化归中间态，开启接续完成 LR。' : targetTier === 'tier2' ? '短公式完成 EO 并把 LR 放入底层双槽；开启接续归位。' : '短公式完成 EO、具名 LR 与顶角对齐。'}`,
    sourceAlg: source, sourceMatch: row.matchStatus, computedPrefix: computed,
  };
});
const output = new URL('../../../src/data/eolr.ts', import.meta.url);
fs.writeFileSync(output, `// Bas, 04.08.2023: https://basilio.dev/cubing/images/ALGS-EOLR.pdf\n// Audited diagram/setup mapping and reproducible MU completions: scripts/research/eolr/build-cases.mjs\nimport type { AlgCase } from '../types';\n\nexport const EOLR_CASES: (AlgCase & { sourceAlg: string | null; sourceMatch: string; computedPrefix: boolean })[] = ${JSON.stringify(cases, null, 2)};\n\n// Legal source-label permutations of only the other four M edges.\nexport const EOLR_NUISANCE_ALGS = ${JSON.stringify(nuisanceAlgs,null,2)};\n`);
console.log(JSON.stringify({ cases: cases.length, goals: goals.length, tiers: Object.fromEntries(['tier1','tier2','tier3'].map(t => [t, cases.filter(c => c.targetTier === t).length])), maxContinuation: Math.max(...cases.map(c => parseAlg(c.continuationAlg ?? '').length)), computedPrefixes: cases.filter(c => c.computedPrefix).map(c => c.id) }));
