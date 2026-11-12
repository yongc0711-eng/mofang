# WV：CFOP Winter Variation 公式集接入规格（27 情形）

## 1. 目标与范围

在 CFOP 方法下新增 **WV（Winter Variation，27 情形）** 公式集：当最后一组 F2L（`FR` 槽）已经在顶层配成相连对（`R U' R'` 型基础入槽对），且顶层棱块朝向已全部完成（执行入槽后 4 个顶棱全部黄朝上）时，在插入最后一对的同时一次性还原全部 4 个顶层角块朝向（跳过 OLL，直接进入 PLL）。

- **独立可交付**：`WV` 的前置依赖（`T71` 练习抽样与统计基础、`COLL`、`SBLS`）均已在 `main`（`fd4ddf1` / `ec07c28`）合入发布，本任务不依赖任何未完成前置任务，也不与 `EOLR` 绑定。
- **严守硬约束**：
  - 不得为了通过测试而放宽现有 `SET_RULES`（`f2l`、`oll`、`pll`、`coll`、`cmll`、`lse`、`sbls`）。
  - 不得删除、skip、todo 或放宽现有测试断言；基线数量同步按 `docs/decisions.md` **D22** 等强度更新。
  - 不得修改任何已录入情形的 `id`，不得改动 `SBLS_RULE.display` 或 SBLS 图解掩码。
  - 全部 27 个情形的主公式与备选公式均**不含 `x / y / z` 整体转体**，且执行后 **6 个中心块完全保持原位**（`normalize: false`，不靠 `normalizeRotation` 掩盖起手或中心差异）。

---

## 2. 权威资料核验与收录口径（27 情形）

### 2.1 参考资料与具体链接

1. **SpeedCubeDB — Winter Variation (WV, 27 cases)**
   - 链接：`https://speedcubedb.com/a/3x3/WV`
   - 收录 `WV 1`–`WV 27` 共 27 个情形，按未连接对外的 3 个顶层角块（`UBL`、`UBR`、`UFL`）黄面朝上的数量分为 4 组：`3 Corners`（1）、`2 Corners`（6）、`1 Corner`（12）、`0 Corners`（8）。
2. **J Perm — Winter Variation Algorithms (27 cases)**
   - 链接：`https://jperm.net/algs/wv`（数据源：`https://jperm.net/lib/wv.js`）
   - 同样收录 27 个情形，分为 `3 Corners`（1）、`2 Corners`（6：Rectangle 2 / Snake 2 / Tank 2）、`1 Corner`（12：Gun 4 / Bowtie 4 / Adjacent 4）、`0 Corners`（8：Sune 2 / Pi 4 / H 2）。
3. **CubeSkills (Feliks Zemdegs) — Winter Variation Algorithms PDF (27 cases)**
   - 链接：`https://www.cubeskills.com/uploads/pdf/tutorials/wv-algorithms.pdf`
   - 同样收录 27 个情形，分为 `3 Corners Oriented`（1）、`2 Corners Oriented`（6）、`1 Corner Oriented`（12，其中 8 个给出专用公式，4 个推荐 `(R U' R') -> [OLL]`）、`0 Corners Oriented`（8，其中 7 个给出专用公式，1 个推荐 `(R U' R') -> [OLL]`）。

### 2.2 WV 与 SV、VLS 的边界区分

| 公式集 | 起手最后一对形态 | 顶棱朝向前提 | 完成目标 | 情形总数 |
|---|---|---|---|---|
| **VLS (Valk Last Slot)** | `FR` 槽相连对（`R U' R'` 型） | 任意顶棱朝向（含全部 8 种 EO 状态） | 入槽同时完成整个 OLL（顶棱 + 顶角朝向） | 216（$27 \times 8$） |
| **WV (Winter Variation)** | `FR` 槽相连对（`R U' R'` 型，VLS 的全顶棱已翻正子集） | 顶层其余 3 个顶棱已朝上，相连对中的 `FR` 棱入槽后亦翻正 | 入槽同时完成全部 4 个顶角朝向（跳过 OLL，剩 PLL） | **27** |
| **SV (Summer Variation)** | `FR` 槽分离对（`R U R'` 型三步入槽对） | 顶层其余 3 个顶棱按 `R U R'` 入槽后全翻正 | 入槽同时完成全部 4 个顶角朝向 | 27（不在本任务范围） |

### 2.3 为什么恰好是 27 个情形（含普通入槽 `WV 2`）

在 `FR` 槽相连对固定的前提下：
- 顶层其余 3 个角块位置为 `UBL`（`[-1, 1, -1]`）、`UBR`（`[1, 1, -1]`）、`UFL`（`[-1, 1, 1]`）。
- 每个顶层角块的 `U` 面贴纸有 3 种可能朝向：
  - `UBL`：`U`、`B`、`L`
  - `UBR`：`U`、`B`、`R`
  - `UFL`：`U`、`F`、`L`
- 第 4 个顶层角块此时位于底前右槽 `DFR`（`[1, -1, 1]`），其朝向由魔方角块总色向和（$\equiv 0 \pmod 3$）唯一确定。
- 因此，3 个顶层角块的朝向共有 $3^3 = 27$ 种独立可达组合：
  - **`3 Corners`**（3 角朝上）：$\binom{3}{3}\cdot 1^0 = 1$ 个（`WV 1`）
  - **`2 Corners`**（2 角朝上）：$\binom{3}{2}\cdot 2^1 = 6$ 个（`WV 2`–`WV 7`）
  - **`1 Corner`**（1 角朝上）：$\binom{3}{1}\cdot 2^2 = 12$ 个（`WV 8`–`WV 19`）
  - **`0 Corners`**（0 角朝上）：$\binom{3}{0}\cdot 2^3 = 8$ 个（`WV 20`–`WV 27`）
- **普通入槽（`U R U' R'`）计为 `WV 2`**：SpeedCubeDB、J Perm（#2）、CubeSkills（#2）三份权威资料全部将基础入槽收录为第 2 号情形（`UBL:U, UBR:R, UFL:U`），以保持 $3^3 = 27$ 组合完整无缺。

### 2.4 跨来源起手摆法差异（`UFR + UR` vs `UFL + UF`）与统一口径

不同资料对相连对的起手位置有两种约定，二者仅相差一步前置 `U`：

1. **SpeedCubeDB 口径（相连对位于目标槽正上方 `UFR + UR`）**：
   - `DFR` 角块位于 `UFR`（`[1, 1, 1]`，`D` 贴纸朝 `F`、`F` 贴纸朝 `U`、`R` 贴纸朝 `R`）；
   - `FR` 棱块位于 `UR`（`[1, 1, 0]`，`F` 贴纸朝 `U`、`R` 贴纸朝 `R`）；
   - 基础入槽公式（`WV 2`）为 **`U R U' R'`**。
   - **这与本仓库现有 `f2l-1`（`src/data/f2l.ts`：`algs: ["U R U' R'", ...]`）的起手位置完全一致。**
2. **J Perm / CubeSkills 口径（已先做完一步 `U`，相连对位于 `UFL + UF`）**：
   - 相连对已被 `U` 拨到 `UFL`（`[-1, 1, 1]`）+ `UF`（`[0, 1, 1]`）；
   - 基础入槽公式为 **`R U' R'`**。
   - 将 J Perm 的 27 条公式或 CubeSkills 的 22 条显式公式前面左乘一步 `U`（并合并首步 `U + U -> U2`、`U + U' -> ε`、`U + U2 -> U'`），在 `src/lib/cube.ts` 引擎下与 SpeedCubeDB 的 `WV 1`–`WV 27` **27/27（J Perm）及 22/22（CubeSkills）逐一精确等价**。

**本项目采用口径**：
- 统一采用 **SpeedCubeDB / `f2l-1` 的 `UFR + UR` 起手姿态**；
- 稳定 ID 为 `wv-1` 至 `wv-27`；
- 名称为 `WV 1` 至 `WV 27`（与 SpeedCubeDB 编号 1:1 对应，按 `(UBL, UBR, UFL)` 朝向字典序排列）；
- 分组名称固定为：`3 Corners`（1）、`2 Corners`（6）、`1 Corner`（12）、`0 Corners`（8）。

---

## 3. 可执行规则与贴纸掩码规格（基于 `STICKERS` 几何坐标独立核计）

### 3.1 `STICKERS` 贴纸精确计数核对

在 [`src/lib/cube.ts`](file:///d:/allwork/mofang/src/lib/cube.ts) 中，全魔方共 **54** 张贴纸（`id: 0..53`），各谓词下的贴纸数量经几何坐标独立核计如下：

| 谓词 / 掩码 | 坐标定义 | 精确贴纸数 | 组成明细 |
|---|---|---:|---|
| 全魔方 `all` | `() => true` | **54** | 6 面 × 9 张 = 54 |
| 顶层块 `inU(id)` | `S[id].p[1] === 1` | **21** | `U` 面 9 张 + `F/B/L/R` 顶行各 3 张（12 张） |
| 前两层 `isF2LPiece(id)` | `S[id].p[1] !== 1`（即 `y <= 0`） | **33** | `D` 面 9 张 + 底行 12 张 + 中层 12 张（含 `D/F/B/L/R` 5 个中心块） |
| 右前槽对 `isFRPair(id)` | `p[0] === 1 && p[2] === 1 && p[1] <= 0` | **5** | `DFR` 角块（`[1,-1,1]`，3 张）+ `FR` 棱块（`[1,0,1]`，2 张） |
| **WV 保护掩码 `isWvPreserve(id)`** | `isF2LPiece(id) && !isFRPair(id)` | **28** | 前两层 33 张减去 `FR` 槽对 5 张 = **28 张**（含左前 `FL`、左后 `BL`、右后 `BR` 三槽、底十字 4 棱及 5 个非 `U` 中心） |
| 顶面贴纸 `uFace(id)` | `S[id].face === 'U'` | **9** | `U` 面 9 张贴纸（含 `U` 中心 1 张 + 顶棱顶面 4 张 + 顶角顶面 4 张） |
| **WV 显示与完成掩码 `isWvMask(id)`** | `isF2LPiece(id) \|\| uFace(id)` | **42** | 前两层 33 张 + `U` 面 9 张 = **42 张**（仅忽略顶层 8 个块在 `F/B/L/R` 侧面的 12 张贴纸） |

### 3.2 起手前提、完成目标与变换范围

1. **起手前提（在 `after = applyMoves(solved(), invertMoves(alg))` 上检查）**：
   - **前两层保护区完好**：`isWvPreserve(loc)` 的 **28** 张贴纸全部满足 `after[loc] === loc`，且全部 6 个中心满足 `after[c] === c`。
   - **最后一对相连且位于 `UFR + UR`**：
     - `UFR` 角块位（`p = [1, 1, 1]`）上是 `DFR` 角块（原位 `[1, -1, 1]`），且其 `D` 贴纸朝 `F`、`F` 贴纸朝 `U`、`R` 贴纸朝 `R`；
     - `UR` 棱块位（`p = [1, 1, 0]`）上是 `FR` 棱块（原位 `[1, 0, 1]`），且其 `F` 贴纸朝 `U`、`R` 贴纸朝 `R`。
   - **顶棱朝向已完成**：顶层其余 3 个棱块位 `UB`（`[0, 1, -1]`）、`UL`（`[-1, 1, 0]`）、`UF`（`[0, 1, 1]`）在 `U` 面上的贴纸（`S[loc].face === 'U'`）必须全部是顶面色（`S[after[loc]].face === 'U'`）。
2. **完成目标（`solve: isWvMask`，42 张贴纸）**：
   - 前两层 **33** 张贴纸全部回到原位（4 组 F2L 全部还原，且底十字与中层中心对齐）；
   - 顶面 `U` 的 **9** 张贴纸全部为 `U` 面色（OLL 完成）；
   - 顶层块在 `F/B/L/R` 侧面的 12 张贴纸允许任意 PLL 排列，允许任意后置 `U / U' / U2`（`post` $\in \{0, 1, 2, 3\}$）。
3. **变换与归一化限制**：
   - `preUs: [0]`：起手姿态对 `U` 敏感（做 `U` 会把 `UFR + UR` 的相连对转走），不得对前置 `U` 取等价类。
   - `preY: [0]`：目标槽固定为 `FR`，不允许 `y` 转体等价。
   - `normalize: false`：主公式与备选公式禁止包含 `x / y / z` 转体，且执行前后 6 个中心块必须保持原位（`after[c] === c`），不启用 `normalizeRotation`。
4. **2D 图解与 3D 播放器**：
   - `CaseSet.view` 设为 `'top'`（使用 `TopView` 21 格顶视图渲染）。
   - 在 `display: isWvMask`（42 张贴纸）下，`DFR` 角块与 `FR` 棱块的全部 5 张贴纸满足 `isF2LPiece(id) === true`，因此位于 `UFR + UR` 的相连对在顶视图与外圈侧边条上显示完整绿/橙/白配色；而顶层其余 3 个棱块和 3 个角块仅 `U` 贴纸满足 `uFace(id) === true`，非 `U` 贴纸渲染为灰色，与 `OLL` 顶视图风格完全一致。
   - 27 个情形在 `TopView` 下的 21 格颜色签名 **27/27 两两互异**。
5. **练习模式接入**：
   - **不加入 `AUF_SETS`**（[`src/lib/practice.ts`](file:///d:/allwork/mofang/src/lib/practice.ts)）：WV 起手相连对位置固定在 `UFR + UR`，随机前置 `U` 会改变起手姿态。
   - **不加入 `options` / `variation`**（[`src/lib/practiceSample.ts`](file:///d:/allwork/mofang/src/lib/practiceSample.ts)）：`pll-ua` 三棱换会移动 `UR` 位的 `FR` 棱块，破坏相连对。
   - `isRouxSet('wv')` 为 `false`，练习配色沿用 CFOP 配色池。

### 3.3 `src/lib/cases.ts` 中的 `WV_RULE` 与 `lintWvState` 实现规格

在 [`src/lib/cases.ts`](file:///d:/allwork/mofang/src/lib/cases.ts) 中新增：

```ts
// WV (Winter Variation)：前两层除 FR 槽外已还原，FR 相连对位于 UFR+UR，其余 3 顶棱已翻正；
// 入槽同时还原全部顶面朝向（前两层 33 + U 面 9 = 42 张贴纸）。
const isWvMask: Mask = (id) => isF2LPiece(id) || uFace(id);
const isWvPreserve: Mask = (id) => isF2LPiece(id) && !isFRPair(id);

const WV_RULE: SetRule = {
  display: isWvMask,
  solve: isWvMask,
  preserve: isWvPreserve,
  preUs: [0],
  preY: [0],
  normalize: false,
};
```

并在 `SET_RULES` 中注册 `wv: WV_RULE`。同时新增起手结构校验函数 `lintWvState` 并在 `verifyCase` 中当 `setId === 'wv'` 时调用：

```ts
function lintWvState(caseId: string, after: CubeState, algs: string[]): string[] {
  const errors: string[] = [];
  for (const alg of algs) {
    if (parseAlg(alg).some((m) => 'xyz'.includes(m.base))) {
      errors.push(`${caseId}: WV 公式不允许包含整体转体 x/y/z: ${alg}`);
    }
  }
  if (!CENTERS.every((id) => after[id] === id)) {
    errors.push(`${caseId}: WV 起手中心块偏移`);
  }
  // 1. 检查 UFR ([1,1,1]) 必须是 DFR 角块 ([1,-1,1])，且朝向为 U<-F, F<-D, R<-R
  for (let loc = 0; loc < 54; loc++) {
    const p = S[loc].p;
    if (p[0] === 1 && p[1] === 1 && p[2] === 1) {
      const src = S[after[loc]];
      const expectedFace = S[loc].face === 'U' ? 'F' : S[loc].face === 'F' ? 'D' : 'R';
      if (src.p[0] !== 1 || src.p[1] !== -1 || src.p[2] !== 1 || src.face !== expectedFace) {
        errors.push(`${caseId}: WV 起手 UFR 角块不是相连的 DFR 角块姿态`);
        break;
      }
    }
  }
  // 2. 检查 UR ([1,1,0]) 必须是 FR 棱块 ([1,0,1])，且朝向为 U<-F, R<-R
  for (let loc = 0; loc < 54; loc++) {
    const p = S[loc].p;
    if (p[0] === 1 && p[1] === 1 && p[2] === 0) {
      const src = S[after[loc]];
      const expectedFace = S[loc].face === 'U' ? 'F' : 'R';
      if (src.p[0] !== 1 || src.p[1] !== 0 || src.p[2] !== 1 || src.face !== expectedFace) {
        errors.push(`${caseId}: WV 起手 UR 棱块不是相连的 FR 棱块姿态`);
        break;
      }
    }
  }
  // 3. 检查其余 3 个顶层棱块位 UB([0,1,-1])、UL([-1,1,0])、UF([0,1,1]) 的 U 面贴纸已翻正
  for (let loc = 0; loc < 54; loc++) {
    const p = S[loc].p;
    const isOtherUEdgeTop =
      S[loc].face === 'U' &&
      ((p[0] === 0 && p[1] === 1 && p[2] === -1) ||
        (p[0] === -1 && p[1] === 1 && p[2] === 0) ||
        (p[0] === 0 && p[1] === 1 && p[2] === 1));
    if (isOtherUEdgeTop && S[after[loc]].face !== 'U') {
      errors.push(`${caseId}: WV 起手顶层棱块朝向未完成`);
      break;
    }
  }
  return errors;
}
```

同时在 `verifyCase` 的备选公式循环中，对 `setId === 'wv'` 检查每条备选公式：
- 不含 `x / y / z`；
- `applyMoves(solved(), invertMoves(parseAlg(alg)))` 的 6 个中心块保持 `id === loc`；
- 对 `base` 执行备选公式 + `U^post` 后中心块同样保持 `id === loc`。

---

## 4. 完整 27 情形核验数据表

下表列出全部 27 个情形的 `id`、`name`、`group`、通过引擎核验的主公式与备选公式、J Perm / CubeSkills 对应关系，以及顶层 3 个角块位 `(UBL, UBR, UFL)` 上 `U` 色贴纸所在的物理面朝向（27 个三元组覆满 `{U,B,L} × {U,B,R} × {U,F,L}`）：

| ID | 名称 | 分组 (`group`) | `(UBL, UBR, UFL)` U 贴纸朝向 | 主公式 (`algs[0]`) | 备选公式 (`algs[1]`) | J Perm 对应（前置 `U` 前原式） | CubeSkills 对应（前置 `U` 前原式） |
|---|---|---|---|---|---|---|---|
| `wv-1` | `WV 1` | `3 Corners` | `UBL:U, UBR:U, UFL:U` | `U L' U2 R U R' U2 L` | `L' U2 R U2 R' U2 L` | JP #1: `L' U2 R U R' U2 L` | CS #1: `L' U2 (R U R') U2' L` |
| `wv-2` | `WV 2` | `2 Corners` | `UBL:U, UBR:R, UFL:U` | `U R U' R'` | `U l F' l'` | JP #2: `R U' R'` | CS #2: `R U' R'` |
| `wv-3` | `WV 3` | `2 Corners` | `UBL:U, UBR:B, UFL:U` | `R' F R U R U' R' F'` | `U' L U' R U L' U R'` | JP #3: `U' R' F R U R U' R' F'` | CS #5: `U' (R' F R U) (R U' R' F')` |
| `wv-4` | `WV 4` | `2 Corners` | `UBL:B, UBR:U, UFL:U` | `U R2 D R' U' R D' R2` | `U2 R' D' R U' R' D R2 U' R'` | JP #4: `R2 D R' U' R D' R2` | CS #6: `R2 D (R' U' R) D' R2'` |
| `wv-5` | `WV 5` | `2 Corners` | `UBL:L, UBR:U, UFL:U` | `U R U' R' U R' U' R U' R' U2 R` | `U R U' R' U2 R U2 R' U' R U' R'` | JP #5: `R U' R' U R' U' R U' R' U2 R` | CS #3: `(R U' R') U [R' U' R U' R' U2 R]` |
| `wv-6` | `WV 6` | `2 Corners` | `UBL:U, UBR:U, UFL:L` | `R U' R' U2 R U' R' U2 R U R'` | `U' R' D' R U2 R' D R2 U' R'` | JP #6: `U' R U' R' U2 R U' R' U2 R U R'` | CS #4: `U' (R U' R' U2) (R U' R' U2) (R U R')` |
| `wv-7` | `WV 7` | `2 Corners` | `UBL:U, UBR:U, UFL:F` | `U R U R' U' R U' R'` | `R' U' R U R U' R' U' R' U R` | JP #7: `R U R' U' R U' R'` | CS #7: `(R U R' U') (R U' R')` |
| `wv-8` | `WV 8` | `1 Corner` | `UBL:B, UBR:U, UFL:L` | `U2 R U' R' U R U2 R'` | `U2 R U L' U R' U' L` | JP #8: `U R U' R' U R U2 R'` | CS #8: `U (R U' R' U) (R U2' R')` |
| `wv-9` | `WV 9` | `1 Corner` | `UBL:B, UBR:U, UFL:F` | `U2 F' R U2 R' U2 R' F R` | `U R U' R' U R U2 R2 U' R2 U' R2 U2 R` | JP #9: `R U' R' U R U2 R2 U' R2 U' R2 U2 R` | CS #12: `U F' (R U2' R' U2') R' F R` |
| `wv-10` | `WV 10` | `1 Corner` | `UBL:L, UBR:U, UFL:L` | `U R U R2 U' R2 U' R2 U2 R` | `R' U2 R U R' U R2 U2 R'` | JP #10: `R U R2 U' R2 U' R2 U2 R` | CS #9: `R U R2' U' R2 U' R2' U2' R` |
| `wv-11` | `WV 11` | `1 Corner` | `UBL:L, UBR:U, UFL:F` | `U2 R' U' R2 U' R2 U2 R` | `U R U' R' L' U' L U' L' U2 L` | JP #11: `U R' U' R2 U' R2 U2 R` | CS #11: `U R' U' R2 U' R2' U2' R` |
| `wv-12` | `WV 12` | `1 Corner` | `UBL:U, UBR:R, UFL:L` | `R' F2 R F2 U L' U L` | `l' U2 l F2 U L' U L` | JP #12: `U' R' F2 R F2 U L' U L` | CS: `(R U' R') -> [OLL]` |
| `wv-13` | `WV 13` | `1 Corner` | `UBL:U, UBR:R, UFL:F` | `U2 R U2 R2 U' R U' R' U2 R` | `R' F R F' R' U' F' U F R` | JP #13: `U R U2 R' R' U' R U' R' U2 R` | CS #13: `U R U2' [R2' U' R U' R' U2 R]` |
| `wv-14` | `WV 14` | `1 Corner` | `UBL:U, UBR:B, UFL:L` | `U2 R2 D R' U2 R D' R2` | `U2 L' U R U' L U2 R'` | JP #14: `U R2 D R' U2 R D' R2` | CS #10: `U R2 D (R' U2 R) D' R2'` |
| `wv-15` | `WV 15` | `1 Corner` | `UBL:U, UBR:B, UFL:F` | `L' U R U' R' L` | `R' U R U2 R U2 R' U R' U2 R` | JP #15: `U' L' U R U' R' L` | CS #14: `U' L' (U R U' R') L` |
| `wv-16` | `WV 16` | `1 Corner` | `UBL:B, UBR:R, UFL:U` | `U R' D' R U R' D R2 U2 R'` | `U2 R U' R' U' R' F R U R U' R' F'` | JP #16: `U R U' R' U' R' F R U R U' R' F'` | CS: `(R U' R') -> [OLL]` |
| `wv-17` | `WV 17` | `1 Corner` | `UBL:L, UBR:R, UFL:U` | `R' F' R U2 R U2 R' F` | `U L' U2 R U' R' U2 L U R U' R'` | JP #18: `U' R' F' R U2 R U2 R' F` | CS: `(R U' R') -> [OLL]` |
| `wv-18` | `WV 18` | `1 Corner` | `UBL:B, UBR:B, UFL:U` | `U2 R U2 R'` | `U2 l F2 l'` | JP #17: `U R U2 R'` | CS #15: `U R U2' R'` |
| `wv-19` | `WV 19` | `1 Corner` | `UBL:L, UBR:B, UFL:U` | `R' F2 R2 U' R' U' R U R' F2` | `U R U' R D' R U2 R' D R U2 R` | JP #19: `R U' R D' R U2 R' D R U2 R` | CS: `(R U' R') -> [OLL]` |
| `wv-20` | `WV 20` | `0 Corners` | `UBL:B, UBR:R, UFL:L` | `U R U' R' U' R U R' U R U2 R'` | `U L' U2 L R U R' U L' U L` | JP #20: `R U' R' U' R U R' U R U2 R'` | CS #16: `(R U' R') U' [R U R' U R U2' R']` |
| `wv-21` | `WV 21` | `0 Corners` | `UBL:B, UBR:B, UFL:L` | `U R U' R2 U2 R U R' U R` | `U2 R U' R D R' U' R D' R2` | JP #22: `R U' R' R' U2 R U R' U R` | CS #17: `R U' [R2' U2' R U R' U R]` |
| `wv-22` | `WV 22` | `0 Corners` | `UBL:B, UBR:R, UFL:F` | `U R U R D R' U2 R D' R2` | `U R2 D R' U R D' R' U2 R'` | JP #23: `R2 D R' U R D' R' U2 R'` | CS #22: `R2 D (R' U R) D' R' U2 R'` |
| `wv-23` | `WV 23` | `0 Corners` | `UBL:B, UBR:B, UFL:F` | `R2 U R' U R' U' R U R U2 R2` | `U2 R' U L U' R2 U L' U R'` | JP #26: `U R' U L U' R2 U L' U R'` | CS: `(R U' R') -> [OLL]` |
| `wv-24` | `WV 24` | `0 Corners` | `UBL:L, UBR:R, UFL:L` | `U2 R U' R' U R U' R' U R U2 R'` | `U R U' R' U' F' r U R' U' r' F R` | JP #27: `U R U' R' U R U' R' U R U2 R'` | CS #18: `U (R U' R' U) (R U' R' U) R U2' R'` |
| `wv-25` | `WV 25` | `0 Corners` | `UBL:L, UBR:B, UFL:L` | `U2 R U2 R2 U2 R U R' U R` | `U2 R U2 R' U R U R' U R U2 R'` | JP #24: `U R U2 R' R' U2 R U R' U R` | CS #19: `U R U2' [R2' U2' R U R' U R]` |
| `wv-26` | `WV 26` | `0 Corners` | `UBL:L, UBR:R, UFL:F` | `U R U' R2 U' R U' R' U2 R` | `U R U R' U F2 L' U L U' L' U' L F2` | JP #25: `R U' R' R' U' R U' R' U2 R` | CS #20: `R U' [R2' U' R U' R' U2 R]` |
| `wv-27` | `WV 27` | `0 Corners` | `UBL:L, UBR:B, UFL:F` | `U R U R' U' R U R' U' R U' R'` | `U R U' R' F R U R' U' R U R' U' R U R' U' F'` | JP #21: `R U R' U' R U R' U' R U' R'` | CS #21: `(R U R' U') (R U R' U') R U' R'` |

### 4.1 `src/data/wv.ts` 完整实现代码

新建 `src/data/wv.ts`：

```ts
import type { Case, CaseSet } from '../types';

// Winter Variation（WV，27 情形）：
// 前提：前两层左前、左后、右后三槽与底十字已完成，顶层棱块朝向已完成；
// 右前槽（FR）的角棱已配成相连对并停在目标槽正上方（UFR + UR，基础入槽为 U R U' R'）。
// 目标：将最后一对插入 FR 槽的同时还原全部 4 个顶层角块朝向（跳过 OLL，直接进入 PLL）。
// 分组按顶层其余 3 个角块（UBL、UBR、UFL）黄面朝上的数量分为：
// 3 Corners (1) / 2 Corners (6) / 1 Corner (12) / 0 Corners (8)。
const wvCases: Case[] = [
  // === 3 Corners (1) ===
  {
    id: 'wv-1',
    name: 'WV 1',
    group: '3 Corners',
    algs: ["U L' U2 R U R' U2 L", "L' U2 R U2 R' U2 L"],
  },

  // === 2 Corners (6) ===
  {
    id: 'wv-2',
    name: 'WV 2',
    group: '2 Corners',
    algs: ["U R U' R'", "U l F' l'"],
  },
  {
    id: 'wv-3',
    name: 'WV 3',
    group: '2 Corners',
    algs: ["R' F R U R U' R' F'", "U' L U' R U L' U R'"],
  },
  {
    id: 'wv-4',
    name: 'WV 4',
    group: '2 Corners',
    algs: ["U R2 D R' U' R D' R2", "U2 R' D' R U' R' D R2 U' R'"],
  },
  {
    id: 'wv-5',
    name: 'WV 5',
    group: '2 Corners',
    algs: ["U R U' R' U R' U' R U' R' U2 R", "U R U' R' U2 R U2 R' U' R U' R'"],
  },
  {
    id: 'wv-6',
    name: 'WV 6',
    group: '2 Corners',
    algs: ["R U' R' U2 R U' R' U2 R U R'", "U' R' D' R U2 R' D R2 U' R'"],
  },
  {
    id: 'wv-7',
    name: 'WV 7',
    group: '2 Corners',
    algs: ["U R U R' U' R U' R'", "R' U' R U R U' R' U' R' U R"],
  },

  // === 1 Corner (12) ===
  {
    id: 'wv-8',
    name: 'WV 8',
    group: '1 Corner',
    algs: ["U2 R U' R' U R U2 R'", "U2 R U L' U R' U' L"],
  },
  {
    id: 'wv-9',
    name: 'WV 9',
    group: '1 Corner',
    algs: ["U2 F' R U2 R' U2 R' F R", "U R U' R' U R U2 R2 U' R2 U' R2 U2 R"],
  },
  {
    id: 'wv-10',
    name: 'WV 10',
    group: '1 Corner',
    algs: ["U R U R2 U' R2 U' R2 U2 R", "R' U2 R U R' U R2 U2 R'"],
  },
  {
    id: 'wv-11',
    name: 'WV 11',
    group: '1 Corner',
    algs: ["U2 R' U' R2 U' R2 U2 R", "U R U' R' L' U' L U' L' U2 L"],
  },
  {
    id: 'wv-12',
    name: 'WV 12',
    group: '1 Corner',
    algs: ["R' F2 R F2 U L' U L", "l' U2 l F2 U L' U L"],
  },
  {
    id: 'wv-13',
    name: 'WV 13',
    group: '1 Corner',
    algs: ["U2 R U2 R2 U' R U' R' U2 R", "R' F R F' R' U' F' U F R"],
  },
  {
    id: 'wv-14',
    name: 'WV 14',
    group: '1 Corner',
    algs: ["U2 R2 D R' U2 R D' R2", "U2 L' U R U' L U2 R'"],
  },
  {
    id: 'wv-15',
    name: 'WV 15',
    group: '1 Corner',
    algs: ["L' U R U' R' L", "R' U R U2 R U2 R' U R' U2 R"],
  },
  {
    id: 'wv-16',
    name: 'WV 16',
    group: '1 Corner',
    algs: ["U R' D' R U R' D R2 U2 R'", "U2 R U' R' U' R' F R U R U' R' F'"],
  },
  {
    id: 'wv-17',
    name: 'WV 17',
    group: '1 Corner',
    algs: ["R' F' R U2 R U2 R' F", "U L' U2 R U' R' U2 L U R U' R'"],
  },
  {
    id: 'wv-18',
    name: 'WV 18',
    group: '1 Corner',
    algs: ["U2 R U2 R'", "U2 l F2 l'"],
  },
  {
    id: 'wv-19',
    name: 'WV 19',
    group: '1 Corner',
    algs: ["R' F2 R2 U' R' U' R U R' F2", "U R U' R D' R U2 R' D R U2 R"],
  },

  // === 0 Corners (8) ===
  {
    id: 'wv-20',
    name: 'WV 20',
    group: '0 Corners',
    algs: ["U R U' R' U' R U R' U R U2 R'", "U L' U2 L R U R' U L' U L"],
  },
  {
    id: 'wv-21',
    name: 'WV 21',
    group: '0 Corners',
    algs: ["U R U' R2 U2 R U R' U R", "U2 R U' R D R' U' R D' R2"],
  },
  {
    id: 'wv-22',
    name: 'WV 22',
    group: '0 Corners',
    algs: ["U R U R D R' U2 R D' R2", "U R2 D R' U R D' R' U2 R'"],
  },
  {
    id: 'wv-23',
    name: 'WV 23',
    group: '0 Corners',
    algs: ["R2 U R' U R' U' R U R U2 R2", "U2 R' U L U' R2 U L' U R'"],
  },
  {
    id: 'wv-24',
    name: 'WV 24',
    group: '0 Corners',
    algs: ["U2 R U' R' U R U' R' U R U2 R'", "U R U' R' U' F' r U R' U' r' F R"],
  },
  {
    id: 'wv-25',
    name: 'WV 25',
    group: '0 Corners',
    algs: ["U2 R U2 R2 U2 R U R' U R", "U2 R U2 R' U R U R' U R U2 R'"],
  },
  {
    id: 'wv-26',
    name: 'WV 26',
    group: '0 Corners',
    algs: ["U R U' R2 U' R U' R' U2 R", "U R U R' U F2 L' U L U' L' U' L F2"],
  },
  {
    id: 'wv-27',
    name: 'WV 27',
    group: '0 Corners',
    algs: [
      "U R U R' U' R U R' U' R U' R'",
      "U R U' R' F R U R' U' R U R' U' R U R' U' F'",
    ],
  },
];

export const wvSet: CaseSet = {
  id: 'wv',
  method: 'cfop',
  name: 'WV',
  description: '顶棱朝向完成时最后一对顺带还原顶面（27）',
  expectedCount: 27,
  complete: true,
  view: 'top',
  cases: wvCases,
};
```

---

## 5. 独立验证与正反例测试规格

不能只验证“公式求逆后再执行原公式能还原”，必须建立三层独立验证：

### 5.1 新建 `src/data/wv.names.test.ts`（物理块几何特征 + 双外部权威源交叉核验）

1. **物理块姿态与 27 个角块朝向三元组核验**：
   - 对每个 `wv-1`..`wv-27` 的 `caseState(c)`：
     - 独立检查 `UFR`（`[1,1,1]`）上必须是 `DFR` 角块（`U<-F, F<-D, R<-R`），`UR`（`[1,1,0]`）上必须是 `FR` 棱块（`U<-F, R<-R`）；
     - 独立检查 `UB`、`UL`、`UF` 三个顶棱的 `U` 面贴纸全部为 `U`；
     - 独立读取 `(UBL, UBR, UFL)` 三个角块位上 `U` 色贴纸所在的面，与第 4 节表中的 27 个 `(UBL, UBR, UFL)` 朝向三元组逐一精确比对；
     - 独立统计其中 `'U'` 的个数，断言与 `c.group`（`3 Corners` -> 3、`2 Corners` -> 2、`1 Corner` -> 1、`0 Corners` -> 0）严格一致。
2. **J Perm 27 情形全量交叉核验**：
   - 将第 4 节表中的 27 条 J Perm 原始公式左乘一步 `U` 后生成状态 `applyMoves(solved(), invertMoves(parseAlg('U ' + jpRaw)))`，断言与对应 `wv-1`..`wv-27` 满足 `equivalentStates('wv', caseState(c), jpState) === true`，且不与任何其他 WV 情形等价。
3. **CubeSkills 22 条显式公式交叉核验**：
   - 将第 4 节表中的 22 条 CubeSkills 显式公式左乘一步 `U` 后生成状态，断言与对应 `wv` 情形满足 `equivalentStates('wv', caseState(c), csState) === true`。

### 5.2 在 `src/lib/cases.test.ts` 中新增 `WV_RULE` 正反例与贴纸计数断言

必须覆盖以下正反例：
1. **贴纸计数精确断言**：
   - `STICKERS` 中满足 `SET_RULES.wv.display`（及 `solve`）的贴纸数精确为 **42**；
   - 满足 `SET_RULES.wv.preserve` 的贴纸数精确为 **28**；
   - `SET_RULES.wv.preUs` 等于 `[0]`，`preY` 等于 `[0]`，`normalize` 等于 `false`。
2. **正例**：
   - `verifyCase('wv', ...)` 通过 `wv-1`（`U L' U2 R U R' U2 L`）、`wv-2`（`U R U' R'`）等合法情形；
   - `solvesCase('wv', caseState(wv1), "U L' U2 R U R' U2 L U")`（带后置 AUF `U`）返回 `true`。
3. **反例（必须被 `verifyCase` 或 `solvesCase` 拒绝）**：
   - **起手相连对位置偏离（缺前置 `U`）**：传入 `"R U' R'"`（相连对位于 `UFL + UF` 而非 `UFR + UR`）-> `verifyCase` 报错 `WV 起手 UFR 角块不是相连的 DFR 角块姿态`；
   - **起手为分离对（SV 姿态）**：传入 `"U' R U R'"` -> `verifyCase` 报错；
   - **起手顶棱朝向未完成（VLS 非 WV 情形）**：传入 `"F R' F' R"`（翻转 `UF` 与 `UR` 棱）-> `verifyCase` 报错 `WV 起手顶层棱块朝向未完成`；
   - **破坏前两层其他槽（preserve 违例）**：传入 `"L' U' L U R U' R'"` -> `verifyCase` 报错 `破坏了已完成部分`；
   - **只入槽未翻正全部顶角（solve 违例）**：对 `wv-1` 起手状态执行普通入槽 `"U R U' R'"` -> `solvesCase` 返回 `false`；
   - **包含 `x / y / z` 转体或改变中心块**：传入 `"y L' U' L"` 或 `"U r U' l'"` -> `verifyCase` 报错。

---

## 6. 涉及文件与接口修改清单

### 6.1 生产代码文件（共 5 处，另新建 `src/data/wv.ts`）

1. **[`src/types.ts`](file:///d:/allwork/mofang/src/types.ts)**
   - `SetId` 联合类型加入 `'wv'`：
     `export type SetId = 'f2l' | 'oll' | 'pll' | 'coll' | 'wv' | 'cmll' | 'lse' | 'sbls';`
2. **[`src/lib/cases.ts`](file:///d:/allwork/mofang/src/lib/cases.ts)**
   - 新增 `isWvMask`（42 张）、`isWvPreserve`（28 张）、`WV_RULE`、`lintWvState`；
   - `SET_RULES` 注册 `wv: WV_RULE`；
   - `verifyCase` 中当 `setId === 'wv'` 时调用 `lintWvState(c.id, base, c.algs)`，并在备选公式循环中检查 `setId === 'wv'` 时备选公式不含 `x/y/z` 且逆状态与还原后状态均满足 `CENTERS.every((id) => st[id] === id)`。
3. **`src/data/wv.ts`（新建）**
   - 导出 `wvSet`（27 个情形，`id: 'wv'`，`method: 'cfop'`，`name: 'WV'`，`description: '顶棱朝向完成时最后一对顺带还原顶面（27）'`，`expectedCount: 27`，`complete: true`，`view: 'top'`）。
4. **[`src/data/index.ts`](file:///d:/allwork/mofang/src/data/index.ts)**
   - 导入 `wvSet` 并放入 `SETS`（位于 `collSet` 之后、`cmllSet` 之前）：
     `export const SETS: CaseSet[] = [f2lSet, ollSet, pllSet, collSet, wvSet, cmllSet, lseSet, sblsSet];`
   - 导出 `wvSet`。
5. **[`src/pages/HomePage.tsx`](file:///d:/allwork/mofang/src/pages/HomePage.tsx)**
   - `SET_ACCENTS` 的 `Record<SetId, string>` 增加 `wv: 'var(--accent-wv)'`（或在 `src/styles.css` 定义 `--accent-wv` 或复用现有主题变量，确保类型完整与深浅色对比度合规）。

> **明确不需要改动的文件**：
> - `src/lib/practice.ts`（`WV` 不加入 `AUF_SETS`）
> - `src/lib/practiceSample.ts`（`WV` 不加入 `options`）
> - `src/lib/practiceTarget.ts`（`WV` 使用默认的 `caseState` / `solvesCase` 判定）
> - `src/lib/colorScheme.ts` / `src/lib/practiceColors.ts`（`isRouxSet('wv')` 为 `false`，自动走 CFOP 配色）
> - `src/store/devicePrefs.ts`（练习页公式组列表由 `SETS` 动态派生，无硬编码列表）
> - `src/components/CaseDiagram.tsx`（`view: 'top'` 已完整支持 `wv`）

### 6.2 测试文件更新清单（按 D22 等强度更新）

1. **`src/data/wv.names.test.ts`（新建）**：物理块坐标/朝向三元组验证 + J Perm 27 情形全量交叉验证 + CubeSkills 22 情形交叉验证。
2. **[`src/lib/cases.test.ts`](file:///d:/allwork/mofang/src/lib/cases.test.ts)**：新增 `WV_RULE` 贴纸数（42 / 28）及正反例测试。
3. **[`src/lib/practice.test.ts`](file:///d:/allwork/mofang/src/lib/practice.test.ts)**：验证 `wv` 不做随机前置 AUF、不混入 `pll-ua` 变化。
4. **[`src/lib/practiceSample.test.ts`](file:///d:/allwork/mofang/src/lib/practiceSample.test.ts)**：`EMPTY_COUNTS` 增加 `wv: 0`。
5. **[`src/pages/outsideDiagrams.test.tsx`](file:///d:/allwork/mofang/src/pages/outsideDiagrams.test.tsx)**：`EXPECTED_TOTAL` 中 `wv: 27`，总情形数从 `359` 更新为 `386`。
6. **[`src/pages/homeCards.test.tsx`](file:///d:/allwork/mofang/src/pages/homeCards.test.tsx)**：CFOP 组列表从 `['f2l', 'oll', 'pll', 'coll']` 更新为 `['f2l', 'oll', 'pll', 'coll', 'wv']`，CFOP 总数从 `159` 更新为 `186`，全站总数从 `359` 更新为 `386`。
7. **[`e2e/home-decks.spec.ts`](file:///d:/allwork/mofang/e2e/home-decks.spec.ts)**、**[`e2e/visual-smoke.spec.ts`](file:///d:/allwork/mofang/e2e/visual-smoke.spec.ts)**、**[`e2e/formula-expansion.spec.ts`](file:///d:/allwork/mofang/e2e/formula-expansion.spec.ts)**：同步更新 CFOP 卡片数（`4 -> 5`）与 `WV` 页面冒烟检查。

## 7. Executor 实现记录（2026-11-12）

### 实际接口与规格适配

- 从最新 main `ec07c28` 建立 `codex/wv`，导入 Lead 文档提交 `9e4373a`（本分支 `aafa1ad`），追加实现；main、部署工作流及原 `codex/ui-polish` 保持不变。
- 当前类型是 `AlgCase`，每条数据必须含 `set: 'wv'`；按项目实际接口录入 `WV_CASES` 并导出 `wvSet`。`SETS` 原本内联定义，直接在 COLL 后插入 wvSet。
- 当前没有 `verifyCase` / `solvesCase` / `equivalentStates`，用现有 `lintCase` / `lintCaseAlg` / `algSolvesCase` 接入结构、公式及目标检查，不新增同义 API。
- 首页没有 `SET_ACCENTS`，实际穷举映射是 `COVER`，增加 `wv: 'wv-1'`。不新增颜色 token，不改 CSS。测试里也不存在 `EMPTY_COUNTS` / `EXPECTED_TOTAL`，更新实际的精确总数、链接、隐藏卡及循环边界。

### 规则、数据与独立核验

- 27 条主公式和 27 条备选全部通过：保护区 28 张、显示/完成 42 张、固定 UFR+UR 相连对、其余三顶棱朝向、四个分组及 27 个顶角三元组。主备选原始六中心均原位，不归一化。
- 全部 WV 公式（包括自定义和备选）统一拒绝 x/y/z，即使转体相互抵消；拒绝 M 中心偏移。`algSolvesCase` 保持前置 U=0、y=0，仅允许后置 AUF，执行后再次确认中心原位。旧七组 SET_RULES 与语义不变。
- 直接读取 J Perm 当前 wv.js 的 27 条主参考，按表中跨源编号映射左乘 U，每条都唯一命中对应 WV。JP #22 原文缺右括号，测试参考文本仅去掉分组括号，动作未变；不修改生产解析器。
- 按 PDF 技能渲染 CubeSkills 原始两页，核对 22 条显式算法；PDF 的方括号是分组提示，测试只移除分组标点，全部唯一命中对应情形。其余五格仅建议入槽接 OLL，未冒充显式独立参考。
- 新增数据几何/来源测试；规则计数、后置 AUF、错误前置 U、SV、坏棱、破坏保护区、普通入槽无法完成 WV 1、转体和中心偏移反例放在 cases.test.ts。顶视图 21 格签名 27/27 两两互异。
- 练习不额外加 AUF 或 variation，继续使用 CFOP 配色池；原完整 54 张贴纸打乱与六底色求解回放测试动态覆盖全部 WV，另加固定起手和方法配色断言。
- 按 D22 精确更新为八组 / 386 情形（CFOP 五组 / 186、桥式三组 / 200）；CFOP 循环变为六张卡（含封面），六个动画仍逐个锁定 220ms / 无 opacity。快滑覆盖增加为 8 次上滑，逐次计数、反向和即时点击断言保留。

### 门禁与界面验收

- `npm test`：5428 / 59 通过。
- `npm run check:data`：786 / 8 通过。
- `npm run build`：通过。
- `npm run test:visual -- --workers=2`：44 / 44 通过。原 40 条保留，增加 WV 的两个视口×列表/详情和练习共 4 条。
- 320×640 / 390×844、浅深色均无横向滚动，分类弹窗在视口内、返回恢复分类；WV 单图 64×64，舞台高 164 / 190px，peek 底边约 534.39 / 598.08px，底栏顶边 568 / 772px，均未遮挡。
- WV 截图目录：`ui-review.local/formula-expansion/wv-{320,390}-{light,dark}.png`；分类和列表截图为 `wv-category-*` / `wv-list-*`。
- 未改旧数据/ID/公式、SBLS display/mask、路由、3D、播放器、练习求解或部署工作流；不合并、不 push，待独立 Auditor。EOLR 原稿实测不符已另记复核意见，未实现。
