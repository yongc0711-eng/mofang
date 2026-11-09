# T66 OLL / PLL 主公式括号显示候选（B 表 37 条缺口补齐）

> **重要声明：这是候选，尚未进入生产映射。**
> 本报告仅针对 `tmp/alg-parens-audit.md` 中 B 表的 37 条缺口（OLL 28 条、PLL 9 条）提供“原始主公式 → 带括号显示串”候选，未修改 `src/data`、`CasePage`、测试或 `docs/TASKS.md`。

## 背景与口径

1. **只读基线**：以 `src/data/oll.ts` 和 `src/data/pll.ts` 中的 `algs[0]` 原始字符串为唯一基准，逐字符原样复制。
2. **只加括号**：仅在原字符串上插入 `(` 与 `)`；不改变任何转动、整体转体、大小写（如 `r` vs `Rw`）、后缀、空格或顺序。
3. **括号规范**：
   - 统一采用单层圆括号 `(R U R' U')` 风格，不嵌套、无空括号、不跨 `x/y/z` 分组、不引入 `(...)n` 重复后缀。
   - **单步不括**（如去掉 `(r2)`）、**连接步 `U`/`U'`/`U2` 不强行括入相邻组**（如 `R U2 (R2 F R F') (R U2 R')` 的起手 `R U2` 留白不强行凑括号）、没有顺手 trigger 组的部分保持留白。
   - 对每一条候选均已通过脚本实测验证：`display.replace(/[()]/g, '') === raw`，且 `parseAlg(display)` 与 `parseAlg(raw)` 深度相等（`JSON.stringify` 完全一致）。
4. **状态汇总**：
   - `filled`：**37 条**
   - `uncertain`：**0 条**
   - `not-found`：**0 条**

---

## B 表 37 条缺口候选明细（OLL 28 条 + PLL 9 条）

| id | 原始主公式 | 带括号显示串 | 来源 URL | 匹配依据 | 状态 | 备注 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `oll-1` | `R U2 R2 F R F' U2 R' F R F'` | `(R U2 R2) (F R F') U2 (R' F R F')` | https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf | 同源 moves：与 `oll.names.test.ts` 的 `(R U2 R') (R' F R F') U2 (R' F R F')` 仅首尾两步合并为 `R2`，CubeSkills OLL PDF 将前 3 步与两个 sledgehammer 分组，中间连接步 `U2` 不括 | `filled` | 中间 `U2` 作连接步留白 |
| `oll-2` | `R U' R2 D' r U r' D R2 U R'` | `R U' R2 D' (r U r') D R2 U R'` | https://speedcubedb.com/a/3x3/OLL/OLL_2 | SpeedCubeDB OLL 2 收录同条无转体算法，中间 `(r U r')` 为核心插入，首尾 `R U' R2 D'` 与 `D R2 U R'` 留白不强括 | `filled` | 首尾对称共轭留白，只括核心 `(r U r')` |
| `oll-3` | `f R U R' U' f' U' F R U R' U' F'` | `f (R U R' U') f' U' F (R U R' U') F'` | https://speedcubedb.com/a/3x3/OLL/OLL_3 | 与 `oll.names.test.ts` 的 `y' f (R U R' U') f' (U') F (R U R' U') F'` 同条，去掉前置 `y'` 及单步连接 `U'` 的外括号 | `filled` | 两个标准 `(R U R' U')`，连接步 `U'` 不括 |
| `oll-4` | `R' F2 R2 U2 R' F' R U2 R2 F2 R` | `(R' F2 R2 U2) (R' F' R) (U2 R2 F2 R)` | https://speedcubedb.com/a/3x3/OLL/OLL_4 | SpeedCubeDB OLL 4 收录同条纯 RUF 对称公式，中间 `(R' F' R)` 为核心翻转，首尾 4 步 `(R' F2 R2 U2)` 与 `(U2 R2 F2 R)` 互逆对称 | `filled` | 定案采用 4-3-4 对称分组 |
| `oll-8` | `r' U' R U' R' U2 r` | `r' (U' R U' R') U2 r` | https://speedcubedb.com/a/3x3/OLL/OLL_8 | 与 `oll.names.test.ts` 的 `y2 r' (U' R U' R') U2 r` 去掉前置 `y2` 后逐 token 完全一致，且与 A 表 `oll-7` `r (U R' U R) U2 r'` 严格镜像对称 | `filled` | 小闪电标准宽层反小鱼 |
| `oll-9` | `R U R' U' R' F R2 U R' U' F'` | `(R U R' U') R' F (R2 U R' U') F'` | https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf | 与 `oll.names.test.ts` 的 `y (R U R' U') (R' F R) (R U R' U') F'` 同条（`R` 与 `R` 合并为 `R2`），CubeSkills OLL PDF 标为 `(R U R' U') R' F (R2 U R' U') F'` | `filled` | 鱼形主流主公式 |
| `oll-11` | `r' R2 U R' U R U2 R' U M'` | `r' (R2 U R' U R U2 R') U M'` | https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf | 与 `oll.names.test.ts` 的 `M (R U R' U R U2 R') U M'` 同条（起手 `M R` 写作 `r' R2`），中间 6 步为完整 Sune 核心，首尾留白 | `filled` | 保持原串 `r' R2` 不改写 |
| `oll-12` | `M' R' U' R U' R' U2 R U' M` | `M' (R' U' R U' R' U2 R) U' M` | https://speedcubedb.com/a/3x3/OLL/OLL_12 | 与 `oll.names.test.ts` 的 `y' M' (R' U' R U' R' U2 R) U' M` 去掉前置 `y'` 后逐 token 完全一致 | `filled` | 与 `oll-11` 上下对称 |
| `oll-13` | `F U R U2 R' U' R U R' F'` | `(F U R U2 R') (U' R U R' F')` | https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf | CubeSkills / SpeedCubeDB 收录同条 Gun/Knight 算法，按前后两个 5 步顺手块 `(F U R U2 R') (U' R U R' F')` 切分 | `filled` | 定案采用 5+5 两段切分 |
| `oll-18` | `R U2 R2 F R F' U2 M' U R U' r'` | `(R U2 R2) (F R F') U2 M' (U R U' r')` | https://speedcubedb.com/a/3x3/OLL/OLL_18 | 与 `oll.names.test.ts` 的 `y (R U2 R') (R' F R F') U2 M' (U R U' r')` 同条（去掉 `y`，`R' R'` 合并为 `R2`），连接步 `U2 M'` 留白，后半段与 A 表 `oll-57` 一致 | `filled` | 前半段与 `oll-1` 一致 |
| `oll-19` | `S' R U R' S U' R' F R F'` | `(S' R U R' S) U' (R' F R F')` | https://speedcubedb.com/a/3x3/OLL/OLL_19 | SpeedCubeDB OLL 19 高票 S 层算法，前 5 步 `(S' R U R' S)` 为 S 层共轭块，连接步 `U'` 不括，后 4 步 `(R' F R F')` 为标准 sledgehammer | `filled` | 中间连接步 `U'` 留白 |
| `oll-25` | `R U2 R D R' U2 R D' R2` | `R U2 (R D R' U2 R D') R2` | https://speedcubedb.com/a/3x3/OLL/OLL_25 | SpeedCubeDB OLL 25 收录同条 RUD 算法，起手 `R U2` 与收尾 `R2` 留白，中间括出完整的 `(R D R' U2 R D')` 换向块 | `filled` | 定案括中间 `D...D'` 换向块，首尾留白 |
| `oll-26` | `R U2 R' U' R U' R'` | `R U2 (R' U' R U') R'` | https://speedcubedb.com/a/3x3/OLL/OLL_26 | 与 `oll.names.test.ts` 的 `y R U2 (R' U' R U') R'` 去掉前置 `y` 后逐 token 完全一致，且与 A 表 `oll-6` `r U2 (R' U' R U') r'` 一致 | `filled` | 起手 `R U2` 留白，不强括 2 步 |
| `oll-29` | `r2 D' r U r' D r2 U' r' U' r` | `(r2 D' r U r' D r2) (U' r' U' r)` | https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf | CubeSkills / SpeedCubeDB 收录同条宽层算法，前 7 步 `(r2 D' r U r' D r2)` 为完整 `r2 D'...D r2` 块，后 4 步 `(U' r' U' r)` 收尾 | `filled` | 7+4 宽层标准分组 |
| `oll-30` | `F U R U2 R' U' R U2 R' U' F'` | `F U (R U2 R') U' (R U2 R') U' F'` | https://speedcubedb.com/a/3x3/OLL/OLL_30 | 与 `oll.names.test.ts` 的 `y2 F U (R U2 R') U' (R U2 R') U' F'` 去掉前置 `y2` 后逐 token 完全一致 | `filled` | 两个 `(R U2 R')` 组，连接步 `U`/`U'` 留白 |
| `oll-34` | `f R f' U' r' U' R U M'` | `(f R f') U' (r' U' R U M')` | https://speedcubedb.com/a/3x3/OLL/OLL_34 | SpeedCubeDB OLL 34 收录同条高票公式，前 3 步 `(f R f')` 为宽 F 插入，连接步 `U'` 留白，后 5 步 `(r' U' R U M')` 收尾 | `filled` | 连接步 `U'` 不强括 |
| `oll-35` | `R U2 R2 F R F' R U2 R'` | `R U2 (R2 F R F') (R U2 R')` | https://jperm.net/algs/oll | J Perm / SpeedCubeDB OLL 35 收录同条算法：起手 `R U2` 留白不强括，接 `(R2 F R F')` 与 `(R U2 R')` | `filled` | 起手 `R U2` 留白（与 `oll-26` 一致） |
| `oll-36` | `R U R2 F' U' F U R2 U2 R'` | `(R U R2 F' U' F) (U R2 U2 R')` | https://speedcubedb.com/a/3x3/OLL/OLL_36 | SpeedCubeDB / Speedsolving Wiki 收录同条右手 RUF 算法，按 `(R U R2 F' U' F) (U R2 U2 R')` 切为前后两段 | `filled` | 6+4 两段顺手切分 |
| `oll-37` | `F R' F' R U R U' R'` | `(F R' F' R) (U R U' R')` | https://jperm.net/algs/oll | J Perm / SpeedCubeDB 收录同条反向 Y-perm 前半段，标准切分为 4+4 两段 `(F R' F' R) (U R U' R')` | `filled` | 经典 8 步鱼形公式 |
| `oll-39` | `f' r U r' U' r' F r S` | `f' (r U r' U') (r' F r S)` | https://speedcubedb.com/a/3x3/OLL/OLL_39 | SpeedCubeDB OLL 39 收录同条宽层 S 公式，起手单步 `f'` 留白，中间 `(r U r' U')` 为宽层 sexy，末尾 `(r' F r S)` 收尾 | `filled` | 结构与 A 表 `oll-32` `S (R U R' U') (R' F R f')` 互逆 |
| `oll-40` | `R' F R U R' U' F' U R` | `R' F (R U R' U') F' U R` | https://speedcubedb.com/a/3x3/OLL/OLL_40 | 与 `oll.names.test.ts` 的 `y R' F (R U R' U') F' U R` 去掉前置 `y` 后逐 token 完全一致 | `filled` | 只括核心 `(R U R' U')`，首尾留白 |
| `oll-41` | `R U R' U R U2 R' F R U R' U' F'` | `(R U R' U) (R U2 R') F (R U R' U') F'` | https://speedcubedb.com/a/3x3/OLL/OLL_41 | 与 `oll.names.test.ts` 的 `y2 (R U R' U) (R U2 R') F (R U R' U') F'` 去掉前置 `y2` 后逐 token 完全一致，且与 A 表 `oll-42` 对称 | `filled` | Sune + `F (R U R' U') F'` |
| `oll-43` | `R' U' F' U F R` | `R' U' (F' U F) R` | https://speedcubedb.com/a/3x3/OLL/OLL_43 | 与 `oll.names.test.ts` 的 `y R' U' (F' U F) R` 去掉前置 `y` 后逐 token 完全一致 | `filled` | 6 步 P 形基础公式，首尾留白 |
| `oll-47` | `F R' F' R U2 R U' R' U R U2 R'` | `(F R' F' R) U2 (R U' R' U) (R U2 R')` | https://speedcubedb.com/a/3x3/OLL/OLL_47 | SpeedCubeDB OLL 47 收录同条右手公式：前 4 步 `(F R' F' R)` 同 `oll-37`，中间连接步 `U2` 留白不括，后接 `(R U' R' U) (R U2 R')` | `filled` | 定案保留连接步 `U2` 留白 |
| `oll-49` | `r U' r2 U r2 U r2 U' r` | `r U' (r2 U) (r2 U) r2 U' r` | https://speedcubedb.com/a/3x3/OLL/OLL_49 | 与 `oll.names.test.ts` 的 `y2 r U' (r2 U) (r2 U) (r2) U' r` 同条，去掉前置 `y2` 并移除单步 `(r2)` 括号 | `filled` | 单步 `r2` 不加括号 |
| `oll-51` | `F U R U' R' U R U' R' F'` | `F (U R U' R') (U R U' R') F'` | https://speedcubedb.com/a/3x3/OLL/OLL_51 | SpeedCubeDB / J Perm OLL 51 收录同条 `F` 夹双 inverse-sexy 公式，标准切分为 `F (U R U' R') (U R U' R') F'` | `filled` | 与 A 表 `oll-48` `F (R U R' U') (R U R' U') F'` 对偶 |
| `oll-52` | `R' F' U' F U' R U R' U R` | `R' (F' U' F U') (R U R' U) R` | https://speedcubedb.com/a/3x3/OLL/OLL_52 | 与 `oll.names.test.ts` 的 `y2 R' (F' U' F U') (R U R' U) R` 去掉前置 `y2` 后逐 token 完全一致 | `filled` | SpeedCubeDB 原生括号写法 |
| `oll-55` | `R' F U R U' R2 F' R2 U R' U' R` | `(R' F U R) (U' R2 F') (R2 U R' U' R)` | https://speedcubedb.com/a/3x3/OLL/OLL_55 | SpeedCubeDB / Speedsolving Wiki 收录同条 11 步 RUF 公式，按 4-3-4 trigger 切分为 `(R' F U R) (U' R2 F') (R2 U R' U' R)` | `filled` | 定案采用 4-3-4 trigger 切分 |
| `pll-e` | `R' U' R' D' R U' R' D R U R' D' R U R' D R2` | `(R' U' R' D') (R U' R' D) (R U R' D') (R U R' D) R2` | https://speedcubedb.com/a/3x3/PLL/E | SpeedCubeDB PLL E 收录同条无转体 RUD 算法，由 4 个 4 步 `(R/R' U/U' R' D/D')` 换向循环加末尾单步 `R2` 留白组成 | `filled` | 与转体版 E-perm 的 4 段式完全同构 |
| `pll-f` | `R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R` | `(R' U' F') (R U R' U') R' F R2 (U' R' U') (R U R' U) R` | https://speedcubedb.com/a/3x3/PLL/F | 与 `pll.names.test.ts` 的 `y (R' U' F') (R U R' U') R' F R2 (U' R' U') (R U R' U) R` 去掉前置 `y` 后逐 token 完全一致 | `filled` | 中间过渡 `R' F R2` 与收尾 `R` 留白 |
| `pll-gb` | `D R' U' R U D' R2 U R' U R U' R U' R2` | `D (R' U' R U) D' R2 (U R' U R U' R U') R2` | https://speedcubedb.com/a/3x3/PLL/Gb | 与 `pll.names.test.ts` 的 `(R' U' R U) D' R2 (U R' U R U' R U') R2 D` 同条（仅将末尾 `D` 移到开头留白），括号分组与 A 表 `Ga/Gc/Gd` 完全统一 | `filled` | G 系列四条括号结构完全对齐 |
| `pll-h` | `M2 U M2 U2 M2 U M2` | `(M2 U M2) U2 (M2 U M2)` | https://speedcubedb.com/a/3x3/PLL/H | 与 `pll.names.test.ts` 的 `(M2 U' M2) U2 (M2 U' M2)` 仅 `U` 与 `U'` 方向互为镜像，中间连接步 `U2` 留白 | `filled` | 标准 H-perm 切分 |
| `pll-ja` | `L' U' L F L' U' L U L F' L2 U L` | `(L' U' L F) (L' U' L U) L F' L2 U L` | https://speedcubedb.com/a/3x3/PLL/Ja | SpeedCubeDB PLL Ja 收录同条左手 J-perm，是 A 表 `pll-jb` `(R U R' F') (R U R' U') R' F R2 U' R'` 的严格左右镜像，末尾 `L F' L2 U L` 留白 | `filled` | 与 A 表 `pll-jb` 括号位置 1:1 镜像对齐 |
| `pll-ra` | `R U' R' U' R U R D R' U' R D' R' U2 R'` | `(R U' R' U') (R U R D) (R' U' R D') (R' U2 R')` | https://speedcubedb.com/a/3x3/PLL/Ra | 与 `pll.names.test.ts` 的 `y (R U' R' U') (R U R D) (R' U' R D') (R' U2 R')` 去掉前置 `y` 后逐 token 完全一致 | `filled` | 标准 RUD Ra-perm 切分 |
| `pll-ua` | `M2 U M U2 M' U M2` | `(M2 U M) U2 (M' U M2)` | https://speedcubedb.com/a/3x3/PLL/Ua | 与 `pll.names.test.ts` 的 `y2 (M2 U M) U2 (M' U M2)` 去掉前置 `y2` 后逐 token 完全一致，中间 `U2` 留白 | `filled` | 标准 MU Ua-perm 切分 |
| `pll-ub` | `M2 U' M U2 M' U' M2` | `(M2 U' M) U2 (M' U' M2)` | https://speedcubedb.com/a/3x3/PLL/Ub | 与 `pll.names.test.ts` 的 `y2 (M2 U' M) U2 (M' U' M2)` 去掉前置 `y2` 后逐 token 完全一致，中间 `U2` 留白 | `filled` | 标准 MU Ub-perm 切分 |
| `pll-z` | `M' U' M2 U' M2 U' M' U2 M2` | `M' U' (M2 U' M2) U' M' (U2 M2)` | https://speedcubedb.com/a/3x3/PLL/Z | SpeedCubeDB / J Perm PLL Z 收录同条 `M'` 起手公式，括出核心 `(M2 U' M2)` 与收尾 `(U2 M2)`，前后过渡 `M' U'` 留白 | `filled` | 定案括 `(M2 U' M2)` 与 `(U2 M2)` |

---

## 自检结果

1. **条数与状态完整性**：共 37 条（OLL 28 条 + PLL 9 条），状态为 `filled` 37 / `uncertain` 0 / `not-found` 0。
2. **字符与解析等价性**：
   - 37 条候选去掉 `(` 和 `)` 后，与 `src/data/oll.ts`、`src/data/pll.ts` 中的 `algs[0]` 逐字符 100% 相等（`display.replace(/[()]/g, '') === raw`）；
   - 37 条候选经 `parseAlg(display)` 解析出的 `Move[]` 与 `parseAlg(raw)` 深度相等；
   - 无单步括号（如已移除 `(r2)`）、无强行括入的连接步 `U/U'/U2`、无嵌套括号、无空括号、未改写任何 `r/Rw`、`x/y/z`、`M/E/S` 或倍数后缀。
