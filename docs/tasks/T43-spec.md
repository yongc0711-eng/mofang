# T43 方案卡：上下滑动到顶/底的“弹性”反馈

状态：方案卡已审，用户选了“Android/Windows 也要”，已按方案 B 实现，见文末“实现记录”。

## 1. 现状（先看代码，再看各端）

### 代码里和滚动有关的全部事实

| 位置 | 内容 | 影响 |
| --- | --- | --- |
| `src/styles.css:47-48` | `html`、`body` 没有 `overflow`、`height`、`overscroll-behavior` | 滚动的是**文档本身**，浏览器的原生行为原样生效 |
| 全文搜索 `overscroll` | 0 处 | 没有人关过原生回弹/下拉刷新 |
| `styles.css:63-70`（手机再覆盖 `:428-437`） | `.nav` 是 `position: fixed`，手机上还有 `transform: translateX(-50%)` | 底栏不随文档滚动；见 §3 B 的风险 |
| `styles.css:78`、`:448` | `main` 底部留白，避免被胶囊挡住 | 长页能滚到底 |
| `styles.css:188-196` | `.practice` 的 `min-height: calc(100dvh - …)`，`.practice-pad` 有 `touch-action: none`、`flex: 1`、`min-height: 60vh` | 练习页**几乎刚好一屏**，手指落在 pad 上时浏览器不会把手势当成滚动 |
| `styles.css:332-333` | `.player-stage { height: min(46vh, 340px); touch-action: none }` | 手指落在 3D 画面上不滚文档，只拖魔方 |
| `styles.css:97` | `.chips { overflow-x: auto }` | 横向滚动的内层容器；竖向手势仍可滚动文档 |
| `styles.css:226`、`App.tsx:76-78` | `.route` 每次换页有 0.22s 进场动画（`route-in`） | `main` 里已经有 transform/动画，B 方案要避开 |
| `App.tsx:90-99` | `<Nav />` 和 `<main>` 是兄弟节点 | 对 `main` 做 transform 不会影响 `.nav` 的 fixed（见 §3 B） |
| `styles.css:476` | 宽屏 `.player` 是 `position: sticky` | 在 `main` 里做 transform 时 sticky 的表现要测 |

没有任何一行把 `overflow` / `touch-action` / `height` 写错来“关掉”回弹，所以 **§5 没有一行补丁**：现在没有弹性反馈不是 bug，是各端原生行为不同。

### 各端表现（按“长页滚到边界 / 短页不能滚 / 内层滚动”拆开）

我在这台机器上只有桌面浏览器，**没有 iPhone 和 Android 真机**，下表“预期”来自平台的通常行为，必须真机确认（§6），不要当成已验证。用户用哪个端我也不假设，所以三个端都写。

| 情形 | iPhone Safari / 主屏 PWA | Android Chrome / PWA | 桌面 |
| --- | --- | --- | --- |
| 长页滚到顶/底 | 预期**已有原生回弹**（文档滚动 + 没关 overscroll），跟手、有阻尼、松手回弹；PWA（standalone）同理 | 没有回弹。Android 12+ 系统可能有拉伸效果，较早系统是发光；在顶部下拉，浏览器可能触发下拉刷新（PWA 也可能） | macOS 触控板 Safari/Chrome 有弹性；Windows 鼠标滚轮、触控板没有 |
| 短页（内容不足一屏，`main` 没有溢出） | **不确定**：iOS 对不可滚动的文档是否回弹要看版本和 Safari/PWA，需要真机 | 没有 | macOS 触控板：文档不可滚时一般不弹；Windows 没有 |
| 内层滚动（`.chips` 横向） | 横向在 chips 内滚，到头时回弹的是 chips 本身（原生）；竖向手势穿透到文档 | 横向到头有发光/拉伸；竖向穿透到文档 | 同左 |
| 手指落在 `.practice-pad` / `.player-stage` | `touch-action: none`：文档**不滚、也不回弹**（Safari 对 `touch-action: none` 的支持是 13+，会生效） | 同左，不滚 | 滚轮落在上面仍会滚文档（`touch-action` 只管触摸） |

结论：**iOS 原生回弹大概率已经存在**（待真机确认）；Android Chrome 和 Windows 桌面原生没有，CSS 也造不出来；练习页和 3D 播放器上方的触摸本来就不滚，不该有弹性。

## 2. 目标（验收口径）

1. 文档级滚动到顶/底时：内容跟手位移，有阻尼，松手回弹。
2. 固定底栏（手机胶囊 / 宽屏顶栏）**不跟着位移**。
3. 不改变滚动位置（`scrollY`）和练习会话（计时、题目、`practiceSession`）。
4. 不和练习点击（`.practice-pad` 的按住/松手）、3D 拖拽（`.player-stage`）、横向 `.chips` 抢手势。
5. `prefers-reduced-motion: reduce` 下关闭（自绘方案）；原生回弹由系统控制，不在页面范围。

## 3. 方案

### A. 只用原生 / CSS —— **结论：不够，且不需要为它写 JS**

CSS 能做的只有这几件，逐个说明：

- `overscroll-behavior-y: auto`（默认值，现状）：iOS 保留原生回弹，Android 保留发光 / 下拉刷新。**不用改，已经是这样。**
- `overscroll-behavior-y: contain` / `none`：只能**关掉**下拉刷新或回弹（`none` 在 iOS 16+ 还会去掉文档的回弹），**不能新增**弹性。所以它不能满足“Android / Windows 也要有”。
- 滚动容器方案（把 `html, body { height: 100%; overflow: hidden }`，让 `main` 成为 `overflow-y: auto` 的内层容器）：内层滚动容器在 iOS 上自己带回弹，在 Android 上依然没有。收益只在 iOS，而且 iOS 文档本身已经有；代价是大改：`position: sticky`、固定导航、`100dvh`、地址栏收起行为、`touch-action` 都会重新测，风险大于收益。**不推荐。**
- 让短页也能回弹的小技巧（例如 `main { min-height: calc(100dvh + 1px) }`）：只可能在 iOS 上让短页多 1px 滚动距离来触发回弹，会让所有页面多出一个可滚动的 1px，影响练习页（本来刚好一屏），也不解决 Android。**不推荐，除非真机确认 iOS 短页确实不回弹且用户在意。**

所以：

- 如果用户**只用 iPhone（或 Mac）**：A 就是“什么都不改”，原生已经有。**不需要 JS，关闭任务**，只需要真机确认一次（§6）。
- 如果用户要 **Android 或 Windows** 也有：A 做不到，必须 B。

**需要用户回答的唯一问题：你主要在哪个端用？Android / Windows 是否也要有弹性？** 回答前建议只做 §6 的真机确认，不写代码。

### B. 自绘（transform + 边界检测 + spring）—— 只有用户要求 Android/Windows 时才做

**做法**

- 新增 `src/lib/rubberBand.ts`（纯函数，可单测）：
  - `damp(delta, limit)`：阻尼，位移 = `limit * (1 - 1/(delta/limit * 0.55 + 1))` 之类的单调函数，上限约 80px；
  - `spring(state, dt)`：松手后的回弹，临界阻尼，位移小于 0.5px 时归零并结束 rAF。
- 新增 `src/components/RubberBand.tsx`：只包 `main` 里的内容容器（`.route`），不包 `<Nav />`，不包 `body` / `#root`。
  - 触摸：`touchstart` 记录起点；`touchmove` 里**只在** `scrollY <= 0 且向下拉`、或 `scrollY + innerHeight >= scrollHeight - 1 且向上拉` 时接管，`preventDefault()`（需要 `{ passive: false }`），位移走 `damp`；`touchend` 用 `spring` 回到 0。
  - 滚轮：只在 Windows 鼠标滚轮 / 触控板到边界时用 `wheel` 事件累加位移，空闲 120ms 后回弹；macOS 已有原生弹性，要检测并跳过（否则双重弹性）。
  - 位移用 `transform: translate3d(0, y, 0)` 设在内容容器上，`will-change` 仅在位移非 0 时设。
- 改动文件：`src/lib/rubberBand.ts`（新）、`src/components/RubberBand.tsx`（新）、`src/App.tsx`（在 `<main>` 里包一层）、`src/styles.css`（`prefers-reduced-motion` 与 `overscroll-behavior-y: none`，见下）、对应测试文件。

**为什么固定底栏不会位移**：`<Nav />` 与 `<main>` 是兄弟节点（`App.tsx:90-99`），transform 只加在 `main` 内部的容器上，不会成为 `.nav`（fixed）的包含块。**绝不能**把 transform 加到 `body`、`#root` 或同时包含 `<Nav />` 的元素上，否则 fixed 会变成相对于它定位，底栏会跟着位移或错位。

**配合 CSS**：给文档加 `overscroll-behavior-y: none`，关掉 Android 的下拉刷新 / 发光和原生回弹，避免与自绘叠加；代价是 iOS 16+ 的原生回弹也被关掉（所以自绘必须在 iOS 上也接管）。这一点要真机验收，是 B 最大的联动风险之一。

**手势冲突怎么避开**

- `.practice-pad`、`.player-stage`：事件目标在这两个元素内（`closest('.practice-pad, .player-stage')`）就不接管，保持现有 `touch-action: none` 的行为。
- `.chips`：横向手势（`|dx| > |dy|`）不接管；`.chips` 内起手的竖向手势照常处理。
- 练习点击：不接管时不 `preventDefault`，所以 `pointerdown/up` 不受影响；位移期间的 `click` 不会被吞（只在 `touchmove` 里阻止默认，不阻止 `touchend`）。
- 3D 拖拽：同上，目标在 `.player-stage` 内直接退出。

**风险**

1. `preventDefault` 需要非被动监听器，写错会让整页滚动变卡或根本不滚（回归风险最高）。
2. iOS 地址栏收起、`100dvh` 变化、橡皮筋与自绘叠加会抖动。
3. `main > .route` 已有进场动画 `route-in`（`styles.css:226`），位移 transform 要加在**内层**容器，不能和它抢同一个 `transform`。
4. 宽屏 `position: sticky` 的 `.player` 在带 transform 的祖先里是否正常，需要实测。
5. 练习会话不受影响的前提是：位移只改样式，不触发 React 状态（用 ref + 直接写 `style.transform`，不 `setState`）。
6. 电量与性能：只在位移非 0 时跑 rAF。

**测试方式**

- 单测：`damp`、`spring` 是纯函数，测单调性、上限、收敛到 0、`dt` 很大时不发散。
- 边界检测写成纯函数 `shouldCapture({ scrollY, innerHeight, scrollHeight, dy, target })`，测：中间不接管、顶部下拉接管、底部上拉接管、目标在 `.practice-pad` / `.player-stage` / 横向手势时不接管、`prefers-reduced-motion` 时不接管。
- 源码接线测试（`?raw`）：`App.tsx` 里 `RubberBand` 只包 `main`，不包 `Nav`；`styles.css` 里有 reduced-motion 关闭。
- 真机手测清单（§6）。jsdom / node 里没有真实的触摸滚动，不能代替。

**怎么回退**：`App.tsx` 去掉一层包装（一处改动）即可，`styles.css` 里的 `overscroll-behavior-y: none` 一并去掉；`rubberBand.ts` 保留也无副作用。可以做成设备设置里的开关（`devicePrefs`，默认关，先给一台设备试用），出问题用户自己关。

## 4. 建议

1. **先不写代码**，用 §6 在用户的真实设备上确认现状；
2. 用户只在 iPhone / Mac：关闭任务（原生已有，A 即“不改”）；
3. 用户需要 Android / Windows：做 B，但作为**设备设置里的可选开关，默认关**，第一版只做触摸 + 顶/底两端，滚轮放第二步。

## 5. 精确补丁

根因不是某一行的 `overflow` / `touch-action` / `height` 写错，**没有一行补丁可给**。唯一接近的是“把 `touch-action: none` 去掉让练习页也能滚”，但那会破坏按住 / 松手计时和 3D 拖拽，不建议。

## 6. 需要用户做的真机确认（不改文件）

在每个会用到的设备上，用主屏 PWA 和浏览器各试一次：

1. 公式组页（长页）：到顶下拉、到底上拉，是否跟手回弹？底栏是否不动？
2. 首页或「我的」若内容不足一屏：是否还能下拉回弹？
3. 练习页：手指落在 pad 上上下拖，是否不滚、不误触发开始 / 停止？
4. 公式页：手指落在 3D 魔方上拖，是否只转魔方？
5. Android：顶部下拉是否触发浏览器刷新？

把结果回给我，再决定走 A（关闭）还是 B。

## 实现记录（用户回复“Android/Windows 也要”后做的方案 B）

分支 `claude/t43-rubber-band`（从 main 767f234），未合并、未 push。

- 新增 `src/lib/rubberBand.ts`（`damp`/`undamp`/`stepSpring`/`atEdgePull`/`canCaptureFrom`，纯函数）、`src/components/RubberBand.tsx`、`src/store/rubberBandPref.ts`；改 `App.tsx`（只包 `<main>` 里）和 `MePage.tsx`（“页面弹性”开/关）。
- **和方案卡的两处不同：**
  1. 开关**默认开**（用户明确要，关掉在「我的」里，是回退手段），不是默认关。
  2. 滚轮（Windows）和触摸一起做了，没有留到第二步。macOS 触控板（UA 含 Mac 且无触点）跳过滚轮，用系统自带的。
- 开关单独一个键 `mofang.device.rubberBand.v1`，没有放进 `DevicePrefs`：这样不用改 `devicePrefs.test.ts` 里一批严格相等的断言。同样按设备、不进备份。
- 开启时给 `<html>` 设 `overscroll-behavior-y: none`，关闭/卸载时还原；位移只写 `style.transform`（静止时清空，不留 transform，不影响 sticky 和 fixed）。
- 不接管：`.practice-pad`、`.player-stage`、`.chips`、输入控件里起手的手势；横向手势；多指；`prefers-reduced-motion`。
- 测试：`src/lib/rubberBand.test.ts` 新增 19 项。

### 验收
`npm test` 3177 通过（基线 3158，新增 19 项测试），`check:data` 393，`build`、`tsc` 通过。

### 已在桌面浏览器里验证（用合成事件）
- 组页顶部滚轮向上：被接管，约 25px 位移，1.5s 后回到无 transform；底部同理；中间、顶部向下滚不接管；`scrollY` 不变；`.nav` 位置和自身 transform（`translateX(-50%)`）不变。
- 触摸：顶部下拉被接管并有阻尼（拉 200px 位移约 44px）；往回拖过起点释放；在 `.chips` 里起手不接管；练习页 pad 里触摸和滚轮都不接管。
- `<html>` 的 `overscroll-behavior-y` 为 `none`。

### 没有验证的（必须真机）
- iPhone Safari / PWA、Android Chrome / PWA 上的真实手感：是否跟手、是否和浏览器自己的回弹 / 下拉刷新冲突、`overscroll-behavior-y: none` 在这些端是否生效。
- 合成事件不等于真实触摸滚动：惯性滚动（fling）撞到边界这条路径没测。
- 宽屏 `position: sticky` 的 `.player` 在位移期间的表现只看了代码，没看画面。
- 触控板（Windows 精确触控板）惯性滚轮事件在回弹后是否再次触发位移，需要手感确认。

## 进展

- 2026-11-07：方案卡完成；随后按用户选择实现了方案 B（分支见上）。
