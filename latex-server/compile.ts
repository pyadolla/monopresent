import { execFile } from "child_process";
import { promises as fsp } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import {
  buildLaTeXBoxContent, parseTeXBoxMetrics,
  applyLegacyCompatibleNormalization, fallbackAdjustSvgViewBox,
  extractInlineBaselineMetrics, parseLatexErrors, rewritePagePathsToDefsUses,
  InlineBaselineMetrics, TeXBoxMetrics,
} from "./normalize";
import { DOMParser, XMLSerializer } from "xmldom";

export const ENGINE = (process.env.LATEX_ENGINE || "lualatex").toLowerCase();
const LEGACY_ENGINE = "pdflatex";
// Per-compile scratch on node-local disk (NVMe/tmpfs), never the networked /project fs.
export const TMP_ROOT =
  process.env.LATEX_TMPDIR || process.env.SLURM_TMPDIR || os.tmpdir();
const DVISVGM_PAR = Math.max(1, Number(process.env.DVISVGM_PARALLEL || "4"));

function run(cmd: string, args: string[], cwd: string, timeoutMs = 180000):
  Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 },
      (err: any, stdout, stderr) => resolve({ code: err ? (err.code ?? 1) : 0, out: (stdout || "") + (stderr || "") }));
  });
}

// ---- document builders -------------------------------------------------
// The per-page body is byte-identical to the body server-concmath.ts emits for a
// single expression (same leading "\n    " indentation, same trailing "\n    "),
// so preview/standalone computes the identical tight bounding box per page.
function pageBody(tex: string, idx: number): string {
  const bodyContent = buildLaTeXBoxContent(tex);
  return (
    `\\begin{immb}\n` +
    `    \\setbox\\immersionbox=\\hbox{${bodyContent}}\n` +
    // NOTE the trailing "%": inside the preview box we are in horizontal mode, so
    // the newline after \typeout would contribute a real inter-word space and widen
    // the box by ~3.32pt. The per-request server is still in vertical mode there, so
    // its space is discarded. The "%" makes the two agree exactly.
    `    \\typeout{IMMBOX:${idx}:wd=\\the\\wd\\immersionbox;ht=\\the\\ht\\immersionbox;dp=\\the\\dp\\immersionbox}%\n` +
    `    \\makebox[0pt][l]{.}\\copy\\immersionbox\n` +
    `    \\end{immb}\n`
  );
}

function concmathDoc(texList: string[], preamble: string): string {
  return `
    \\documentclass[border=0pt,multi=immb]{standalone}
    ${preamble}
    \\usepackage{fontspec}
    \\usepackage{unicode-math}
    \\usepackage[Style=upint]{concmath-otf}
    \\usepackage{xcolor}
    \\newcommand{\\bm}[1]{\\symbf{#1}}
    \\setlength{\\hoffset}{0pt}
    \\setlength{\\voffset}{0pt}
    \\newcommand{\\g}[2]{%
      \\begingroup
      \\color[HTML]{#1}%
      #2%
      \\endgroup
    }
    \\newbox\\immersionbox
    \\newenvironment{immb}{}{}
    \\begin{document}
${texList.map((t, i) => pageBody(t, i + 1)).join("")}    \\end{document}
  `;
}

function legacyDoc(texList: string[], preamble: string): string {
  return `
    \\documentclass[border=0pt,multi=immb]{standalone}
    ${preamble}
    \\usepackage[utf8]{inputenc}
    \\usepackage[T1]{fontenc}
    \\usepackage[sfmath, uprightgreeks, intlimits, frenchstyle]{kpfonts}
    \\usepackage{bm}
    \\usepackage{xcolor}
    \\setlength{\\hoffset}{0pt}
    \\setlength{\\voffset}{0pt}
    \\newcommand{\\g}[2]{%
      \\begingroup
      \\color[HTML]{#1}%
      #2%
      \\endgroup
    }
    \\newbox\\immersionbox
    \\newenvironment{immb}{}{}
    \\begin{document}
${texList.map((t, i) => pageBody(t, i + 1)).join("")}    \\end{document}
  `;
}

function parseAllTeXBoxMetrics(out: string, n: number): Array<TeXBoxMetrics | null> {
  const res: Array<TeXBoxMetrics | null> = new Array(n).fill(null);
  const re = /IMMBOX:(\d+):wd=([+-]?\d*\.?\d+)pt;ht=([+-]?\d*\.?\d+)pt;dp=([+-]?\d*\.?\d+)pt/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(out))) {
    const i = parseInt(m[1], 10) - 1;
    if (i >= 0 && i < n) res[i] = { widthPt: +m[2], heightPt: +m[3], depthPt: +m[4] };
  }
  return res;
}

async function fileExists(p: string): Promise<boolean> {
  return (await fsp.stat(p).catch(() => null)) !== null;
}

/**
 * dvisvgm names the page group "page<N>" for page N of a multi-page file.
 * A single-page conversion (what the per-request server does) always yields
 * "page1", and both the normalizer and the presentation client look up
 * getElementById("page1"). Renaming it is an id-only change with no effect on
 * geometry, paths or glyphs.
 */
function renamePageGroupToPage1(svg: string, pageNo: number): string {
  if (pageNo === 1) return svg;
  return svg
    .replace(`id='page${pageNo}'`, "id='page1'")
    .replace(`id="page${pageNo}"`, 'id="page1"');
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

export type BatchItem =
  | { ok: true; svg: string; metrics: InlineBaselineMetrics | null; texBox: TeXBoxMetrics | null }
  | { ok: false; error: any };

/**
 * Compile N expressions using ONE lualatex run + ONE pdflatex run, then one
 * dvisvgm invocation per page (parallel). Normalization is the verbatim
 * server logic, so each result is the same SVG the per-request server emits.
 */
export async function batchCompile(texList: string[], preamble = ""): Promise<BatchItem[]> {
  const n = texList.length;
  if (n === 0) return [];
  const dir = path.join(TMP_ROOT, `latexbatch-${randomUUID()}`);
  await fsp.mkdir(dir, { recursive: true });
  try {
    await fsp.writeFile(path.join(dir, "cm.tex"), concmathDoc(texList, preamble));
    await fsp.writeFile(path.join(dir, "lg.tex"), legacyDoc(texList, preamble));

    const [cm, lg] = await Promise.all([
      run(ENGINE, ["-interaction=nonstopmode", "-output-directory=.", "cm.tex"], dir),
      run(LEGACY_ENGINE, ["-interaction=nonstopmode", "-output-format", "dvi", "-output-directory=.", "lg.tex"], dir),
    ]);

    const cmLog = cm.out + (await fsp.readFile(path.join(dir, "cm.log"), "utf8").catch(() => ""));
    const lgLog = lg.out + (await fsp.readFile(path.join(dir, "lg.log"), "utf8").catch(() => ""));
    const texBoxes = parseAllTeXBoxMetrics(cmLog, n);

    // If the concmath PDF is missing entirely the whole batch is unusable; the
    // caller falls back to per-expression compiles so one bad expression cannot
    // poison the rest.
    if (!(await fileExists(path.join(dir, "cm.pdf")))) {
      const err = { name: "BatchCompileFailed", message: "batch produced no PDF",
                    details: parseLatexErrors(cmLog).slice(0, 5).join("\n"), engine: ENGINE };
      return texList.map(() => ({ ok: false as const, error: err }));
    }
    const haveLegacy = await fileExists(path.join(dir, "lg.dvi"));

    const idxs = Array.from({ length: n }, (_, i) => i + 1);
    const svgs = await mapLimit(idxs, DVISVGM_PAR, async (p) => {
      const cmOut = `cm-${p}.svg`, lgOut = `lg-${p}.svg`;
      const jobs: Promise<any>[] = [run("dvisvgm", ["-n", "--pdf", "--bbox=preview", "-p", String(p), "cm.pdf", "-o", cmOut], dir)];
      if (haveLegacy) jobs.push(run("dvisvgm", ["-n", "--bbox=preview", "-p", String(p), "lg.dvi", "-o", lgOut], dir));
      await Promise.all(jobs);
      const cmRaw = await fsp.readFile(path.join(dir, cmOut), "utf8").catch(() => null);
      const lgRaw = haveLegacy ? await fsp.readFile(path.join(dir, lgOut), "utf8").catch(() => null) : null;
      const cmSvg = cmRaw === null ? null : renamePageGroupToPage1(cmRaw, p);
      const lgSvg = lgRaw === null ? null : renamePageGroupToPage1(lgRaw, p);
      return { cmSvg, lgSvg };
    });

    return svgs.map(({ cmSvg, lgSvg }, i) => {
      if (!cmSvg) return { ok: false as const, error: { name: "NoSVG", message: `page ${i + 1} produced no SVG`, engine: ENGINE } };
      try {
        let finalSvg: string;
        if (lgSvg) {
          finalSvg = applyLegacyCompatibleNormalization(cmSvg, lgSvg);
        } else {
          finalSvg = fallbackAdjustSvgViewBox(cmSvg);
          const d = new DOMParser().parseFromString(finalSvg, "image/svg+xml");
          rewritePagePathsToDefsUses(d);
          finalSvg = new XMLSerializer().serializeToString(d);
        }
        const tb = texBoxes[i];
        return { ok: true as const, svg: finalSvg,
                 metrics: extractInlineBaselineMetrics(finalSvg, tb, tb?.widthPt), texBox: tb };
      } catch (e: any) {
        return { ok: false as const, error: { name: "NormalizeError", message: e.message, engine: ENGINE } };
      }
    });
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Exact replica of the per-request pipeline in server-concmath.ts: one
 * lualatex + one pdflatex compile of a single-page standalone document.
 * Used as a fallback when a batch fails, so a single malformed expression can
 * never take down the rest of a batch.
 */
export async function singleCompile(tex: string, preamble = ""): Promise<BatchItem> {
  const dir = path.join(TMP_ROOT, `latexone-${randomUUID()}`);
  await fsp.mkdir(dir, { recursive: true });
  const body = buildLaTeXBoxContent(tex);
  const mk = (pre: string) => `
    \\documentclass[border=0pt]{standalone}
    ${preamble}
${pre}
    \\newbox\\immersionbox
    \\begin{document}
    \\setbox\\immersionbox=\\hbox{${body}}
    \\typeout{IMMBOX:wd=\\the\\wd\\immersionbox;ht=\\the\\ht\\immersionbox;dp=\\the\\dp\\immersionbox}
    \\makebox[0pt][l]{.}\\copy\\immersionbox
    \\end{document}
  `;
  const CM = `    \\usepackage{fontspec}
    \\usepackage{unicode-math}
    \\usepackage[Style=upint]{concmath-otf}
    \\usepackage{xcolor}
    \\newcommand{\\bm}[1]{\\symbf{#1}}
    \\setlength{\\hoffset}{0pt}
    \\setlength{\\voffset}{0pt}
    \\newcommand{\\g}[2]{%
      \\begingroup
      \\color[HTML]{#1}%
      #2%
      \\endgroup
    }`;
  const LG = `    \\usepackage[utf8]{inputenc}
    \\usepackage[T1]{fontenc}
    \\usepackage[sfmath, uprightgreeks, intlimits, frenchstyle]{kpfonts}
    \\usepackage{bm}
    \\usepackage{xcolor}
    \\setlength{\\hoffset}{0pt}
    \\setlength{\\voffset}{0pt}
    \\newcommand{\\g}[2]{%
      \\begingroup
      \\color[HTML]{#1}%
      #2%
      \\endgroup
    }`;
  try {
    await fsp.writeFile(path.join(dir, "cm.tex"), mk(CM));
    await fsp.writeFile(path.join(dir, "lg.tex"), mk(LG));
    const [cm] = await Promise.all([
      run(ENGINE, ["-interaction=nonstopmode", "-output-directory=.", "cm.tex"], dir),
      run(LEGACY_ENGINE, ["-interaction=nonstopmode", "-output-format", "dvi", "-output-directory=.", "lg.tex"], dir),
    ]);
    const cmLog = cm.out + (await fsp.readFile(path.join(dir, "cm.log"), "utf8").catch(() => ""));
    if (!(await fileExists(path.join(dir, "cm.pdf")))) {
      return { ok: false, error: { name: "CompilationError", message: "LaTeX compilation failed.",
               details: cmLog, tex, latexErrors: parseLatexErrors(cmLog), engine: ENGINE } };
    }
    await run("dvisvgm", ["-n", "--pdf", "--bbox=preview", "cm.pdf", "-o", "cm.svg"], dir);
    const haveLegacy = await fileExists(path.join(dir, "lg.dvi"));
    if (haveLegacy) await run("dvisvgm", ["-n", "--bbox=preview", "lg.dvi", "-o", "lg.svg"], dir);
    const cmSvg = await fsp.readFile(path.join(dir, "cm.svg"), "utf8").catch(() => null);
    const lgSvg = haveLegacy ? await fsp.readFile(path.join(dir, "lg.svg"), "utf8").catch(() => null) : null;
    if (!cmSvg) return { ok: false, error: { name: "FileReadError", message: "no SVG produced", tex, engine: ENGINE } };
    const tb = parseTeXBoxMetrics(cmLog);
    let finalSvg: string;
    if (lgSvg) finalSvg = applyLegacyCompatibleNormalization(cmSvg, lgSvg);
    else {
      finalSvg = fallbackAdjustSvgViewBox(cmSvg);
      const d = new DOMParser().parseFromString(finalSvg, "image/svg+xml");
      rewritePagePathsToDefsUses(d);
      finalSvg = new XMLSerializer().serializeToString(d);
    }
    return { ok: true, svg: finalSvg, metrics: extractInlineBaselineMetrics(finalSvg, tb, tb?.widthPt), texBox: tb };
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
