import { describe, expect, it } from 'vitest';
import { WV_CASES } from './wv';
import { algSolvesCase, caseState, displayColors } from '../lib/cases';
import { STICKERS as S, applyMoves, invertMoves, solved, stickerAt } from '../lib/cube';
import { parseAlg } from '../lib/alg';

// Independent physical orientation table and source mapping: docs/tasks/WV.md section 4.
// J Perm live source: https://www.jperm.net/lib/wv.js (2026-11-12).
// CubeSkills: https://www.cubeskills.com/uploads/pdf/tutorials/wv-algorithms.pdf,
// both pages visually checked; 22 explicit algorithms, five insert-then-OLL suggestions excluded.
const REFERENCES = [
  {
    "id": "wv-1",
    "geo": "UBL:U, UBR:U, UFL:U",
    "jp": "L' U2 (R U R') U2 L",
    "cs": "L' U2 (R U R') U2' L"
  },
  {
    "id": "wv-2",
    "geo": "UBL:U, UBR:R, UFL:U",
    "jp": "R U' R'",
    "cs": "R U' R'"
  },
  {
    "id": "wv-3",
    "geo": "UBL:U, UBR:B, UFL:U",
    "jp": "U' R' F R U R U' R' F'",
    "cs": "U' (R' F R U) (R U' R' F')"
  },
  {
    "id": "wv-4",
    "geo": "UBL:B, UBR:U, UFL:U",
    "jp": "R2 D R' U' R D' R2",
    "cs": "R2 D (R' U' R) D' R2'"
  },
  {
    "id": "wv-5",
    "geo": "UBL:L, UBR:U, UFL:U",
    "jp": "(R U' R') U (R' U' R U' R' U2 R)",
    "cs": "(R U' R') U [R' U' R U' R' U2 R]"
  },
  {
    "id": "wv-6",
    "geo": "UBL:U, UBR:U, UFL:L",
    "jp": "U' (R U' R' U2) (R U' R' U2) R U R'",
    "cs": "U' (R U' R' U2) (R U' R' U2) (R U R')"
  },
  {
    "id": "wv-7",
    "geo": "UBL:U, UBR:U, UFL:F",
    "jp": "R U R' U' R U' R'",
    "cs": "(R U R' U') (R U' R')"
  },
  {
    "id": "wv-8",
    "geo": "UBL:B, UBR:U, UFL:L",
    "jp": "U R U' R' U R U2 R'",
    "cs": "U (R U' R' U) (R U2' R')"
  },
  {
    "id": "wv-9",
    "geo": "UBL:B, UBR:U, UFL:F",
    "jp": "R U' R' U R U2 (R2 U' R2 U' R2) U2 R",
    "cs": "U F' (R U2' R' U2') R' F R"
  },
  {
    "id": "wv-10",
    "geo": "UBL:L, UBR:U, UFL:L",
    "jp": "R U (R2 U' R2 U' R2) U2 R",
    "cs": "R U R2' U' R2 U' R2' U2' R"
  },
  {
    "id": "wv-11",
    "geo": "UBL:L, UBR:U, UFL:F",
    "jp": "U R' U' R2 U' R2 U2 R",
    "cs": "U R' U' R2 U' R2' U2' R"
  },
  {
    "id": "wv-12",
    "geo": "UBL:U, UBR:R, UFL:L",
    "jp": "U' (R' F2 R F2) U L' U L",
    "cs": null
  },
  {
    "id": "wv-13",
    "geo": "UBL:U, UBR:R, UFL:F",
    "jp": "U R U2 R' (R' U' R U' R' U2 R)",
    "cs": "U R U2' [R2' U' R U' R' U2 R]"
  },
  {
    "id": "wv-14",
    "geo": "UBL:U, UBR:B, UFL:L",
    "jp": "U R2 D R' U2 R D' R2",
    "cs": "U R2 D (R' U2 R) D' R2'"
  },
  {
    "id": "wv-15",
    "geo": "UBL:U, UBR:B, UFL:F",
    "jp": "U' L' (U R U' R') L",
    "cs": "U' L' (U R U' R') L"
  },
  {
    "id": "wv-16",
    "geo": "UBL:B, UBR:R, UFL:U",
    "jp": "U R U' R' U' R' F R U R U' R' F'",
    "cs": null
  },
  {
    "id": "wv-17",
    "geo": "UBL:L, UBR:R, UFL:U",
    "jp": "U' R' F' R U2 R U2 R' F",
    "cs": null
  },
  {
    "id": "wv-18",
    "geo": "UBL:B, UBR:B, UFL:U",
    "jp": "U R U2 R'",
    "cs": "U R U2' R'"
  },
  {
    "id": "wv-19",
    "geo": "UBL:L, UBR:B, UFL:U",
    "jp": "R U' R D' R U2 R' D R U2 R",
    "cs": null
  },
  {
    "id": "wv-20",
    "geo": "UBL:B, UBR:R, UFL:L",
    "jp": "R U' R' U' (R U R' U R U2 R')",
    "cs": "(R U' R') U' [R U R' U R U2' R']"
  },
  {
    "id": "wv-21",
    "geo": "UBL:B, UBR:B, UFL:L",
    "jp": "R U' R' (R' U2 R U R' U R",
    "cs": "R U' [R2' U2' R U R' U R]"
  },
  {
    "id": "wv-22",
    "geo": "UBL:B, UBR:R, UFL:F",
    "jp": "R2 D R' U R D' R' U2 R'",
    "cs": "R2 D (R' U R) D' R' U2 R'"
  },
  {
    "id": "wv-23",
    "geo": "UBL:B, UBR:B, UFL:F",
    "jp": "U R' U L U' R2 U L' U R'",
    "cs": null
  },
  {
    "id": "wv-24",
    "geo": "UBL:L, UBR:R, UFL:L",
    "jp": "U R U' R' U R U' R' U R U2 R'",
    "cs": "U (R U' R' U) (R U' R' U) R U2' R'"
  },
  {
    "id": "wv-25",
    "geo": "UBL:L, UBR:B, UFL:L",
    "jp": "U R U2 R' (R' U2 R U R' U R)",
    "cs": "U R U2' [R2' U2' R U R' U R]"
  },
  {
    "id": "wv-26",
    "geo": "UBL:L, UBR:R, UFL:F",
    "jp": "R U' R' (R' U' R U' R' U2 R)",
    "cs": "R U' [R2' U' R U' R' U2 R]"
  },
  {
    "id": "wv-27",
    "geo": "UBL:L, UBR:B, UFL:F",
    "jp": "R U R' U' R U R' U' R U' R'",
    "cs": "(R U R' U') (R U R' U') R U' R'"
  }
];

// Only source-table grouping marks are removed. JP #22 lacks a closing parenthesis;
// PDF square brackets mark triggers. No moves are added/removed and parseAlg stays strict.
const referenceAlg = (raw: string) => 'U ' + raw.replace(/[()\[\]]/g, '');
const centers = S.filter((s) => s.p.filter(Boolean).length === 1).map((s) => s.id);

describe('WV 独立来源与物理姿态', () => {
  for (const [index, ref] of REFERENCES.entries()) {
    const c = WV_CASES[index];
    it(`${ref.id}: 稳定编号、分组、相连对及角块三元组`, () => {
      expect(c.id).toBe(ref.id);expect(c.name).toBe(`WV ${index + 1}`);expect(c.set).toBe('wv');
      const st = caseState(c);
      const faces = [[-1, 1, -1], [1, 1, -1], [-1, 1, 1]].map((p) =>
        S.find((s) => s.p.every((v, i) => v === p[i]) && S[st[s.id]].face === 'U')!.face,
      );
      expect(faces).toEqual(ref.geo.split(', ').map((s) => s.split(':')[1]));
      const count = faces.filter((face) => face === 'U').length;
      expect(c.group).toBe(`${count} ${count === 1 ? 'Corner' : 'Corners'}`);
      const pair = [
        [stickerAt([1, 1, 1], [0, 1, 0]), stickerAt([1, -1, 1], [0, 0, 1])],
        [stickerAt([1, 1, 1], [0, 0, 1]), stickerAt([1, -1, 1], [0, -1, 0])],
        [stickerAt([1, 1, 1], [1, 0, 0]), stickerAt([1, -1, 1], [1, 0, 0])],
        [stickerAt([1, 1, 0], [0, 1, 0]), stickerAt([1, 0, 1], [0, 0, 1])],
        [stickerAt([1, 1, 0], [1, 0, 0]), stickerAt([1, 0, 1], [1, 0, 0])],
      ];
      for (const [loc, id] of pair) expect(st[loc]).toBe(id);
      for (const p of [[0, 1, -1], [-1, 1, 0], [0, 1, 1]] as const) expect(S[st[stickerAt([...p], [0, 1, 0])]].face).toBe('U');
    });
    it(`${ref.id}: J Perm 同号对应与唯一匹配`, () => {
      expect(WV_CASES.filter((candidate) => algSolvesCase(candidate, referenceAlg(ref.jp))).map((candidate) => candidate.id)).toEqual([ref.id]);
    });
    if (ref.cs) it(`${ref.id}: CubeSkills 原表对应`, () => {
      expect(WV_CASES.filter((candidate) => algSolvesCase(candidate, referenceAlg(ref.cs!))).map((candidate) => candidate.id)).toEqual([ref.id]);
    });
    it(`${ref.id}: 每条内置公式原始中心不偏移，不靠归一化`, () => {
      for (const alg of c.algs) {
        const raw = applyMoves(solved(), invertMoves(parseAlg(alg)));
        for (const id of centers) expect(raw[id]).toBe(id);
        const after = applyMoves(caseState(c), parseAlg(alg));
        for (const id of centers) expect(after[id]).toBe(id);
      }
    });
  }

  it('27 个三元组覆盖所有组合，22 条 PDF 参考，27 张顶视图签名互异', () => {
    expect(WV_CASES).toHaveLength(27);
    expect(REFERENCES.filter((r) => r.cs)).toHaveLength(22);
    const expected = ['U', 'B', 'L'].flatMap((a) => ['U', 'R', 'B'].flatMap((b) => ['U', 'L', 'F'].map((c) => `UBL:${a}, UBR:${b}, UFL:${c}`)));
    expect(REFERENCES.map((r) => r.geo).sort()).toEqual(expected.sort());
    expect(['3 Corners', '2 Corners', '1 Corner', '0 Corners'].map((group) => WV_CASES.filter((c) => c.group === group).length)).toEqual([1, 6, 12, 8]);
    const signatures = WV_CASES.map((c) => { const colors = displayColors(c);return S.filter((s) => s.p[1] === 1).map((s) => colors[s.id] ?? '.').join(''); });
    expect(new Set(signatures).size).toBe(27);
  });

});
