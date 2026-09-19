# pi-duck-mode

A pi extension for a coding harness with no LLM.

Every message gets the same reply: "Great, go ahead and make it!"

The reply streams like a normal model reply.
It has zero latency, zero cost and zero hallucinations.

## Install

```sh
pi install git:github.com/<user>/pi-duck-mode
```

Start pi and type `/duck`.
Type `/duck` again to go back to your normal session.

## Always-on duck

Clone the repo and run the launcher.

```sh
git clone https://github.com/<user>/pi-duck-mode
cd pi-duck-mode
./duck
```

The launcher uses its own empty config.
It loads no other extensions, tools, skills or context files.
Use `/quit`, `/exit` or Ctrl+C to leave.

## What duck mode turns off

Slash commands, hotkeys, model switching, tools and autocomplete.
Only `/duck`, `/quit` and `/exit` still work.

## Benchmark

Prompt: "Write a binary search function in Python. Return the index of the target, or -1."

Time to first token (TTFT) is the time from prompt accepted to first text delta.
Tokens per second (TPS) is tokens divided by the time from first to last delta.
Tokens are estimated as characters divided by 4 in both modes.

| | vanilla pi | duck mode |
| --- | --- | --- |
| model | openai-codex/gpt-6-astra | duck |
| TTFT (median) | 2503 ms | 1.3 ms |
| TPS (median) | 29 | 23166 |
| reply tokens (median) | 99 | 7 |
| total time (median) | 5748 ms | 1.6 ms |
| runs | 5 | 10 |

Duck mode is about 1900 times faster to first token.
It also does not write a binary search.
That part is up to you.

Run it yourself:

```sh
node bench/bench.mjs duck 10
node bench/bench.mjs vanilla 5 <provider/model>
```

The vanilla run makes real model calls.
Both runs use `--mode json -p --thinking off` with no tools, extensions or skills.
