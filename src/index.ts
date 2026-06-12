#!/usr/bin/env node
import { runSetup } from "./install/setup.js";
import { startServer } from "./server.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args[0] === "setup") {
    const code = await runSetup(args.slice(1));
    process.exit(code);
  }

  await startServer();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
