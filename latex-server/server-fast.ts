import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import zlib from "zlib";
import path from "path";
import { createHash, randomUUID } from "crypto";
import { promises as fsp, existsSync, appendFileSync, mkdirSync, createReadStream } from "fs";
import readline from "readline";
import { batchCompile, singleCompile, ENGINE, TMP_ROOT } from "./compile";
import { InlineBaselineMetrics } from "./normalize";

const app = express();
app.use(bodyParser.json({ limit: "8mb" }));
app.use(cors());

const PORT = Number(process.env.LATEX_SERVER_PORT || 3101);
const CACHE_FILE = process.env.LATEX_CACHE_FILE ||
  path.join(process.env.LATEX_CACHE_DIR || "./cache", "latex-cache.jsonl");
const COALESCE_MS = Number(process.env.COALESCE_MS || 25);
const BATCH_MAX = Number(process.env.BATCH_MAX || 64);
const SCHEMA = "v1";

type Entry = { svg: string; metrics: InlineBaselineMetrics | null };

// ---------------------------------------------------------------- cache ----
// Durable, append-only JSONL. One inode, survives restarts and rebuilds.
const cache = new Map<string, Entry>();
let cacheWrites = 0;

function keyOf(tex: string, preamble: string): string {
  // NOTE: deliberately does NOT include `meta`. The old server keyed on it, so
  // the client's meta=0 -> meta=1 transition recompiled the entire deck twice.
  return createHash("sha256")
    .update(JSON.stringify({ tex, preamble, engine: ENGINE, schemaVersion: SCHEMA }))
    .digest("hex");
}

async function loadCache(): Promise<void> {
  mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  if (!existsSync(CACHE_FILE)) return;
  const rl = readline.createInterface({ input: createReadStream(CACHE_FILE), crlfDelay: Infinity });
  let n = 0, bad = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); cache.set(r.k, { svg: r.svg, metrics: r.m ?? null }); n++; }
    catch { bad++; }               // a torn final line from a crash is simply skipped
  }
  console.log(`[fast] cache loaded: ${cache.size} entries (${n} records, ${bad} skipped) from ${CACHE_FILE}`);
}

function putCache(k: string, e: Entry): void {
  putCacheMany([[k, e]]);
}

/**
 * One append per batch rather than one per entry. The cache file lives on a
 * networked filesystem, where 113 individual appendFileSync calls cost seconds;
 * a single append costs milliseconds. Still crash-safe: the file is append-only
 * JSONL and a torn trailing line is skipped on load.
 */
function putCacheMany(entries: Array<[string, Entry]>): void {
  if (entries.length === 0) return;
  let blob = "";
  for (const [k, e] of entries) {
    cache.set(k, e);
    blob += JSON.stringify({ k, svg: e.svg, m: e.metrics }) + "\n";
  }
  try { appendFileSync(CACHE_FILE, blob); cacheWrites += entries.length; }
  catch (err) { console.warn("[fast] cache append failed", err); }
}

// ------------------------------------------------------ batch coalescing ----
// Misses are collected for a few ms and compiled as ONE multi-page document, so
// a slide that fires N concurrent requests costs one preamble load, not N.
type Waiter = { tex: string; resolve: (e: Entry) => void; reject: (e: any) => void };
let pending: Waiter[] = [];
let timer: NodeJS.Timeout | null = null;
const inflight = new Map<string, Promise<Entry>>();

function schedule(preamble: string) {
  if (timer) return;
  timer = setTimeout(() => { timer = null; void flush(preamble); }, COALESCE_MS);
}

async function flush(preamble: string): Promise<void> {
  if (pending.length === 0) return;
  const group = pending.splice(0, BATCH_MAX);
  if (pending.length > 0) schedule(preamble);

  const texList = group.map((g) => g.tex);
  const t0 = process.hrtime.bigint();
  let results = await batchCompile(texList, preamble);
  const batchMs = Number(process.hrtime.bigint() - t0) / 1e6;

  // Any expression the batch could not produce is retried on its own, with the
  // exact single-document recipe the original server uses.
  const retry = results.map((r, i) => ({ r, i })).filter((x) => !x.r.ok);
  if (retry.length) {
    console.warn(`[fast] ${retry.length}/${texList.length} failed in batch; falling back to single compiles`);
    for (const { i } of retry) results[i] = await singleCompile(texList[i], preamble);
  }

  const toPersist: Array<[string, Entry]> = [];
  results.forEach((r, i) => {
    const g = group[i];
    if (r.ok) {
      const e = { svg: r.svg, metrics: r.metrics };
      toPersist.push([keyOf(g.tex, preamble), e]);
      g.resolve(e);
    } else g.reject(r.error);
  });
  putCacheMany(toPersist);
  console.log(`[fast] batch n=${texList.length} ${batchMs.toFixed(0)}ms (${(batchMs/texList.length).toFixed(1)} ms/expr)` +
              `${retry.length ? ` +${retry.length} singles` : ""}`);
}

function compileOne(tex: string, preamble: string): Promise<Entry> {
  const k = keyOf(tex, preamble);
  const hit = cache.get(k);
  if (hit) return Promise.resolve(hit);
  const dup = inflight.get(k);
  if (dup) return dup;
  const p = new Promise<Entry>((resolve, reject) => {
    pending.push({ tex, resolve, reject });
    if (pending.length >= BATCH_MAX) { if (timer) { clearTimeout(timer); timer = null; } void flush(preamble); }
    else schedule(preamble);
  }).finally(() => inflight.delete(k));
  inflight.set(k, p);
  return p;
}

// ------------------------------------------------------------- transport ----
function send(req: Request, res: Response, meta: string, e: Entry) {
  const payload = meta === "1"
    ? { type: "application/json", body: JSON.stringify({ svg: e.svg, metrics: e.metrics }) }
    : { type: "image/svg+xml", body: e.svg };
  res.type(payload.type);
  // Long-lived immutable caching: the response for a given tex never changes,
  // so a browser reload costs nothing.
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("ETag", '"' + createHash("sha1").update(payload.body).digest("hex") + '"');
  if (req.headers["if-none-match"] === res.getHeader("ETag")) { res.status(304).end(); return; }
  const ae = String(req.headers["accept-encoding"] || "");
  if (/\bgzip\b/.test(ae) && payload.body.length > 1024) {
    res.setHeader("Content-Encoding", "gzip");
    res.end(zlib.gzipSync(Buffer.from(payload.body), { level: 6 }));
  } else res.end(payload.body);
}

app.get("/latex", async (req: Request, res: Response) => {
  const { tex, preamble = "", meta = "0" } = req.query as Record<string, string>;
  if (!tex) return res.status(400).json({ name: "BadRequest", message: "Missing 'tex' parameter" });
  try {
    send(req, res, String(meta), await compileOne(tex, String(preamble)));
  } catch (error: any) {
    res.status(500).json({
      name: error?.name || "ServerError", message: error?.message || "An unexpected error occurred.",
      details: error?.details || "", tex, engine: ENGINE,
      latexErrors: error?.latexErrors || ["Unknown error during processing."],
    });
  }
});

// Batch endpoint: one request, many expressions. Lets a client fetch a whole
// slide (or the whole deck) in a single round trip.
app.post("/latex/batch", async (req: Request, res: Response) => {
  const { tex, preamble = "", meta = "1", results: want = true } = req.body || {};
  if (!Array.isArray(tex)) return res.status(400).json({ name: "BadRequest", message: "'tex' must be an array" });
  const out = await Promise.all(tex.map(async (t: string) => {
    try {
      const e = await compileOne(t, preamble);
      // `results: false` is prewarm mode: fill the cache but do not pay to
      // serialize ~840KB of SVG back to a caller that is going to discard it.
      if (!want) return { ok: true };
      return meta === "1" ? { svg: e.svg, metrics: e.metrics } : { svg: e.svg };
    }
    catch (e: any) { return { error: e?.message || "compile failed", latexErrors: e?.latexErrors }; }
  }));
  // Batch payloads are the largest responses the server produces (a whole
  // slide's SVG in one body), so they benefit from compression the most.
  const payload = JSON.stringify(want ? { results: out } : { ok: out.filter((r: any) => r.ok).length, n: tex.length });
  res.type("application/json");
  const ae = String(req.headers["accept-encoding"] || "");
  if (/\bgzip\b/.test(ae) && payload.length > 1024) {
    res.setHeader("Content-Encoding", "gzip");
    res.end(zlib.gzipSync(Buffer.from(payload), { level: 6 }));
  } else res.end(payload);
});

app.get("/health", (_req, res) => res.json({
  ok: true, engine: ENGINE, cacheEntries: cache.size, cacheWrites,
  cacheFile: CACHE_FILE, tmpRoot: TMP_ROOT, pending: pending.length,
}));

loadCache().then(() => {
  app.listen(PORT, () => console.log(`[fast] LaTeX server (${ENGINE}) on http://localhost:${PORT}  tmp=${TMP_ROOT}`));
});
