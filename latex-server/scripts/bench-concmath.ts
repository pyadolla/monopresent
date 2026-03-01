import { performance } from "perf_hooks";

type Sample = {
  tex: string;
  preamble: string;
  meta: string;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

function buildCorpus(): Sample[] {
  const base: Sample[] = [
    { tex: "$x_t$", preamble: "", meta: "1" },
    { tex: "$\\frac{1+x^2}{1-x}$", preamble: "", meta: "1" },
    { tex: "$\\int_0^1 t^2\\,dt$", preamble: "", meta: "1" },
    { tex: "$\\sum\\limits_{i=1}^n i$", preamble: "", meta: "1" },
    {
      tex: "$\\Delta s_i = \\sum\\limits_j \\alpha_{ij} m^s_{ij} \\qquad \\Delta \\mathbf{v}_{i} = \\sum\\limits_i \\alpha_{ij} \\mathbf{m}_{ij}^v$",
      preamble: "",
      meta: "1",
    },
    { tex: "10. Updated node embeddings:", preamble: "", meta: "1" },
  ];
  return base;
}

async function requestOnce(baseUrl: string, sample: Sample): Promise<number> {
  const started = performance.now();
  const u = new URL("/latex", baseUrl);
  u.searchParams.set("tex", sample.tex);
  u.searchParams.set("preamble", sample.preamble);
  u.searchParams.set("meta", sample.meta);
  u.searchParams.set("cachebust", "bench");
  const res = await fetch(u.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  await res.text();
  return performance.now() - started;
}

async function main() {
  const baseUrl = process.env.BENCH_URL || "http://localhost:3001";
  const totalRequests = Number(process.env.BENCH_REQUESTS || "100");
  const concurrency = Number(process.env.BENCH_CONCURRENCY || "8");
  const corpus = buildCorpus();

  let launched = 0;
  let completed = 0;
  let failed = 0;
  const latencies: number[] = [];
  const t0 = performance.now();

  const worker = async () => {
    while (true) {
      const idx = launched++;
      if (idx >= totalRequests) return;
      const sample = corpus[idx % corpus.length];
      try {
        const latency = await requestOnce(baseUrl, sample);
        latencies.push(latency);
      } catch {
        failed += 1;
      } finally {
        completed += 1;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  const totalMs = performance.now() - t0;

  latencies.sort((a, b) => a - b);
  const rps = completed > 0 ? (completed / totalMs) * 1000 : 0;
  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);

  console.log(
    JSON.stringify(
      {
        baseUrl,
        totalRequests,
        concurrency,
        completed,
        failed,
        durationMs: Number(totalMs.toFixed(1)),
        rps: Number(rps.toFixed(2)),
        p50Ms: Number(p50.toFixed(1)),
        p95Ms: Number(p95.toFixed(1)),
        p99Ms: Number(p99.toFixed(1)),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error("bench failed:", e);
  process.exit(1);
});

