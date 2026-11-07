# 分工和任务清单

## 分工原则

- **Opus**：架构、魔方引擎、校验规则、部署，以及校验器报出的疑难问题。
- **Sonnet**：照样板录入数据、做功能页面、打磨界面。

开始任何任务前先读 `CLAUDE.md`，并参考样板 `src/data/pll.ts`。

## 已完成（Opus）

- 工程配置、PWA、GitHub Pages 工作流
- 魔方引擎、公式解析、各公式组的校验规则和测试
- 2D 图解、3D 播放器
- 首页、公式列表、详情页、搜索、我的（备份导入导出）
- 进度、收藏、自定义公式（保存时校验能否解决该情形）
- PLL 全部 21 种

## 已完成（公式数据）

- T1–T4：OLL 57、F2L 41、CMLL 42、LSE 93 全部录入。
- 公式顺序：OLL、PLL、F2L、CMLL 按 SpeedCubeDB 社区投票（2026-11-07），LSE 的 EO 和部分 4c 用 Trevor Scheopner 的 LSE 页，其余 LSE 是穷举得到的最短公式。详见各数据文件开头。

下面 T1–T4 的说明仅作记录，不用再做。

## 进行中：用 Three.js 替换 3D 播放器

新播放器 `src/components/CubePlayer3D.tsx` 和隐藏对比页 `#/lab` 已在本地做好，用户在真手机上试过并满意后才替换。替换时要做：

- 详情页改用 `CubePlayer3D`，接上“只显示相关贴纸”（`displayMask`）
- 在“我的”页面加涂层开关（UV 亮面 / 普通面），按设备保存，不跟随备份迁移
- 删除 `cubing` 依赖、旧 `CubePlayer.tsx` 和对比页，更新 `CLAUDE.md`

## 待办

| 编号 | 任务 | 模型 | 依赖 |
| --- | --- | --- | --- |
| T1 | 录入 OLL 57 种 | Sonnet | 无 |
| T2 | 录入 F2L 41 种 | Sonnet | 无 |
| T3 | 录入 CMLL 42 种 | Sonnet | 无 |
| T4 | 录入 LSE | Sonnet | 无 |
| T5 | 练习模式 | Sonnet | 有数据即可，T1 后效果更好 |
| T6 | 补充识别要点和别名，打磨界面 | Sonnet | T1–T4 |
| T7 | 部署到 GitHub Pages | Opus | 需要你的 GitHub 仓库 |

T1–T4 分别只改自己的数据文件，可以并行。`src/data/index.ts` 的 `complete` 标记各改一行。

## T1 OLL

- 文件：`src/data/oll.ts`。保留 `oll-27`，把数组补到 57 条。
- `id` 为 `oll-编号`，`name` 为 `OLL 编号`，编号用公认的 1–57。
- `group` 按形状分组：十字、点、方块、C、W、L、P、T、I、闪电、鱼、骑士、Awkward 等。
- 每条 1–2 个常用公式，手速好的优先。常见别名写进 `aliases`，如 Sune、Antisune。
- 完成标准：`npm run check:data` 全过，`index.ts` 里 OLL 的 `complete` 改为 `true`；对照至少两份公认资料核对编号。

## T2 F2L

- 文件：`src/data/f2l.ts`。保留 `f2l-1` 或按正式编号替换。
- 目标槽位统一为 FR，编号采用公认的 1–41，`id` 为 `f2l-编号`。
- `group` 按角棱位置分组：基础插入、角棱都在顶层、角在顶层棱在中层、棱在顶层角在底层、角棱都在槽内等。
- 公式末尾可以有 U 调整；公式里带 `y`、`d` 也可以，校验器会校正朝向。
- 完成标准同 T1。

## T3 CMLL

- 文件：`src/data/cmll.ts`。替换示例条目。
- 分组使用公认的 O、H、Pi、U、T、L、Sune、Antisune，共 42 种，`id` 形如 `cmll-sune-1`。
- 公式不能破坏左右两个 1x2x3 块，并且不能带整体转动，否则校验不过。可以用 `r`、`M`。
- 完成标准同 T1。

## T4 LSE

- 文件：`src/data/lse.ts`。替换示例条目。
- LSE 没有固定数量，按步骤组织，`group` 只能是 `EO`、`UL/UR`、`4c`，每步的判定不同：
  - `EO`：执行后六条棱朝向全对，排列不管。指纹只看好棱和坏棱的分布，同分布只录一条。
  - `UL/UR`：起始时朝向全对、UL 和 UR 未归位，执行后朝向全对且 UL、UR 归位。
  - `4c`：起始时朝向全对、UL 和 UR 已归位，执行后完全还原。
- 公式只能用 M 和 U，校验器会检查。
- 这些情形可以从 M/U 转动推算，来源不好找时，可以用引擎写临时脚本做广度搜索，取最短公式。名称用描述性写法（如“前后各一坏棱”），不要编造术语。
- `index.ts` 中 LSE 的 `expectedCount` 保持 `null`；完成后 `complete` 改为 `true`。

## T5 练习模式

替换 `src/pages/PracticePage.tsx` 的占位内容。

- 选范围：按公式组、分组、学习状态或收藏组合筛选，也可以只练选中的情形。
- 流程：随机出一个情形，显示图解和打乱 → 空格键或点屏幕开始计时 → 再按一次停止 → 显示公式和用时 → 下一题。
- 打乱：取 `invertMoves(parseAlg(主公式))`，加随机 AUF。不要引入 cubing.js 的打乱生成，它要加载 worker。
- 记录每个情形最近的用时，存在 `userStore`，加字段时保持向后兼容，导出/导入要带上。
- 优先出“学习中”和用时最慢的情形。
- 把用时写进情形详情页。
- 手机上全屏可点、计时数字大。

## T6 识别要点和界面打磨

- 给 `recognition` 补内容。写之前对照图解确认，不确定就留空，不要编。PLL 目前只写了一部分。
- 公式列表滚动位置：从详情页返回后保留。
- 公式字体、手机上的一屏信息量按实际使用调整。

## T7 部署

工作流已写好（`.github/workflows/deploy.yml`）。需要 git 初始化、建 GitHub 仓库、在仓库设置里把 Pages 来源设为 GitHub Actions，然后推送到 `main`。
