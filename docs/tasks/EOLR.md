# EOLR：桥式（Roux）LSE 4a+4b 合并技术深度研究与规格修订

> **当前状态（2026-11-12，Lead 调研与规格修订）**：已完成全部可复现研究证据、群论轨道枚举与源码级映射，本轮**暂不接入生产功能、不修改生产代码、不注册 SetId**。
>
> 独立可运行验证脚本：
> ```bash
> node scripts/research/eolr/verify-eolr.mjs
> node scripts/research/eolr/verify-eolr.mjs --negative-test
> ```
> 机器核验数据集产物：`scripts/research/eolr/basilio-eolr-verified.json`。
> 历史勘误与复核记录见文末第 8、9 节。

---

## 1. 物理定义、边界与终点说明

### 1.1 起手前提与保护不变量
在桥式（Roux）最后一阶段 **LSE（Last Six Edges，步骤 4）** 开始前，魔方处于以下物理状态：
1. **左右两桥（Roux Blocks）已彻底完成**：
   - 左桥（1x2x3）：`DL`、`BL`、`FL` 三棱，`DBL`、`DFL` 两角，`L` 中心块，以及相邻的 6 张 D/B/F 贴纸，共 13 张贴纸；
   - 右桥（1x2x3）：`DR`、`BR`、`FR` 三棱，`DBR`、`DFR` 两角，`R` 中心块，以及相邻的 6 张 D/B/F 贴纸，共 13 张贴纸；
   - **两桥合计受保护贴纸为 26 张**（非 24 张，几何判定为 `|S[id].p[0]| === 1 && S[id].p[1] <= 0`）。在 $\langle M, U \rangle$ 作用下，这 26 张贴纸恒等不变。
2. **顶层四个角块（U-Corners）已完成朝向与相对位置归位（CMLL 已解决）**：
   - 4 个角块（`UFL`、`UFR`、`UBL`、`UBR`）仅差顶层整层旋转（$U^k, k \in \{0, 1, 2, 3\}$）。
   - $M$ 转动完全不改变 4 个顶角的位置与朝向；仅 $U$ 转动会以 4-cycle $(UFL \to UBL \to UBR \to UFR)$ 改变角块位置。
3. **活动块范围**：仅余 **6 个棱块**（`UF`、`UB`、`UL`、`UR`、`DF`、`DB`）与 **4 个中心块**（`U`、`F`、`D`、`B`）。

### 1.2 EO 判定与中心相位
- **EO（棱块朝向）判定**：在 Roux 规范中，一个棱块被称为“好棱（oriented）”，当且仅当其原属于 U 或 D 面的贴纸位于该棱块朝向 U 或 D 轴向的外表面（即顶层 4 棱的 y=1 贴纸为 U/D 色，底层 2 棱的 y=-1 贴纸为 U/D 色）。当所有 6 个棱块的 U/D 贴纸均处于 y 轴法向时，EO 达成（`edgesOriented(st) === true`）。
- **中心相位（Center Phase）**：
  - $U$ 转动不改变中心位置（绕 y 轴自转）；
  - $M$ 转动是 M 层中心块沿 x 轴的 4-cycle $(U \to F \to D \to B)$；
  - 令 $m \pmod 4$ 表示从 `solved()` 起累积的 $M$ 顺时针四分之一转代数和：
    - $m \equiv 0 \pmod 4$：U 中心在 U，F 在 F（正相位）；
    - $m \equiv 1 \pmod 4$：U 中心在 F，F 在 D（$90^\circ$ 偏移）；
    - $m \equiv 2 \pmod 4$：U 中心在 D，F 在 B（$180^\circ$ 反相，半转中心）；
    - $m \equiv 3 \pmod 4$：U 中心在 B，F 在 U（$270^\circ$ 偏移）。
  - 在 Roux LSE 中，$m \in \{0, 2\}$ 称为**平面中心态（Flat Centers）**，此时 U/D 轴向仍为 U/D 中心块（仅两者可能互换）；$m \in \{1, 3\}$ 为倾斜中心态。严格的 EO 解决必须保证中心处于允许的平面相位 $m \in \{0, 2\}$。

### 1.3 完成目标的精确区分：化归中间态 vs 标准 EOLR vs 严格 EOLRb
依从 Athefre 权威定义（[Athefre's Roux Guide](https://sites.google.com/site/athefre/roux/eolr)）与魔方群论物理事实，严格区分三种操作层级（彻底取消“单步 AUF 即完成”的不实承诺）：

| 指标 | Tier 1: 化归中间态（Reduction State） | Tier 2: 标准 EOLR（Standard EOLR） | Tier 3: 严格 EOLRb（Strict Top-Solved EOLRb） |
|---|---|---|---|
| **起手前提** | 左右桥完成，具有 2/4/6 个坏棱 | 左右桥完成，具有 2/4/6 个坏棱 | 左右桥完成，具有 2/4/6 个坏棱 |
| **追踪目标** | 坏棱形态转换 + LR 相对位置 | 6 棱 EO + `{UL, UR}` 目标底层槽位 | 6 棱 EO + `UL`、`UR` 具名身份 + 顶角对齐 |
| **物理终点** | 坏棱数化归为好处理形态（如 Arrow 态或 4/0 态），**或出现假顶层中间态** | **EO 全部翻正（0 坏棱），中心处于平面态（$m \in \{0, 2\}$），`{UL, UR}` 位于底面双槽 `{DF, DB}`** | **EO 全部翻正（0 坏棱），中心处于平面态（$m \in \{0, 2\}$），`UL` 严格在 `UL` 槽、`UR` 严格在 `UR` 槽（非无序互换），且 4 个 CMLL 顶角与左右桥严格对齐（$U\text{-AUF}=0$）** |
| **后置要求** | 接续下一段化归公式或实战 4b 标准算法进入 4c | 接续实战 4b 标准入槽（`U' M2 U'` 等）直接进入 4c | **零后置操作**，直接进入 4c（仅余 M 轴 4 棱互换） |
| **是否依赖顶角** | 不依赖 | **完全不依赖**（顶角无论处于何种 AUF，底面双槽终态公式完全相同） | **强依赖**（顶角 4 种 AUF 会分裂出不同公式，末尾必须包含明确的顶角对齐） |

> [!CAUTION]
> **取消“单步 AUF 即完成”的不实承诺，揭示假顶层扫除冲突**：
> 顶角在 CMLL 阶段已与 L/R 两桥在物理上锁定。当算法终止时若出现 LR 处于 $UL/UR$ 顶槽但顶角偏置 $90^\circ$（$u \pmod 2 = 1$），则**任何单一 AUF（$0, U, U2, U'$）在物理上均绝不可能同时满足顶角对齐与 LR 归位**：
> - 若执行 $U'$ 对齐顶角，LR 棱被同时带入 $UF/UB$ 槽（脱离左右槽）；
> - 若不转 $U$，顶角与两桥错位 $90^\circ$（无法进入 4c 阶段还原）。
> 因此，此类状态属于未完成的化归中间态（Tier 1），绝非完成态，必须接续实测验证的 4b 算法（如 `U M2 U' M2 U'`）才能闭环。同时，严格 EOLRb（Tier 3）必须严格校验具名身份 `ulSlot === 'UL' && urSlot === 'UR'`，绝不放行无序对调（$UL \leftrightarrow UR$）。

### 1.4 $M2$ 的字面物理终点与显式后置 $U / U'$
在三维空间中，$M2$ 是绕 x 轴的 $180^\circ$ 旋转：
- 坐标变换：$(x, y, z) \mapsto (x, -y, -z)$；
- 槽位映射：$DF [0,-1,1] \mapsto UB [0,1,-1]$，$DB [0,-1,-1] \mapsto UF [0,1,1]$；
- **$M2$ 严格保持 $x = 0$ 不变，绝不可能直接把位于 $x = 0$ 的 $DF/DB$ 棱送到 $x = \pm 1$ 的 $UL/UR$ 槽！**
- 若要从 $DF/DB$ 预备态闭环到 $UL/UR$ 顶层槽，必须先用一个前置 $U / U'$ 将顶层角块旋转 $90^\circ$，再做 $M2$ 将 $DF/DB$ 送上 $UF/UB$，最后再用一个反向 $U' / U$ 将这两个棱块带入 $x = \pm 1$ 的 $UL/UR$ 槽位（如 `src/data/lse.ts` 中 `lse-ulur-1` 的标准公式 `"U' M2 U'"`）。
- **因此，任何宣称“以 EOLRb 为终点”的静态公式，必须把后置的 $U / U'$ 明确写进公式字符串中，绝不能依赖校验器的隐式 AUF 抹去，否则 3D 播放器播放结束时两棱仍在 $UF/UB$。**

---

## 2. 状态空间群论枚举与可达性定理

由 `scripts/research/eolr/verify-eolr.mjs` 独立枚举并证明（断言检查 100% 通过）：

### 2.1 $\langle M, U \rangle$ 生成子群的完全规模
从 `solved()` 出发，由自由转动集合 $\{U, U', U2, M, M', M2\}$ 作用生成的全部可达状态空间大小为：
$$\mathbf{|\langle M, U \rangle| = 184,320}$$
其精确数学因式分解为：
- 4 种顶角旋转相位（$u \pmod 4 \in \{0, 1, 2, 3\}$）；
- 4 种中层中心相位（$m \pmod 4 \in \{0, 1, 2, 3\}$）；
- 6 棱置换奇偶校验与色向守恒约束：在给定的 $(u, m)$ 下，6 棱置换偶性与角块、中心置换偶性锁定，可达置换数为 $\frac{6!}{2} = 360$ 种；
- 6 棱朝向受偶色向约束，可达朝向数为 $2^{6-1} = 32$ 种；
- 乘积：$4 \times 4 \times (360 \times 32) = 16 \times 11,520 = \mathbf{184,320}$。

### 2.2 投影空间与 465 原始状态的真实含义
当将可达状态投影到二元组 $(EO, \{UL, UR\})$（其中 $EO$ 为 6 棱朝向，$\{UL, UR\}$ 为无序位置对），且限定中心处于标准平相位 $m \equiv 0 \pmod 4$ 时：
- 6 棱非还原 $EO$ 模式共有 $2^5 - 1 = 31$ 种；
- 无序 $\{UL, UR\}$ 棱位共有 $\binom{6}{2} = 15$ 种；
- **两者构成完全笛卡尔直积，全部 $31 \times 15 = \mathbf{465}$ 个非平凡组合在 $\langle M, U \rangle$ 中 100% 物理可达**（若计入 $EO$ 已全还原的平凡态，则为 $32 \times 15 = 480$ 种）。
- 在单个正平面中心相位（$m \equiv 0 \pmod 4$）下：按无序集合 $\{UL, UR\}$ 计数为 480 种，按具名有序对 $(UL, UR)$ 计数为 $32 \times 30 = \mathbf{960}$ 种。
- 若中心处于平面双相位 $m \in \{0, 2\}$，可达投影状态数按无序集合 $\{UL, UR\}$ 计数为 $2 \times 480 = \mathbf{960}$ 种；按具名有序对 $(UL, UR)$ 计数为 $2 \times 960 = \mathbf{1,920}$ 种。

### 2.3 几何商空间推导（123 / 93 / 60）
社区各教程中出现的不同情形数，是 465 个非平凡原始投影在不同对称群作用下的严格轨道数（由脚本断言验证）：

1. **模 $U\text{-AUF}$（$U^k, k \in \{0, 1, 2, 3\}$）商空间**：
   $U$ 转动将顶层 4 棱沿 $(UF \to UR \to UB \to UL)$ 轮换，底层 $DF, DB$ 保持原位。
   465 个原始状态在 $U^4$ 作用下归并为 **$\mathbf{123}$ 个等价类**。
2. **模 $U\text{-AUF} + \text{左右镜像（}L \leftrightarrow R\text{）}$ 商空间**：
   三维空间反射 $x \mapsto -x$：
   - 槽位映射：$UL \leftrightarrow UR$，$UF, UB, DF, DB$ 保持原位；
   - 块身份映射：$UL \leftrightarrow UR$；
   - 转动映射：$U \leftrightarrow U'$，$M \mapsto M$；
   - 在 123 个类的基础上消除左右手镜像后，得到 **$\mathbf{93}$ 个等价类**（与本仓库现存 `lse-eo-*` 的 11 个基础分组结构完全一致）。
3. **模 $U\text{-AUF} + \text{左右镜像} + \text{前后镜像（}F \leftrightarrow B\text{）}$ 商空间**：
   三维空间反射 $z \mapsto -z$：
   - 槽位映射：$UF \leftrightarrow UB$，$DF \leftrightarrow DB$，$UL, UR$ 保持原位；
   - 转动映射：$M \leftrightarrow M'$，$U \leftrightarrow U'$；
   - **注意：此反射保持 U/D 中心在原位，与物理 $M2$ 半转有本质区别！**
   - 进一步消除前后镜像（将 $3/1f$ 与 $3/1b$、$1/1f$ 与 $1/1b$ 合并，将 11 个 EO 组压为 9 个 EO 组）后，得到 **$\mathbf{60}$ 个全对称等价类**（即 Kian Mansour 教程所指的 60 个 EOLR 经典情形）。

---

## 3. 三大不可违背的物理反例证据

为证明“不能草率将 EOLR 套入静态求解器”，脚本构建并运行了以下 3 个确定性反例：

### 反例 A：忽略其余 4 个 M 棱的位置置换将破坏闭环
- **构造**：
  - 状态 $S_1 = solved()$；
  - 状态 $S_2 = applyMoves(solved(), parseAlg('M2 U2 M2 U2'))$。
- **实测特征**：
  - $S_1$ 与 $S_2$ 的中心均为 U/F，两者的 6 棱 EO 均为全还原（`[]`），且两者的 LR 棱均严格处于顶层左右原位（$UL$ 在 $UL$，$UR$ 在 $UR$）；
  - 但在 $S_2$ 中，M 层的 4 个棱块发生了两两对换：$(UF \leftrightarrow UB)$ 且 $(DF \leftrightarrow DB)$；
  - 若有算法仅根据 $(EO, \{UL, UR\})$ 断定 $S_2$ 已经与 $S_1$ 等价而提前终止，魔方在 4c 阶段将遗留两个对棱互换，**无法完成整方还原**。

### 反例 B：忽略 $UL \leftrightarrow UR$ 具名身份将产生对棱反相
- **构造**：在保持左右两桥完好的前提下，执行算法 `U M2 U2 M2 U`。
- **实测特征**：
  - 6 中心保持原位（U 在 U，F 在 F）；
  - 4 个顶角保持原位（$1 + 2 + 1 = 4 \equiv 0 \pmod 4$）；
  - 6 棱 EO 依然全对；
  - 但 $UL$ 棱落在了 $UR$ 槽，而 $UR$ 棱落在了 $UL$ 槽；
  - **推论**：若一个 EOLR 算法将底面双槽中的 $\{DF, DB\}$ 视为无序集合，一旦实际状态中 $UL$ 与 $UR$ 的顺序颠倒，执行相同的标准归位后两棱将直接在顶层反向入槽，产生不可通过单步 AUF 修复的对棱置换。

### 反例 C：忽略顶角对齐（AUF 偏置）将彻底破坏算法闭环
- **构造**：以 Good Arrow 情形 `3/1-1`（起手由 `M' U M2 U M'` 生成）为例，给起手人为附加一个前置 `U`。
- **实测特征**：
  - 原起手的 4 坏棱为 `[DF, UF, UL, UR]`（箭头指向 F，底棱在 DF）；
  - 偏置 `U` 后，坏棱变为 `[DF, UB, UF, UL]`，箭头方向转了 $90^\circ$；
  - 此时若强行执行原静态公式 `M' U' M'`，终态坏棱不仅没有解决，反而残留为 `[DB, DF]`，且顶角与左右桥永久偏置 $90^\circ$。

### 反例 D：单步 AUF 无法闭环角棱偏角 90° 的假顶层状态（实测样例 5）
- **构造**：以 4/0 Cross 1 为例，起手执行 `M' U M2 U M' U2 M U2 M`，算法执行 `M' U2 M' U2 M' U' M'`。
- **实测特征**：
  - 终态坏棱全部翻正（`[]`），中心处于 `D/B` 平面相（$m=2$）；
  - $UL$ 位于 $UL$ 槽，$UR$ 位于 $UR$ 槽；
  - 但顶角累积净旋转量为 $U^9 \equiv U^1 \pmod 4$，即顶角相对两桥存在 $U'$ 偏置（`cornersAligned=false`）；
  - **4 种单一 AUF 验证结果**：
    - 不转：顶角偏置 $90^\circ$（未对齐），无法进入 4c；
    - `U`：$UL \to UB$，$UR \to UF$，顶角偏置 $180^\circ$；
    - `U2`：$UL \to UR$，$UR \to UL$（左右对调），顶角偏置 $270^\circ$；
    - `U'`：顶角对齐两桥（`cornersAligned=true`），但 $UL \to UF$，$UR \to UB$（LR 脱离左右槽！）；
  - **推论**：任何宣称“只需一步 AUF 即可进入 4c”的顶层假终态在物理上是不成立的。该状态必须接续 5 步 4b 算法（如 `U M2 U' M2 U'`）才能真正达成严格 EOLRb。

---

## 4. Bas's EOLR Cheat Sheet 51 图解完全核查清单

通过对 `https://basilio.dev/cubing/images/ALGS-EOLR.pdf`（Bas, 04.08.2023）矢量数据流的深度提取与物理验证，整张速查表的完整结构如下：

### 4.1 矢量图表全景与 18 项原图解差异的根本原因
Bas 速查表物理上包含 **51 个主图解**，分布于 9 个 EO 行：
- `3/1`：8 个图解（4 个正常化归 + 4 个 BAD CASES）；
- `2a/2`：7 个主图解（5 个正常化归 + 2 个 BAD CASES）；
- `4/0`：4 个主图解（2 个正常化归 + 2 个 BAD CASES）；
- `2o/2`：6 个主图解（4 个正常化归 + 2 个 BAD CASES）；
- `2o/0`：6 个主图解（4 个正常化归 + 2 个 BAD CASES）；
- `0/2`：4 个主图解（3 个正常化归 + 1 个 BAD CASE）；
- `2a/0`：7 个主图解（5 个正常化归 + 2 个 BAD CASES）；
- `1/1`：6 个主图解（4 个正常化归 + 2 个 BAD CASES）；
- `4/2`：3 个主图解（全部处于虚线框内，属于全坏棱特殊情形）。
- **总计**：31 个正常主情形 + 20 个虚线框 BAD CASES = **51 个主图解**。

**Codex 独立复核指出的“18 条图解不一致”的技术根因与彻底解决**：
1. **线宽判定修正（消除 14 处假阳性坏棱）**：
   - 提取脚本早期按 `!/\[ 0.5 0.5 \]/.test(...)`（非虚线即粗线）判断坏棱。但在 Bas PDF 中，部分好棱画法为**实线细线（0.5 w）**，而坏棱全部为**粗黑线（2.0 w，`strokeW > 1.2`）**。
   - 改为严格按 `strokeW > 1.2` 阈值提取后，`2o/2` 全行 6 个图解及 `2a/2-6`、`2a/2-7` 的坏棱计数全部恢复正常，14 处假阳性彻底消除！
2. **左右手镜像约定（5 条图解）**：
   - Bas 在表底特别注明：*"Note: These cases can all be mirrored in different ways (the symmetry axes change depending on case, I'll trust you to be bright enough to work these out!)"*。
   - 对于 `2o/0-1`、`2o/0-4`、`0/2-3`、`1/1-1`、`4/2-1`，Bas 所印灰字起手为画出图解的左右镜像（$UL \leftrightarrow UR$ 映射），脚本加入反射变换后 100% 精确吻合。
3. **缺失灰字起手补齐（4 条图解）**：
   - Bas 表中 `3/1` 行的第 3、6、7 列及第 5 列未印灰字起手公式或公式有笔误。脚本通过 BFS 反查求得全局唯一确定性起手公式（`U M U' M`、`U M U2 M U M' U M`、`U M U' M U2 M' U2`、`U M U2 M U2 M U M`），100% 吻合图解。
4. **DF/DB 观察翅绘图伪影（2 条图解）**：
   - `2a/0-3`：PDF 翅片误填粉色，物理状态 F 面贴纸为红色实色；
   - `4/2-3`：PDF 翅片误填红色，物理状态 D 面贴纸为暗色。
   - `4/2` 全行：PDF 矢量流中 DF/DB 底层翅片线宽使用模板默认值 0.5w，但行标题为“4/2”（4 顶 2 底 = 6 坏棱），魔方引擎按 6 坏棱建构。
5. **小型插图（Inset Diagrams）范围声明**：
   - 表中另有 14 个微型插图（如 "Switch to good arrow"、"Turn into 4/0" 等减步提示图）与 3 个图例图解，属于教学辅助标注，**不作为独立主公式收录**。

### 4.2 完整 51 图解逐条核验总表

| 序号 | 情形 ID | EO 分类 | 列号 | PDF 坐标 (cx, cy) | 坏棱列表 | LR 位置与显隐 | 匹配状态 | 验证起手公式 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `3/1-1` | 3/1 | 1 | (231.0, 1586.6) | DF,UF,UL,UR | DF:pink, UF:red | DIRECT | `M' U M2 U M'` | Good Arrow 1 |
| 2 | `3/1-2` | 3/1 | 2 | (320.1, 1586.6) | DF,UF,UL,UR | UB:pink, UR:red | DIRECT | `U M' U M` | Good Arrow 2 |
| 3 | `3/1-3` | 3/1 | 3 | (409.2, 1586.6) | DF,UF,UL,UR | DB:red, UR:red | BFS_SETUP | `U M U' M` | Good Arrow 3（原表无灰字） |
| 4 | `3/1-4` | 3/1 | 4 | (498.9, 1586.6) | DF,UF,UL,UR | UF:red, UR:red | DIRECT | `M' U M U M2 U M U2 M U'` | OK Arrow |
| 5 | `3/1-5` | 3/1 | 5 | (627.3, 1586.6) | DF,UF,UL,UR | UL:red, UR:red | BFS_SETUP | `U M U2 M U2 M U M` | BAD CASE（原表灰字不符） |
| 6 | `3/1-6` | 3/1 | 6 | (716.6, 1586.6) | DF,UF,UL,UR | DB:red, UF:red | BFS_SETUP | `U M U2 M U M' U M` | BAD CASE（原表无灰字） |
| 7 | `3/1-7` | 3/1 | 7 | (803.2, 1586.6) | DF,UF,UL,UR | DF:pink, UR:red | BFS_SETUP | `U M U' M U2 M' U2` | BAD CASE（原表无灰字） |
| 8 | `3/1-8` | 3/1 | 8 | (890.6, 1586.6) | DF,UF,UL,UR | DB:red, DF:pink | DIRECT | `M' U M U M U M' U` | BAD CASE |
| 9 | `2a/2-1` | 2a/2 | 1 | (220.9, 1435.5) | DB,DF,UB,UL | UB:red, UL:red | DIRECT | `M' U M U M2` | V + D-Line |
| 10 | `2a/2-2` | 2a/2 | 2 | (313.6, 1435.5) | DB,DF,UB,UL | DF:pink, UF:pink | DIRECT | `U M U' M' U' M2 U` | |
| 11 | `2a/2-3` | 2a/2 | 3 | (461.4, 1435.5) | DB,DF,UB,UL | DB:pink, DF:pink | DIRECT | `U M' U' M U' M U' M` | |
| 12 | `2a/2-4` | 2a/2 | 4 | (535.8, 1435.5) | DB,DF,UB,UL | UL:red, UR:pink | DIRECT | `M' U M' U M' U M' U` | |
| 13 | `2a/2-5` | 2a/2 | 5 | (625.1, 1435.5) | DB,DF,UB,UL | DF:pink, UL:red | DIRECT | `M' U M' U' M U2 M U2` | |
| 14 | `2a/2-6` | 2a/2 | 6 | (735.0, 1435.5) | DB,DF,UB,UL | UB:red, UR:pink | DIRECT | `U M U' M U' M2 U M U2 M` | BAD CASE |
| 15 | `2a/2-7` | 2a/2 | 7 | (855.7, 1435.5) | DB,DF,UB,UL | UF:pink, UR:pink | DIRECT | `M' U M' U M' U2 M U2 M U M' U` | BAD CASE |
| 16 | `4/0-1` | 4/0 | 1 | (210.3, 1238.4) | UB,UF,UL,UR | UB:red, UF:red | DIRECT | `M' U M2 U M' U2 M U2 M` | 4/0 Cross 1 |
| 17 | `4/0-2` | 4/0 | 2 | (302.5, 1238.4) | UB,UF,UL,UR | DF:red, UR:red | DIRECT | `U M U' M U2 M U2 M` | |
| 18 | `4/0-3` | 4/0 | 3 | (731.8, 1238.4) | UB,UF,UL,UR | UF:red, UR:red | DIRECT | `M' U M U' M' U2 M U M' U2 M U` | BAD CASE |
| 19 | `4/0-4` | 4/0 | 4 | (836.7, 1238.4) | UB,UF,UL,UR | DB:red, DF:red | DIRECT | `U M' U2 M U2 M U M U2 M U2 M` | BAD CASE |
| 20 | `2o/2-1` | 2o/2 | 1 | (205.8, 1042.4) | DB,DF,UL,UR | DB:pink, DF:pink | DIRECT | `M' U M2 U M U2 M U2 M` | |
| 21 | `2o/2-2` | 2o/2 | 2 | (298.7, 1042.4) | DB,DF,UL,UR | UB:pink, UL:red | DIRECT | `U M' U' M' U2 M U2 M` | |
| 22 | `2o/2-3` | 2o/2 | 3 | (379.4, 1042.4) | DB,DF,UL,UR | UL:red, UR:red | DIRECT | `M' U M U2 M U2 M U M2` | |
| 23 | `2o/2-4` | 2o/2 | 4 | (496.5, 1042.4) | DB,DF,UL,UR | DF:pink, UF:pink | DIRECT | `M' U M' U' M' U' M U M U2 M U2` | |
| 24 | `2o/2-5` | 2o/2 | 5 | (712.5, 1042.4) | DB,DF,UL,UR | UB:pink, UF:pink | DIRECT | `U M U M' U M U M U M' U M` | BAD CASE |
| 25 | `2o/2-6` | 2o/2 | 6 | (855.8, 1042.4) | DB,DF,UL,UR | DF:pink, UL:red | DIRECT | `U M' U' M' U M U M U' M' U' M` | BAD CASE |
| 26 | `2o/0-1` | 2o/0 | 1 | (211.3, 860.5) | UB,UF | DF:red, UR:pink | LR_MIRROR | `U M' U M' U' M U M'` | 原表灰字为镜像 |
| 27 | `2o/0-2` | 2o/0 | 2 | (303.5, 860.5) | UB,UF | UB:red, UF:red | DIRECT | `U M' U M U' M' U M` | |
| 28 | `2o/0-3` | 2o/0 | 3 | (391.3, 860.5) | UB,UF | DF:red, UF:red | DIRECT | `U M' U' M' U' M U M'` | |
| 29 | `2o/0-4` | 2o/0 | 4 | (485.9, 860.5) | UB,UF | UF:red, UR:pink | LR_MIRROR | `U M' U M U M' U' M` | 原表灰字为镜像 |
| 30 | `2o/0-5` | 2o/0 | 5 | (716.8, 860.5) | UB,UF | DB:red, DF:red | DIRECT | `U' M U' M' U' M' U2 M U' M U' M` | BAD CASE |
| 31 | `2o/0-6` | 2o/0 | 6 | (836.3, 860.5) | UB,UF | UL:pink, UR:pink | DIRECT | `M' U M' U M' U2 M U M U M` | BAD CASE |
| 32 | `0/2-1` | 0/2 | 1 | (210.0, 674.7) | DB,DF | UF:pink, UL:pink | DIRECT | `M' U M' U' M U M U` | |
| 33 | `0/2-2` | 0/2 | 2 | (302.4, 674.7) | DB,DF | DB:pink, DF:pink | DIRECT | `U M U M' U' M U M` | |
| 34 | `0/2-3` | 0/2 | 3 | (391.2, 674.7) | DB,DF | DF:pink, UR:pink | LR_MIRROR | `U M U' M' U' M U M` | 原表灰字为镜像 |
| 35 | `0/2-4` | 0/2 | 4 | (834.8, 674.7) | DB,DF | UB:pink, UF:pink | DIRECT | `M' U M' U' M U2 M U M' U M U` | BAD CASE |
| 36 | `2a/0-1` | 2a/0 | 1 | (213.9, 511.2) | UB,UL | UF:pink, UL:red | DIRECT | `M' U M' U2 M U' M2 U M U` | |
| 37 | `2a/0-2` | 2a/0 | 2 | (327.9, 511.2) | UB,UL | DF:red, UF:pink | DIRECT | `M' U M U' M' U' M' U' M2` | |
| 38 | `2a/0-3` | 2a/0 | 3 | (444.8, 511.2) | UB,UL | DF:pink, UL:red | PDF_FLAP_ARTIFACT | `U M2 U M' U' M U2 M U' M` | 原表 DF 翅填色伪影 |
| 39 | `2a/0-4` | 2a/0 | 4 | (535.1, 511.2) | UB,UL | DB:red, DF:red | DIRECT | `U M' U M' U2 M U M' U` | |
| 40 | `2a/0-5` | 2a/0 | 5 | (625.5, 511.2) | UB,UL | UB:red, UL:red | DIRECT | `M' U M' U M U M' U' M U M U` | |
| 41 | `2a/0-6` | 2a/0 | 6 | (734.0, 511.2) | UB,UL | UF:pink, UR:pink | DIRECT | `M' U M U M' U M U M U2 M` | BAD CASE |
| 42 | `2a/0-7` | 2a/0 | 7 | (855.9, 511.2) | UB,UL | UL:red, UR:pink | DIRECT | `M' U M U' M' U' M U' M' U' M U` | BAD CASE |
| 43 | `1/1-1` | 1/1 | 1 | (225.3, 327.7) | DB,UF | UB:pink, UR:pink | LR_MIRROR | `U M' U' M' U M U M` | 原表灰字为镜像 |
| 44 | `1/1-2` | 1/1 | 2 | (350.9, 327.7) | DB,UF | DB:pink, UL:pink | DIRECT | `U M U M' U M U M'` | |
| 45 | `1/1-3` | 1/1 | 3 | (483.4, 327.7) | DB,UF | DF:red, UF:red | DIRECT | `U M' U M' U M U M'` | |
| 46 | `1/1-4` | 1/1 | 4 | (615.9, 327.7) | DB,UF | UL:pink, UR:pink | DIRECT | `U M' U' M' U2 M U' M U` | |
| 47 | `1/1-5` | 1/1 | 5 | (737.4, 327.7) | DB,UF | UB:pink, UF:red | DIRECT | `M' U M' U' M U' M' U2 M U M' U2` | BAD CASE |
| 48 | `1/1-6` | 1/1 | 6 | (878.1, 327.7) | DB,UF | DF:red, UB:pink | DIRECT | `M U' M U' M U2 M U' M' U' M U` | BAD CASE |
| 49 | `4/2-1` | 4/2 | 1 | (226.5, 142.0) | DB,DF,UB,UF,UL,UR | UF:red, UR:red | LR_MIRROR | `M' U M U' M' U' M U2 M U M` | 虚线框特例；灰字镜像 |
| 50 | `4/2-2` | 4/2 | 2 | (355.2, 142.0) | DB,DF,UB,UF,UL,UR | UB:red, UF:red | DIRECT | `U M' U' M' U2 M' U' M U' M' U' M` | 虚线框特例 |
| 51 | `4/2-3` | 4/2 | 3 | (491.0, 142.0) | DB,DF,UB,UF,UL,UR | DB:red, DF:red | PDF_FLAP_ARTIFACT | `U M' U' M' U2 M' U' M U' M' U' M'` | 虚线框特例；翅片填色伪影 |

---

## 5. 多层级闭环验证实例（实测 100% 通过）

由 `verify-eolr.mjs` 实测跑通的 7 个具有完全代表性的多层级闭环示例如下（均满足左右桥 26 贴纸完全保护）：

### 样例 1：Good Arrow 1（严格 EOLRb 顶层归位终态）
- **标识**：`eolr-3-1-good-arrow-1-tier3`（`3/1-1` 干净终态）
- **起手生成**：`M U M`（纯净 BFS 起手，CMLL 顶角预对齐）
- **起手特征**：坏棱 `[DF, UF, UL, UR]`，LR 棱位于 `{DF, UF}`，中心处于 `D/B` 平面相；
- **执行算法**：`M' U' M'`
- **物理终点**：
  - 坏棱全部翻正（`[]`）；
  - 中心处于 `U/F` 正平面相（$m=0$）；
  - `UL` 严格归位入 `UL` 槽，`UR` 严格归位入 `UR` 槽；
  - **4 个 CMLL 顶角与左右桥严格对齐（$U\text{-AUF}=0$）**。
- **达成层级**：**Tier 3: 严格 EOLRb（顶层严格归位且顶角对齐）**。

### 样例 2：Good Arrow 1（前缀化归到 4/0 态）
- **标识**：`eolr-3-1-good-arrow-1-tier1`（Bas 表加粗单步算法）
- **起手生成**：`M' U M2 U M'`
- **执行算法**：`M`
- **物理终点**：
  - 坏棱转变为 `[UB, UF, UL, UR]`（顶层 4 坏，即 4/0 态）；
  - LR 棱移入 `{DF, DB}` 底面双槽；
  - 中心处于 $m=1$ 倾斜相（$U=B, F=U$）。
- **达成层级**：**Tier 1: 化归中间态（不宣称 EO 解决）**。

### 样例 3：Good Arrow 2（直通标准 EOLR，底层双槽）
- **标识**：`eolr-3-1-good-arrow-2-tier2`（`3/1-2`）
- **起手生成**：`U M' U M`
- **起手特征**：坏棱 `[DF, UF, UL, UR]`，LR 棱位于 `{UB, UR}`，中心处于 `U/F` 正平面相；
- **执行算法**：`M' U' M'`
- **物理终点**：
  - 坏棱全部翻正（`[]`）；
  - 中心处于 `D/B` 反平面相（$m=2$）；
  - `UL` 处于 `DF` 槽、`UR` 处于 `DB` 槽（无序底面双槽）。
- **达成层级**：**Tier 2: 标准 EOLR（DF/DB 底层双槽终态）**。

### 样例 4：Good Arrow 3（直通标准 EOLR，底层双槽）
- **标识**：`eolr-3-1-good-arrow-3-tier2`（`3/1-3`）
- **起手生成**：`U M U' M`
- **起手特征**：坏棱 `[DF, UF, UL, UR]`，LR 棱位于 `{DB, UR}`，中心处于 `D/B` 反平面相；
- **执行算法**：`M' U M`
- **物理终点**：
  - 坏棱全部翻正（`[]`）；
  - 中心处于 `D/B` 反平面相（$m=2$）；
  - `UL` 处于 `DF` 槽、`UR` 处于 `DB` 槽。
- **达成层级**：**Tier 2: 标准 EOLR（DF/DB 底层双槽终态）**。

### 样例 5：4/0 Cross 1（假顶层化归中间态 + 实测验证接续公式）
- **标识**：`eolr-4-0-cross-1-tier1`（`4/0-1`）
- **起手生成**：`M' U M2 U M' U2 M U2 M`
- **前缀算法**：前缀化归 `M' U2 M' U2` + 箭头收尾 `M' U' M'`（总计 `M' U2 M' U2 M' U' M'`）；
- **物理终点特征**：
  - 坏棱全部翻正（`[]`）；
  - 中心处于 `D/B` 反平面相（$m=2$）；
  - `UL` 处于 `UL` 槽、`UR` 处于 `UR` 槽；
  - **但 4 个 CMLL 顶角相对两桥偏置 $90^\circ$（`cornersAligned=false`）**；
  - **取消单步 AUF 承诺**：实测 4 种 AUF（不转 / U / U2 / U'）全灭，无任何一种能同时对齐顶角与 LR 两棱（转 U' 对齐顶角后两棱移入 UF/UB）；
- **达成层级**：**Tier 1: 假顶层化归中间态（如实记录中间态，不虚假宣称闭环）**；
- **接续算法（实测验证闭环）**：接续 `U M2 U' M2 U'`（总算法为 `M' U2 M' U2 M' U' M' U M2 U' M2 U'`）；
- **接续后物理终点**：坏棱 `[]`，中心处于 `D/B` 反平面相，`UL` 处于 `UL` 槽，`UR` 处于 `UR` 槽，且顶角与两桥完全对齐（`cornersAligned=true`），零后置步达成 **Tier 3: 严格 EOLRb**！

### 样例 6：2a/2 V + D-Line 1（两步化归全闭环至顶层 LR，顶角严格对齐）
- **标识**：`eolr-2a-2-v-dline-1-tier3`（`2a/2-1`）
- **起手生成**：`M' U M U M2`
- **完整算法**：前缀化归 `M2 U'` + 箭头收尾 `M' U' M'`（总计 `M2 U' M' U' M'`）；
- **物理终点**：
  - 坏棱全部翻正（`[]`）；
  - 中心处于 `D/B` 反平面相（$m=2$）；
  - `UL` 处于 `UL` 槽、`UR` 处于 `UR` 槽，且顶角保持严格对齐（`cornersAligned=true`）。
- **达成层级**：**Tier 3: 严格 EOLRb（顶层严格归位且顶角对齐）**。

### 样例 7：1/1 Front/Back 1（单步化归到 Arrow 态）
- **标识**：`eolr-1-1-opposite-1-tier1`（`1/1-1`）
- **起手生成**：`U M' U' M' U M U M`
- **起手特征**：坏棱 `[DB, UF]`，LR 棱位于 `{UB, UL}`，中心为正平面相 `U/F`；
- **执行算法**：`M U' M' U`
- **物理终点**：
  - 坏棱转换为 `[DB, UF, UL, UR]`（Arrow 态，4 坏棱）；
  - LR 棱移入 `{UF, UR}`；
  - 中心保持平面态 `U/F`（$m=0$）。
- **达成层级**：**Tier 1: 化归中间态（如实记录中间态，不虚假宣称闭环）**。

---

## 6. 生产级架构设计：最小引擎、图解与练习抽象

为确保未来接入时不破坏任何既有规则，梳理出基于项目真实 API 的最小接入方案：

### 6.1 真实项目接口映射与扩展
现有 `src/lib/cases.ts` 中的核心接口为：
- `caseFingerprint(c: CaseRef): string`
- `lintCase(c: CaseRef): string[]`
- `lintCaseAlg(c: Pick<AlgCase, 'set'>, alg: string): string[]`
- `algSolvesCase(c: CaseRef, alg: string): boolean`

**针对 EOLR 的最小化规则扩展设计**：
在 `SET_RULES` 中增设 `eolr` 或在 `lse` 中增设 `EOLR` 步骤：
```ts
export function algSolvesEolr(start: State, alg: string, mode: 'dfdb' | 'ulur'): boolean {
  const moves = parseAlg(alg);
  const end = applyMoves(start, moves);

  // 1. 左右两桥 26 贴纸必须严格保护
  if (!rouxBlocksIntact(end)) return false;

  // 2. 6 棱 EO 必须全部翻正且中心处于平面态 (m in {0, 2})
  if (!edgesOriented(end) || !centerIsFlat(end)) return false;

  // 3. 终点判定
  const lr = getLRSlots(end);
  if (mode === 'dfdb') {
    // 标准 EOLR: {UL, UR} 无序落在 {DF, DB}
    return (lr.UL === 'DF' && lr.UR === 'DB') || (lr.UL === 'DB' && lr.UR === 'DF');
  } else {
    // 严格 EOLRb: UL 在 UL 且 UR 在 UR 且顶角对齐
    return lr.UL === 'UL' && lr.UR === 'UR' && uCornersAligned(end);
  }
}
```

### 6.2 2D 图解高亮抽象（Piece-Identity Mask）
在 `src/components/CaseDiagram.tsx` 中：
- 现有逻辑按单张贴纸的物理位置涂色；
- EOLR 图解需要对贴纸进行**块身份识别**：
  - 若贴纸属于 `UL` 或 `UR` 棱块：
    - 位于顶层 U 表面或底层 F/B 观察视窗的，染成高亮识别色（深红/紫）；
    - 位于侧面不可见向的，染成次级识别色（浅红/粉红）；
  - 其余 4 个 M 棱的非 U/D 侧面贴纸全部置灰；
  - 坏棱贴纸外框加粗（对应 Bas 图表上的粗边框）。

### 6.3 练习模式（Practice）的出题与打乱
在 `src/lib/practiceTarget.ts` 与 `practiceSample.ts` 中：
- 不能简单通过单条公式取逆出题；
- 应从代表元起手出发，允许随机施加：
  1. 其余 4 个 M 棱的随机合法置换；
  2. 顶角 $U^k$ 的随机 AUF（若采用标准 EOLR 底面双槽模式）；
- 出题判定仅检查操作后是否达到 `(EO 完成 ∧ LR 位于 DF/DB ∧ 中心处于平面态)`。

---

## 7. 最终实现规格定稿（Lead 架构裁定）

根据群论枚举、物理反例实测及三轮独立复核结论，Lead 制定 EOLR 的最终生产级实现规格如下，供下一轮 Executor（Codex）直接执行编码与接入：

### 7.1 收录范围：Basilio 51 主图解（31 正常 + 20 BAD CASES）
- **选定方案**：严格对齐国际主流公认的 Basilio EOLR Cheat Sheet 全表 **51 个主图解**；
- **分组结构（9 个 EO 分组）**：
  1. `3/1`（箭头组 Arrow）：8 个情形（4 个正常化归 + 4 个 BAD CASES）；
  2. `2a/2`（相邻 2 顶 2 底 V + D-Line）：7 个情形（5 个正常 + 2 个 BAD CASES）；
  3. `4/0`（全顶坏棱 4/0 Cross）：4 个情形（2 个正常 + 2 个 BAD CASES）；
  4. `2o/2`（对顶 2 底）：6 个情形（4 个正常 + 2 个 BAD CASES）；
  5. `2o/0`（对顶 0 底）：6 个情形（4 个正常 + 2 个 BAD CASES）；
  6. `0/2`（0 顶 2 底）：4 个情形（3 个正常 + 1 个 BAD CASE）；
  7. `2a/0`（相邻顶 0 底）：7 个情形（5 个正常 + 2 个 BAD CASES）；
  8. `1/1`（1 顶 1 底）：6 个情形（4 个正常 + 2 个 BAD CASES）；
  9. `4/2`（全坏棱特例）：3 个特例情形（全部为 BAD CASES 虚线框标注）。
- **情形属性定义**：
  - 31 个正常化归情形（Normal Cases）：具有高效的化归或直通双槽解法；
  - 20 个劣势情形（BAD CASES）：速查表中带虚线框，提示实战应走常规 LSE 4a 避坑；在数据中标记 `isBadCase: true`，在 UI 卡片上显示虚线框与 "BAD CASE" 标记。
- **命名规范**：
  - 稳定 ID 格式：`eolr-<group>-<col>`，如 `eolr-3-1-1`、`eolr-2a-2-1`、`eolr-4-0-1`，确保与 Bas 速查表行列坐标 1:1 稳定映射。

### 7.2 公式终点：两段式标准架构与独立起手接入契约

#### 1. 现有起手机制冲突与解决方案
- **冲突根因**：
  - 现有全站情形（F2L/OLL/PLL/COLL/WV/CMLL/SBLS/LSE 4c）均假设 `algs[0]` 是从起手状态**直通整方还原**的完整公式；
  - `src/lib/cases.ts` 中的 `caseState(c)` 以及 `src/lib/timeline.ts` 中的 `Timeline` 均硬编码计算 `applyMoves(solved(), invertMoves(parseAlg(c.algs[0])))`；
  - 在 EOLR 中，公认核心公式 `algs[0]`（如 `M' U' M'`）是解决 EO 并将 LR 导向 `{DF, DB}`（或化归到中间态）的短公式，**执行后绝不应该整方还原**；
  - 若对 EOLR 短公式强行取逆，播放器与图解将从一个错误的起手出发，播放结束后直接恢复整方，完全掩盖了真实的 `{DF, DB}` 底面双槽终态或化归中间态。
- **独立起手 `setup` 扩展契约**：
  - 在 `src/types.ts` 的 `AlgCase` 中新增可选字段 `setup?: string`（全量 51 条 EOLR 均填入经验证的独立起手公式，现有 359 条情形缺省保持 `undefined`）；
  - **图解层改造（`src/lib/cases.ts`）**：
    ```ts
    export function caseState(c: Pick<AlgCase, 'set' | 'algs'> & { setup?: string }): State {
      if (c.setup) {
        return finish(applyMoves(solved(), parseAlg(c.setup)), c.set);
      }
      return finish(applyMoves(solved(), invertMoves(parseAlg(c.algs[0]))), c.set);
    }
    ```
    当 `setup` 存在时，直接由 `solved() + setup` 产生起手状态，图解（卡片、首页封面、详情）严格展示原始图解形态；当 `setup` 缺失时，100% 兼容回退至原有 `invertMoves(algs[0])` 逻辑。
  - **3D 播放器层改造（`src/lib/timeline.ts` 与 `CubePlayer.tsx`）**：
    `Timeline` 构造函数支持可选入参 `setup?: string`：
    ```ts
    constructor(alg: string, setup?: string) {
      this.moves = parseAlg(alg);
      const initial = setup
        ? applyMoves(solved(), parseAlg(setup))
        : applyMoves(solved(), invertMoves(this.moves));
      this.states = [initial];
      this.starts = [0];
      this.moves.forEach((m, i) => {
        this.states.push(applyMove(this.states[i], m));
        this.starts.push(this.starts[i] + durationOf(m));
      });
    }
    ```
    `CubePlayer` 接收可选属性 `setup?: string` 并传递给 `Timeline`。
  - **切换“接续”时保持同一起手**：
    - 详情页内部维护状态 `showContinuation: boolean`（默认 `false`）；
    - 当未勾选接续时：播放公式为 `c.algs[0]`，起手为 `c.setup`。播放器从 `setup` 起步，执行短公式后停在真实的 `{DF, DB}` 底面双槽终态或中间态；
    - 当勾选接续时：播放公式平滑替换为 `c.algs[0] + " " + c.continuationAlg`，**起手参数 `setup` 严格保持不变（仍然是 `c.setup`）**；
    - 这样播放器的第 0 帧状态完全恒等不变，仅时间线进度条向后延伸，前段播放 EOLR 短公式化归入底槽，后段接续播放实战 4b 入顶槽，最终停在严格对齐的 Tier 3 终态。
  - **练习模式（`prepareSetup.ts` 与 `practiceTarget.ts`）**：
    - 出题生成题目基础打乱时，若 `c.setup` 存在直接基于 `c.setup` 生成初始魔方，再叠合 Roux 桥式 24 配色池；
    - 终点判断按 `c.targetTier` 校验（Tier 2 检查 0 坏棱、平面中心、LR 位于 `{DF, DB}`；Tier 3 检查 0 坏棱、平面中心、`UL/UR` 具名到位且顶角对齐）。

#### 2. 两段式数据字段定义（`src/data/eolr.ts`）
每个 EOLR 情形完整包含以下数据字段：
1. **主公式 `algs[0]`（速查表核心 EOLR 公式，3~7 步）**：
   - 步数简短、手感自然，忠实还原魔友日常练习与记忆的标准手法；
2. **目标层级 `targetTier`（涵盖 3 种物理终点）**：
   - `'tier1'`（化归中间态 / Reduction State）：用于 BAD CASES 或多步化归情形（如 4/0-1、1/1-1 等），主公式执行前缀化归（如减步到 Good Arrow 或 4/0 态），必须提供 `continuationAlg` 接续至 Tier 3；
   - `'tier2'`（标准 EOLR / Standard EOLR）：主公式解决 EO 并将两枚 LR 棱导向底层双槽 `{DF, DB}`（无序对），必须提供标准 4b 入槽 `continuationAlg`（如 `U' M2 U'` 或 `U M2 U`）；
   - `'tier3'`（严格 EOLRb / Strict Top-Solved EOLRb）：主公式一步到位翻正 EO、中心平面且 `UL/UR` 具名归位、顶角完全对齐（如 2a/2-1、3/1-1），`continuationAlg` 可为空或省略；
3. **接续公式 `continuationAlg`（实战 4b 入槽 / 闭环算法，2~5 步）**：
   - **闭环硬约束**：`c.algs[0] + " " + c.continuationAlg` 从 `c.setup` 起步执行后，必须 **100% 达成 Tier 3 严格 EOLRb**（0 坏棱、平面中心、`UL` 在 `UL`、`UR` 在 `UR`、顶角与左右桥严格对齐）。
4. **独立起手 `setup`**：
   - 填入对应情形经严格验证的独立起手公式字符串（与 `basilio-eolr-verified.json` 保持 1:1 绝对一致）。
5. **避坑标注 `isBadCase`**：
   - 20 个虚线框劣势情形标记为 `true`。

### 7.3 入口位置：独立顶层公式集 + 保留旧入口顺序追加
- **顶层公式集注册**：
  - 在 `src/types.ts` 中注册 `SetId = 'eolr'`，成为全站独立公式集；
  - 拥有专属路由 `/set/eolr`、专属练习模式 `/practice?set=eolr`、专属分类筛选面板（9 个分组）；
  - 练习模式复用桥式 24 配色池与两桥不变量约束；
- **首页 Roux 卡堆严格保留原有顺序并在末尾追加 EOLR**：
  - 现有桥式顺序为 `CMLL → LSE → SBLS`，严禁改动旧入口顺序；
  - 在 Roux 卡堆末尾自然追加 `EOLR`：
    $$\text{CFOP 卡堆（原有顺序追加 WV）}：\mathbf{F2L (41) \to OLL (57) \to PLL (21) \to COLL (40) \to WV (27)}$$
    $$\text{Roux 卡堆（原有顺序追加 EOLR）}：\mathbf{CMLL (42) \to LSE (93) \to SBLS (65) \to EOLR (51)}$$
- **LSE 页面双向互联**：
  - 在 `/set/lse` 的头部概览和 EO 分组底部，增设轻量快捷入口（Pill Chip）：“进阶技巧：EOLR (4a+4b 合并) 51 式 →”；
  - 保证常规 LSE 学习者与进阶速度玩家的双向互通。

### 7.4 全部 51 情形的完整算法验证规范
- **规则引擎扩展（`src/lib/cases.ts`）**：
  - 新增 `isEolrMask`（只关注 6 棱 + 4 中心 + 左右两桥 26 贴纸保护）；
  - 新增 `EOLR_RULE`：定义 `display` 掩码、`preserve` 两桥贴纸，以及 `algSolvesCase` 的双层级检查逻辑；
- **数据完整性与名称测试（`src/data/eolr.names.test.ts`）**：
  - **断言 1（起手唯一性）**：51 个情形的起手公式与 `basilio-eolr-verified.json` 100% 一致；
  - **断言 2（两桥保护不变量）**：全部 51 个情形的起手、主公式、接续公式执行过程中，左右桥 26 贴纸恒等不变；
  - **断言 3（主公式达成目标）**：全部 51 个情形的 `algs[0]` 均严格达成其声明的 `targetTier`；
  - **断言 4（接续公式全闭环）**：全部提供 `continuationAlg` 的情形，组合后 100% 达成 Tier 3 严格 EOLRb（0 坏棱、平面中心、`UL` 处于 `UL`、`UR` 处于 `UR`、顶角与左右桥严格对齐）；
- **门禁要求**：
  - `npm run check:data`：涵盖 `eolr.names.test.ts` 全量通过；
  - `npm test`：通过全部单元测试，断言数等强提升；
  - `npm run build`：类型检查与打包通过；
  - 视觉冒烟：Playwright 验证 EOLR 在 320×640 / 390×844 无头视口下无横向滚动、卡片与图解无遮挡。

---

## 8. 历史复核与勘误记录

### 8.1 Executor 初审意见（2026-11-12）
1. `M2` 物理终点仅在 $x=0$ 移动，不能把 $DF/DB$ 送入 $UL/UR$ 槽；
2. `isRouxBlock` 保护 26 张贴纸，原稿写 24 张系错误；
3. 调研原稿样例 2/3/4 的六中心求逆后不是原位，因 $M$ 奇偶和不为 0 导致中心偏移；
4. 真实接口为 `caseFingerprint`、`lintCase`、`algSolvesCase`，原稿使用了伪代码名；
5. 465/123/93/60 的轨道数缺乏可复现脚本。

### 8.2 Lead 规格与脚本第一版修复（2026-11-12，提交 49185a2）
1. 全部 5 项问题在正文更正；
2. 交付了独立可运行脚本 `scripts/research/eolr/verify-eolr.mjs`，复现 184,320 状态枚举与商空间计数；
3. 解析并导出了 `basilio-eolr-verified.json`。

---

## 9. Codex 独立复核五项问题整改与本轮交付（2026-11-12）

针对 Codex 对提交 `49185a2` 的复核意见，本轮完成全面整改并交付：

1. **验证失败退出码非零与断言增强**：
   - `verify-eolr.mjs` 增设全局 `assert(cond, msg)`，在任意计数不符、不变量违背、图解不一致或样例未达标时**立即非零退出（`process.exit(1)`）**；
   - 增加输入文件存在性检查，缺少数据文件即刻报错；
   - 新增 `--negative-test` 参数，实测证明：破坏两桥、残留坏棱、中心 $90^\circ$ 倾斜、顶角未对齐四种异常均能 100% 触发断言失败并被捕获。
2. **图解映射 18 处差异彻底解决**：
   - 发现并修正了 PDF 矢量流好棱细实线（`0.5 w`）被误判为粗线的 bug（以 `strokeW > 1.2` 为准）；
   - 记录并验证了 5 处左右手镜像约定（`2o/0-1`、`2o/0-4`、`0/2-3`、`1/1-1`、`4/2-1`）；
   - 补齐了 4 处缺失/笔误灰字起手的 BFS 验证公式；
   - 记录并确认了 2 处绘图翅片填色伪影（`2a/0-3` 与 `4/2-3`）；
   - 明确了小型插图仅为教学标注、不作为独立主公式收录；
   - 51 个主图解全部通过机器比对断言，差异数为 0。
3. **终点判定与中心/顶角检查**：
   - 分层明确了 Tier 1（化归中间态）、Tier 2（标准 EOLR，DF/DB 终态）、Tier 3（严格 EOLRb，顶角对齐）三大目标；
   - 严格 EO 判定强制检查中心处于平面态（$m \in \{0, 2\}$）；
   - 样例 6 如实标注为 Tier 1 化归中间态（不虚假宣称闭环）；
   - 样例 1 提供了预对齐起手与严格顶角对齐断言。
4. **统一 EOLRb 术语定义**：
   - 严格按照 Athefre 规范：标准 EOLR 为 `{DF, DB}` 底层双槽；EOLRb 为 `{UL, UR}` 顶层完全对齐归位；正文第 5 节的混淆称谓全部纠正。
5. **统一收录数量为 51**：
   - 正文、脚本、数据集与推荐方案统一为 **51 个主图解**（31 正常 + 20 BAD CASES）；
   - 澄清了此前草案中“50”系对 `4/2` 特殊行计数的笔误，提供全 51 条清单。

---

## 10. 第二轮复核阻塞问题整改（2026-11-12，针对提交 57571e9）

针对独立复核指出的两个阻塞缺陷与两处文档同步项，完成全面修正与实测验证：

1. **彻底解决负向测试“假通过”问题（TDZ ReferenceError 根因排查）**：
   - **缺陷复盘**：此前 `--negative-test` 分支置于常量与辅助函数定义之前。在 ESM `const` 暂时性死区（TDZ）作用下，执行负向测试时直接抛出 `ReferenceError: Cannot access 'ROUX_BLOCK_INDICES' before initialization`。由于外层通配捕获了所有异常，误将该 JS 运行时语法错误断定为“成功捕获魔方公式错误”，形成假阳性测试。
   - **整改措施**：将所有不变量、状态巡检、多层级判定及图解核验函数前置初始化完成；负向验证套件针对 5 类真实异常，显式断言特定的错误消息（如 `failed Tier 2: bad=`、`flat=false`、`cornersAligned=false`、`Roux block invariant` 等）；若抛出意外异常或未捕获到特定断言则直接非零退出。
2. **彻底封闭 PDF 绘图伪影分支直接放行漏洞（`PDF_FLAP_ARTIFACT` 严格物理断言）**：
   - **缺陷复盘**：此前在处理 `2a/0-3` 与 `4/2-3` 时，直接在 `PDF_FLAP_ARTIFACT` 分支设定 `verified = true`，未校验魔方物理模拟状态。若传入破坏两桥的非法起手（如 `R`），脚本仍能静默返回 0。
   - **整改措施**：对全部 51 个图解统一先断言左右桥 26 贴纸完全完好（`assert(sim.rouxBlockIntact)`）；在 `PDF_FLAP_ARTIFACT` 分支中，严格比对物理模拟生成的坏棱列表与 LR 槽位特征（精确匹配 `UB,UL|DF:red,UL:red` 与 `DB,DF,UB,UF,UL,UR|DB:pink,DF:pink`），仅允许经核实的单一翅片填色差异；并增加了负向测试 5，实测证明非法起手（如 `R` 或 `M`）均会被立即打回。
3. **统一 Tier 2 与 Tier 3 层级定义**：
   - 统一规范：**Tier 2** 严格且唯一指代**标准 EOLR（底层双槽 `{DF, DB}`）**，废止历史草案中的“顶层 Tier 2”提法；
   - 将进入顶层双槽 `{UL, UR}` 的终态统一定义为 **Tier 3（EOLRb）**，并清晰划分为 **Tier 3a（顶槽预备态，顶角待单步 AUF）** 与 **Tier 3b（完全严格 EOLRb，顶角与左右桥严格对齐）**；
   - 同步更新正文第 1.3 节、第 5 节的 7 个样例标识及达成层级。
4. **修正平面双相位计数表述（第 2.2 节）**：
   - 在 $m \in \{0, 2\}$ 平面双相位下，无序集合 $\{UL, UR\}$ 可达状态数为 $2 \times 480 = \mathbf{960}$；具名有序对 $(UL, UR)$ 可达状态数为 $2 \times 960 = \mathbf{1,920}$。纠正了原稿中将 960 误标为有序计数的笔误。

---

## 11. 第三轮复核阻塞问题整改（2026-11-12，针对提交 374a6ba）

针对独立复核指出的 Tier 3a“单步 AUF 即完成”关键事实错误与判定漏查 UL/UR 互换缺陷，完成全面整改并交付：

1. **取消“单步 AUF 即完成”承诺，将样例 5 如实标成假顶层化归中间态**：
   - **事实复盘**：样例 5（4/0-1 执行 `M' U2 M' U2 M' U' M'`）终态虽然坏棱为 0 且两棱位于 $UL/UR$ 槽，但顶角相对两桥偏置 $90^\circ$（$u \equiv 1 \pmod 4$）。实测遍历 4 种单一 AUF（`""`、`"U"`、`"U2"`、`"U'"`），没有一种能同时对齐顶角与两棱（转 $U'$ 对齐顶角后两棱移至 $UF/UB$）。
   - **整改措施**：取消草案中“只需 1 步 AUF 即可进入 4c”的虚假承诺；将样例 5 如实标注为 **Tier 1: 假顶层化归中间态**；彻底废除半吊子的“Tier 3a”分类，确立 Tier 1（中间态）、Tier 2（标准底层双槽 EOLR）、Tier 3（严格具名对齐 EOLRb）的干净物理三层级体系。
2. **严格 EOLRb 判定严密化（封闭无序 UL/UR 互换漏洞）**：
   - **缺陷排查**：此前代码仅检查 `lrUnordered === 'UL,UR'`，导致 $UL$ 与 $UR$ 互换（$UL$ 在 $UR$，$UR$ 在 $UL$）的对棱反相状态被误判为通过。
   - **整改措施**：严格 EOLRb 强制同时断言 `ulSlot === 'UL' && urSlot === 'UR'`（具名准确入槽）与 `areCornersAligned === true`（顶角与左右桥严格对齐，零 AUF 终态）。
3. **补齐实测验证的闭环接续公式**：
   - 针对样例 5 假顶层中间态，给出经 BFS 求解和脚本验证的接续公式：`"U M2 U' M2 U'"`（总算法 12 步：`M' U2 M' U2 M' U' M' U M2 U' M2 U'`）；
   - 在 `checkTierGoal` 中内置 `continuationAlg` 执行与断言，实测证明接续后 100% 达成 Tier 3 严格 EOLRb。
4. **扩充真实负向测试套件（5 项扩充至 7 项全过）**：
   - **Negative Test 6（单步 AUF 全灭反例）**：实测遍历 `""`、`"U"`、`"U2"`、`"U'"` 4 种 AUF，断言每一项均被严格 EOLRb 检查明确拒绝；
   - **Negative Test 7（具名 LR 互换反例）**：利用 `U M2 U2 M2 U` 构造顶角对齐且中心平面的 $UL \leftrightarrow UR$ 对棱互换状态，断言被严格 EOLRb 检查明确拦截（抛出 `UL=UR`），证明不再放行无序互换。

---

## 12. 生产接入契约与规格澄清（2026-11-12，针对提交 3f15dd6）

针对独立复核提出的 3 项关键生产接入契约问题，完成规格修订与定稿：

1. **彻底解决短公式与现有起手机制冲突（独立起手全链路接入契约）**：
   - **机制冲突**：现有全站情形均依赖 `invertMoves(algs[0])` 计算起手状态（假定播放后必整方还原）；而 EOLR 的 `algs[0]` 是非整方还原短公式（停在 DF/DB 底层双槽或中间态），若强行对短公式取逆，图解与播放器起手将彻底失真，播放后甚至虚假整方还原；
   - **全链路契约**：
     - `AlgCase` 扩展 `setup?: string`；
     - `caseState(c)`：优先基于 `c.setup` 计算初始状态，无 `setup` 时兼容回退原有逆公式；2D 图解（卡片、封面、详情）直接忠实呈现真实初始图解；
     - `Timeline(alg, setup?)` 与 `CubePlayer({ alg, setup })`：传入 `setup` 时以 `solved() + setup` 为第 0 帧，播放 `algs[0]` 结束后自然停在真实 EOLR 终点（如 `{DF, DB}` 双槽）；
     - **切换接续 4b 时保持同一起手**：切换仅将播放公式由 `algs[0]` 扩展为 `algs[0] + " " + continuationAlg`，而 **`setup` 保持完全不变**，播放器第 0 帧状态完全稳定，进度条向后平滑延伸至 Tier 3 严格顶角对齐终态；
     - **练习模式**：`prepareSetup` 直接取用 `c.setup` 叠加 Roux 桥式配色池与打乱。
2. **`targetTier` 完备化中间态支持**：
   - 明确 `targetTier` 类型联合为 `'tier1' | 'tier2' | 'tier3'`，为如实收录的 Tier 1 化归中间态（如 4/0-1、1/1-1 及虚线框 BAD CASES）建立严密契约；Tier 1 情形必须提供 `continuationAlg`，以保证总算法可验证闭环至 Tier 3。
3. **严格保持原有首页入口顺序**：
   - 坚决不打乱原有 Roux 卡堆顺序，严格规范在末尾追加：
     $$\text{Roux 卡堆}：\mathbf{CMLL (42) \to LSE (93) \to SBLS (65) \to EOLR (51)}$$
