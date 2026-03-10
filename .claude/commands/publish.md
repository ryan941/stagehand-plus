根據 `.claude/skills/publish.md` 中定義的流程，執行 heybee-stagehand 的 npm 發布。

完整流程：
1. 檢查 npm 登入狀態
2. 確認版本號（如有參數直接使用，否則自動判斷）
3. 預發布檢查（git clean、branch、build、dry-run）
4. Bump 版本 + git tag + push
5. npm publish
6. 驗證 registry 上的版本
7. 回報結果

如果使用者提供了參數（如 "patch"、"minor"、"major" 或具體版本號），直接使用，不需再問。
