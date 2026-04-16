// Test guard — skips test commands when ENABLE_TESTS=false
// Usage: node scripts/testGuard.mjs <command> [args...]
// When ENABLE_TESTS=false, exits 0 without running the command.
// When ENABLE_TESTS is unset or any other value, runs the command.

import { execSync } from "node:child_process";

const enabled = process.env.ENABLE_TESTS !== "false";

if (!enabled) {
    console.log("⏭  Tests skipped (ENABLE_TESTS=false). Set ENABLE_TESTS=true or remove the setting to re-enable.");
    process.exit(0);
}

const cmd = process.argv.slice(2).join(" ");
if (cmd) {
    try {
        execSync(cmd, { stdio: "inherit" });
    } catch (e) {
        process.exit(e.status ?? 1);
    }
}
