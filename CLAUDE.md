# 魔方公式站

个人使用的三阶魔方公式查询和练习网站，收录 CFOP（F2L/OLL/PLL）和桥式 Roux（CMLL/LSE）。手机优先，部署为可离线的 PWA。界面语言是中文。

## 常用命令

- `npm run dev`：本地开发，端口 5173
- `npm test`：全部测试
- `npm run check:data`：只校验公式数据
- `npm run build`：类型检查并打包

## 结构

- `src/lib/cube.ts`：贴纸级魔方引擎，转动由几何旋转生成
- `src/lib/alg.ts`：公式解析
- `src/lib/cases.ts`：每个公式组的规则 `SET_RULES`（显示掩码、已解决判定、不变量）和校验函数
- `src/data/*.ts`：公式数据，`index.ts` 汇总公式组
- `src/data/data.test.ts`：数据校验
- `src/store/userStore.ts`：进度、收藏、自定义公式，存在 localStorage，靠导出/导入跨设备迁移
- `src/components/CaseDiagram.tsx`：由公式推导的 SVG 图解
- `src/lib/timeline.ts`：播放时间线，任意时刻的画面都由时间算出
- `src/components/CubePlayer.tsx`：3D 播放器和控制条
- `src/components/CubeScene.ts`：Three.js 渲染层，动态加载，只管画，不含播放逻辑
- `src/store/devicePrefs.ts`：按设备保存的显示设置，不进备份
- `src/pages/`：路由页面，使用 HashRouter

## 约定

- **图解和情形都由 `algs[0]` 推导**，不要添加图片素材或手写状态。
- **公式必须通过 `npm run check:data`**。不要为了通过测试而放宽 `SET_RULES` 或删除校验；改这些规则前先说明原因。
- 校验器证明公式“能解决这个情形”，但不能证明“情形编号和名字是对的”。录入时要对照公认资料核对名称。
- 配色约定是黄顶绿前。2D 图解和 3D 播放器必须一致。
- 用户数据的 key 是情形 `id`，已录入的 `id` 不要改。
- 所有颜色用 `styles.css` 里的 CSS 变量，同时适配浅色和深色模式。手机宽度下不能横向滚动，触控目标不小于 32px。

## 任务

待办和分工见 `docs/TASKS.md`。
