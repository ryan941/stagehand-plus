# Skill: npm-publish

npm 發布流程 for heybee-stagehand。

## 觸發條件

當使用者提到「發布」「publish」「npm publish」「上 npm」「發新版」「bump version」時觸發。

## 流程

### 1. 登入檢查

```bash
npm whoami
```

- 如果未登入，提示使用者先執行 `npm login`，等待確認後再繼續
- 已登入則繼續

### 2. 版本確認

- 讀取 `package.json` 的當前版本
- 檢查 npm registry 上的最新版本：`npm view heybee-stagehand version`
- 如果使用者有指定版本類型（patch/minor/major），直接使用
- 如果未指定，根據變更內容自動判斷：
  - 只有依賴更新、bug fix → `patch`
  - 新增 endpoint、新功能 → `minor`
  - API 不相容變更 → `major`
- 告知使用者即將發布的版本號

### 3. 預發布檢查

依序執行以下檢查，任一失敗則停止：

```bash
# 確認工作目錄乾淨（忽略 untracked 的 .claude/settings.local.json）
git status --porcelain

# 確認在 main 分支
git branch --show-current

# 確認與 remote 同步
git fetch origin && git status

# Build
npm run build

# Dry run 確認發布內容（不應包含 .env、src/、node_modules/）
npm pack --dry-run
```

### 4. 版本更新

如果當前版本已經是目標版本（例如已經 bump 過但還沒 publish），跳過 bump。

否則：
```bash
npm version <patch|minor|major> --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump version to vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

### 5. 發布到 npm

```bash
npm publish
```

如果是 scoped package（@scope/name），需要：
```bash
npm publish --access public
```

### 6. 驗證

```bash
# 等幾秒讓 registry 同步
npm view heybee-stagehand version
```

確認 registry 上的版本與剛發布的一致。

### 7. 報告

回報：
- 版本變更：`舊版本 → 新版本`
- npm 頁面：https://www.npmjs.com/package/heybee-stagehand
- 安裝指令：`npm install heybee-stagehand@X.Y.Z`
- Git tag：`vX.Y.Z`

## 失敗處理

| 失敗點 | 處理方式 |
|--------|---------|
| npm 未登入 | 提示 `npm login`，等使用者完成 |
| 工作目錄不乾淨 | 列出未提交的變更，問使用者是否先 commit |
| Build 失敗 | 顯示錯誤，修復後重試 |
| 版本號已存在於 npm | 自動 bump 到下一個版本 |
| publish 失敗（403） | 可能是套件名衝突或權限問題，提示解決方案 |
| publish 失敗（需要 OTP） | 提示使用者輸入 `npm publish --otp=XXXXXX` |

## 注意事項

- 發布前一定要先 build，`prepublishOnly` script 會自動處理
- 永遠不要發布含有 `.env` 或 secrets 的內容
- `files` 欄位已設定只發布 `dist/`
- 第一次發布和後續更新都用 `npm publish`（版本號不同即可）
