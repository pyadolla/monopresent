# latex-server

## Concmath server

Start the concmath server:

```bash
npm run start:concmath
```

### Performance toggles

`server-concmath.ts` supports these environment variables:

- `ENABLE_PARALLEL_COMPILE` (default: `1`)
- `ENABLE_CACHE` (default: `1`)
- `ENABLE_INFLIGHT_DEDUPE` (default: `1`)
- `ENABLE_QUEUE` (default: `1`)
- `MAX_COMPILE_CONCURRENCY` (default: `4`)
- `QUEUE_TIMEOUT_MS` (default: `10000`)
- `CACHE_MAX_ENTRIES` (default: `1000`)
- `CACHE_TTL_MS` (default: `600000`)
- `LATEX_ENGINE` (`lualatex` by default; use `xelatex` for XeTeX)

Example:

```bash
ENABLE_QUEUE=1 MAX_COMPILE_CONCURRENCY=4 QUEUE_TIMEOUT_MS=10000 npm run start:concmath
```

### Benchmark

Run a small concurrent benchmark against a running server:

```bash
npm run bench:concmath
```

Optional benchmark variables:

- `BENCH_URL` (default: `http://localhost:3001`)
- `BENCH_REQUESTS` (default: `100`)
- `BENCH_CONCURRENCY` (default: `8`)

Example:

```bash
BENCH_REQUESTS=200 BENCH_CONCURRENCY=16 npm run bench:concmath
```
