/**
 * Dev orchestrator: make `pnpm dev` self-contained.
 *
 * 1. If MongoDB is already listening on 127.0.0.1:27017, reuse it.
 * 2. Otherwise spawn a local `mongod` with a project-owned data dir (./.mongo) —
 *    no brew/launchd/sudo, no shared data dir permission issues.
 * 3. Wait until it accepts connections, then start `next dev`.
 * 4. On exit, shut down the mongod we started (not a pre-existing one).
 */
import { spawn } from "node:child_process";
import net from "node:net";
import { mkdirSync } from "node:fs";
import path from "node:path";

const HOST = "127.0.0.1";
const PORT = 27017;
const DB_DIR = path.resolve(process.cwd(), ".mongo");

function canConnect(host, port, timeout = 800) {
  return new Promise((resolve) => {
    const sock = net.connect({ host, port });
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeout);
    sock.once("connect", () => done(true));
    sock.once("timeout", () => done(false));
    sock.once("error", () => done(false));
  });
}

async function waitForMongo(attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    if (await canConnect(HOST, PORT)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

let mongo = null;

async function ensureMongo() {
  if (await canConnect(HOST, PORT)) {
    console.log("[dev] MongoDB already running on 27017 — reusing it.");
    return;
  }

  mkdirSync(DB_DIR, { recursive: true });
  console.log(`[dev] starting mongod (dbpath ${DB_DIR}) ...`);
  mongo = spawn(
    "mongod",
    // --nounixsocket: connect over TCP only, so mongod never touches the
    // /tmp/mongodb-27017.sock file (which a prior `sudo` run left root-owned).
    ["--dbpath", DB_DIR, "--port", String(PORT), "--bind_ip", HOST, "--nounixsocket", "--quiet"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  mongo.on("error", (err) => {
    if (err.code === "ENOENT") {
      console.error(
        "[dev] 'mongod' is not on your PATH. Install it (brew install mongodb-community) " +
          "or start MongoDB yourself, then run `pnpm dev` again.",
      );
    } else {
      console.error("[dev] failed to start mongod:", err.message);
    }
  });
  // Surface fatal mongod output so failures are visible, not silent.
  const echoErrors = (buf) => {
    const s = buf.toString();
    if (/error|exception|abort|fatal|address already in use/i.test(s)) {
      process.stderr.write(`[mongod] ${s}`);
    }
  };
  mongo.stdout?.on("data", echoErrors);
  mongo.stderr?.on("data", (b) => process.stderr.write(`[mongod] ${b}`));

  const ready = await waitForMongo();
  if (ready) console.log("[dev] mongod is ready.");
  else console.error("[dev] mongod did not become ready — see [mongod] output above.");
}

async function main() {
  await ensureMongo();

  const nextBin = path.resolve("node_modules", ".bin", "next");
  const next = spawn(nextBin, ["dev"], { stdio: "inherit" });

  const shutdown = () => {
    next.kill("SIGINT");
    if (mongo) mongo.kill("SIGINT");
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  next.on("exit", (code) => {
    if (mongo) mongo.kill("SIGINT");
    process.exit(code ?? 0);
  });
}

main();
