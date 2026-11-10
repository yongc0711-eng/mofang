# 任务

## 当前状态（2026-11-11）

- **分工：** Lead = Gemini 4 / Antigravity；Executor = Codex；Auditor / Release = 独立复核者；Router = 用户。Claude 账号不可用，旧分工不再适用；细则见 `AGENTS.md`。
- **公式数据：** 254 条已录完：F2L 41、OLL 57、PLL 21、CMLL 42、LSE 93。来源见 `docs/decisions.md` 和各数据文件开头。
- **功能：** 列表、搜索、进度、收藏、自定义公式、备份导入导出、练习模式都已完成。
- **3D 播放器：** Three.js 版已合并并上线，cubing.js 已移除。
- **图解：** 所有 OLL 的 2D 图解固定只显示顶层的 9 张颜色（公式页、卡片、练习页、首页封面）；OLL 的 3D 和其他组一样，默认完整魔方，开“只看相关的块”后只显示顶层 21 格（T27 把两者合成一个设置，T32 修正）。外面的图解（卡片、首页封面、练习页）按主公式的起手画，和详情页一致（T33）。六色底同时作用于公式页 3D 和所有 2D 图解、练习页说明，见 T28–T30。T60a 把浏览配色按 CFOP / 桥式拆成两份设备偏好；T61 又把首页和练习的入口收成各一个，点开是带 CFOP / 桥式两个 tab 的弹窗；T62 把首页入口移到标题行右侧；T63 再把入口收成搜索框右侧的 44px 圆形按钮，搜索框缩短并改为胶囊圆角；T64 把五张方法卡改成独立卡片并加上圆形箭头，方法标题只留名称；T65 再把卡片加高到 68/78px，并把全站有框组件换成 14–24px 的大圆角；T69 全局关闭长按文字选择，只保留公式、输入框和可编辑区域；T70 加 320/390 的 Playwright 视觉冒烟并接进部署 CI。
- **部署：** 推送到 `main` 自动发布，已确认可以打开：https://yongc0711-eng.github.io/mofang/
- **基线：** `npm test` 3748/56 项全过，`npm run check:data` 393 项全过，`npm run build` 通过；`npm run test:visual` 16 条 Playwright 冒烟全过。
- **识别要点：** PLL（T13）和 OLL（T14）已重写，有非空/互异/特征测试；OLL 识别文字里的「黄」随顶色变化（T29）；F2L、CMLL、LSE 还没有 recognition。

任务详细记录可以用 `docs/tasks/_template.md` 建文件。编号只增不复用，T1–T70 已用过（T67 预留给 T15 UL/UR 文档；T34–T55 的记录见 `docs/tasks/`，本文件没有逐条补）。

## 未完成

目前没有未完成任务。

## 已完成（T15、T16、T21–T30、T32、T33、T56、T58、T59、T60a、T60b、T61、T62、T63、T64、T65、T66、T68、T69、T70、UI-polish；T56-fix 已合并）

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
- [UI-polish](tasks/UI-polish.md) 公式列表与详情页视觉打磨：列表筛选/分类/空结果、卡片 64px 图解与状态文字、详情单图 64px 与收藏上移；LSE 双图改为 132×64 并排、各 64×64，320 收藏放到返回行右侧；`peek-cue` 改为 accent-soft 按钮感，320 列表卡片 padding 12 / 间距 10。3748/56、393、build、visual 16 条通过；待合并。

## 待确认（不建任务）

- **T30：** 非白底时，练习页说明里“起手朝上的是底色”这个说法是否要换。等用户定。
- **真机复核：** T21、T22、T24、T26–T30、T32、T56、T58、T60a、T60b、T61、T62、T63、T64、T65、T68、T69（OLL 4/13/55、PLL Z、OLL 50 在 320/390 下显示括号、长公式换行且不横向滚动；oll-22 不显示括号是预期）、UI-home、UI-polish。
- **T56 未验证：** 真实浏览器里 SW 注册后的注销、缓存名和导航行为（内置浏览器里 SW 没注册，只有替身单测，缓存名只核对了构建出的 Workbox 命名规则）；微信/X5 真机。已知限制：没有 30 分钟定时（持续前台不切换时发现不了新版，靠手动检查）；每次部署（含只改文档的）都会让旧页面看到新版提示；更新提示条对 T48 首屏预算的影响已由 T56-fix 处理（提示条不在详情页和练习页显示）；遗留：320×640 的 PLL Ga（长公式）提示条底部 590 在底栏顶部 568 下面，是 T48 原有的矮屏问题，不是 T56 造成的，需要的话单独开任务。
