# stagehand-plus

A REST API server that wraps [Stagehand](https://github.com/browserbase/stagehand) for AI-driven browser automation, with built-in [Tavily](https://tavily.com) web search and [FireCrawl](https://firecrawl.dev) web scraping.

**One server. Three capabilities:**

- **Browser automation** — Navigate, click, extract, and run full agent workflows via Stagehand
- **Web search** — Find URLs and answers before navigating (Tavily)
- **Web scraping** — Extract structured data without spinning up a browser (FireCrawl)

## Quick Start

```bash
# Install globally
npm install -g stagehand-plus

# Generate global config file
stagehand-plus --init
# → creates ~/.stagehand-plus/settings.json

# Edit your API keys
vim ~/.stagehand-plus/settings.json

# Start the server
stagehand-plus
# → listening on http://localhost:9090
```

Or use npx without installing:

```bash
npx stagehand-plus
```

## Configuration

### Global config (recommended)

Run `stagehand-plus --init` to create `~/.stagehand-plus/settings.json`:

```json
{
  "port": 9090,
  "modelName": "gpt-4o",
  "modelApiKey": "sk-...",
  "tavilyApiKey": "tvly-...",
  "firecrawlApiKey": "fc-..."
}
```

Set once, works everywhere. No need to create `.env` in every directory.

### Per-project `.env` (optional override)

If you need different keys for a specific project, create a `.env` in that directory:

```env
MODEL_API_KEY=sk-different-key
```

### Priority order (highest to lowest)

1. **Per-request headers** — `x-model-api-key`, `x-tavily-api-key`, `x-firecrawl-api-key`
2. **`.env` file** — in the current working directory
3. **`~/.stagehand-plus/settings.json`** — global config
4. **Environment variables** — `export MODEL_API_KEY=sk-...`

## API Reference

### Health Check

```
GET /health
```

```json
{ "status": "ok", "activeSessions": 0, "uptime": 123.45 }
```

---

### Browser Automation (Session-based)

All browser endpoints require a session. Start one first, then use the session ID.

#### Start Session

```
POST /v1/sessions/start
Header: x-model-api-key (optional, overrides env)
```

```json
{
  "modelName": "gpt-4o",
  "systemPrompt": "You are a helpful browser assistant",
  "domSettleTimeoutMs": 3000,
  "selfHeal": true
}
```

Response:

```json
{
  "success": true,
  "data": { "available": true, "sessionId": "uuid-here" }
}
```

#### Navigate

```
POST /v1/sessions/:sessionId/navigate
```

```json
{
  "url": "https://example.com",
  "options": { "waitUntil": "load", "timeout": 30000 }
}
```

#### Act

Perform an action described in natural language.

```
POST /v1/sessions/:sessionId/act
```

```json
{
  "input": "Click the Sign In button",
  "options": { "timeout": 10000 }
}
```

#### Observe

Find interactive elements on the page.

```
POST /v1/sessions/:sessionId/observe
```

```json
{
  "instruction": "Find all navigation links"
}
```

#### Extract

Extract data from the current page.

```
POST /v1/sessions/:sessionId/extract
```

```json
{
  "instruction": "Extract all product names and prices",
  "schema": {
    "type": "object",
    "properties": {
      "products": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "price": { "type": "string" }
          }
        }
      }
    }
  }
}
```

#### Agent Execute

Run a multi-step agent that autonomously completes a task.

```
POST /v1/sessions/:sessionId/agentExecute
```

```json
{
  "executeOptions": {
    "instruction": "Go to Hacker News and find the top 3 stories",
    "maxSteps": 10
  },
  "agentConfig": {
    "model": "gpt-4o"
  }
}
```

#### End Session

```
POST /v1/sessions/:sessionId/end
```

---

### Web Search (No session needed)

```
POST /v1/search
Header: x-tavily-api-key (optional, overrides env)
```

```json
{
  "query": "best practices for browser automation",
  "maxResults": 5,
  "searchDepth": "basic",
  "topic": "general",
  "includeAnswer": true,
  "timeRange": "month"
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | **required** | Search query |
| `maxResults` | number | `5` | Number of results (1-20) |
| `searchDepth` | `"basic"` \| `"advanced"` | `"basic"` | Search depth |
| `topic` | `"general"` \| `"news"` \| `"finance"` | `"general"` | Search category |
| `includeAnswer` | boolean | `false` | Include AI-generated answer |
| `includeRawContent` | boolean | `false` | Include full page content |
| `includeDomains` | string[] | `[]` | Restrict to these domains |
| `excludeDomains` | string[] | `[]` | Exclude these domains |
| `timeRange` | `"day"` \| `"week"` \| `"month"` \| `"year"` | — | Time filter |

---

### Web Scraping (No session needed)

```
POST /v1/scrape
Header: x-firecrawl-api-key (optional, overrides env)
```

```json
{
  "url": "https://example.com/article",
  "formats": ["markdown"],
  "onlyMainContent": true,
  "waitFor": 5000
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | **required** | URL to scrape |
| `formats` | string[] | `["markdown"]` | `"markdown"`, `"html"`, `"rawHtml"`, `"links"`, `"json"` |
| `onlyMainContent` | boolean | `true` | Strip navs, footers, ads |
| `includeTags` | string[] | — | CSS selectors to include |
| `excludeTags` | string[] | — | CSS selectors to exclude |
| `waitFor` | number | `0` | Ms to wait for JS rendering |
| `timeout` | number | `30000` | Request timeout in ms |
| `mobile` | boolean | `false` | Emulate mobile device |
| `jsonOptions` | object | — | `{ prompt, schema }` for structured extraction |

## Development

```bash
git clone https://github.com/ryan941/stagehand-plus.git
cd stagehand-plus
npm install
cp .env.example .env
# Fill in your API keys in .env

npm run dev    # Development with hot reload
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

## Architecture

```
src/
  index.ts              Express server + graceful shutdown
  session-manager.ts    Stagehand session lifecycle (create/get/end)
  routes/
    health.ts           GET  /health
    sessions.ts         POST /v1/sessions/* (browser automation)
    search.ts           POST /v1/search (Tavily web search)
    scrape.ts           POST /v1/scrape (FireCrawl web scraping)
```

## License

[MIT](LICENSE)
