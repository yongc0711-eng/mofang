# COLL — 新增 CFOP COLL 公式集（40 情形）

- **状态：** done
- **前置依赖：** 先完成 [`T71.md`](T71.md)（公共校验谓词与桥式配色 helper），再执行本任务；本任务完成后再执行 [`SBLS.md`](SBLS.md)。
- **方法归属：** `method: 'cfop'`，`id: 'coll'`，`title: 'COLL'`，`subtitle: '顶棱色相完成时一次还原顶角（40）'`，`view: 'top'`，`expectedCount: 40`。

## 1. 收录口径与来源查证

### 1.1 为什么是 40 个情形而不是 42 个（与 PLL / CMLL 的关系）
- 顶层四角（U-layer corners）的色相（CO）共有 7 种非全还原组合（`Antisune` 6、`Sune` 6、`L` 6、`U` 6、`T` 6、`Pi` 6、`H` 4，合计 $6 \times 6 + 4 = 40$）以及 1 种四角已全部朝上的 `O` 组（含 `O Adjacent` 邻角换与 `O Diagonal` 对角换 2 个情形）。
- 在桥式 **CMLL（42 情形）** 中，因为顶层四棱色相（EO）和 M 层还未还原，四角已朝上但需要换角时仍属于 CMLL 阶段，故 CMLL 收录 42 个情形（含 `O Adjacent` 与 `O Diagonal`）。
- 在 CFOP **COLL（Corners of the Last Layer，40 情形）** 中，适用前提是 **F2L 已完成且顶层四棱已全部朝上（十字 OLL / EO 已完成）**。在此前提下，若顶层四角也已全部朝上，则整个 OLL 已经完成，当前状态直接就是标准 **PLL**（邻角换即 `T/Ja/Jb/Ra/Rb/F/Ga–Gd`，对角换即 `Y/V/E/Na/Nb`，四角归位即 EPLL `Ua/Ub/H/Z`），无需也不应再做 COLL。
- 三家公认权威算法表在计数、分组和收录范围上 **100% 一致，均为 7 组 40 情形（不含 O 组）**：
  1. **SpeedCubeDB**：https://speedcubedb.com/a/3x3/COLL （40 情形：`Anti Sune` 1–6、`Sune` 1–6、`L` 1–6、`U` 1–6、`T` 1–6、`Pi` 1–6、`H` 1–4）
  2. **J Perm**：https://jperm.net/algs/coll （40 情形：`AS1..6`、`S1..6`、`L1..6`、`U1..6`、`T1..6`、`P1..6`、`H1..4`，与 SpeedCubeDB 编号 40/40 一一对应）
  3. **CubeSkills（Feliks Zemdegs）**：https://www.cubeskills.com/uploads/pdf/tutorials/coll-algorithms.pdf （40 情形，7 组完全相同，组内顺序略有不同，指纹与 SpeedCubeDB 40/40 完全吻合）

### 1.2 为什么严禁直接复制 `src/data/cmll.ts` 的数据或校验规则
- **规则不同**：CMLL 的 `preserve` 仅保护左右两桥（`isRouxBlock`，26 张贴纸），允许打乱 M 层（`DF`、`DB` 棱与中心）且允许翻转顶层四棱（`UF`、`UB`、`UL`、`UR`）；而 COLL 必须保持完整 F2L（`isF2LPiece`，33 张贴纸，含 `DF`、`DB` 与四个侧面中心），且必须保持顶层四棱朝向（EO 不变）。
- **算法实测不兼容**：经引擎逐条验证，本项目现有 `src/data/cmll.ts` 的 40 条非 `O` 主公式中，有 **29 条** 直接违反 COLL 不变量（例如 `cmll-as-3` `U' F' L F L' U2 L' U2 L` 会翻转顶棱，`cmll-as-2` `U2 R U R2 F' r F R U' r2 F r` 既破坏 F2L 又翻转顶棱）。因此 COLL 必须独立建立规则与数据源。

### 1.3 分类、稳定 ID 与命名规范
- **7 个分类（`group` 字段，与站内 `cmll.ts` 拼写保持一致）**：
  `'Antisune'`（6）、`'Sune'`（6）、`'L'`（6）、`'U'`（6）、`'T'`（6）、`'Pi'`（6）、`'H'`（4）。
- **稳定 ID（`id` 字段）**：
  `coll-as-1`..`coll-as-6`、`coll-s-1`..`coll-s-6`、`coll-l-1`..`coll-l-6`、`coll-u-1`..`coll-u-6`、`coll-t-1`..`coll-t-6`、`coll-pi-1`..`coll-pi-6`、`coll-h-1`..`coll-h-4`。
- **显示名称（`name` 字段）**：
  采用 SpeedCubeDB / J Perm 通用的简洁编号名：`AS 1`..`AS 6`、`S 1`..`S 6`、`L 1`..`L 6`、`U 1`..`U 6`、`T 1`..`T 6`、`Pi 1`..`Pi 6`、`H 1`..`H 4`。

---

## 2. 可执行规则规格（`SET_RULES.coll` 与 `lintCase`）

### 2.1 规则表定义（复用 `T71` 在 `src/lib/cases.ts` 导出的 `COLL_RULE`）
- **适用前提（起手状态 `after = caseState(c)`）**：
  1. F2L 全部还原：所有 `isF2LPiece(loc)`（`p[1] !== 1`，共 33 张贴纸）满足 `after[loc] === loc`；
  2. 顶层四棱已朝上（EO 已还原）：`COLL_U_EDGE_TOP_LOCS`（`UB`、`UR`、`UF`、`UL` 的 `U` 面 4 个位置）满足 `S[after[loc]].face === 'U'`；
  3. 顶层四角未全部朝上：`COLL_U_CORNER_TOP_LOCS`（4 个顶角 `U` 面位置）不全为 `'U'`（排除 PLL / `O` 组）。
- **完成目标（`solve: isCollMask`）**：
  - `isCollMask(id) = isF2LPiece(id) || isCorner(id) || uFace(id)`（共 50 张贴纸为 `true`，仅顶层四棱的 4 张侧面贴纸 `FU`、`RU`、`BU`、`LU` 为 `false`）。
  - 在某个顶层 AUF `post in [0, 1, 2, 3]` 下，`render(st, isCollMask) === render(solved(), isCollMask)` 同时等价于：
    1. F2L 33 张贴纸完全还原；
    2. 顶层四角 12 张贴纸的色相与位置（CP + CO）完全还原；
    3. 顶层四棱的 4 张顶面贴纸仍为 `'U'`（EO 保持不变），而 4 张侧面贴纸允许任意 EPLL 棱置换（`Ua` / `Ub` / `H` / `Z` / 已还原）。
- **显示掩码（`display: isCollMask`）**：
  - 2D `TopView` 渲染顶层 21 张贴纸时，`isCollMask` 会给顶面 9 格（中心 + 四棱顶面 + 四角顶面）以及 **四角外圈 8 张侧面条** 上色（用于识别角块条/灯/对角色关），并将 **四棱外圈 4 张侧面条** 置灰（因为 COLL 不关心顶棱侧面置换，与 CubeSkills PDF、J Perm `mask: "coll"` 和 SpeedCubeDB 的 COLL 图解完全一致）。
- **保持掩码（`preserve: isF2LPiece`）**：
  - F2L 全部 33 张贴纸不得被破坏。
- **转体与 AUF 参数**：
  - `view: 'top'`，`preUs: [0, 1, 2, 3]`，`preY: [0, 1, 2, 3]`，`normalize: true`。
- **`lintCase` 附加不变量**：
  - 在 `lintCase` 中当 `c.set === 'coll'` 时调用 `lintCollState(c.id, after, c.algs[0])`，强制检查：
    1. `COLL_U_EDGE_TOP_LOCS` 在 `after` 中全部为 `'U'` 面贴纸；
    2. `COLL_U_CORNER_TOP_LOCS` 在 `after` 中不能全部为 `'U'` 面贴纸；
    3. `c.algs[0]` 不含整体转体 `x/y/z`（保证列表与详情 2D 图解朝向直接由无转体主公式决定）。
  - 同时数据校验 `src/data/data.test.ts` 对备选公式的循环通过 `algSolvesCase(c, alg)` 验证每条备选公式都在 `isCollMask` 下还原该情形（自动拦截任何破坏 F2L、翻转顶棱或角块置换不匹配的备选公式）。

### 2.2 正例与反例（必须在测试中覆盖）
- **合法正例**：
  - `coll-as-1` 主公式 `R' U' R U' R' U2 R`，备选 `U R U2 R' U' R U' R'`：起手 F2L 完好、顶棱 4 张顶面均为 `U`、顶角仅 1 张 `U` 朝上，主备公式均还原 `isCollMask`。
- **非法反例（必须被 `lintCase` / `algSolvesCase` 拒绝）**：
  1. **翻转顶棱的 CMLL 公式**：如 `cmll-as-3` 的 `U' F' L F L' U2 L' U2 L` 或 `F R U R' U' F'` —— 虽能还原对应角块，但会翻转顶层棱块，被 `lintCollState` 及 `isCollMask` 的 `uFace` 拒绝。
  2. **破坏 DF/DB 的 CMLL 公式**：如 `cmll-s-6` 的 `U r U' r' F R' F' R` —— 破坏 M 层 F2L 棱块，被 `preserve: isF2LPiece` 拒绝。
  3. **只对 CO 不对 CP 的 OLL 公式**：如把普通 Sune `R U R' U R U2 R'` 填进 `coll-s-2` —— 角块侧面置换不匹配，被 `algSolvesCase` 拒绝。
  4. **四角已朝上的 PLL 公式**：如 T-perm `R U R' U' R' F R2 U' R' U' R U R' F'` —— 被 `lintCollState` 的非全朝上检查拒绝。

---

## 3. 40 个情形完整规范与算法对照表

> 下表全部主备选公式均已通过引擎 `isCollMask`、`isF2LPiece`、`lintCollState` 与 40/40 指纹去重验证，且 `algs[0]` 不含 `x/y/z` 转体，生成的起手状态与 SpeedCubeDB 的 `setup` 图解朝向一致。最后列给出 J Perm（https://jperm.net/algs/coll ）的独立参考公式，供 `src/data/coll.names.test.ts` 交叉核验。

| # | `id` | `name` | `group` | 验证通过的无转体公式（`algs[0]` / 备选） | J Perm 独立参考公式 |
|---:|---|---|---|---|---|
| 1 | `coll-as-1` | `AS 1` | `Antisune` | `R' U' R U' R' U2 R` / `R U2 R' U' R U' R'` / `L' U' L U' L' U2 L` | `AS1`: `L' U' L U' L' U2 L` |
| 2 | `coll-as-2` | `AS 2` | `Antisune` | `R' U' R U' R' U R' D' R U R' D R2` / `R2 D R' U R D' R' U R' U' R U' R'` / `U2 R2 D R' U R D' R' U R' U' R U' R'` | `AS2`: `R' U2 F' R U R' U' R' F R2 U R' U R` |
| 3 | `coll-as-3` | `AS 3` | `Antisune` | `U2 R2 D R' U2 R D' R2 U' R U' R'` / `U2 f' L F L' U2 L' U2 L U2 S` / `R2 D R' U2 R D' R2 U' R U' R'` | `AS3`: `R2 D R' U2 R D' R2 U' R U' R'` |
| 4 | `coll-as-4` | `AS 4` | `Antisune` | `U2 R U2 R' U2 r' F R F' M'` / `R' U' R U R' F R U R' U' R' F' R2` / `U2 R U2 R' U2 L' U R U' R' L` | `AS4`: `R' U' R U' R2 D' R U2 R' D R2` |
| 5 | `coll-as-5` | `AS 5` | `Antisune` | `R' U L U' R U L'` / `r' F R F' r U R'` / `L' U R U' L U R'` | `AS5`: `L' U R U' L U R'` |
| 6 | `coll-as-6` | `AS 6` | `Antisune` | `R U' R' U2 R U' R' U2 R' D' R U R' D R` / `R U2 r' F R' F' r U' R U' R'` / `R U R' F' R U2 R' U' R U' R' F R U' R'` | `AS6`: `y2 R U' R' U2 R U' R' U2 R' D' R U R' D R` |
| 7 | `coll-s-1` | `S 1` | `Sune` | `R U R' U R U2 R'` / `R' U2 R U R' U R` / `L' U2 L U L' U L` | `S1`: `R U R' U R U2 R'` |
| 8 | `coll-s-2` | `S 2` | `Sune` | `U2 R U R' U R2 D R' U2 R D' R2` / `r' F2 r U2 R U' r' F M'` / `L' U2 L U2 R U' L' U L R'` | `S2`: `L' U2 L U2 R U' L' U L R'` |
| 9 | `coll-s-3` | `S 3` | `Sune` | `L' R U R' U' L U2 R U2 R'` / `M F R' F' r U2 R U2 R'` / `U2 R2 D' R U2 R' D R2 U R' U R` | `S3`: `R2 D' R U2 R' D R2 U R' U R` |
| 10 | `coll-s-4` | `S 4` | `Sune` | `R U R' U R U' R D R' U' R D' R2` / `F R' U2 R F' R' F U2 F' R` / `R U R' U' R' F R F' r U R' U R U2 r'` | `S4`: `y' R U R' U R U' R D R' U' R D' R2` |
| 11 | `coll-s-5` | `S 5` | `Sune` | `R U' L' U R' U' L` / `R U' r' F R' F' r` / `l F' L' F l' U' L` | `S5`: `R U' L' U R' U' L` |
| 12 | `coll-s-6` | `S 6` | `Sune` | `U2 R U R' F' R U R' U R U2 R' F R U' R'` / `U2 R U R' U r' F R F' r U2 R'` / `U2 R U R' U L' U R U' L U2 R'` | `S6`: `F' R U2 R' U2 R' F2 R U R U' R' F'` |
| 13 | `coll-l-1` | `L 1` | `L` | `R U R' U R U' R' U R U' R' U R U2 R'` / `R U2 R' U' R U R' U' R U R' U' R U' R'` / `R' U2 R U R' U' R U R' U' R U R' U R` | `L1`: `R' U2 (R U R' U') R U R' U' R U R' U R` |
| 14 | `coll-l-2` | `L 2` | `L` | `R' U2 R' D' R U2 R' D R2` / `R U R' U2 L U' R U L' U R'` / `L' U2 L' D' L U2 L' D L2` | `L2`: `R' U2 R' D' R U2 R' D R2` |
| 15 | `coll-l-3` | `L 3` | `L` | `R U2 R D R' U2 R D' R2` / `U2 R U2 R2 D' R U' R' D R2 U' R'` / `R' F' R U R' U' R' F R2 U' R' U2 R` | `L3`: `R U2 R D R' U2 R D' R2` |
| 16 | `coll-l-4` | `L 4` | `L` | `R2 D R' U R D' R' U' R'` / `F R' F' r U R U' r'` / `R U R' U' R' F R U R U' R' F'` | `L4`: `F R' F' r U R U' r'` |
| 17 | `coll-l-5` | `L 5` | `L` | `F' r U R' U' r' F R` / `r U R U' r' F R' F'` / `R2 D' R U' R' D R U R` | `L5`: `x R' U R D' R' U' R D` |
| 18 | `coll-l-6` | `L 6` | `L` | `U2 r U2 R2 F R F' R U2 r'` / `R' U' R U R' F' R U R' U' R' F R2` / `U U' R' U' R U R' F' R U R' U' R' F R2` | `L6`: `R' U' (R U R') F' R U R' U' R' F R2` |
| 19 | `coll-u-1` | `U 1` | `U` | `R' U' R U' R' U2 R2 U R' U R U2 R'` / `U R U2 R' U' R U' R' U' R U R' U R U2 R'` / `R U R' U R U2 R2 U' R U' R' U2 R` | `U1`: `R' U' R U' R' U2 R R U R' U R U2 R'` |
| 20 | `coll-u-2` | `U 2` | `U` | `R' F R U' R' U' R U R' F' R U R' U' R' F R F' R` / `r U R' U' r' F R2 U' R' U' R U2 R' U' F'` / `R' U' R F R2 D' R U R' D R2 U' F'` | `U2`: `R' F R U' R' U' R U R' F' R U R' U' R' F R F' R` |
| 21 | `coll-u-3` | `U 3` | `U` | `R2 D R' U2 R D' R' U2 R'` / `L2 D L' U2 L D' L' U2 L'` / `R U' R' U' R U2 R' U' R' D' R U2 R' D R` | `U3`: `R2 D R' U2 R D' R' U2 R'` |
| 22 | `coll-u-4` | `U 4` | `U` | `F R U' R' U R U R' U R U' R' F'` / `U' F U2 R' D' R U2 R' D R F'` / `R' F2 R U2 R U2 R' F2 R U2 R'` | `U4`: `F R U' R' U R U R' U R U' R' F'` |
| 23 | `coll-u-5` | `U 5` | `U` | `R2 D' R U2 R' D R U2 R` / `L2 D' L U2 L' D L U2 L` / `L U' R U' L' U R' U2 L U' L'` | `U5`: `R2 D' R U2 R' D R U2 R` |
| 24 | `coll-u-6` | `U 6` | `U` | `R' U2 R F U' R' U' R U F'` / `R2 D' R U R' D R U R U' R' U' R` / `R U' R' U' R U R D R' U R D' R2` | `U6`: `R2 D' R U R' D R U R U' R' U' R` |
| 25 | `coll-t-1` | `T 1` | `T` | `R U2 R' U' R U' R2 U2 R U R' U R` / `R U R2 U' R2 U' R2 U2 R U' R U' R'` / `R U2 R' r' F2 r U' R U' R' U' r' F r` | `T1`: `R U2 R' U' R U' R' R' U2 R U R' U R` |
| 26 | `coll-t-2` | `T 2` | `T` | `R' U R U2 R' L' U R U' L` / `R' U R U2 r' R' F R F' r` / `R' F R U R' U' R' F' R2 U' R' U2 R` | `T2`: `R' U R U2 R' L' U R U' L` |
| 27 | `coll-t-3` | `T 3` | `T` | `R' F' r U R U' r' F` / `l' U' L U R U' r' F` / `l' U' L U l F' L' F` | `T3`: `y l' U' L U l F' L' F` |
| 28 | `coll-t-4` | `T 4` | `T` | `F R U R' U' R U' R' U' R U R' F'` / `R F R' U R U2 R' U R U F' R'` / `R U2 R' F2 R U2 R' U2 R' F2 R` | `T4`: `y2 F R U R' U' R U' R' U' R U R' F'` |
| 29 | `coll-t-5` | `T 5` | `T` | `r U R' U' r' F R F'` / `R U R D R' U' R D' R2` / `R U R' U R' D' R U' R' D R2 U' R'` | `T5`: `y' r U R' U' r' F R F'` |
| 30 | `coll-t-6` | `T 6` | `T` | `R' U R2 D r' U2 r D' R2 U' R` / `R U' R2 D' r U2 r' D R2 U R'` / `R' U' R U R2 D' R U2 R' D R2 U' R' U R` | `T6`: `R' U R2 D r' U2 r D' R2 U' R` |
| 31 | `coll-pi-1` | `Pi 1` | `Pi` | `R U2 R2 U' R2 U' R2 U2 R` / `R' U2 R2 U R2 U R2 U2 R'` / `L' U2 L2 U L2 U L2 U2 L'` | `P1`: `R U2 (R2 U' R2 U' R2) U2 R` |
| 32 | `coll-pi-2` | `Pi 2` | `Pi` | `R' F2 R U2 R U2 R' F2 U' R U' R'` / `F U R U' R' U R U' R2 F' R U R U' R'` / `L' U' L U L F' L2 U' L U L' U' L U F` | `P2`: `R' F2 R U2 R U2 R' F2 U' R U' R'` |
| 33 | `coll-pi-3` | `Pi 3` | `Pi` | `R' U' F' R U R' U' R' F R2 U2 R' U2 R` / `F U R U' R' U R U2 R' U' R U R' F'` / `F R2 U' R2 U R2 U S R2 f'` | `P3`: `R' U' F' R U R' U' R' F R2 U2 R' U2 R` |
| 34 | `coll-pi-4` | `Pi 4` | `Pi` | `R U R' U' R' F R2 U R' U' R U R' U' F'` / `R U2 R' U' R U R' U2 r' F R F' M'` / `U' R' U2 R U R' U R2 U' L' U R' U' L` | `P4`: `R U R' U' R' F R2 U R' U' R U R' U' F'` |
| 35 | `coll-pi-5` | `Pi 5` | `Pi` | `R U' L' U R' U L U L' U L` / `R U2 R' U R' D' R U2 R' D R2 U' R'` / `R U R' U F' R U2 R' U2 R' F R` | `P5`: `R U' L' U R' U L U L' U L` |
| 36 | `coll-pi-6` | `Pi 6` | `Pi` | `U' r U R' U R' F R F' R U' R' U R U2 r'` / `R U D' R U R' D R2 U' R' U' R2 U2 R` / `R' F' U' F U' R U S' R' U R S` | `P6`: `R2 D' R U R' D R U R U' R' U R U R' U R` |
| 37 | `coll-h-1` | `H 1` | `H` | `R U R' U R U' R' U R U2 R'` / `R U2 R' U' R U R' U' R U' R'` / `R' U2 R U R' U' R U R' U R` | `H1`: `R U R' U R U' R' U R U2 R'` |
| 38 | `coll-h-2` | `H 2` | `H` | `F R U' R' U R U2 R' U' R U R' U' F'` / `f R2 S' U' R2 U' R2 U R2 F'` / `f R U R' U' R F' R U R' U' R' S'` | `H2`: `F R U' R' U R U2 R' U' R U R' U' F'` |
| 39 | `coll-h-3` | `H 3` | `H` | `R U R' U R U L' U R' U' L` / `R U R' U R U r' F R' F' r` / `R' F' R U2 R U2 R' F U' R U' R'` | `H3`: `R U R' U R U L' U R' U' L` |
| 40 | `coll-h-4` | `H 4` | `H` | `F R U R' U' R U R' U' R U R' U' F'` / `F U R U' R' U R U' R' U R U' R' F'` / `U' U F R U R' U' R U R' U' R U R' U' F'` | `H4`: `F R U R' U' R U R' U' R U R' U' F'` |

---

## 4. 独立名称、分类与特征测试（`src/data/coll.names.test.ts`）

不能只靠 `data.test.ts` 的“公式求逆再执行原公式还原”。必须新建 `src/data/coll.names.test.ts`，做以下三项独立校验：
1. **跨源算法交叉验证（J Perm 40 条）**：
   - 将上表 J Perm 的 40 条独立参考算法写入测试表 `JPERM_COLL_REF: Record<string, string>`；
   - 对 `COLL_CASES` 的全部 40 个情形，断言 `algSolvesCase(c, JPERM_COLL_REF[c.id]) === true`（证明每个 `coll-*-*` 的编号与 J Perm / SpeedCubeDB 完全同构，没有任何串号）。
2. **CubeSkills 40 条集合覆盖验证**：
   - 验证 CubeSkills COLL PDF 的 40 条参考算法在 `COLL_CASES` 上 1-to-1 命中全部 40 个 `c.id`，无遗漏、无重号。
3. **分类（`group`）几何特征不变量验证**：
   - 从 `after = caseState(c)` 直接读取顶层四角 `COLL_U_CORNER_TOP_LOCS` 上 `face === 'U'` 的数量 `uCount`：
     - `group === 'Sune' || group === 'Antisune'` 必须满足 `uCount === 1`；
     - `group === 'L' || group === 'U' || group === 'T'` 必须满足 `uCount === 2`，且：
       - `L` 组的两个朝上角块在顶面呈**对角**（`x1 !== x2 && z1 !== z2`）；
       - `U` 组与 `T` 组的两个朝上角块在顶面呈**邻角**（同行或同列），且未朝上的两个角块的 `U` 贴纸在 `U` 组指向**同一外侧面**（Headlights），在 `T` 组指向**相反外侧面**（Chameleon）；
     - `group === 'Pi' || group === 'H'` 必须满足 `uCount === 0`，且 4 个角块的 `U` 贴纸在 `H` 组只分布在 2 个相对侧面（对称双灯），在 `Pi` 组分布在 3 个侧面（一侧双灯、另一侧外撇）。

---

## 5. 全站接入范围与测试等强更新清单

### 5.1 生产文件修改范围
1. `src/types.ts`：
   - `export type SetId = 'f2l' | 'oll' | 'pll' | 'coll' | 'cmll' | 'lse';`
2. `src/lib/cases.ts`：
   - `SET_RULES` 增加 `coll: COLL_RULE`；
   - `lintCase` 中增加 `if (c.set === 'coll') errors.push(...lintCollState(c.id, after, c.algs[0]));`。
3. `src/data/coll.ts`（新建）：
   - 录入上表 40 个情形（每个情形 2–3 条通过校验的无转体公式）。
4. `src/data/index.ts`：
   - 导入 `COLL_CASES`，定义 `COLL_SET`（`id: 'coll'`, `title: 'COLL'`, `subtitle: '顶棱色相完成时一次还原顶角（40）'`, `method: 'cfop'`, `view: 'top'`, `expectedCount: 40`, `cases: COLL_CASES`）；
   - `SETS` 顺序定为 `[F2L_SET, OLL_SET, PLL_SET, COLL_SET, CMLL_SET, LSE_SET]`（保持原五组相对顺序不变，`COLL` 排在 CFOP 末尾）。
5. `src/pages/HomePage.tsx`：
   - `COVER` 增加 `coll: 'coll-as-1'`（封面卡仍为纯文字，不渲染 `COVER` 图解；分组卡使用各组第 1 个情形 `s.cases[0]`）。
6. `src/store/devicePrefs.ts`：
   - `EMPTY_SETS` 增加 `coll: []`。
7. `src/lib/practice.ts` 与 `src/lib/practiceSample.ts`：
   - `src/lib/practice.ts` 的 `AUF_SETS` 增加 `'coll'`（`['oll', 'pll', 'cmll', 'coll']`）；
   - `src/lib/practiceSample.ts` 的 `options` 列表增加 `'coll'`（`['oll', 'pll', 'cmll', 'coll'].includes(c.set)`），无需加进 `variation`（因为 `COLL` 要求顶棱 EO 固定不变，而 `variation` 的 `F R U R' U' F'` 会翻转顶棱，切勿将 `'coll'` 加入 `F R U R' U' F'` 的 `variation`！）。

### 5.2 按 D21 等强更新的测试文件
1. `src/data/coll.names.test.ts`（新建）：40 条 J Perm + CubeSkills + 7 组几何特征校验。
2. `src/pages/outsideDiagrams.test.tsx`：
   - `ALL_CASES.length` 从 `254` 等强更新为 `294`（`254 + 40`）。
3. `src/pages/homeCards.test.tsx`：
   - `.set-card` 数量从 `5` 等强更新为 `6`；
   - 链接列表从 `['f2l', 'oll', 'pll', 'cmll', 'lse']` 等强更新为 `['f2l', 'oll', 'pll', 'coll', 'cmll', 'lse']`；
   - CFOP 封面文案从 `3 组 · 119 个情形` / `F2L · OLL · PLL` 等强更新为 `4 组 · 159 个情形` / `F2L · OLL · PLL · COLL`。
4. `src/store/devicePrefs.test.ts`：
   - 默认 `practiceSets` 断言增加 `coll: []`。
5. `src/lib/practiceSample.test.ts`：
   - 在遍历各组测试 `sampleTarget` 时，增加 `else if (c.set === 'coll')` 分支，断言 `SET_RULES.coll.display(i)` 范围内的贴纸与真题一致。
6. `e2e/home-decks.spec.ts` 与 `e2e/visual-smoke.spec.ts`：
   - `e2e/home-decks.spec.ts`：CFOP 封面文案更新为 `4 组 · 159 个情形` / `F2L · OLL · PLL · COLL`；CFOP 卡堆最后一张索引从 `index: 3`（PLL）等强更新为 `index: 4`（COLL，向下再翻一次回到 `index: 0` 封面）；展开后链接列表更新为 `['f2l', 'oll', 'pll', 'coll', 'cmll', 'lse']`（6 张 `set-card`）。
   - `e2e/visual-smoke.spec.ts`：展开后 `.set-card` 数量从 `5` 等强更新为 `6`。

## 6. 验收门禁

1. `npm run check:data` 通过（40 条 COLL 全部通过 `lintCase` 及去重指纹校验）
2. `npm test` 全部通过（含 `coll.names.test.ts`）
3. `npm run build` 通过
4. `npm run test:visual` 30 条 Playwright 视觉冒烟全部通过（320×640 与 390×844 下首页卡堆、展开列表、COLL 列表与详情均无横向溢出或底栏遮挡）
5. `git diff --check` 无空白错误

## 7. Executor 实现记录（2026-11-12）

- 40 个情形全部录入，含主备选公式；注册 COLL 的规则与独立前提校验，保持原五组数据、ID、规则及公式不变。CFOP 卡堆末尾增加 COLL，总数为 6 组 / 294 情形。
- 按实际项目接口使用 `CaseSet.name` / `description`，未引入不存在的 `title` / `subtitle` 字段。当前 `devicePrefs.ts` 没有 `EMPTY_SETS` / `practiceSets`；练习范围本就在 PracticePage 中按 SETS 动态生成，故不改设备偏好结构或默认值。
- 复核在线 J Perm 原始 coll.js 的 40 条同号公式，L5 保留原来源的 x 转体参考；CubeSkills 原始 PDF 渲染三页，独立转录 40 条公式并验证一对一覆盖。另检查七组角块朝向形状与 Sune/Antisune 的扭转方向。
- 练习允许 COLL 四种 AUF，不加额外 variation。新增逐条 AUF 抽样、六种底色×四 AUF 的完整 54 张贴纸求解回放检查。原“无主公式图解完全一致”测试及 5 秒超时均保留；曾与 Playwright 同时运行时因 CPU 竞争超时，随后单独完整重跑通过。
- 按 D21 将数量、首页入口、隐藏卡及循环边界更新为六组的精确值；快滑覆盖由 6 次上滑增加为 7 次，以维持完整循环后回到相同点击入口。CFOP 五张卡（含封面）的 5 个动画逐个保留 220ms / 无透明度检查。
- 门禁：`npm test` **4260 / 57**；`npm run check:data` **518 / 6**；`npm run build` 通过；`npm run test:visual -- --workers=2` **34 / 34**（原 32 条 + COLL 新增两视口）；`git diff --check` 通过。
- 320×640 / 390×844，浅深色：COLL 列表、分类弹窗、详情无横向滚动；详情 SVG 64×64，播放器舞台 164 / 190px，peek 位于底栏上方；分类选择返回恢复正常。截图：`ui-review.local/formula-expansion/coll-{320,390}-{light,dark}.png`。
- 未改样式、卡堆动效、路由、播放器、练习求解实现、现有数据和 SET_RULES；未合并、未 push，等待独立 Auditor。
