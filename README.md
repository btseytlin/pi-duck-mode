<div align="center">
<pre>
    __
___( o)>
\ <_. )
 `---'
</pre>
</div>

<p align="center">
  <strong>The zero-token coding agent. Cuts 100% of the LLM output your agent reads.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="build: passing">
  <a href="https://pi.dev"><img src="https://img.shields.io/badge/pi-extension-lightgrey" alt="pi extension"></a>
  <a href="#benchmark"><img src="https://img.shields.io/badge/TTFT-1.3ms-brightgreen" alt="TTFT 1.3ms"></a>
  <a href="#what-duck-does"><img src="https://img.shields.io/badge/powered%20by-duck-yellow?logo=duckdb&logoColor=white" alt="powered by duck"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license: MIT"></a>
</p>

<p align="center">
  <a href="#installation">Install</a> &bull;
  <a href="#what-duck-does">What duck does</a> &bull;
  <a href="#how-it-works">How it works</a> &bull;
  <a href="#benchmark">Benchmark</a> &bull;
  <a href="#commands">Commands</a>
</p>

---

Pi extension that makes pi 798x faster in terms of TPS and consumes 14x less tokens. It also prevents developer skill atrophy.

duck replaces your LLM with a duck. Single TypeScript file, 1 supported command, <2ms overhead. Zero hallucinations.

> **Not affiliated.** This project is not affiliated with, endorsed by or connected to rtk-ai/rtk, DuckDB or any other project named rtk or duck. Any resemblance is intentional.

## What duck does

duck intercepts your prompt and compresses the model reply to a single line.

| Your prompt | What duck does to the output |
|-------------|------------------------------|
| `fix my bug` | Great, go ahead and make it! |
| `write a binary search` | Great, go ahead and make it! |
| `refactor this file` | Great, go ahead and make it! |
| `explain this stack trace` | Great, go ahead and make it! |
| `/model` | Great, go ahead and make it! Model switching is off |
| `!ls` | Great, go ahead and make it! The shell is off |

## How Savings Work

duck cuts **100% of the LLM output** your agent reads. That is what duck measures. It is not the same as getting your code written.

The reply is a good plan, and the plan is short. **You still have to write the code.**

The token counts in the benchmark are estimated as `chars / 4`. duck ships no tokenizer, so the **percentages are reliable but the absolute token numbers are approximate**.

## Installation

```sh
pi install git:github.com/<user>/pi-duck-mode
```

Start pi and type `/duck`. Now you are in duck mode. In this mode there is no LLM. Every message gets the same reply: "Great, go ahead and make it!" Type your prompt, then write the code.

Type `/duck` again to leave duck mode.

> **Name collision warning**: Another project named "duck" (DuckDB) exists. If `/duck` opens a database, you have the wrong package.

## How It Works

```
  Without duck:                                With duck:

  You  --prompt-->  pi  -->  LLM               You  --prompt-->  pi  -->  duck
   ^                          |                 ^                          |
   |   2503 ms, 99 tokens     |                 |   1.3 ms, 7 tokens       |
   +--------------------------+                 +--------------------------+
```

Four strategies applied to every prompt:

1. **Smart Filtering** - Removes noise (the answer)
2. **Grouping** - Aggregates similar replies (all of them) into one
3. **Truncation** - Keeps relevant context, cuts the reply to 7 tokens
4. **Deduplication** - Collapses repeated replies. There is only ever one

> **Does duck break the prompt cache?** No. There is nothing to cache.

## Commands

```
/duck                           # Enter duck mode, or leave it
/quit                           # Exit pi
/exit                           # Exit pi, but longer
```

Everything else is off in duck mode: other slash commands, hotkeys, tools, model switching and autocomplete.

## Benchmark

Prompt: "Write a binary search function in Python. Return the index of the target, or -1."

| | vanilla pi | duck mode |
| --- | --- | --- |
| model | openai-codex/gpt-6-astra | duck |
| TTFT (median) | 2503 ms | 1.3 ms |
| TPS (median) | 29 | 23166 |
| reply tokens (median) | 99 | 7 |
| total time (median) | 5748 ms | 1.6 ms |
