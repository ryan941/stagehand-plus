# Skill: npm-publish

npm 發布流程 for heybee-stagehand。

## 觸發條件

當使用者提到「發布」「publish」「npm publish」「上 npm」「發新版」「bump version」時觸發。

## 流程

### 1. 版本確認

- 讀取 `package.json` 的當前版本
- 問使用者要發布什麼類型的版本更新：
  - `patch` (1.0.0 → 1.0.1)：bug fix
  - `minor` (1.0.0 → 1.1.0)：新功能，向下相容
  - `major` (1.0.0 → 2.0.0)：breaking change
- 或者使用者可以直接指定版本號

### 2. 預發布檢查

依序執行以下檢查，任一失敗則停止：

```bash
# 確認工作目錄乾淨
git status --porcelain

# 確認在 main 分支
git branch --show-current

# Build
npm run build

# Dry run 確認發布內容
npm pack --dry-run
```

### 3. 版本更新與 Git Tag

```bash
# 更新版本號（會自動建 git tag）
npm version <patch|minor|major>

# 推送 commit 和 tag
git push origin main --tags
```

### 4. 發布到 npm

```bash
npm publish
```

如果是 scoped package（@scope/name），需要：
```bash
npm publish --access public
```

### 5. 驗證

```bash
# 確認 npm 上可以找到
npm view heybee-stagehand version
```

### 6. 報告

回報：
- 發布的版本號
- npm 頁面連結：https://www.npmjs.com/package/heybee-stagehand
- Git tag

## 注意事項

- 發布前**一定**要先 build，`prepublishOnly` script 會自動處理
- 如果 npm login 未完成，提示使用者先執行 `npm login`
- 第一次發布用 `npm publish`，之後更新也用 `npm publish`（版本號不同即可）
- 永遠不要發布含有 `.env` 或 secrets 的內容
- `files` 欄位已設定只發布 `dist/`
