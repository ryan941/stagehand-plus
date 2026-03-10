# stagehand-plus

Local Stagehand server for HeyBee browser automation.

## Tech Stack

- TypeScript + Node.js (>=18)
- Express 5
- @browserbasehq/stagehand
- @tavily/core (web search for agents)
- @mendable/firecrawl-js (web scraping without browser)

## Commands

- `npm run build` — compile TypeScript to dist/
- `npm run dev` — run with tsx (hot reload)
- `npm start` — run compiled dist/index.js
- `/publish [patch|minor|major]` — npm 發布流程

## Project Structure

```
src/
  index.ts              — CLI entry point (--init, --update, --version, or start server)
  server.ts             — Express server setup and routes
  config.ts             — Global config (~/.stagehand-plus/settings.json)
  updater.ts            — Self-update and version check
  session-manager.ts    — Stagehand session lifecycle
  routes/
    health.ts           — GET /health
    sessions.ts         — POST /v1/sessions/* (start, navigate, act, observe, extract, agentExecute, end)
    search.ts           — POST /v1/search (Tavily web search, no session needed)
    scrape.ts           — POST /v1/scrape (FireCrawl web scrape, no session needed)
```

## npm Package

- Package name: `stagehand-plus`
- Published files: `dist/` only (controlled by `files` field)
- Binary: `npx stagehand-plus` starts the server
- Registry: https://www.npmjs.com/package/stagehand-plus
