# UI-home-deck-tap：滑动后第一次轻点进入

## 问题与复现

2026-11-12，用户反馈安卓手机浏览器在首页翻到下一个分组后，要点两次才能进入。

基于 `main` 的 `f9a6ded`，在 `codex/home-deck-tap` 实现。使用 Chromium 移动触屏模拟，在 320×640 和 390×844 下，以单个 touchmove 翻卡，等待归位及额外 300ms，再轻点当前入口。修改前两种尺寸均失败：第一次轻点产生 pointerdown / pointerup / touchend，但没有原生 click；第二次才进入。目标命中正确入口，等待更长时间和避免归位时写样式均不能解决。

## 修复

- 原实现仅在 pointermove 上 preventDefault，未取消对应的原生 touchmove。对照实验中，取消纵向滑动的 touchmove 后，下一次轻点恢复原生 click。
- 仅在首页卡堆注册可取消的原生 touchmove 监听器；沿用已有手势状态，纵向位移超过 9px 且超过横向位移的 1.1 倍时才 preventDefault。监听器随组件卸载清理。
- 动画和判定继续由原 PointerEvent 逻辑处理；正常轻点仍走真实 Link 和浏览器 click，不增加延迟、模拟点击或手动导航。
- 展开列表没有翻卡手势，因此不会取消其原生 touchmove。卡堆外滚动不受此监听器影响。
- 不改数据、公式、ID、SET_RULES、路由、播放器、3D、练习、配色、CSS 或发布工作流。

## 回归覆盖

`e2e/home-decks.spec.ts` 新增一项检查，在两个视口各运行一次（共增加 2 条）：

- CFOP / 桥式均覆盖单个 touchmove 翻卡，等待归位后首次真实触屏轻点进入 F2L / CMLL。
- 同时检查正常动效与 reduced-motion；滑动松手不自动导航，进入后结果数量正确。
- 浏览器返回一次即回到首页，保留当前卡位，不产生重复导航历史，无横向滚动。
- 所有原测试与断言保留，包括连续快滑、接管未完成动画、1:1 跟手、取消/轻微拖动、防误触、展开/收起、键盘焦点和详情播放器门禁。

## 验证结果

| 命令 | 结果 |
| --- | --- |
| `npm test` | 5428 条 / 59 文件通过 |
| `npm run check:data` | 786 条 / 8 文件通过 |
| `npm run build` | TypeScript、Vite、PWA 打包通过 |
| `npm run test:visual -- --workers=2` | 46 条通过，无 skip（原 44 + 新增 2） |

补充真实触摸输入检查：320 / 390 下，翻卡归位后第一次触屏轻点“展开全部”均成功；展开后纵向触摸滚动分别产生 85px / 58px 的页面滚动，四次 touchmove 均未被 preventDefault，没有误导航或横向溢出。

以上为移动 Chromium 触屏模拟，尚未在用户实体安卓设备上复测。

只交付实现、回归测试和本文档；不合并、不 push。
