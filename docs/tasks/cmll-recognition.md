# 三阶 CMLL 识别提示

2026-11-18，基线 `5219b16`，在 `codex/ui-lab-polish` 实现。

## 交付

- 桥式 CMLL 的 42 个情形在详情页显示识别提示。先看顶色落在哪些角的哪些面，再比对一到两对角贴纸的同色、对色或相邻色。四角顶色都朝上时，直接看侧面两个顶角有没有同色。
- 从详情页的公式起手推导贴纸位置，沿用顶视图朝向和桥式配色。切换备选公式时，图解与提示一起更新。
- 手机上可以通过播放器下方的“识别与公式”跳到提示。宽度不超过 360px 时，将 CMLL 收藏移至返回行，为标题和首屏入口留出空间。
- 原公式、情形 ID 和 `SET_RULES` 保留。入口文案分支的既有断言按 D34 更新，原几何和交互断言保留。

角朝向和侧面同色识别参考 [The Roux Reader](https://book.rouxers.com/en/cmll.html) 与 [athefre 的 CMLL 指南](https://sites.google.com/site/athefre/roux/cmll-prediction)，分组参考 [SpeedCubeDB](https://speedcubedb.com/a/3x3/CMLL)。单个情形的提示由站内公式推导。

## 验证

- 数据测试覆盖 42 个情形的内置公式、四种 U 层摆法和 24 种桥式配色，检查每条识别提示与实际角贴纸相符，并能区分同形情形。
- 浏览器用例覆盖 320×640 深色和 390×844 浅色，检查入口避开底栏、替换桥式配色和备选公式后图解与提示一致，以及页面没有横向滚动。

| 门禁 | 结果 |
| --- | --- |
| `npm test -- --maxWorkers=2` | 7477 条 / 74 文件通过 |
| `npm run check:data` | 1294 条 / 16 文件通过 |
| `npm run build` | 类型检查、Vite、PWA 构建通过 |
| `npm run test:visual -- --workers=2` | 150 条通过，使用独立本地端口 |
