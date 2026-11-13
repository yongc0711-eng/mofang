# 任务

## 当前状态（2026-11-12）

- **分工：** Lead = Gemini 4 / Antigravity；Executor = Codex（额度用尽期间由 Gemini 4 Hydrogen 代班）；Auditor / Release = 独立复核者；Router = 用户。Claude 账号不可用，旧分工不再适用；细则见 `AGENTS.md`。
- **公式数据：** 9 个公式集、437 条已录完：F2L 41、OLL 57、PLL 21、COLL 40、WV 27、CMLL 42、LSE 93、SBLS 65、EOLR 51。来源见 `docs/decisions.md` 和各数据文件开头。
- **功能：** 列表、搜索、进度、收藏、自定义公式、备份导入导出、练习模式都已完成。
- **3D 播放器：** Three.js 版已合并并上线，cubing.js 已移除。
- **图解：** 所有 OLL 的 2D 图解固定只显示顶层的 9 张颜色（公式页、卡片、练习页、首页封面）；OLL 的 3D 和其他组一样，默认完整魔方，开“只看相关的块”后只显示顶层 21 格（T27 把两者合成一个设置，T32 修正）。外面的图解（卡片、首页封面、练习页）按主公式的起手画，和详情页一致（T33）。六色底同时作用于公式页 3D 和所有 2D 图解、练习页说明，见 T28–T30。T60a 把浏览配色按 CFOP / 桥式拆成两份设备偏好；T61 又把首页和练习的入口收成各一个，点开是带 CFOP / 桥式两个 tab 的弹窗；T62 把首页入口移到标题行右侧；T63 再把入口收成搜索框右侧的 44px 圆形按钮，搜索框缩短并改为胶囊圆角；T64 把五张方法卡改成独立卡片并加上圆形箭头，方法标题只留名称；T65 再把卡片加高到 68/78px，并把全站有框组件换成 14–24px 的大圆角；T69 全局关闭长按文字选择，只保留公式、输入框和可编辑区域；T70 加 320/390 的 Playwright 视觉冒烟并接进部署 CI；UI-polish 把公式库的分类筛选从原生 select 换成 CategoryPicker 紧凑面板，支持数量、选中、Esc/遮罩关闭和焦点返回；分类面板再加 200ms 进入 / 150ms 退出的轻浮层动效（退场前 70% 不透明、最后 30% 淡出）；UI-home-decks 把首页改为 CFOP / 桥式两叠循环横卡；T71、COLL、SBLS 新增 CFOP COLL（40）与桥式 SBLS（65）；WV 新增 CFOP Winter Variation（27），CFOP 卡堆变成五组；EOLR 新增桥式 EOLR（51），其中 20 张 BAD CASE 用虚线卡标出，桥式卡堆变成四组，详情页可把短公式接上「接续 4b」播到严格 EOLRb。
- **部署：** 推送到 `main` 自动发布，已确认可以打开：https://yongc0711-eng.github.io/mofang/
- **基线：** `npm test` 6216/65 项全过，`npm run check:data` 1104/11 项全过，`npm run build` 通过；`npm run test:visual` 54 条 Playwright 冒烟全过（main `de733b7`）。
- **识别要点：** PLL（T13）和 OLL（T14）已重写，有非空/互异/特征测试；OLL 识别文字里的「黄」随顶色变化（T29）；F2L、COLL、WV、CMLL、LSE、SBLS、EOLR、CLL 还没有 recognition。

任务详细记录可以用 `docs/tasks/_template.md` 建文件。编号只增不复用，T1–T71 已用过（T67 预留给 T15 UL/UR 文档；T34–T55 的记录见 `docs/tasks/`，本文件没有逐条补）。

## 未完成

- [2x2](tasks/2x2.md) 二阶 CLL / EG-1 / EG-2 各 42 条（共 126）：新增 24 贴纸引擎 `src/lib/cube2.ts`、独立 `cases2.ts` 规则、2×2 图解与 `CubeScene` 参数化、首页第三叠「二阶」；本轮只做查询与 2D/3D，不做练习。分 P1–P4 四期，执行方为代班的 Gemini 4 Hydrogen（分支 `hydro/2x2-p1` 起）。P1（24 贴纸引擎，与三阶引擎逐贴纸交叉验证）、P2（`CaseDiagram2` 顶/底视图、`CubeScene` 的 `size`、`Timeline` 可选引擎 + 二阶引擎测试）与 P3a（CLL 42 条、`cases2.ts` 的 `caseState2`/`algSolvesCase2`/24 朝向指纹、双源对照测试）已合入 main `de733b7`，6216/65、1104/11、build、visual 54 通过。`SET_RULES.cll` 只是 `Record<SetId, SetRule>` 的类型占位、被调用即抛错，2×2 一律走 `cases2.ts`。剩 P3b 的 EG-1 / EG-2 84 条与 P4 的首页第三叠与页面接通；2×2 的图解与 3D 尚未在任何页面里跑过，等 P4。
- EOLR 已按 Lead 的 `ea262a9` 规格实现并合并，调研、勘误与显示口径仍保留在 `tasks/EOLR.md`。

## 已完成（T15、T16、T21–T30、T32、T33、T56、T58、T59、T60a、T60b、T61、T62、T63、T64、T65、T66、T68、T69、T70、UI-polish、UI-home-decks、UI-home-deck-tap、T71、COLL、SBLS、WV、EOLR；T56-fix 已合并）

每条链接到它的任务记录。

- [T15](tasks/T15.md) LSE 情形名称：4c 的 36 条和 UL/UR 的 46 条都已按置换命名（UL/UR 在提交 58aa5d5）。`T15.md` 目前只记了 4c 那 36 条的规则和新旧名对照，UL/UR 的部分没有单独写文档。
- [T16](tasks/T16.md) 真手机验收清单：2026-11-09 用户确认六大项全部通过；具体机型、系统版本与逐项现象未逐格填写。
- [T21](tasks/T21.md) 练习会话持久化、计时持续、屏幕常亮
- [T22](tasks/T22.md) 练习打乱固定白顶绿前起手，去掉整体转体
- [T23](tasks/T23.md) 公式页图解按所选公式对齐，点公式不自动播放
- [T24](tasks/T24.md) 练习页按住准备、松手计时（按下反馈）
- [T25](tasks/T25.md) 练习页 setup 文案与朝向
- [T26](tasks/T26.md) 练习按下与计时反馈统一橙色
- [T27](tasks/T27.md) OLL 识别视图开关（默认只显示顶面 9 格，可切 21 格）。**已被 T32 修正**：2D 和 3D 的分工理解错了，这个设置已删除。
- [T28](tasks/T28.md) 六色底（公式页 3D 和 2D）
- [T29](tasks/T29.md) OLL 识别文字跟随顶色
- [T30](tasks/T30.md) 所有 2D 图解和练习页说明跟随底色
- [T32](tasks/T32.md) 修正 OLL 的 2D/3D 分工：2D 固定顶层 9 张，3D 和其他组一样（默认完整，“只看相关的块”可选）
- [T33](tasks/T33.md) 外面的图解（卡片、首页封面、练习页）跟主公式对齐；练习的 setup 同步按主公式算
- [T56](tasks/T56.md) 版本检查与强制刷新（Codex 实现，Claude 审查，合并提交 f082505，实现提交 8c78823 + 3393495）：每次构建生成 `dist/version.json`（不进 SW precache），页面可见/获得焦点时检查（30 分钟节流），有新版只提示不自动重载；「我的」里可手动检查和强制刷新，强制刷新只清本应用 scope 的 SW 和缓存，清理失败也照样带 `?v=` 导航并留下一次性提醒。合并时 `npm test` 3381 / `check:data` 393 / `build` 通过。
- [T56-fix](tasks/T56.md) 更新提示条不再出现在详情页和练习页（文档流里的提示条会改变 T48 的首屏预算）：新增 `shouldShowUpdateNotice`，版本检查仍全局运行。**已复核，已合并**（fast-forward，main `86215df`；分支 `claude/t56-notice-layout`，提交 `40c12f8`，`npm test` 3389 / `check:data` 393 / `build` 通过）。

- [UI-home](tasks/UI-home.md) 首页 UI 重做试点：用户看过方向 A 后选定方向 C（分组面板），实现提交 `a8ac4e8`，fast-forward 合并。只改首页样式，底栏和其他页没动。`npm test` 3396 / `check:data` 393 / `build` 通过。
- [T57](tasks/T57.md) 首页顶部搜索框与结果区：复用 SearchPage 的匹配逻辑抽到 `src/lib/search.ts`，首页显示结果计数、CaseCard 或无结果提示；旧 `/search` 与底栏搜索 tab 未动。收尾 rebase 到 `ae03af8`，补 320×640 无头 Edge 实测（scrollWidth 320 = clientWidth，结果卡宽 288 单列），3422/393/build 通过，合并 `c4ea962`。
- [T59](tasks/T59.md) 练习完成后的 2D 图改用主公式的 canonical view，与公式详情页同向；训练中仍显示本题实际目标，未改 `sampleTarget`/`scrambleFor`/`prepareSetup`/求解/3D。fast-forward 合并 main `830fb1c`，3409/393/build 通过。
- [T58](tasks/T58.md) 首页保留 T57 搜索；`/search` 改为纯试转页（底栏“试转”），3×3 主键 R U F / L D B / x y z，「更多」切 r l u d f b / M E S，后缀选中后锁定（点“无”或复原才清除），撤销/复原；复用 `CubeScene`、不走 Timeline，x/y/z 不 normalize，UV/普通面跟“我的 → 魔方表面”设置走。Codex 实现，Lead 复核并补 320×640 首屏遮挡修正（stage 220→180）；T58-fix 后缀锁定 + finish 同步 `e78e258`；3450/393/build 通过，fast-forward 合并 main `47fca10`、`e78e258`。
- [T60a](tasks/T60a.md) 方法独立的浏览配色：首页 CFOP / 桥式 Roux 方法标题旁各一个入口；CFOP 只六底，Roux 六底 + 两个合法无序桥对 + 持久化左右方向（交换为整体 y2）；图解、3D、卡片、首页封面、详情统一走 `colorScheme`；删除“我的”旧底色入口，T58 固定白顶绿前不再读旧 `bottomColor`。Codex 实现，Lead 核过迁移、测试与 320/390 无头布局；3479/46、393、build 通过，fast-forward 合并 main `14aa1c9`。入口后来被 T61 收成单入口弹窗。
- [T60b](tasks/T60b.md) 练习配色完整接入：CFOP 六底、Roux 六底 / 每底合法桥对 / 两个左右方向；两池独立，每题按方法均匀抽完整配色并冻结；`PreparedSetupV2` 保存完整 colors，24 个整体转体反查观察持法（不拼旧 `OBSERVATION`），`verifySetup` 做 54/54 校验；旧 v1 与计时恢复原样。Codex 实现，Lead 核过 24 配色、135×24 真实求解、迁移与 320/390 无头布局；3644/50、393、build 通过，fast-forward 合并 main `1ba3a13`。页内网格后来被 T61 收进单入口弹窗。
- [T61](tasks/T61.md) 配色单入口弹窗：首页 `FormulaColors` 与练习页顶部各只留一个入口，点开是共用 `ColorDialog` 外壳 + CFOP/Roux 两个 tab；关闭支持 ×/遮罩/Esc、焦点陷阱与回入口；320/390 不横滚、控件 44px、不占 T48 首屏。浏览写 devicePrefs，练习仍写本地 pools、刷新重置，不改 T58/T60b 的 setup/求解/计时。Codex 实现，Lead 核过焦点、tab、状态隔离与 320/390 无头布局；3654/52、393、build 通过，fast-forward 合并 main `74772fb`。
- [T62](tasks/T62.md) 首页配色入口从独立的「配色」chip 改为标题行右侧的调色盘 + 文案动作：标题/计数在左，入口 80×44px 在右，搜索仍独占下一行；header 高从 152.5 降到 120.5px（320/390），不横滚；保留唯一入口、`browse-colors` id、aria 契约、点击聚焦与 T61 弹窗/焦点返回。Codex 实现并查了 Notion/Spotify/Linear/Material 3 的官方做法，Lead 核过 320/390 浅深色与焦点；3658/53、393、build 通过，fast-forward 合并 main `eec85be`。入口后被 T63 移到搜索行右侧并改为圆形。
- [T63](tasks/T63.md) 首页配色入口改为搜索框右侧的圆形按钮：`HomePage` 去掉标题行包裹，搜索与入口同排；搜索框 44px 高、胶囊圆角、320 下 236px，入口 44×44 正圆、仅调色盘图标（`FormulaColors iconOnly`），练习页仍保留「配色」文字；placeholder 缩短。浏览器用 CDP 设备视口实测 320/390 均 `scrollWidth=clientWidth`；3658/53、393、build 通过，main `9659e05`。
- [T64](tasks/T64.md) 首页五张方法卡改成 A 独立学习卡，并并入 C 的 24px 圆形箭头：64px 高、6px 间距、细边圆角、2px 橙色侧标、40px 图解、accent 进度；方法标题只留名称。删除 `?cards`/`?tone` 预览、B/C 和雾蓝实验；`homeCards` 与旧面板断言等强改写为固定 A，记录 D16。320×640 LSE 底 552.5、底栏顶 568；3662/54、393、build 通过，main `157ed2f`。
- [T65](tasks/T65.md) 首页卡片纵向比例与全站大圆角：矮屏 68px、高屏 78px，320×640 通过收紧 header/方法间距保住五卡全在底栏上方（LSE 底 554.5、底栏顶 568）；新增 `--radius-card:20px`、`--radius-panel:24px`、`--radius-control:14px`、`--radius-small:10px`，覆盖卡片、播放器、练习面板、弹窗、输入、按钮、公式行、分段控件、统计块、键盘与更新提示，保留胶囊/圆点/进度条原形。`homeStyle` 等强更新高度与圆角断言，记录 D17；3662/54、393、build 通过，main `de6dcdb`。
- [T66](tasks/T66-alg-parens-gaps.md) OLL / PLL 主公式括号显示候选（B 表 37 条缺口补齐）：仅文档（merge `47162c2`），整理 OLL 28 条 + PLL 9 条共 37 条主公式的带括号显示候选（`filled` 37 / `uncertain` 0 / `not-found` 0），全部满足去括号与 `raw` 逐字符一致且 `parseAlg` 深度相等；尚未进入生产映射、未上线，`npm test` 3662 不变。
- [T68](tasks/T68.md) 主公式括号显示：新增 displayAlg，78 条映射（A 41 + B 37），仅 raw 全等且 algs[0] 生效；其他等价公式不套括号；oll-22 无顺手组不括。3746/55、393、build；main 76f6ba0。
- [T69](tasks/T69.md) 关闭长按文字选择：`body` 禁用 `-webkit-touch-callout` / `user-select`，只给 `input`、`textarea`、`code`、`[contenteditable="true"]` 恢复；新增两条样式契约测试。3748/56、393、build；main 850992f。
- [T70](tasks/T70.md) 视觉冒烟：Playwright 在 320×640 / 390×844 跑 5 条布局检查（首页、公式详情、练习设置、配色弹窗、试转），只做溢出/遮挡/焦点断言，不做像素快照；`test:visual` 接进部署 CI，失败时上传截图与 trace。10 条全过。
- [UI-polish](tasks/UI-polish.md) 公式列表与详情页视觉打磨：列表筛选改为 CategoryPicker 紧凑分类面板（原生 dialog、两列、数量/选中/焦点返回）、空结果、卡片 64px 图解与状态文字、详情单图 64px 与收藏上移；LSE 双图改为 132×64 并排、各 64×64，320 收藏放到返回行右侧；`peek-cue` 改为 accent-soft 按钮感，320 列表卡片 padding 12 / 间距 10；分类面板再加 200ms 进入 / 150ms 退出轻浮层动效（退场前 70% 不透明、最后 30% 淡出）。3748/56、393、build、visual 20 条通过；分类面板合并 main `c6101cb`、动效合并 `851fdaf`，GitHub Actions 部署成功。
- [UI-home-decks](tasks/UI-home-decks.md) 首页改为两叠循环横卡：公共「三阶」标题下 CFOP / 桥式各一叠，封面→分组→封面首尾循环；滑动、方向键、展开全部、减少动态效果与返回恢复位置；连续快滑改为 1:1 跟手、可接管未完成动画、70–220ms 收尾；保留五入口顺序、图解、掌握数、进度、搜索和唯一配色入口。3750/56、393、build、visual 32 条通过；合并 main `7ede31c`，手感修复 `43262cb`。
- [T71](tasks/T71.md) COLL / SBLS 的规则前提：新增 `isCollMask`、`isSblsPreserve`、`COLL_RULE`、`SBLS_RULE` 与 `lintCollState` / `lintSblsState`（COLL 要求四顶棱朝上且排除四角全朝上；SBLS 要求 FR 对未归位、公式不含整体转体）；`preUs` 从函数挪进每条规则并保留原组回退，`SetId` 增加 coll/sbls，练习配色池接入。分支 `253a790` → cherry-pick `274fb6f`。
- [COLL](tasks/COLL.md) CFOP COLL 40 情形（Antisune/Sune/L/U/T/Pi 各 6、H 4），`algs[0]` 与 J Perm + CubeSkills 逐条核对，`coll.names.test.ts` 83 条；首页 CFOP 卡堆接 COLL。分支 `bccad77` → `925bdb3`。
- [SBLS](tasks/SBLS.md) Roux SBLS 65 情形（6 组），按 DFR 角 / FR 棱物理位置命名，修正 SpeedCubeDB 7 对 UF↔UL、DB↔DF 标签互换，`sbls.names.test.ts` 68 条；首页 Roux 卡堆接 SBLS，`SBLS_RULE.display` 保持只显示桥块（列表同图现状用户已接受，不改）。分支 `1495183` → `fd4ddf1`。
- **COLL/SBLS 合并记录**：只 cherry-pick 上述三个提交（不整分支 merge，避免旧版 `.github/workflows/deploy.yml` 回退“先 deploy 后 visual”）；合并后 `npm test` 5046/58、`check:data` 653/7、`build`、`visual` 40 条通过，main `fd4ddf1`，Actions deploy → visual 均成功。
- [WV](tasks/WV.md) CFOP Winter Variation 27 情形（`3 Corners` 1 / `2 Corners` 6 / `1 Corner` 12 / `0 Corners` 8）：`cases.ts` 新增 `isWvMask`（F2L + 顶面 42 张）、`WV_RULE`（保留 FR 对以外的 F2L 块）与 `lintWvState`（中心原位、UFR 与 UR 姿态、UF/UL/UB 三顶棱朝上），公式一律不含 `x/y/z`；`wv.names.test.ts` 104 条（物理块几何 + J Perm 27 + CubeSkills 22）。独立复核：J Perm 27 条逐条一致；SpeedCubeDB 27 条 setup 有 26 条与本项目状态逐张相同，剩下 WV10 是其 PLL 变体，但 SCDB 列出的主公式与 `wv-10` 逐字相同、也能解该状态，编号与公式无误。合并前 .github 无改动，`SBLS_RULE.display` 与既有 SET_RULES 未动；fast-forward 合并 main `3114442`，`npm test` 5428/59、`check:data` 786/8、`build`、`visual` 44 条通过。Lead 复核结论见 `WV.md` 第 8 节。
- [UI-home-deck-tap](tasks/UI-home-deck-tap.md) 修复安卓翻卡后第一次轻点被吞：原来只在 `pointermove` 上 `preventDefault`，没有取消原生 `touchmove`，浏览器会把下一次轻点当成终止原生手势。现在在卡堆上注册非被动 `touchmove`，仅在已识别纵向翻卡（`|dy| > 9` 且超过横向位移 1.1 倍）时取消默认；轻点、横向循环、展开后的页面滚动和原有 PointerEvent 逻辑都不受影响。反向对照：撤掉 `src` 修复后新用例两个视口都失败，装回即通过。合并 main `422902b`，`npm test` 5428/59、`check:data` 786/8、`build`、`visual` 46 条通过；仅 Chromium 触屏模拟验证，尚未在实体安卓机上复测。
- [EOLR](tasks/EOLR.md) 桥式 EOLR 51 情形（9 个 EO 行：3/1 8、2a/2 7、4/0 4、2o/2 6、2o/0 6、0/2 4、2a/0 7、1/1 6、4/2 3），其中 20 张 BAD CASE 用虚线卡与标签标出：每条情形显式保存 `setup`、`targetTier`、接续公式和来源映射，`caseState` 从 `setup` 起手（旧 386 条仍走原路径），`algSolvesCase` 用 `eolrGoal`，`caseFingerprint` 用 `inspectEolr(...).key`；`EOLR_RULE` 保护两桥 26 张、`allowedBases: 'MU'`，只在完成 EO 的 Tier 2/3 与完整接续终点要求平面中心。短公式分层 Tier 1 50 / Tier 2 1，全部 51 条接续逐帧保护两桥并到达严格 EOLRb（最长 12 步）；4 条前缀（3/1-5、3/1-7、3/1-8、2o/0-5）明确标为计算补全，3/1-7 保留倾斜中心相位 1 不 normalize。详情页「接续 4b」开关保留当前帧与播放位置，自定义公式时禁用；练习 `/practice?set=eolr` 接 12 种 M 棱置换与 Tier 2 四种 AUF，题目目标标明化归中间态 / 底层双槽 / 归位。图解改为六槽示意（坏棱粗框、LR 可见/背向标记、DF/DB 标注），不新增图片。`eolr.names.test.ts` 134 行逐条对照 Bas 速查表，`build-cases.mjs` 重跑与 `src/data/eolr.ts` 字节一致。独立交叉：Bas 2023-08-04 速查表的 48 条加粗公式在页面文本中逐条命中，9 行分类与 20 张 BAD CASE 对齐，51 条层级用不依赖 `src/lib/eolr.ts` 的独立脚本重算为 50/1、0 问题。fast-forward 合并 main `972e1c8`，`npm test` 6198/60、`check:data` 1097/9、`build`、`visual` 54 条通过；规格见 `EOLR.md`，交付记录见 `EOLR-implementation.md`，决策见 D23。实体安卓机尚未实测。

## 待确认（不建任务）

- **T30：** 非白底时，练习页说明里“起手朝上的是底色”这个说法是否要换。等用户定。
- **真机复核：** T21、T22、T24、T26–T30、T32、T56、T58、T60a、T60b、T61、T62、T63、T64、T65、T68、T69（OLL 4/13/55、PLL Z、OLL 50 在 320/390 下显示括号、长公式换行且不横向滚动；oll-22 不显示括号是预期）、UI-home、UI-polish、UI-home-decks。
- **T56 未验证：** 真实浏览器里 SW 注册后的注销、缓存名和导航行为（内置浏览器里 SW 没注册，只有替身单测，缓存名只核对了构建出的 Workbox 命名规则）；微信/X5 真机。已知限制：没有 30 分钟定时（持续前台不切换时发现不了新版，靠手动检查）；每次部署（含只改文档的）都会让旧页面看到新版提示；更新提示条对 T48 首屏预算的影响已由 T56-fix 处理（提示条不在详情页和练习页显示）；遗留：320×640 的 PLL Ga（长公式）提示条底部 590 在底栏顶部 568 下面，是 T48 原有的矮屏问题，不是 T56 造成的，需要的话单独开任务。
