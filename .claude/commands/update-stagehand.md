更新 @browserbasehq/stagehand 依賴到最新版本，並確保專案相容性。

## 步驟

### 1. 版本偵測
- 執行 `npm outdated @browserbasehq/stagehand` 查看目前版本 vs 最新版
- 如果已是最新版，報告並結束

### 2. 查閱 Release Notes
- 到 GitHub repo `browserbase/stagehand` 讀取最新 release notes
- 識別是否有 breaking changes
- 特別關注以下 API 是否有變動：
  - `new Stagehand()` 建構參數
  - `stagehand.init()` 初始化
  - `stagehand.act()` / `stagehand.observe()` / `stagehand.extract()` 方法簽名
  - `stagehand.agent()` / `agent.execute()` agent API
  - `stagehand.context.activePage()` 頁面存取

### 3. 更新依賴
- 執行 `npm install @browserbasehq/stagehand@latest`
- 記錄舊版本 → 新版本

### 4. 編譯驗證
- 執行 `npm run build`
- 如果有編譯錯誤，分析錯誤訊息並修復受影響的檔案：
  - `src/session-manager.ts` — Stagehand 建構和 session 生命週期
  - `src/routes/sessions.ts` — 所有 browser automation endpoint
- 修復後重新 build 直到通過

### 5. 相容性檢查
- 確認 `dist/` 產出正常
- 用 `npm pack --dry-run` 確認 package 內容完整

### 6. 報告
回報：
- 版本變更：`舊版本 → 新版本`
- Breaking changes 摘要（如果有）
- 修改的檔案清單（如果有）
- 建議：是否需要 bump 專案版本號（patch/minor/major）
