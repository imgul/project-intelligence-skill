#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function shouldSkip() {
  if (process.env.CI === "true") {
    return "CI environment";
  }
  if (process.env.PROJECT_INTELLIGENCE_SKIP_SETUP === "1") {
    return "PROJECT_INTELLIGENCE_SKIP_SETUP=1";
  }
  return null;
}

const skipReason = shouldSkip();
if (skipReason) {
  console.log(`[project-intelligence-skill] Skipping auto-setup (${skipReason})`);
  process.exit(0);
}

const setupPath = path.join(__dirname, "..", "dist", "install", "setup.js");
if (!fs.existsSync(setupPath)) {
  console.log(
    "[project-intelligence-skill] dist not built yet — run `npm run build` then `npx project-intelligence-skill setup`"
  );
  process.exit(0);
}

const result = spawnSync(process.execPath, [setupPath, "--silent"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 0);
