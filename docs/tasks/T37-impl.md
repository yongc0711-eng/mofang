# T37 实现：求解器训练打乱与实际终态图解

## 交付与基线

- 工作树：`D:\allwork\mofang-codex`；基线 `main@6074fbb`。
- 分支：`codex/t37-practice-state`；不合并、不 push。
- 从干净源码基线建立分支，先执行 `npm test`：17 个文件、1333 项通过。
- 开始时已有未跟踪的 T35.md / T37-spec.md，先用限定路径 stash 保存；交付时恢复原文件，不纳入实现提交，也不改写方案原文。

## 问题与结果

旧练习输出教学公式的等价逆串，并前置随机 U；2D 却画固定 caseState。底色设置只换绘图配色，没有成为固定白顶绿前起手的生成输入，实际摆法、AUF 和图可能不一致。

新题先采样合法目标，将选定底色映射到物理白顶绿前坐标，由 worker 求解目标，再逆转**求解器的解**得到训练串。主线程复验整颗 54 张贴纸后，才同时发布训练串和实际终态图。生成中没有可启动的计时 pad；失败/15 秒超时显示“准备失败”和重试，绝不输出旧逆公式作 fallback。

## 模块与兼容边界

- `practiceSample.ts`：T33 reference → 合法目标。继续使用 practiceViewFor 的 view 选择与内部转体回退。保留旧同步接口和测试；其 reference 串只用于识别本题所抽 AUF，不显示、不持久化为新训练串。四个旧 reference 候选与之匹配后，在 caseState(view) **末尾**施加选中 U，而非将旧前置 U 当成末态 AUF。caseState 是既有类别来源，未改变 algs[0]。
- OLL/CMLL 在施加 AUF 前，从 identity、Ua、Ua² 三种合法末层棱排列中抽样；Ua 来自现有 PLL 数据推导，不手写状态，不改四角、F2L 或 Roux 左右块。OLL 的顶色位置保持同一类别。PLL 取四种 AUF；F2L/LSE 不添加随机 U。
- 这是**有限合法目标采样**，不是所有合法状态的均匀采样。F2L/LSE 目前每个基础 view 只有一个目标；求解器生成其路径。不能宣传成 WCA random-state。
- `practiceTarget.ts`：坐标契约、中心偏移分离、逐贴纸与物理颜色验证。没有 normalizeRotation。
- `practiceSolver.worker.ts`：独立 worker 内引入 min2phase；只接收目标状态和底色，不接收教学公式。
- `prepareSetup.ts`：请求时才创建 worker；每题独立初始化；成功、异常、取消、超时均终止 worker。新请求/离页取消旧请求，过期结果不能发布题目。
- `practiceInstructions.ts`：新题恒定白顶绿前起手，观察持法与串分开说明；标明 Roux 中心偏移照图保留。
- `CaseDiagram` / `diagramColors` 新增可选只读 `state`。不传时仍走原 caseState/displayColors；传入时只替换取色状态，掩码、调色与 Top/Iso/Lse SVG 布局完全沿用。
- `PracticePage` 将选题 reference 和已完成题目分开；只有生成/回放成功的题目能显示、计时和保存。新题取底色快照，去设置页换色不重染、不重新生成当前题。
- `practiceSession` 只扩展 question 的可选 prepared 载荷并验证；T21 的 elapsedOf/start/stop/resume/freeze、后台、同文档、重载、心跳语义未改。

没有修改：公式数据、ID/名称/algs[0]、cases.ts/SET_RULES/合法性/掩码、practice.ts、CaseCard、详情播放器、样式、TASKS.md；没有修改任何既有测试。

## 坐标契约

state[position] = 原始贴纸 ID，全部比较为 54 张身份贴纸，不只比较颜色或 mask 可见部分。引擎仍是原黄顶绿前逻辑坐标，没有改引擎。

令 `compose(a,b) = b.map(id => a[id])`，表示 a 后接 b。T 为采样后的逻辑观察状态；A 为固定物理白顶绿前到所选观察框架的整体持法。

| 底色 | A（仅观察，不写进打乱串） | 基础观察 U / D / F |
| --- | --- | --- |
| 白 | z2 | 黄 / 白 / 绿 |
| 黄 | 不转 | 白 / 黄 / 绿 |
| 红 | z | 橙 / 红 / 绿 |
| 橙 | z' | 红 / 橙 / 绿 |
| 绿 | x z2 | 蓝 / 绿 / 黄 |
| 蓝 | x y2 | 绿 / 蓝 / 白 |

物理目标 B = A · T · A⁻¹。求解得到的训练串 S 从白顶绿前还原态到达 B。严格断言 S · A = A · T，并独立断言物理白顶配色下观察所得颜色 = T 经现有 displayFace(bottom) 得到的颜色。不存在事后搜索朝向“凑相同”。训练串不含 x/y/z。

### Roux 中心偏移

标准 face-turn 求解器不能直接处理移动中心。对 B 寻找明确的 C ∈ {identity, M/M2/M', E/E2/E', S/S2/S'}，使 B · C 的六中心回到固定位置；求解 B · C，最后输出 inverse(solution) · C⁻¹。最后的 slice 动作是真实输出动作，恢复了完整目标的中心偏移，**没有丢弃或归一化中心**。

254 条现有基础情形的六底色都能分离到上述集合，CMLL/LSE 的原始偏移完整保留。任意未来自定义状态若需要多轴中心修正，本轮未覆盖，会明确准备失败。基础观察表是块/配色参考，不承诺偏移后的中心仍在该表位置。

## 恢复与迁移

- 新题 prepared 保存版本 1、完整 state、bottom、solver scramble、observation；恢复时再次校验训练串和目标 54/54 相等。状态已经完整确定，不需要重抽随机数或种子。
- 设备底色后续改变不影响该题；下一题才读取新底色。
- 旧会话没有 prepared：原 id/alg/scramble/计时保留，不重抽，不调用 solver 改题，也不给它补猜出的 bottom。继续原参考图路径，并显示“旧版会话、原底色未知”的提示；其配色/说明只是当前设置的旧版参考，不承诺与实物一致。下一题使用新路径。
- 损坏的 prepared 丢弃为旧版参考模式，保留原题与计时，不静默重生成。计时冻结/继续仍完全由 T21 决定。
- 尚在准备、未发布的新题不进入会话存储；若此时刷新，最多恢复上一个已保存题目（或返回练习设置），不会把未验证 reference 当成新训练串。未实现跨刷新恢复 worker 中间准备进度。

## 行为红测证据

在修改 CaseDiagram 之前，先添加绿底 PLL T、目标末尾 U' 的实际图测试。旧组件接收额外 state 属性却忽略它，仍画基础模板，产生行为失败，而非缺少 API 的编译失败。

命令：`npm test -- src/components/PracticeDiagram.test.tsx`

失败输出摘录（长 SVG 的 Expected/Received 行省略）：

```text
❯ src/components/PracticeDiagram.test.tsx (1 test | 1 failed)
  × T37 green-bottom PLL T diagram renders the actual U-prime terminal state
FAIL src/components/PracticeDiagram.test.tsx > T37 green-bottom PLL T diagram renders the actual U-prime terminal state
AssertionError: expected '<div class="diagram"><svg viewBox="0 …' to be '<div class="diagram"><svg viewBox="0 …' // Object.is equality
❯ src/components/PracticeDiagram.test.tsx:16:18
Test Files  1 failed (1)
     Tests  1 failed (1)
```

接入可选 state 后同一断言通过，未改其预期。

## 测试与覆盖

新增 1806 项测试，总数 **3139 = 1333 + 1806**，23 个文件。方案原估算 54 项，实现改用逐 case/底色参数化，所以数量增加；没有删除、放宽、skip 旧测试。

- `practiceTarget.test.ts`：1527 项，254 × 6 个逐情形测试加 3 项失败/T33/配色测试。每个 OLL/PLL/CMLL 遍历四种 AUF，其余无 AUF；合计 3684 次严格完整回放。
- `practiceFixtures.test.ts`：10 项。方案 A/B/C/D 四个独立 URFDLB 色面例子（oll-5 白底、pll-t 绿底、cmll-s-1 红底、pll-aa 蓝底）通过；六种底色各遍历 99 个 OLL/CMLL × 4 AUF × 2 非零棱变体，再增加 4752 次回放。
- 合计 **8436 组**完整目标经真实求解器到达目标并验证 54/54。包含全部基础 254 条、六色、AUF 和目前允许的有限棱变体；未用 normalize，非只测可见格。
- `practiceSample.test.ts`：255 项；独立于 solver 检查目标所属类别和保留块：OLL 顶色位置、F2L 完整；CMLL 四角/左右块；其他组完整参考状态；F2L/LSE 无 AUF。
- `prepareSetup.test.ts`：4 项；请求前不建 worker、成功、15 秒超时、取消后晚到结果、运行错误和错目标拒绝。
- `practiceSetupRestore.test.ts`：3 项；旧题原串/计时、新题六色状态载荷、损坏载荷不重抽，重载冻结行为保持。
- `PracticeDiagram.test.tsx`：7 项；首个行为红测，以及六色 × 全部情形的既有 mask/palette、显式参考状态与默认 SVG 完全一致。
- T33 的主公式与 U + 外围整体转体回退测试保留。其旧接线仍实际用于 view/reference 选择和旧题恢复，并非无效调用或假注释；最终新串只来自 worker。

## 门禁结果

| 命令 | main@6074fbb 基线 | 本分支 |
| --- | --- | --- |
| npm test | 1333 通过 | **3139 通过**，23 文件 |
| npm run check:data | 393 通过 | **393 通过**，5 文件 |
| npm run build | 通过 | **通过**，tsc + Vite + PWA |

## 求解器、许可证、体积与懒加载

新增且锁定依赖 **min2phase.js@0.0.4**。npm 包声明 `(MIT or GPL-3.0)`，本次选择其 README 中明确提供的 **MIT** 许可分支。完整声明随站点放在 `public/min2phase-LICENSE.txt`。包解压体积 82,219 bytes。

权威来源：[min2phase.js 官方源码与 README](https://github.com/cs0x7f/min2phase.js)、[0.0.4 npm 包](https://www.npmjs.com/package/min2phase.js/v/0.0.4)。其 README 同时提供 GPLv3 / MIT；所用代码和许可证以锁定 npm 包为准。

本机生产构建：

- 独立 `practiceSolver.worker-*.js`：**25,883 bytes**（25.88 kB）；Node gzip 探针 9,790 bytes。
- 应用主 JS：**351.79 kB**，Vite 报 gzip **107.11 kB**；CSS 17.51 kB；Three.js chunk 487.07 kB。
- PWA 预缓存 9 项、**863.07 KiB**，包含 worker；求解表运行时在 worker 内初始化，不依赖 CDN 或网络 API。
- min2phase 只由 worker import，不进入主入口执行图；只有开始新题时构造 Worker。Service Worker 为离线能力后台预缓存 worker 资源，不能把这个下载说成“从不在首次访问下载”。
- 没有修改 Vite 配置，也未把新 solver 打入首屏主 chunk。每次准备结束销毁 worker，代价是每题都要初始化；尚未做常驻/预热池。

## 实测耗时与界面验收

本机 Windows、Node 24.19.0，非手机：

- 浏览器实际点击“开始练习”到新题就绪：**152 ms**（绿底 CMLL 首题；本地 Vite，资源缓存已热，worker 为本题新建；包含自动化调用开销）。另一题切换约 290 ms。不是移动设备或冷网络承诺。
- 用 Node worker_threads 包一层 self/MessageEvent 适配，直接执行生产 worker bundle，四个各自全新线程从创建到返回：oll-5/白 77.5 ms、pll-t/绿 70.0 ms、cmll-s-1/红 67.6 ms、lse-ulur-1/蓝 64.5 ms；四个结果均由项目引擎再次精确验证。这个探针不是手机 Web Worker 测速。
- 浏览器实际验证：准备中→新题；按住 1 秒松手开始；running 按下停表且松手不进下一题；刷新保留原串/题数/用时；到设置选绿底返回后旧题仍为白底快照，下一题才变绿底。
- 390 × 844 截图已检查，scrollWidth = clientWidth = 390，无横向溢出；未改布局和样式。画面保存在本次会话可视化目录的 t37-practice-390.png，不添加到项目作为图片素材。

## 风险、未覆盖与后续真机验收

1. **未覆盖：** 全体任意自定义主公式 × 六色的穷举、所有合法自由状态的均匀采样、多轴中心偏移、自定义 solver 状态协议损坏的全部组合。当前 254 条基础数据及所列有限变体有完整 54/54 证据；不等于全部 Roux 状态空间。
2. **未覆盖：** 真手机首题耗时、发热、低端机 15 秒门限，以及实际断网启动/升级 Service Worker 后的操作。构建确认 worker 已预缓存，只能据此说明离线设计成立，不能冒充真机断网验收。
3. **未覆盖：** 旧会话的原底色与实际终态；没有足够元数据，不猜、不重抽。旧版参考提示是明确兼容限制。
4. 有限采样可能重复目标；F2L/LSE 尤其如此。求解器输出有时可能碰巧与某条短教学逆序列相同，这不改变输出来源契约；没有为制造不同字符串而拼接抵消动作。
5. 真机待验：六色各从还原态白顶绿前执行一题，按观察持法转动后逐格对照；OLL 含侧面顶色、PLL T/Aa、CMLL/LSE 含非零中心偏移单独验证。不要先强行对齐中心再比较。
6. 真机待验：后台持续计时、重载暂停、离页取消准备、断网首题、失败重试、按住/快速点按反馈。T21 自动测试保持通过，但不代替真机。

本轮探针通过 stdin 临时运行，没有提交临时脚本。没有用数据改写、放宽规则或删测来消除失败。
