#!/usr/bin/env node
/**
 * Patch @browserbasehq/stagehand SDK for OpenAI-compatible proxy compatibility.
 *
 * Problem: Proxies like MixRoute sometimes return `"arguments": ""`  (string)
 * instead of `"arguments": []` (array), causing Zod schema validation to fail.
 *
 * Fix: Sanitize parsed LLM response before Zod validation in OpenAIClient.js.
 */
const fs = require("fs");
const path = require("path");

const TARGET = path.join(
  __dirname,
  "..",
  "node_modules",
  "@browserbasehq",
  "stagehand",
  "dist",
  "cjs",
  "lib",
  "v3",
  "llm",
  "OpenAIClient.js"
);

const MARKER = "/* stagehand-plus:patched */";

if (!fs.existsSync(TARGET)) {
  // Not installed yet (e.g. during npm pack), skip silently
  process.exit(0);
}

const src = fs.readFileSync(TARGET, "utf-8");

if (src.includes(MARKER)) {
  console.log("[patch] OpenAIClient.js already patched, skipping");
  process.exit(0);
}

const needle = "const parsedData = JSON.parse(extractedData);";
if (!src.includes(needle)) {
  console.warn("[patch] Could not find patch target in OpenAIClient.js, skipping");
  process.exit(0);
}

const patch = `${needle}
            ${MARKER}
            if (parsedData && typeof parsedData.arguments === "string") {
                parsedData.arguments = parsedData.arguments ? [parsedData.arguments] : [];
            }`;

const patched = src.replace(needle, patch);
fs.writeFileSync(TARGET, patched);
console.log("[patch] OpenAIClient.js patched for OpenAI-compatible proxy support");
