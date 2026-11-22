import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
// One loopback development server serves the gym and local staff registration.
const host = "127.0.0.1";
const port = 3000;
const root = fileURLToPath(new URL("../", import.meta.url));
try {
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(port, host, () => probe.close(resolve));
  });
} catch {
  console.error(
    "Gym port 3000 is already in use. Stop the existing server with Ctrl+C, then run npm run dev again. No alternative port was started.",
  );
  process.exit(1);
}
console.log("\nPULSE GYM: http://127.0.0.1:3000");
console.log(
  "Use Sign in for members and staff. Staff administration is available inside the sign-in popup.\n",
);
const proc = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/next/dist/bin/next", import.meta.url),
    ),
    "dev",
    "--webpack",
    "--hostname",
    host,
    "--port",
    String(port),
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development",
    },
  },
);
process.on("SIGTERM", () => proc.kill("SIGTERM"));
process.on("SIGINT", () => proc.kill("SIGINT"));
proc.on("error", (error) => {
  console.error("Unable to start the gym server:", error.message);
  process.exit(1);
});
proc.on("exit", (code) => process.exit(code ?? 0));
