# pi-duck-mode

[![pi extension](https://img.shields.io/badge/pi-extension-lightgrey)](https://pi.dev)
[![TTFT](https://img.shields.io/badge/TTFT-1.3ms-brightgreen)](#benchmark)
[![powered by duck](https://img.shields.io/badge/powered%20by-duck-yellow?logo=duckdb&logoColor=white)](#pi-duck-mode)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Pi extension that makes pi 798x faster in terms of TPS and consumes 14x less tokens. It also prevents developer skill atrophy. 

Start pi and type `/duck`. Now you are in duck mode. In this mode there is no LLM. Every message gets the same reply: "Great, go ahead and make it!" Type your prompt, then write the code.

Zero hallucinations.

## Install

```sh
pi install git:github.com/<user>/pi-duck-mode
```

Type `/duck` to enter or exit duck mode.

## Benchmark

Prompt: "Write a binary search function in Python. Return the index of the target, or -1."

| | vanilla pi | duck mode |
| --- | --- | --- |
| model | openai-codex/gpt-6-astra | duck |
| TTFT (median) | 2503 ms | 1.3 ms |
| TPS (median) | 29 | 23166 |
| reply tokens (median) | 99 | 7 |
| total time (median) | 5748 ms | 1.6 ms |

