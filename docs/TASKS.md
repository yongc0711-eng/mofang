# 任务

## 当前状态（2026-11-07）

- **公式数据：** 254 条已录完：F2L 41、OLL 57、PLL 21、CMLL 42、LSE 93。来源见 `docs/decisions.md` 和各数据文件开头。
- **功能：** 列表、搜索、进度、收藏、自定义公式、备份导入导出、练习模式都已完成。
- **3D 播放器：** Three.js 版已合并并上线，cubing.js 已移除。
- **部署：** 推送到 `main` 自动发布，已确认可以打开：https://yongc0711-eng.github.io/mofang/
- **基线：** `npm test` 475 项全过，`npm run check:data` 367 项全过。
- **质量未达标：** 识别要点只算有内容，不算完成质量，见 T13、T14。

任务详细记录可以用 `docs/tasks/_template.md` 建文件。编号只增不复用，T1–T7 已用过。

## 未完成

下面的任务本轮只登记，都还没修。

并行限制：T8、T9、T10、T12、T13 已合并，只剩 T11 要改 `userStore.ts`，目前没有别的任务动这个文件。T18 和 T19 都要写 `docs/tasks/T13.md`，不要同时开。

### T11 导入备份校验太松

- **问题：** `importUserData` 只查 `version` 和 `typeof cases`。`times` 不是数组时，`timeStats` 会抛错。
- **允许改：** `src/store/userStore.ts`，新增 `src/store/userStore.test.ts`
- **验收：** `npm test`，新增测试覆盖 `times` 非数组的备份，合法的旧备份仍能导入
- **非目标：** 不改备份版本号，不改 `devicePrefs`

### T14 其他公式组的识别要点（技术债）

- **问题：** OLL 57 条都是模板化的状态描述，部分情形完全相同，如 OLL 5 和 OLL 8。F2L、CMLL、LSE 还没有 recognition。
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

### T18 PLL 特征提取写成测试

- **问题：** T13 的 recognition 是照临时脚本的结果手写的，脚本没提交。以后改引擎、改 `algs[0]` 或改显示规则，recognition 可能悄悄过期，没有测试会报。
- **允许改：** `src/data/pll.test.ts`（新增）、`docs/tasks/T13.md`
- **验收：** `npm test`、`npm run check:data`；测试从 `caseState` 提取车灯、色条、同色对等特征，断言 21 条的完整特征行互不相同，并与 recognition 的关键描述一致
- **非目标：** 不改 `src/data/pll.ts` 的 `id`、`algs`、`name`，不放宽现有测试

### T19 PLL 识别要点抽检

- **问题：** T13 的特征由引擎推出，只保证和 `algs[0]` 一致，没有和外部资料比对过。
- **允许改：** `src/data/pll.ts`（只改 `recognition`）、`docs/tasks/T13.md`
- **验收：** 对照公开资料抽检 3–5 条 PLL（建议含 Aa/Ab、T、Ja/Jb 里的几条），结果记入 `docs/tasks/T13.md`；有出入的改正或留空
- **非目标：** 不改 `id`、`algs`、`name`
