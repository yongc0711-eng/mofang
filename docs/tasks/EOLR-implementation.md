# EOLR 实现交付

## 范围与基线

2026-11-12，用户在 Lead 规格 `ea262a9` 复核后批准开始实现。工作区 `D:/allwork/mofang-ui`，实现分支 `codex/eolr`，基于 main `2dcedd3`；不合并、不 push。

引入 Lead 的 EOLR 研究文档、校验脚本和审定 JSON，不覆盖其旧基线的 TASKS 索引或部署工作流。原 8 组 / 386 个情形的 ID、数据和 SET_RULES 保持不变；新增 EOLR 51 个情形，合计 9 组 / 437 个情形。

## 已实现

- 首页桥式卡堆末尾追加 EOLR：`CMLL → LSE → SBLS → EOLR`。9 个 EO 分类、51 条入口，20 个 BAD CASE 虚线卡片与标记。LSE 的概览、EO 分类底部及 EOLR 列表提供关联入口。
- EOLR 通过独立 `setup` 产生原始贴纸状态；`caseState`、图解、Timeline、CubePlayer、练习使用同一起手。旧情形继续使用原公式逆序路径。
- 图解从实际状态标出坏棱粗框、LR 可见/背向标记和底部 DF/DB，不新增图片，不手写魔方状态；新颜色均来自 CSS 变量。
- 详情默认播放内置短公式；「接续 4b」延伸时间线到严格 EOLRb。开启/关闭接续保留当前帧和播放位置（缩短时夹到短公式终点），不通过重算逆公式改起手。接续对应内置短公式；选自定义公式时明确禁用该开关。
- Tier 1 精确比较 EO、具名 LR、中心相位和顶角相位的化归特征；Tier 2 要求 EO 完成、平面中心、LR 在底层双槽；Tier 3 要求 EO 完成、平面中心、具名 LR 与顶角归位。所有接续逐动作保护两桥 26 张贴纸并达到 Tier 3。
- 练习支持独立入口 `/practice?set=eolr`、桥式 24 配色池、原有求解器生成/54 贴纸回放和会话恢复。其余四条 M 棱抽取 12 种合法偶置换；Tier 2 抽四种 AUF，答案显式加反向 U 对准。题目目标标明化归中间态/底层双槽/归位，不伪装成整方还原。
- D23 先记录契约与新增集合的等强断言更新；原测试不删、不 skip、不放宽旧组检查，保留 T48/T56、LSE 双图、分类动效和安卓翻卡首次轻点门禁。

## 数据来源与计算补全

来源是 Bas 2023-08-04 的 EOLR Cheat Sheet，与 Lead 的 `basilio-eolr-verified.json` 逐条对应。保留每条 `sourceCase`、`sourceAlg`、`sourceMatch`，包括 5 条镜像说明、4 条独立补齐的起手和 2 条图解填色例外。起手字符串不被替换成短公式的逆。

`node scripts/research/eolr/build-cases.mjs` 可重新生成全部数据与练习置换：枚举 MU 的 184320 个状态，取 24 个严格 EOLRb 终点为目标，反向 BFS 得到每个起手/化归终点的最短 MU 接续；不通过改规则或中心 normalize 获得通过。

4 条前缀明确标记为计算补全，不冒充原表独立公式：`3/1-5`、`3/1-7`、`3/1-8`（该列无独立加粗公式），以及 `2o/0-5`（原文 R/r OLL 路径改为逐步保护两桥的 MU 路径）。其余 47 条保留审定记录中的加粗前缀。

实际短公式分层为 Tier 1：50 条，Tier 2：1 条。原表许多加粗公式是化归前缀，不能把它们标成已完成 EO/LR；全部 51 条完整接续均验证到严格 Tier 3。

两项实测差异已记 D23：

- `3/1-7` 的审定独立起手是倾斜中心相位 1；如实保留起手，只在完成 EO/完整接续终点要求平面中心。
- 原稿估计的接续 2–5 步并非全表上界，真实最短接续最长 12 步。完整保留必要动作，不缩短断言或伪报终点。

## 门禁与布局

| 命令 | 结果 |
| --- | --- |
| `npm test` | 6198 条 / 60 文件通过 |
| `npm run check:data` | 1097 条 / 9 文件通过 |
| `npm run build` | TypeScript、Vite、PWA 打包通过 |
| `npm run test:visual -- --workers=2` | 54 条通过（原 46 + EOLR 8），无 skip |

新增测试逐条对照来源及物理贴纸；51 条 × 24 个桥式配色均经真实求解器回放；12 种 M 棱置换与允许的 AUF 均保留情形并能正确完成主公式与接续。拒绝错误接续、LR 互换及单步 AUF 假闭环。

生成器再次运行后 `src/data/eolr.ts` 的 SHA256 完全一致，证明提交数据可以从研究输入重建。

| 视口 | EOLR 详情 SVG | 播放器舞台高度 | peek 底部 | 底栏顶部 | scrollWidth / clientWidth |
| --- | --- | --- | --- | --- | --- |
| 320×640 | 64×64 | 164 | 534.39 | 568 | 320 / 320 |
| 390×844 | 64×64 | 190 | 598.08 | 772 | 390 / 390 |

浅/深色均验证。接续、速度和相关块按钮均 ≥32px 且不重叠；旧 LSE 双图仍为两张 64×64，间距 4px。没有新增全局 reset、依赖、图片、字体或发布工作流变更。

补充浏览器检查：1280×900 详情接续按钮可见、无横向溢出；320×640 的 `4/2` 分类显示 3 张 BAD CASE 卡片，无横向溢出。

## 本地截图

忽略目录，不提交图片：

- `ui-review.local/eolr/detail-{320,390}-{light,dark}.png`
- `ui-review.local/formula-expansion/eolr-list-{320,390}-{light,dark}.png`
- `ui-review.local/formula-expansion/eolr-category-{320,390}-{light,dark}.png`
- `ui-review.local/home-decks/after-{320,390}-{light,dark}.png`
- `ui-review.local/eolr/detail-1280-light.png`、`bad-cases-320-light.png`

以上为移动 Chromium 模拟；实体安卓设备尚待用户实测。交付后仍需独立 Auditor / Lead 审查数据与实现，未发布到线上。
