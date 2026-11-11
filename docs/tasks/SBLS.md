# SBLS — 新增桥式 Roux SBLS 公式集（65 情形）

- **状态：** done
- **前置依赖：** 先完成 [`T71.md`](T71.md) 与 [`COLL.md`](COLL.md)，再执行本任务。
- **方法归属：** `method: 'roux'`，`id: 'sbls'`，`title: 'SBLS'`，`subtitle: '右桥最后一槽 FR 成对归位（65）'`，`view: 'iso'`，`expectedCount: 65`。

## 1. 收录口径与来源查证

### 1.1 为什么是 65 个情形（收录范围与组合计数）
- **定义**：**SBLS（Second Block Last Slot，右桥最后一槽）** 是桥式 Roux 第二步（Second Block，右桥 1×2×3）的收尾阶段：在左桥 1×2×3（`x === -1, y <= 0`）和右桥后半（`DR` 棱 `[1,-1,0]`、`DBR` 角 `[1,-1,-1]`、`BR` 棱 `[1,0,-1]`、`R` 中心 `[1,0,0]`）已全部还原的前提下，用单段公式利用自由的 `M` 层与 `U` 层，同时将右桥前槽 **`FR`（`DFR` 角块 `[1,-1,1]` + `FR` 棱块 `[1,0,1]`）** 归位还原。
- **公认来源**：**SpeedCubeDB SBLS 算法表**（https://speedcubedb.com/a/3x3/SBLS ），收录 **6 组共 65 个情形**：
  1. **角块在顶层 `UFR`（`[1, 1, 1]`）时（固定角块在 `UFR` 观察，不加顶层预转 AUF，此时 `FR` 棱块可位于 7 个未占用棱位 `UB, UR, UF, UL, FR, DB, DF` × 2 种朝向 = 14 个情形/组）**：
     - `Corner on U facing up`（代号 `U`，底色朝 `U`）：14 个情形（`U UB`..`U DFm`）
     - `Corner on U oriented`（代号 `Up`，底色朝 `R`）：14 个情形（`Up UB`..`Up DFm`）
     - `Corner on U misoriented`（代号 `Um`，底色朝 `F`）：14 个情形（`Um UB`..`Um DFm`）
  2. **角块在底层槽位 `DFR`（`[1, -1, 1]`）时（顶层可自由预转 `U`，故棱块在顶层 `UB/UR/UF/UL` 的 4 个位置合并为 1 个标准位 `U`，固定停在 `UR` `[1, 1, 0]` 观察；棱块共有 `U(UR), FR, DB, DF` 4 个位置 × 2 种朝向 = 8 个组合）**：
     - `Corner on D solved`（代号 `D`，底色朝 `D` 已归位）：扣除已经完全还原的 `D FR`，共 $8 - 1 = 7$ 个情形（`D U, D DB, D DF, D Um, D FRm, D DBm, D DFm`）
     - `Corner on D facing forward`（代号 `Dp`，底色朝 `F`）：8 个情形（`Dp U`..`Dp DFm`）
     - `Corner on D facing side`（代号 `Dm`，底色朝 `R`）：8 个情形（`Dm U`..`Dm DFm`）
  - **合计**：$14 + 14 + 14 + 7 + 8 + 8 = 65$ 个情形。
- **观察持法、槽位与去重约定**：
  - 统一采用站内桥式标准持法（浏览默认黄顶绿前，随桥式浏览/练习配色池动态映射），目标槽位固定为右前槽 **`FR`**（与站内 `F2L` 槽位完全一致）。
  - 不重复收录左桥槽、右后槽（`BR`）或整体 `y` 转体镜像；`preUs: [0]`、`preY: [0]`、`normalize: false`（因为 SBLS 大量使用 `M` / `r` 转动，执行后会改变 M 层中心朝向，若开启 `normalizeRotation` 会把整个魔方绕 `x` 轴旋转，导致左右桥位置错乱，因此必须与 `CMLL` / `LSE` 一样保持 `normalize: false`）。

### 1.2 ⚠️ SpeedCubeDB 来源冲突查证：7 对（14 条）标签互换错误及修正规范
经本项目魔方引擎（`src/lib/cube.ts`）对 SpeedCubeDB 全部 65 个情形的 `setup` 与算法逐条逆推验证，发现 SpeedCubeDB 的 SBLS 页面存在以下 **7 对（共 14 条）情形的页面标题（`UF`↔`UL` 或 `DB`↔`DF`）与其算法实际生成的物理棱块位置完全互换**：

| 序号 | SpeedCubeDB 页面标称对 | 页面原列主公式（求逆后的真实物理棱位） | 本项目物理归位修正方案 |
|---:|---|---|---|
| 1 | `Up UF` ↔ `Up UL` | SCDB `Up UF` 主公式 `r U' r' U' r U' r'` 实际棱在 **`UL`**；SCDB `Up UL` 主公式 `R' U2 R2 U R2 U R` 实际棱在 **`UF`** | 互换归位：`sbls-up-uf` 用 `R' U2 R2 U R2 U R`，`sbls-up-ul` 用 `r U' r' U' r U' r'` |
| 2 | `Up DB` ↔ `Up DF` | SCDB `Up DB` 主公式 `M' r U r'` 实际棱在 **`DF`**；SCDB `Up DF` 主公式 `r U2 M' U' r'` 实际棱在 **`DB`** | 互换归位：`sbls-up-db` 用 `r U2 M' U' r'`，`sbls-up-df` 用 `M' r U r'` |
| 3 | `Um DB` ↔ `Um DF` | SCDB `Um DB` 主公式 `U' M2 U2 R U' R'` 实际棱在 **`DF`**；SCDB `Um DF` 主公式 `U M' r U' r'` 实际棱在 **`DB`** | 互换归位：`sbls-um-db` 用 `U M' r U' r'`，`sbls-um-df` 用 `U' M2 U2 R U' R'` |
| 4 | `Um DBm` ↔ `Um DFm` | SCDB `Um DBm` 主公式 `U r U' r'` 实际棱在 **`DF`**；SCDB `Um DFm` 主公式 `U' M U2 R U' R'` 实际棱在 **`DB`** | 互换归位：`sbls-um-dbm` 用 `U' M U2 R U' R'`，`sbls-um-dfm` 用 `U r U' r'` |
| 5 | `Dp DBm` ↔ `Dp DFm` | SCDB `Dp DBm` 主公式 `R U' R' U r U' r'` 实际棱在 **`DF`**；SCDB `Dp DFm` 主公式 `M U R U' R' U R U' R'` 实际棱在 **`DB`** | 互换归位：`sbls-dp-dbm` 用 `M U R U' R' U R U' R'`，`sbls-dp-dfm` 用 `R U' R' U r U' r'` |
| 6 | `Dm DB` ↔ `Dm DF` | SCDB `Dm DB` 主公式 `r U r' U' r U r'` 实际棱在 **`DF`**；SCDB `Dm DF` 主公式 `R U2 r' U2 r U r'` 实际棱在 **`DB`** | 互换归位：`sbls-dm-db` 用 `R U2 r' U2 r U r'`，`sbls-dm-df` 用 `r U r' U' r U r'` |
| 7 | `Dm DBm` ↔ `Dm DFm` | SCDB `Dm DBm` 主公式 `M' U' R U R' U' R U R'` 实际棱在 **`DF`**；SCDB `Dm DFm` 主公式 `M' r U r' U' r U r'` 实际棱在 **`DB`** | 互换归位：`sbls-dm-dbm` 用 `M' r U r' U' r U r'`，`sbls-dm-dfm` 用 `M' U' R U R' U' R U R'` |

> **硬性要求**：按项目决策 `D1` 与 `D21`，站内图解与 3D 均由 `algs[0]` 实时推导，**情形名称 `<Corner> <Edge>` 必须 100% 匹配 `caseState(c)` 中的真实物理块位置与朝向**。严禁盲目按 SpeedCubeDB 的错误标题照抄这 7 对！另外，SpeedCubeDB 中个别带 `l F R'`（产生净整体转体 `x`）的备选公式一律剔除，不录入 `src/data/sbls.ts`。

---

## 2. 可执行规则规格（`SET_RULES.sbls` 与 `lintCase`）

### 2.1 规则表定义（复用 `T71` 在 `src/lib/cases.ts` 导出的 `SBLS_RULE`）
- **适用前提（起手状态 `after = caseState(c)`）**：
  1. 左桥 1×2×3 全部还原（`p[0] === -1 && p[1] <= 0`，13 张贴纸）且右桥后半全部还原（`DR`、`DBR`、`BR`、`R` 中心，8 张贴纸）：共 21 张贴纸满足 `isSblsPreserve(loc) => after[loc] === loc`；
  2. 右桥前槽 `FR`（`DFR` 角 + `FR` 棱，5 张贴纸 `SBLS_FR_PAIR_LOCS`）尚未完全还原（不全满足 `after[loc] === loc`）。
- **完成目标（`solve: isRouxBlock`）**：
  - `isRouxBlock(id)`（`p[0] !== 0 && p[1] !== 1`，左右两桥共 26 张贴纸）全部还原到 `solved()` 状态；`U` 层与 `M` 层（中心与 `UF/UB/DF/DB` 棱）自由。
- **显示掩码（`display: isRouxBlock`）**：
  - 与 `CMLL` 的桥块部分一致，只给左右两桥的 26 张贴纸（含散落在顶层或 M 层的 `DFR` 角块 3 张贴纸和 `FR` 棱块 2 张贴纸）上色，其余顶层与 M 层无关贴纸置灰，在 2D `IsoView` 与 3D“只看相关的块”下都能直接看清目标 `DFR` 角与 `FR` 棱的位置和朝向。
- **保持掩码（`preserve: isSblsPreserve`）**：
  - `isSblsPreserve(id) = isRouxBlock(id) && !isFRPair(id)`（21 张已完成的左右桥贴纸严禁被改动）。
- **转体与 AUF 参数**：
  - `view: 'iso'`，`preUs: [0]`，`preY: [0]`，`normalize: false`。
- **`lintCase` 附加不变量**：
  - 在 `lintCase` 中当 `c.set === 'sbls'` 时调用 `lintSblsState(c.id, after, c.algs)`，强制检查：
    1. `SBLS_FR_PAIR_LOCS` 在 `after` 中不能已经全部还原；
    2. `c.algs` 中任何公式均不得包含整体转体 `x/y/z`。
  - 同时数据校验 `src/data/data.test.ts` 对备选公式的循环通过 `algSolvesCase(c, alg)` 验证每条备选公式在不加顶层预转（`preUs: [0]`）下直接把 `caseState(c)` 的左右两桥 26 张贴纸全部还原。

### 2.2 正例与反例（必须在测试中覆盖）
- **合法正例**：
  - `sbls-u-uf` 主公式 `M' r U' r' U2 r U r'`：含 `M'` 与 `r`，执行后 M 层中心偏移但左右两桥 26 张贴纸完全归位，起手 21 张 `isSblsPreserve` 贴纸全部保持原位。
- **非法反例（必须被 `lintCase` / `algSolvesCase` / `sbls.names.test.ts` 拒绝）**：
  1. **破坏右桥后槽 `BR` / `DR` 的公式**：如 `R' U R` —— 破坏 `BR` 与 `DBR`，被 `preserve: isSblsPreserve` 拒绝。
  2. **破坏左桥但还原右桥的 CFOP F2L 公式**：如含 `L` / `l` / `d` 破坏左桥且未复原的公式 —— 被 `preserve: isSblsPreserve` 拒绝。
  3. **需要不同顶层起手 AUF 的公式**：如对 `sbls-u-ur`（`R U2 R' U' R U R'`）填入 `U R U2 R' U' R U R'` —— 因 `preUs: [0]`，被 `algSolvesCase` 拒绝。
  4. **SpeedCubeDB 未修正的互换公式**：如把 `r U' r' U' r U' r'`（实际棱在 `UL`）填进 `sbls-up-uf` —— 被 `src/data/sbls.names.test.ts` 的物理块位置断言拒绝。

---

## 3. 65 个情形完整规范与算法对照表（已修正 7 对物理归位）

> 下表 65 个情形的主备选公式均已通过引擎 `isRouxBlock`、`isSblsPreserve`、`lintSblsState`、65/65 指纹去重以及物理块位置与朝向校验。Executor 录入 `src/data/sbls.ts` 时请直接按本表录入。

| # | `id` | `name` | `group` | 验证通过的公式（`algs[0]` / 备选） | 来源与物理归位说明 |
|---:|---|---|---|---|---|
| 1 | `sbls-u-ub` | `U UB` | `Corner on U facing up` | `U R U2 R' U R U' R'` / `r U' R' U2 M2 r U r'` / `U R U B' R B R2` | SCDB `U UB` |
| 2 | `sbls-u-ur` | `U UR` | `Corner on U facing up` | `R U2 R' U' R U R'` / `R U R' U' M R U R' U' r U R'` / `r U2 r' U' R U R'` | SCDB `U UR` |
| 3 | `sbls-u-uf` | `U UF` | `Corner on U facing up` | `M' r U' r' U2 r U r'` / `r U2 r' U' M' r U r'` / `R U' R' U' R U R' U2 R U R'` | SCDB `U UF` |
| 4 | `sbls-u-ul` | `U UL` | `Corner on U facing up` | `R U' R' U2 R U R'` / `U2 R U R' U R U' R'` / `R B U2 B' R'` | SCDB `U UL` |
| 5 | `sbls-u-fr` | `U FR` | `Corner on U facing up` | `U2 r U r' U r U' r'` / `R2 U R2 U R2 U2 R2` / `R U R' U' R U R' U' R U R' U'` | SCDB `U FR` |
| 6 | `sbls-u-db` | `U DB` | `Corner on U facing up` | `R U' r' U2 r U r'` | SCDB `U DB` |
| 7 | `sbls-u-df` | `U DF` | `Corner on U facing up` | `U2 r U r' F' U' F` / `R U' R' U2 M' r U r'` / `R U M' U R' U' r U r'` | SCDB `U DF` |
| 8 | `sbls-u-ubm` | `U UBm` | `Corner on U facing up` | `r U' r' U2 r U r'` / `F' r' F2 r F` / `U2 F' U' F r U r'` | SCDB `U UBm` |
| 9 | `sbls-u-urm` | `U URm` | `Corner on U facing up` | `U r U2 r' U r U' r'` / `U' R U R2 F R F' R U' R'` / `U2 r U R' M' U M' r U' r'` | SCDB `U URm` |
| 10 | `sbls-u-ufm` | `U UFm` | `Corner on U facing up` | `M' U R U2 R' U R U' R'` / `M' U R U2 R2 F R F'` / `R' F R F' R U' R' U R U' R'` | SCDB `U UFm` |
| 11 | `sbls-u-ulm` | `U ULm` | `Corner on U facing up` | `r U' r' U2 M' r U r'` / `U' F' U2 F r U r'` / `U M' r U2 R' U r U' r'` | SCDB `U ULm` |
| 12 | `sbls-u-frm` | `U FRm` | `Corner on U facing up` | `R U2 R' U' r U r'` / `U' R' F R F' R U' R'` / `R U' R' U2 r U r'` | SCDB `U FRm` |
| 13 | `sbls-u-dbm` | `U DBm` | `Corner on U facing up` | `R U' R' U2 M R U R'` / `R U' R' U2 M2 r U r'` / `M U R U2 R' U R U' R'` | SCDB `U DBm` |
| 14 | `sbls-u-dfm` | `U DFm` | `Corner on U facing up` | `U' B r2 B' r2 B'` / `U2 R U R' U r U' r'` / `U' f U2 F' U2 f'` | SCDB `U DFm` |
| 15 | `sbls-up-ub` | `Up UB` | `Corner on U oriented` | `R U R'` | SCDB `Up UB` |
| 16 | `sbls-up-ur` | `Up UR` | `Corner on U oriented` | `U' R U' R' U R U R'` / `U' M' U M2 r U r'` / `U' M' U M R U R'` | SCDB `Up UR` |
| 17 | `sbls-up-uf` | `Up UF` | `Corner on U oriented` | `R' U2 R2 U R2 U R` / `R U' R' U R U' R' U2 R U' R'` / `r M' U2 M2 U' R'` | ⚠️ 取自 SCDB `Up UL`（物理归位） |
| 18 | `sbls-up-ul` | `Up UL` | `Corner on U oriented` | `r U' r' U' r U' r'` / `U2 R U' R' U' R U R'` / `U M' U' M R U R'` | ⚠️ 取自 SCDB `Up UF`（物理归位） |
| 19 | `sbls-up-fr` | `Up FR` | `Corner on U oriented` | `U R U R' U2 R U R'` / `U' R U2 R' U R U R'` / `U R' D' R U' R' D R` | SCDB `Up FR` |
| 20 | `sbls-up-db` | `Up DB` | `Corner on U oriented` | `r U2 M' U' r'` / `R U2 M2 U' R'` / `U2 M U2 r U r'` | ⚠️ 取自 SCDB `Up DF`（物理归位） |
| 21 | `sbls-up-df` | `Up DF` | `Corner on U oriented` | `M' r U r'` / `R' r2 U r'` / `R M2 U r'` | ⚠️ 取自 SCDB `Up DB`（物理归位） |
| 22 | `sbls-up-ubm` | `Up UBm` | `Corner on U oriented` | `r U2 M2 U' R'` / `r' U2 R2 U R2 U R` / `U2 M U2 M' r U r'` | SCDB `Up UBm` |
| 23 | `sbls-up-urm` | `Up URm` | `Corner on U oriented` | `R U' R' U2 F' U' F` / `U M U' M' r U r'` / `U' M' U' M U2 r U r'` | SCDB `Up URm` |
| 24 | `sbls-up-ufm` | `Up UFm` | `Corner on U oriented` | `r U r'` / `L F L'` / `U r' D' r U' r' D r` | SCDB `Up UFm` |
| 25 | `sbls-up-ulm` | `Up ULm` | `Corner on U oriented` | `U r U r' U2 r U r'` / `U M' U M U2 r U r'` / `U2 F' L' U' L U2 F` | SCDB `Up ULm` |
| 26 | `sbls-up-frm` | `Up FRm` | `Corner on U oriented` | `U2 F' U' F U R U' R'` / `U r U r' U2 M' r U R'` / `U2 R' F R F' U2 R U R'` | SCDB `Up FRm` |
| 27 | `sbls-up-dbm` | `Up DBm` | `Corner on U oriented` | `R M U R'` / `M2 r U R'` / `M R U R'` | SCDB `Up DBm` |
| 28 | `sbls-up-dfm` | `Up DFm` | `Corner on U oriented` | `R U2 M' U' R'` / `U2 M2 U2 r U r'` / `U2 M' U2 R U R'` | SCDB `Up DFm` |
| 29 | `sbls-um-ub` | `Um UB` | `Corner on U misoriented` | `M' U' M U2 R U' R'` / `U' R U R' U' R U2 R'` / `U2 M U' L F' L'` | SCDB `Um UB` |
| 30 | `sbls-um-ur` | `Um UR` | `Corner on U misoriented` | `U R U' R'` / `R' F R F'` / `U2 r U2 r'` | SCDB `Um UR` |
| 31 | `sbls-um-uf` | `Um UF` | `Corner on U misoriented` | `M U r U' r'` / `U2 r U M U R'` / `U2 r U r' R U R'` | SCDB `Um UF` |
| 32 | `sbls-um-ul` | `Um UL` | `Corner on U misoriented` | `U' M U2 r U' r'` / `U' R U2 R' U2 R U' R'` / `U' R U2 R' U' R U2 R'` | SCDB `Um UL` |
| 33 | `sbls-um-fr` | `Um FR` | `Corner on U misoriented` | `U' R U' R' U2 R U' R'` / `U' R U' R' U' R U2 R'` / `U r U r' U' r U' r'` | SCDB `Um FR` |
| 34 | `sbls-um-db` | `Um DB` | `Corner on U misoriented` | `U M' r U' r'` / `U M2 R U' R'` | ⚠️ 取自 SCDB `Um DF`（物理归位） |
| 35 | `sbls-um-df` | `Um DF` | `Corner on U misoriented` | `U' M2 U2 R U' R'` / `U2 R U M2 U R'` / `U' M2 U' R U2 R'` | ⚠️ 取自 SCDB `Um DB`（物理归位） |
| 36 | `sbls-um-ubm` | `Um UBm` | `Corner on U misoriented` | `M2 U r U' r'` / `M' U M2 R U' R'` / `U' R U' R' U2 R M U' r'` | SCDB `Um UBm` |
| 37 | `sbls-um-urm` | `Um URm` | `Corner on U misoriented` | `U' M2 U2 r U' r'` / `U' M' U2 M2 R U' R'` / `U M' r U2 M U r'` | SCDB `Um URm` |
| 38 | `sbls-um-ufm` | `Um UFm` | `Corner on U misoriented` | `U2 M2 U' r U' r'` / `U2 r U' M2 U' r'` / `M' U' R U R' U2 R U' R'` | SCDB `Um UFm` |
| 39 | `sbls-um-ulm` | `Um ULm` | `Corner on U misoriented` | `F' U' F` / `U M R U' R'` / `U r' R2 U' R'` | SCDB `Um ULm` |
| 40 | `sbls-um-frm` | `Um FRm` | `Corner on U misoriented` | `U2 R U M' U R'` / `U2 R U R' r U r'` / `U' R U R' M' U2 R U' R'` | SCDB `Um FRm` |
| 41 | `sbls-um-dbm` | `Um DBm` | `Corner on U misoriented` | `U' M U2 R U' R'` / `U' M U' R U2 R'` | ⚠️ 取自 SCDB `Um DFm`（物理归位） |
| 42 | `sbls-um-dfm` | `Um DFm` | `Corner on U misoriented` | `U r U' r'` | ⚠️ 取自 SCDB `Um DBm`（物理归位） |
| 43 | `sbls-d-u` | `D U` | `Corner on D solved` | `U' r U' M U R'` / `R' U' R' U' R' U R U R` / `U' R' F R F' R U R'` | SCDB `D U` |
| 44 | `sbls-d-db` | `D DB` | `Corner on D solved` | `R U M2 U' R'` / `r U M' U' R'` | SCDB `D DB` |
| 45 | `sbls-d-df` | `D DF` | `Corner on D solved` | `R U' M2 U R'` | SCDB `D DF` |
| 46 | `sbls-d-um` | `D Um` | `Corner on D solved` | `U r U2 r' U' r U' r'` / `U2 r U r' U r U2 r'` / `U2 R U' R' r U r'` | SCDB `D Um` |
| 47 | `sbls-d-frm` | `D FRm` | `Corner on D solved` | `R U' M2 U2 M' U' R'` / `R2 U2 F R2 F' U2 R' U R'` / `R U M2 U2 M U R'` | SCDB `D FRm` |
| 48 | `sbls-d-dbm` | `D DBm` | `Corner on D solved` | `R U' M U R'` | SCDB `D DBm` |
| 49 | `sbls-d-dfm` | `D DFm` | `Corner on D solved` | `R U M' U' R'` / `R U M' U R' U' R U' R'` | SCDB `D DFm` |
| 50 | `sbls-dp-u` | `Dp U` | `Corner on D facing forward` | `R U' R' U R U' R'` / `R U2 B' R B R2` / `r U' R' U R U' r'` | SCDB `Dp U` |
| 51 | `sbls-dp-fr` | `Dp FR` | `Corner on D facing forward` | `R U R' U' R U2 R' U' R U R'` / `R U' R' U2 M U' r U' r'` / `R2 U2 R' U' R U' R' U2 R'` | SCDB `Dp FR` |
| 52 | `sbls-dp-db` | `Dp DB` | `Corner on D facing forward` | `r U' R' U r U' r'` / `R U' R' U M2 R U' R'` / `M2 U' R U' R' U R U' r'` | SCDB `Dp DB` |
| 53 | `sbls-dp-df` | `Dp DF` | `Corner on D facing forward` | `M2 U R U' R' U R U' R'` / `r U2 r' U' R U2 R2 F R F'` / `r U' r' U2 r U' M U' r'` | SCDB `Dp DF` |
| 54 | `sbls-dp-um` | `Dp Um` | `Corner on D facing forward` | `U R' F R F' U R U' R'` / `U' r U' R' M' U r U' r'` / `U' R U' R' F' U' F` | SCDB `Dp Um` |
| 55 | `sbls-dp-frm` | `Dp FRm` | `Corner on D facing forward` | `R U' R' M2 U r U' r'` / `R U' R U B U' B' R2` / `r U' r' M U r U' r'` | SCDB `Dp FRm` |
| 56 | `sbls-dp-dbm` | `Dp DBm` | `Corner on D facing forward` | `M U R U' R' U R U' R'` / `M U R U' R2 F R F'` / `R U' r' U2 M U' r U' r'` | ⚠️ 取自 SCDB `Dp DFm`（物理归位） |
| 57 | `sbls-dp-dfm` | `Dp DFm` | `Corner on D facing forward` | `R U' R' U r U' r'` / `M' U' R U' R' U R U' R'` / `r U' r' U' R U' R' U2 R U' R'` | ⚠️ 取自 SCDB `Dp DBm`（物理归位） |
| 58 | `sbls-dm-u` | `Dm U` | `Corner on D facing side` | `R U R' U' R U R'` / `U' R U2 R' U2 R U R'` / `U' R U' f R2 f' R'` | SCDB `Dm U` |
| 59 | `sbls-dm-fr` | `Dm FR` | `Corner on D facing side` | `r U r' U' R U2 M' U' R'` / `R U2 R U R' U R U2 R2` / `r U r' U M2 U2 r U r'` | SCDB `Dm FR` |
| 60 | `sbls-dm-db` | `Dm DB` | `Corner on D facing side` | `R U2 r' U2 r U r'` / `M2 U' R U R' U' R U R' U'` / `M2 U' R U R' U' R U R'` | ⚠️ 取自 SCDB `Dm DF`（物理归位） |
| 61 | `sbls-dm-df` | `Dm DF` | `Corner on D facing side` | `r U r' U' r U r'` | ⚠️ 取自 SCDB `Dm DB`（物理归位） |
| 62 | `sbls-dm-um` | `Dm Um` | `Corner on D facing side` | `U R U R' U' r U r'` / `U F' U F2 R' F' R` / `U' r U2 r' U2 r U r'` | SCDB `Dm Um` |
| 63 | `sbls-dm-frm` | `Dm FRm` | `Corner on D facing side` | `r U r' U' M' r U r'` / `R2 B U B' U' R' U R'` / `R U' R' F' r' F2 r F` | SCDB `Dm FRm` |
| 64 | `sbls-dm-dbm` | `Dm DBm` | `Corner on D facing side` | `M' r U r' U' r U r'` / `R M2 U R' U' r U r'` / `R U2 R' U2 M R U R'` | ⚠️ 取自 SCDB `Dm DFm`（物理归位） |
| 65 | `sbls-dm-dfm` | `Dm DFm` | `Corner on D facing side` | `M' U' R U R' U' R U R'` / `R U2 R' M2 U2 r U r'` / `R U2 R' M' U2 R U R'` | ⚠️ 取自 SCDB `Dm DBm`（物理归位） |

---

## 4. 独立物理位置与朝向测试（`src/data/sbls.names.test.ts`）

新建 `src/data/sbls.names.test.ts`，不依赖任何外部文本，直接从每个情形的物理魔方状态 `st = caseState(c)` 独立推导其应有的名称与分类，断言 65/65 精确吻合：
1. **定位目标块的贴纸 ID**：
   - `DFR` 角块的 `D` 面贴纸：`p = [1, -1, 1], face = 'D'`；
   - `FR` 棱块的 `R` 面贴纸（`p = [1, 0, 1], face = 'R'`）与 `F` 面贴纸（`p = [1, 0, 1], face = 'F'`）。
2. **推导角块代号（`cCode`）与所属分类（`expectedGroup`）**：
   - 查找 `DFR` 角块 `D` 面贴纸在 `st` 中的当前位置 `cLoc = st.indexOf(dfrDStickerId)`：
     - 若 `S[cLoc].p` 为 `[1, 1, 1]`（`UFR`）：
       - `S[cLoc].face === 'U'` → `cCode = 'U'`，`expectedGroup = 'Corner on U facing up'`
       - `S[cLoc].face === 'R'` → `cCode = 'Up'`，`expectedGroup = 'Corner on U oriented'`
       - `S[cLoc].face === 'F'` → `cCode = 'Um'`，`expectedGroup = 'Corner on U misoriented'`
     - 若 `S[cLoc].p` 为 `[1, -1, 1]`（`DFR`）：
       - `S[cLoc].face === 'D'` → `cCode = 'D'`，`expectedGroup = 'Corner on D solved'`
       - `S[cLoc].face === 'F'` → `cCode = 'Dp'`，`expectedGroup = 'Corner on D facing forward'`
       - `S[cLoc].face === 'R'` → `cCode = 'Dm'`，`expectedGroup = 'Corner on D facing side'`
3. **推导棱块代号（`eCode`）**：
   - 查找 `FR` 棱块 `R` 面贴纸在 `st` 中的当前位置 `rLoc = st.indexOf(frRStickerId)`：
     - 由 `S[rLoc].p` 确定棱块所在槽位 `ePos in {'UB', 'UR', 'UF', 'UL', 'FR', 'DB', 'DF'}`；
     - 当 `cCode` 为 `D / Dp / Dm` 且棱在顶层时，断言 `ePos === 'UR'`（标准观察位），代号前缀记为 `'U'`；当 `cCode` 为 `U / Up / Um` 时，代号前缀记为 `ePos`；
     - 判定色相后缀 `isM`（misoriented）：
       - 棱在顶层（`UB/UR/UF/UL`）：`S[rLoc].face === 'U'` 时为 `m`（正向时 `F` 贴纸在 `U` 面）；
       - 棱在 `FR`：`S[rLoc].face === 'F'` 时为 `m`（即原位翻转）；
       - 棱在 `DB/DF`：`S[rLoc].face === 'D'` 时为 `m`（正向时 `F` 贴纸在 `D` 面）。
4. **断言**：
   - 对全部 65 个情形，断言 `c.group === expectedGroup`、`c.name === `${cCode} ${eBase}${isM ? 'm' : ''}``、`c.id === 'sbls-' + c.name.toLowerCase().replace(/\s+/g, '-')`。
   - 这项测试能从数学上 100% 证明全部 65 个情形的名称、分类、ID 与其算法生成的 2D/3D 魔方物理状态完全一致。

---

## 5. 全站接入范围与测试等强更新清单

### 5.1 生产文件修改范围
1. `src/types.ts`：
   - `export type SetId = 'f2l' | 'oll' | 'pll' | 'coll' | 'cmll' | 'lse' | 'sbls';`
2. `src/lib/cases.ts`：
   - `SET_RULES` 增加 `sbls: SBLS_RULE`；
   - `lintCase` 中增加 `if (c.set === 'sbls') errors.push(...lintSblsState(c.id, after, c.algs));`。
3. `src/data/sbls.ts`（新建）：
   - 录入第 3 节表格中的 65 个情形。
4. `src/data/index.ts`：
   - 导入 `SBLS_CASES`，定义 `SBLS_SET`（`id: 'sbls'`, `title: 'SBLS'`, `subtitle: '右桥最后一槽 FR 成对归位（65）'`, `method: 'roux'`, `view: 'iso'`, `expectedCount: 65`, `cases: SBLS_CASES`）；
   - `SETS` 顺序定为 `[F2L_SET, OLL_SET, PLL_SET, COLL_SET, CMLL_SET, LSE_SET, SBLS_SET]`（保持原五组相对顺序不变，`SBLS` 排在桥式末尾）。
5. `src/pages/HomePage.tsx`：
   - `COVER` 增加 `sbls: 'sbls-u-ub'`。
6. `src/store/devicePrefs.ts`：
   - `EMPTY_SETS` 增加 `sbls: []`。
7. 练习与配色检查：
   - `T71` 已将 `'sbls'` 加入 `isRouxSet`（`src/lib/colorScheme.ts` 与 `src/lib/practiceColors.ts`），因此 `SBLS` 自动使用桥式浏览配色与桥式 24 配色练习池；
   - `AUF_SETS`（`src/lib/practice.ts`）与 `sampleTarget` 的 `options`/`variation`（`src/lib/practiceSample.ts`）均**不**加入 `'sbls'`（与 `f2l`、`lse` 一致，直接对主公式求逆抽题）。

### 5.2 按 D21 等强更新的测试文件
1. `src/data/sbls.names.test.ts`（新建）：65 个情形的物理块位置、朝向、名称、分类与 ID 一致性校验。
2. `src/pages/outsideDiagrams.test.tsx`：
   - `ALL_CASES.length` 从 `294` 等强更新为 `359`（`294 + 65`）。
3. `src/pages/homeCards.test.tsx`：
   - `.set-card` 数量从 `6` 等强更新为 `7`；
   - 链接列表等强更新为 `['f2l', 'oll', 'pll', 'coll', 'cmll', 'lse', 'sbls']`；
   - 桥式封面文案从 `2 组 · 135 个情形` / `CMLL · LSE` 等强更新为 `3 组 · 200 个情形` / `CMLL · LSE · SBLS`。
4. `src/store/devicePrefs.test.ts`：
   - 默认 `practiceSets` 断言增加 `sbls: []`。
5. `src/lib/practiceSample.test.ts` 与 `src/lib/practiceColors.test.ts`：
   - `practiceColors.test.ts` 中验证 `sbls` 情形抽样走桥式配色池（与 `cmll` / `lse` 一致）。
6. `e2e/home-decks.spec.ts` 与 `e2e/visual-smoke.spec.ts`：
   - `e2e/home-decks.spec.ts`：桥式封面文案更新为 `3 组 · 200 个情形` / `CMLL · LSE · SBLS`；桥式卡堆从封面向上翻回到最后一张的索引从 `index: 2`（LSE）等强更新为 `index: 3`（SBLS）；展开后链接列表更新为 `['f2l', 'oll', 'pll', 'coll', 'cmll', 'lse', 'sbls']`（7 张 `set-card`）。
   - `e2e/visual-smoke.spec.ts`：展开后 `.set-card` 数量从 `6` 等强更新为 `7`。

## 6. 验收门禁

1. `npm run check:data` 通过（全站 7 组 359 个情形全部通过校验）
2. `npm test` 全部通过（含 `sbls.names.test.ts`）
3. `npm run build` 通过
4. `npm run test:visual` 30 条 Playwright 视觉冒烟全部通过（320×640 与 390×844 下首页两叠循环横卡、展开列表、SBLS 列表与详情均无横向溢出或底栏遮挡）
5. `git diff --check` 无空白错误

## 7. Executor 实现与核验记录（2026-11-12）

- 65 个情形按第 3 节录入，包含主备选算法。实际受保护范围是左桥 13 + 右后桥 8 = **21** 张，完成目标两桥为 **26** 张；正文计数已勘误。保留 T71 规格的掩码表达式原样，未放开任何已完成的块。
- 读取 SpeedCubeDB 当前原始页面，确认 7 对 / 14 条标签下的原公式。修正后 65 条逐一独立定位 DFR 角的 D 贴纸和 FR 棱的 R/F 贴纸，精确核对位置、朝向、标准观察位、分类、名称及 ID；另外锁定六组全部 65 个组合，排除已解决 D FR。来源网站生成器的具体原因未经证明，本文仅确认标签/算法与物理状态不符。
- 注册 SBLS 的独立规则与 lint 分支；右后桥/左桥破坏、错误前置 U、已还原槽、备选整体转体和原来源错误标题都有反例检查。旧五组规则、数据、公式与 ID 不变。
- 桥式卡堆末尾增加 SBLS，保留 CMLL → LSE → SBLS 顺序；首页总数 7 组 / 359 情形（CFOP 159，桥式 200），展开 7 个链接，首尾循环的精确下标与快滑逐次计数同步等强更新。未改卡堆交互或动效。
- 沿用实际接口 `CaseSet.name` / `description`；项目不存在规格提到的 `EMPTY_SETS` / `practiceSets`，SET 列表动态驱动练习选择，不新增设备偏好结构。SBLS 使用桥式浏览与练习配色池，65 条 × 24 种合法桥色的全 54 张贴纸求解回放全部通过；不增加 AUF 或 variation。
- `e2e/formula-expansion.spec.ts` 在 320×640 / 390×844、浅深色下覆盖 COLL/SBLS 列表、分类及详情、返回恢复，并分别从选择情形进入练习，校验求解生成、计时状态及原情形详情链接。原有 32 条全部保留，加 8 条新集合界面/练习检查，共 40 条。
- 320 与 390 均无横向滚动；新集合详情 SVG 均 64×64；播放器舞台分别 164 / 190px；peek 底边分别约 534.39 / 598.08px，底栏顶边分别 568 / 772px。分类弹窗在视口内，长英文组名按规格保留并换行显示。
- 截图：`ui-review.local/formula-expansion/sbls-{320,390}-{light,dark}.png`，分类截图 `sbls-category-{320,390}-{light,dark}.png`，列表截图 `sbls-list-{320,390}-{light,dark}.png`；COLL 同目录同样命名。首页七入口截图 `ui-review.local/home-decks/after-{320,390}-{light,dark}.png`、`expanded-{320,390}-{light,dark}.png`。
- 最终门禁：`npm test` **5046 / 58**；`npm run check:data` **653 / 7**；`npm run build` 通过；`npm run test:visual -- --workers=2` **40 / 40**；`git diff --check` 通过。
- 在 `codex/ui-polish` 追加实现提交，不新建/切换分支，不合并、不 push；未改 Lead 的 `docs/TASKS.md`，等待独立 Auditor 门禁及发布。
