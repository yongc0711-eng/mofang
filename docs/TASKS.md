# 任务

## 当前状态（2026-11-07）

- **公式数据：** 254 条已录完：F2L 41、OLL 57、PLL 21、CMLL 42、LSE 93。来源见 `docs/decisions.md` 和各数据文件开头。
- **功能：** 列表、搜索、进度、收藏、自定义公式、备份导入导出、练习模式都已完成。
- **3D 播放器：** Three.js 版已合并并上线，cubing.js 已移除。
- **部署：** 推送到 `main` 自动发布，已确认可以打开：https://yongc0711-eng.github.io/mofang/
- **基线：** `npm test` 449 项全过，`npm run check:data` 367 项全过。
- **质量未达标：** 识别要点只算有内容，不算完成质量，见 T13、T14。

任务详细记录可以用 `docs/tasks/_template.md` 建文件。编号只增不复用，T1–T7 已用过。

## 未完成

下面的任务本轮只登记，都还没修。

### T8 备选和自定义公式没查 allowedBases

- **问题：** `lintCase` 只校验 `algs[0]`，LSE 的备选公式和用户自定义公式没有检查 `allowedBases`。
- **允许改：** `src/lib/cases.ts`、`src/lib/cases.test.ts`、`src/pages/CasePage.tsx`
- **验收：** `npm test`，新增测试覆盖带 `R` 的 LSE 备选公式和自定义公式
- **非目标：** 不改其他公式组的规则，不改已录入公式

### T9 F2L 前置 U 的规则和注释矛盾

- **问题：** `algSolvesCase` 对 F2L 也允许前置 U，而 `src/lib/practice.ts:5` 的注释说 F2L 的起始状态对 U 敏感。要先判断哪一边才对。
- **允许改：** `src/lib/cases.ts`、`src/lib/practice.ts`、对应测试文件、`docs/decisions.md`
- **验收：** `npm test`。如果要改判定语义，先在 `docs/decisions.md` 记录原因
- **非目标：** 不为了通过测试放宽规则，不改 F2L 数据

### T10 强制保存的公式会影响练习打乱

- **问题：** `CasePage` 里“仍然保存”的公式也会被设成 `primaryAlg`。练习打乱按主公式生成，所以可能和图解对不上。
- **允许改：** `src/pages/CasePage.tsx`、`src/store/userStore.ts`、`src/lib/practice.ts`、`src/lib/practice.test.ts`
- **验收：** `npm test`，新增测试覆盖解决不了情形的主公式
- **非目标：** 不禁止用户保存这类公式，不改备份格式

### T11 导入备份校验太松

- **问题：** `importUserData` 只查 `version` 和 `typeof cases`。`times` 不是数组时，`timeStats` 会抛错。
- **允许改：** `src/store/userStore.ts`，新增 `src/store/userStore.test.ts`
- **验收：** `npm test`，新增测试覆盖 `times` 非数组的备份，合法的旧备份仍能导入
- **非目标：** 不改备份版本号，不改 `devicePrefs`

### T12 图解没有测试

- **问题：** `CaseDiagram` 没有测试，2D 和 3D 朝向一致只靠约定。
- **允许改：** 只新增测试文件；如需导出纯函数，可小改 `src/components/CaseDiagram.tsx`
- **验收：** `npm test`，测试覆盖顶视图和等轴视图的贴纸位置，以及和引擎坐标的一致性
- **非目标：** 不改图解外观，不引入组件测试框架

### T13 PLL 识别要点重写

- **问题：** 这些 recognition 区分不了情形：7 条都是“只有一面车灯”（T、Ra、Rb、Ga、Gb、Gc、Gd），3 条都是“没有车灯，另有1面是完整色条”（F、Ja、Jb），4 条都是“没有车灯、没有色条”（V、Y、Na、Nb）。
- **允许改：** `src/data/pll.ts`
- **验收：** `npm run check:data`；对照图解和公认资料人工核对。重写或留空，不确定就留空
- **非目标：** 不改 `id`、`algs`、`name`

### T14 其他公式组的识别要点（技术债）

- **问题：** OLL 57 条都是程序算出的描述，部分情形完全相同，如 OLL 5 和 OLL 8。F2L、CMLL、LSE 还没有 recognition。
- **允许改：** `src/data/oll.ts`、`src/data/f2l.ts`、`src/data/cmll.ts`、`src/data/lse.ts`
- **验收：** `npm run check:data`；人工核对。不确定就留空
- **非目标：** 不重排公式，不改 `id`

### T15 LSE 情形名称

- **问题：** UL/UR 和 4c 的多数情形只有位置或循环结构加序号，看名字认不出来。
- **允许改：** `src/data/lse.ts`
- **验收：** `npm run check:data`
- **非目标：** 不编造术语，不改 `id`，不改公式

### T16 真手机验收（需要用户手动）

- **问题：** 这些只用鼠标或脚本模拟过：手指拖动魔方、连点两下回正、练习页滑动不误触；断网使用、发热卡顿和 iPhone 底部安全区没有实测。
- **允许改：** 验收本身不改文件；发现问题再单独建任务
- **验收：** 用户在真手机上逐项确认，结果记入本任务
- **非目标：** 不在这个任务里顺手调外观

### T17 电脑宽屏布局检查

- **问题：** 新首页、胶囊导航以外的顶部导航和详情页双栏布局，都没在宽屏下看过。测试面板只有约 380 像素宽。
- **允许改：** `src/styles.css`
- **验收：** 在 1280 像素以上的窗口逐页检查；`npm run build`
- **非目标：** 不改手机布局
