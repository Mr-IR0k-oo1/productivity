import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const result = spawnSync(npmCommand, ["run", "build"], {
  shell: process.platform === "win32",
  stdio: "inherit",
  env: {
    ...process.env,
    ORBIT_DESKTOP_EXPORT: "true",
  },
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);