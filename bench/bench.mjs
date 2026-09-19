// Usage: node bench/bench.mjs <duck|vanilla> <runs> [model]
// Sends one binary search prompt to pi in JSON mode and times the event stream.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROMPT = "Write a binary search function in Python. Return the index of the target, or -1.";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [mode, runsArg, model] = process.argv.slice(2);
const runs = Number(runsArg);

if (!["duck", "vanilla"].includes(mode) || !Number.isInteger(runs) || runs < 1) {
  throw new Error("usage: node bench/bench.mjs <duck|vanilla> <runs> [model]");
}
if (mode === "vanilla" && !model) throw new Error("vanilla needs a model, e.g. anthropic/claude-sonnet-5");

// Same flags in both modes, so only the model differs.
const common = ["--mode", "json", "-p", "--no-session", "--no-tools", "--no-extensions", "--no-skills", "--no-prompt-templates", "--no-context-files", "--thinking", "off"];
const [cmd, args] =
  mode === "duck"
    ? [path.join(root, "duck"), common]
    : ["pi", [...common, "--model", model]];

function once() {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [...args, PROMPT], { stdio: ["ignore", "pipe", "inherit"] });
    let buf = "";
    let tSubmit, tFirst, tEnd, text = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error("timeout after 120s")); }, 120_000);

    child.stdout.on("data", (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        const now = performance.now();
        const ev = JSON.parse(line);
        // Clock starts when pi accepts the prompt, so startup time is excluded.
        if (ev.type === "message_start" && ev.message.role === "user") tSubmit = now;
        const d = ev.type === "message_update" && ev.assistantMessageEvent;
        if (d && d.type === "text_delta") {
          tFirst ??= now;
          text += d.delta;
        }
        if (ev.type === "message_end" && ev.message.role === "assistant") {
          tEnd = now;
          if (ev.message.stopReason === "error") reject(new Error(ev.message.errorMessage));
        }
      }
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`exit ${code}`));
      if (tSubmit === undefined || tFirst === undefined || tEnd === undefined) return reject(new Error("no reply seen"));
      const tokens = Math.ceil(text.length / 4); // same rough count for both modes
      resolve({ ttft: tFirst - tSubmit, total: tEnd - tSubmit, tokens, tps: tokens / ((tEnd - tFirst) / 1000) });
    });
  });
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const results = [];
for (let i = 0; i < runs; i++) {
  const r = await once();
  results.push(r);
  console.error(`run ${i + 1}: ttft ${r.ttft.toFixed(1)} ms, ${r.tokens} tokens, ${r.tps.toFixed(0)} tok/s`);
}
console.log(JSON.stringify({
  mode, model: model ?? "duck", runs,
  ttft_ms: median(results.map((r) => r.ttft)),
  tps: median(results.map((r) => r.tps)),
  tokens: median(results.map((r) => r.tokens)),
  total_ms: median(results.map((r) => r.total)),
}));
