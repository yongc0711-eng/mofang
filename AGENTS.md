# 魔方公式站

个人使用的三阶魔方公式查询和练习网站，收录 CFOP（F2L/OLL/PLL）和桥式 Roux（CMLL/LSE）。手机优先，部署为可离线的 PWA，推送到 `main` 会自动发布到 GitHub Pages。界面语言是中文。

新会话先读：本文件、`docs/TASKS.md`、`docs/decisions.md`。

## 常用命令

- `npm run dev`：本地开发，端口 5173
- `npm test`：全部测试
- `npm run check:data`：只校验公式数据
- `npm run build`：类型检查并打包

git 报 dubious ownership 时，用 `git -c safe.directory=D:/allwork/mofang ...`，不要改全局配置。

## 硬约束

1. **不得为了通过测试而放宽 `SET_RULES`。**
2. **不得为了通过测试而删除或放宽现有测试，可以新增。** 不得 skip、todo 或放宽现有断言。确需改语义时，先在 `docs/decisions.md` 记录原因再改。
3. **不得改已录入情形的 `id`。** 用户数据以它为 key。

## 结构

- `src/lib/cube.ts`：贴纸级魔方引擎，转动由几何旋转生成
- `src/lib/alg.ts`：公式解析
- `src/lib/cases.ts`：每个公式组的规则 `SET_RULES`（显示掩码、已解决判定、不变量）和校验函数
- `src/lib/timeline.ts`：播放时间线，任意时刻的画面都由时间算出
- `src/lib/practice.ts`：练习模式的打乱和出题
- `src/data/*.ts`：公式数据，`index.ts` 汇总公式组
- `src/data/*.test.ts`：数据校验
- `src/store/userStore.ts`：进度、收藏、自定义公式、练习用时，存在 localStorage，靠导出/导入跨设备迁移
- `src/store/devicePrefs.ts`：按设备保存的显示设置，不进备份
- `src/components/CaseDiagram.tsx`：由公式推导的 SVG 图解
- `src/components/CubePlayer.tsx`：3D 播放器和控制条
- `src/components/CubeScene.ts`：Three.js 渲染层，动态加载，只管画，不含播放逻辑
- `src/pages/`：路由页面，使用 HashRouter

## 约定

- 不要添加图片素材或手写魔方状态，图解和情形都由公式推导。
- 配色固定黄顶绿前（U 黄、F 绿、R 橙、L 红）；2D 图解和 3D 播放器必须一致。理由见 D2、D4。
- 公式必须通过 `npm run check:data`。
- 校验器证明公式“能解决这个情形”，但不能证明“情形编号和名字是对的”。录入时要对照公认资料核对名称。
- 所有颜色用 `styles.css` 里的 CSS 变量，同时适配浅色和深色模式。手机宽度下不能横向滚动，触控目标不小于 32px。
- 不变量的理由和历史记在 `docs/decisions.md`，任务记在 `docs/TASKS.md`。规则只写在本文件，不要在别处再存一份。

## 分工

Claude 账号目前不可用，不再担任 Lead；新会话按下面的分工执行。

- **Lead**：Gemini 4 / Antigravity。负责架构、魔方引擎、校验规则、任务拆分与规格、审查实现，维护 `docs/TASKS.md`；合并前必须经过 Auditor 的独立门禁。
- **Executor**：Codex。按任务实现、跑门禁、写 `docs/tasks/<id>.md`；交付时不合并、不 push。
- **Auditor / Release**：独立复核实现与测试，确认没有放宽 `SET_RULES` 或测试，跑门禁；通过后合并、push。不得和 Lead 在同一轮里自写自审。
- **Router**：用户。定方向、优先级和最终发布批准。
