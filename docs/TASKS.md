# 任务

## 当前状态（2026-11-07）

- **公式数据：** 254 条已录完：F2L 41、OLL 57、PLL 21、CMLL 42、LSE 93。来源见 `docs/decisions.md` 和各数据文件开头。
- **功能：** 列表、搜索、进度、收藏、自定义公式、备份导入导出、练习模式都已完成。
- **3D 播放器：** Three.js 版已合并并上线，cubing.js 已移除。
- **图解：** OLL 现在显示整个顶层（含四个侧面顶行），2D 和 3D 同源，见 T20。
- **部署：** 推送到 `main` 自动发布，已确认可以打开：https://yongc0711-eng.github.io/mofang/
- **基线：** `npm test` 1226 项全过，`npm run check:data` 393 项全过。
- **识别要点：** PLL（T13）和 OLL（T14）已重写，有非空/互异/特征测试；F2L、CMLL、LSE 还没有 recognition。

任务详细记录可以用 `docs/tasks/_template.md` 建文件。编号只增不复用，T1–T20 已用过。

## 未完成

下面的任务还没全部完成。

### T15 LSE 情形名称

- **问题：** 4c 的 36 条已按置换命名（见 `docs/tasks/T15.md`）；UL/UR 的 46 条仍是「UL 棱在 UF，UR 棱在 UB · 1」这种位置加序号，看名字认不出来。
- **允许改：** `src/data/lse.ts`
- **验收：** `npm run check:data`
- **非目标：** 不编造术语，不改 `id`，不改公式

### T16 真手机验收（需要用户手动）

- **问题：** 这些只用鼠标或脚本模拟过：手指拖动魔方、连点两下回正、练习页滑动不误触；断网使用、发热卡顿和 iPhone 底部安全区没有实测。
- **允许改：** 验收本身不改文件；发现问题再单独建任务
- **验收：** 用户在真手机上逐项确认，结果记入本任务
- **非目标：** 不在这个任务里顺手调外观

### T21 练习会话持久化、计时持续、屏幕常亮

- **问题：** 练习中点「查看详情」再返回、切 tab、系统返回，会话（题目、题数、计时）都会丢；练习时屏幕会熄灭。要求：开始计时后，除非重载或进程被杀，计时一直走。
- **允许改：** `src/pages/PracticePage.tsx`、`src/lib/practiceSession.ts`、`src/lib/wakeLock.ts` 及各自的测试、`docs/tasks/T21.md`
- **验收：** `npm test`、`npm run check:data`、`npm run build`；真机验收项见 `docs/tasks/T21.md`
- **非目标：** 不改练习算法、权重、`userStore` 数据结构，不动 `src/data`、`cases.ts`、`practice.ts`
