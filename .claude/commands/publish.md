根據 `.claude/skills/publish.md` 中定義的 npm 發布流程，執行 heybee-stagehand 的 npm 發布。

步驟：
1. 讀取當前版本，問使用者要 patch/minor/major
2. 預發布檢查（git clean、build、dry-run）
3. npm version bump + git tag
4. git push --tags
5. npm publish
6. 驗證並回報結果

如果使用者提供了參數（如 "patch"、"minor"、"major" 或具體版本號），直接使用，不需再問。
