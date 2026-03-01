import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import fs from "fs-extra";
import { exec } from "child_process";
import cors from "cors";
import { DOMParser, XMLSerializer } from "xmldom";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fsp } from "fs";
import { createHash } from "crypto";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const ENGINE = (process.env.LATEX_ENGINE || "lualatex").toLowerCase();
const PORT = Number(process.env.LATEX_SERVER_PORT || 3001);
const LEGACY_ENGINE = "pdflatex";
const ENABLE_PARALLEL_COMPILE =
  (process.env.ENABLE_PARALLEL_COMPILE || "1").toLowerCase() !== "0";
const ENABLE_CACHE = (process.env.ENABLE_CACHE || "1").toLowerCase() !== "0";
const ENABLE_INFLIGHT_DEDUPE =
  (process.env.ENABLE_INFLIGHT_DEDUPE || "1").toLowerCase() !== "0";
const ENABLE_QUEUE = (process.env.ENABLE_QUEUE || "1").toLowerCase() !== "0";
const CACHE_MAX_ENTRIES = Number(process.env.CACHE_MAX_ENTRIES || 1000);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60_000);
const CACHE_SCHEMA_VERSION = "v1";
const MAX_COMPILE_CONCURRENCY = Math.max(
  1,
  Number(process.env.MAX_COMPILE_CONCURRENCY || "6")
);
const QUEUE_TIMEOUT_MS = Math.max(100, Number(process.env.QUEUE_TIMEOUT_MS || "15000"));

type InlineBaselineMetrics = {
  version: string;
  widthPt: number;
  advanceWidthPt?: number;
  heightPt: number;
  viewBox: [number, number, number, number];
  baselineFromTopPt: number;
  descentFromBaselinePt: number;
};

type TeXBoxMetrics = {
  widthPt: number;
  heightPt: number;
  depthPt: number;
};

type CachedResponse = {
  svg: string;
  metrics: InlineBaselineMetrics | null;
  createdAtMs: number;
  expiresAtMs: number;
};

type CompiledResponse = {
  svg: string;
  metrics: InlineBaselineMetrics | null;
  timing: {
    tConcmathMs: number;
    tLegacyMs: number;
    tNormalizeMs: number;
    usedLegacyMetrics: boolean;
  };
};

const responseCache = new Map<string, CachedResponse>();
const inflightRequests = new Map<string, Promise<CompiledResponse>>();
let activeCompileJobs = 0;
const compileQueue: Array<() => void> = [];

function nowNs(): bigint {
  return process.hrtime.bigint();
}

function elapsedMs(startNs: bigint): number {
  return Number(process.hrtime.bigint() - startNs) / 1_000_000;
}

function hashRequestKey(parts: {
  tex: string;
  preamble: string;
  meta: string;
  engine: string;
  schemaVersion: string;
}): string {
  const payload = JSON.stringify(parts);
  return createHash("sha256").update(payload).digest("hex");
}

function readCache(key: string): CachedResponse | null {
  if (!ENABLE_CACHE) return null;
  const entry = responseCache.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (entry.expiresAtMs <= now) {
    responseCache.delete(key);
    return null;
  }
  // LRU touch
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry;
}

function writeCache(key: string, value: { svg: string; metrics: InlineBaselineMetrics | null }): void {
  if (!ENABLE_CACHE || CACHE_MAX_ENTRIES <= 0 || CACHE_TTL_MS <= 0) return;
  const now = Date.now();
  const entry: CachedResponse = {
    ...value,
    createdAtMs: now,
    expiresAtMs: now + CACHE_TTL_MS,
  };
  if (responseCache.has(key)) {
    responseCache.delete(key);
  }
  responseCache.set(key, entry);
  while (responseCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (!oldestKey) break;
    responseCache.delete(oldestKey);
  }
}

function getQueueDepth(): number {
  return compileQueue.length;
}

function releaseCompileSlot(): void {
  activeCompileJobs = Math.max(0, activeCompileJobs - 1);
  const next = compileQueue.shift();
  if (next) next();
}

async function acquireCompileSlot(timeoutMs: number): Promise<{ queueWaitMs: number; timedOut: boolean }> {
  if (!ENABLE_QUEUE) {
    return { queueWaitMs: 0, timedOut: false };
  }
  const waitStartNs = nowNs();
  if (activeCompileJobs < MAX_COMPILE_CONCURRENCY) {
    activeCompileJobs += 1;
    return { queueWaitMs: 0, timedOut: false };
  }

  return new Promise((resolve) => {
    let settled = false;
    const grant = () => {
      if (settled) return;
      settled = true;
      activeCompileJobs += 1;
      resolve({ queueWaitMs: elapsedMs(waitStartNs), timedOut: false });
    };
    compileQueue.push(grant);

    setTimeout(() => {
      if (settled) return;
      settled = true;
      const idx = compileQueue.indexOf(grant);
      if (idx >= 0) compileQueue.splice(idx, 1);
      resolve({ queueWaitMs: elapsedMs(waitStartNs), timedOut: true });
    }, timeoutMs);
  });
}

function buildLaTeXBoxContent(tex: string): string {
  const hasMathDelimiters =
    tex.includes("$") || tex.includes("\\(") || tex.includes("\\[");
  return hasMathDelimiters ? tex : `\\text{${tex}}`;
}

function parseTeXBoxMetrics(output: string): TeXBoxMetrics | null {
  const m = output.match(
    /IMMBOX:wd=([+-]?\d*\.?\d+)pt;ht=([+-]?\d*\.?\d+)pt;dp=([+-]?\d*\.?\d+)pt/
  );
  if (!m) return null;
  const widthPt = parseFloat(m[1]);
  const heightPt = parseFloat(m[2]);
  const depthPt = parseFloat(m[3]);
  if ([widthPt, heightPt, depthPt].some((n) => Number.isNaN(n))) return null;
  return { widthPt, heightPt, depthPt };
}

async function compileConcmathLaTeXToSVG(
  tex: string,
  preamble: string
): Promise<{ svg: string; texBoxMetrics: TeXBoxMetrics | null }> {
  const inputDir = "./tmp";
  await fs.ensureDir(inputDir);

  const id = randomUUID();
  const baseName = `latex-concmath-${id}`;
  const texPath = path.join(inputDir, `${baseName}.tex`);
  const pdfPath = path.join(inputDir, `${baseName}.pdf`);
  const svgPath = path.join(inputDir, `${baseName}.svg`);
  const bodyContent = buildLaTeXBoxContent(tex);

  const fullTex = `
    \\documentclass[border=0pt]{standalone}
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
    \\begin{document}
    \\setbox\\immersionbox=\\hbox{${bodyContent}}
    \\typeout{IMMBOX:wd=\\the\\wd\\immersionbox;ht=\\the\\ht\\immersionbox;dp=\\the\\dp\\immersionbox}
    \\makebox[0pt][l]{.}\\copy\\immersionbox
    \\end{document}
  `;

  await fs.writeFile(texPath, fullTex);

  return new Promise((resolve, reject) => {
    const latexCmd =
      ENGINE === "xelatex"
        ? `xelatex -interaction=nonstopmode -output-directory=${inputDir} ${texPath}`
        : `lualatex -interaction=nonstopmode -output-directory=${inputDir} ${texPath}`;

    const command = `${latexCmd} && dvisvgm -n --pdf --bbox=preview ${pdfPath} -o ${svgPath}`;

    exec(command, async (error, stdout, stderr) => {
      const combinedOutput = stdout + stderr;
      const cleanupFiles = [".aux", ".log", ".pdf", ".tex", ".svg"].map((ext) =>
        path.join(inputDir, `${baseName}${ext}`)
      );

      const cleanup = async () => {
        await Promise.allSettled(cleanupFiles.map((file) => fsp.rm(file, { force: true })));
      };

      if (error) {
        await cleanup();
        const latexErrors = parseLatexErrors(combinedOutput);
        return reject({
          name: "CompilationError",
          message: "LaTeX compilation failed.",
          details: combinedOutput || error.message,
          tex,
          latexErrors,
          engine: ENGINE,
        });
      }

      try {
        const svg = await fs.readFile(svgPath, "utf8");
        const texBoxMetrics = parseTeXBoxMetrics(combinedOutput);
        await cleanup();
        resolve({ svg, texBoxMetrics });
      } catch (err: any) {
        await cleanup();
        reject({
          name: "FileReadError",
          message: "Error reading the generated SVG file.",
          details: err.message,
          tex,
          latexErrors: ["Error reading the output SVG file."],
          engine: ENGINE,
        });
      }
    });
  });
}

async function compileLegacyLaTeXToSVG(tex: string, preamble: string): Promise<string> {
  const inputDir = "./tmp";
  await fs.ensureDir(inputDir);

  const id = randomUUID();
  const baseName = `latex-legacy-metrics-${id}`;
  const texPath = path.join(inputDir, `${baseName}.tex`);
  const dviPath = path.join(inputDir, `${baseName}.dvi`);
  const svgPath = path.join(inputDir, `${baseName}.svg`);
  const bodyContent = buildLaTeXBoxContent(tex);

  const fullTex = `
    \\documentclass[border=0pt]{standalone}
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
    \\begin{document}
    \\setbox\\immersionbox=\\hbox{${bodyContent}}
    \\typeout{IMMBOX:wd=\\the\\wd\\immersionbox;ht=\\the\\ht\\immersionbox;dp=\\the\\dp\\immersionbox}
    \\makebox[0pt][l]{.}\\copy\\immersionbox
    \\end{document}
  `;

  await fs.writeFile(texPath, fullTex);

  return new Promise((resolve, reject) => {
    const command = `${LEGACY_ENGINE} -interaction=nonstopmode -output-format dvi -output-directory=${inputDir} ${texPath} && dvisvgm -n --bbox=preview ${dviPath} -o ${svgPath}`;

    exec(command, async (error, stdout, stderr) => {
      const combinedOutput = stdout + stderr;
      const cleanupFiles = [".aux", ".log", ".pdf", ".tex", ".dvi", ".svg"].map((ext) =>
        path.join(inputDir, `${baseName}${ext}`)
      );

      const cleanup = async () => {
        await Promise.allSettled(cleanupFiles.map((file) => fsp.rm(file, { force: true })));
      };

      if (error) {
        await cleanup();
        const latexErrors = parseLatexErrors(combinedOutput);
        return reject({
          name: "LegacyMetricsCompilationError",
          message: "Legacy LaTeX metrics compilation failed.",
          details: combinedOutput || error.message,
          tex,
          latexErrors,
          engine: LEGACY_ENGINE,
        });
      }

      try {
        const svg = await fs.readFile(svgPath, "utf8");
        await cleanup();
        resolve(svg);
      } catch (err: any) {
        await cleanup();
        reject({
          name: "FileReadError",
          message: "Error reading the legacy metrics SVG file.",
          details: err.message,
          tex,
          latexErrors: ["Error reading the output SVG file."],
          engine: LEGACY_ENGINE,
        });
      }
    });
  });
}

function fallbackAdjustSvgViewBox(svgString: string): string {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const doc = parser.parseFromString(svgString, "image/svg+xml");

  const svg = doc.getElementsByTagName("svg")[0];
  if (!svg) throw new Error("No <svg> root element found.");

  const viewBoxAttr = svg.getAttribute("viewBox");
  if (!viewBoxAttr) throw new Error("No viewBox attribute found.");

  const [vx, vy, vw, vh] = viewBoxAttr.split(/\s+/).map(Number);
  if ([vx, vy, vw, vh].some((v) => isNaN(v))) {
    throw new Error(`Invalid viewBox format: ${viewBoxAttr}`);
  }

  const page = doc.getElementById("page1");
  if (!page) return serializer.serializeToString(doc);

  const uses = Array.from(page.getElementsByTagName("use")) as Element[];
  if (uses.length === 0) return serializer.serializeToString(doc);

  // Marker inserted by \makebox[0pt][l]{.} is always first in output order.
  const target = uses[0];

  const xRaw = parseFloat(target.getAttribute("x") || "");
  const yRaw = parseFloat(target.getAttribute("y") || "");
  if (isNaN(xRaw) || isNaN(yRaw)) return serializer.serializeToString(doc);

  // Normalize PDF-mode absolute coordinates back to legacy-style coordinates
  // expected by immersion-presentation baseline/layout logic.
  const newVx = -xRaw;
  const newVy = -yRaw;
  svg.setAttribute("viewBox", [newVx, newVy, vw, vh].join(" "));

  target.parentNode?.removeChild(target);

  return serializer.serializeToString(doc);
}

function findMarkerUse(doc: Document): Element | null {
  const page = doc.getElementById("page1");
  if (!page) return null;
  const uses = Array.from(page.getElementsByTagName("use")) as Element[];
  if (uses.length === 0) return null;
  return uses[0];
}

function getTransformFns(transform: string) {
  const fns: Array<(x: number, y: number) => [number, number]> = [];

  const matrixRe = /matrix\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = matrixRe.exec(transform))) {
    const nums = m[1]
      .split(/[,\s]+/)
      .map((s) => parseFloat(s))
      .filter((n) => !Number.isNaN(n));
    if (nums.length === 6) {
      const [a, b, c, d, e, f] = nums;
      fns.push((x, y) => [a * x + c * y + e, b * x + d * y + f]);
    }
  }

  const translateRe = /translate\(([^)]+)\)/g;
  while ((m = translateRe.exec(transform))) {
    const nums = m[1]
      .split(/[,\s]+/)
      .map((s) => parseFloat(s))
      .filter((n) => !Number.isNaN(n));
    if (nums.length >= 1) {
      const tx = nums[0];
      const ty = nums.length >= 2 ? nums[1] : 0;
      fns.push((x, y) => [x + tx, y + ty]);
    }
  }

  return fns;
}

function getFinalXY(element: Element, svg: Element): [number, number] {
  let x = parseFloat(element.getAttribute("x") || "");
  let y = parseFloat(element.getAttribute("y") || "");
  if (Number.isNaN(x) || Number.isNaN(y)) {
    throw new Error("Could not parse marker x/y.");
  }

  let node: Node | null = element;
  while (node && node !== svg) {
    const transform = (node as Element).getAttribute?.("transform");
    if (transform) {
      for (const fn of getTransformFns(transform)) {
        [x, y] = fn(x, y);
      }
    }
    node = node.parentNode;
  }

  return [x, y];
}

function parseViewBox(svg: Element): [number, number, number, number] | null {
  const viewBoxAttr = svg.getAttribute("viewBox");
  if (!viewBoxAttr) return null;
  const values = viewBoxAttr.split(/\s+/).map(Number);
  if (values.length !== 4 || values.some((n) => Number.isNaN(n))) return null;
  return values as [number, number, number, number];
}

function parseNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = parseFloat(raw);
  return Number.isNaN(n) ? null : n;
}

function strokeLineToFilledPath(d: string, strokeWidth: number): string | null {
  const cleaned = d.trim().replace(/,/g, " ");
  const hMatch = cleaned.match(
    /^M\s*(-?\d*\.?\d+)\s*(-?\d*\.?\d+)\s*H\s*(-?\d*\.?\d+)\s*$/i
  );
  if (hMatch) {
    const x1 = parseFloat(hMatch[1]);
    const y = parseFloat(hMatch[2]);
    const x2 = parseFloat(hMatch[3]);
    const hh = strokeWidth / 2;
    return `M ${x1} ${y - hh} L ${x2} ${y - hh} L ${x2} ${y + hh} L ${x1} ${y + hh} Z`;
  }

  const vMatch = cleaned.match(
    /^M\s*(-?\d*\.?\d+)\s*(-?\d*\.?\d+)\s*V\s*(-?\d*\.?\d+)\s*$/i
  );
  if (vMatch) {
    const x = parseFloat(vMatch[1]);
    const y1 = parseFloat(vMatch[2]);
    const y2 = parseFloat(vMatch[3]);
    const hw = strokeWidth / 2;
    return `M ${x - hw} ${y1} L ${x + hw} ${y1} L ${x + hw} ${y2} L ${x - hw} ${y2} Z`;
  }

  const lMatch = cleaned.match(
    /^M\s*(-?\d*\.?\d+)\s*(-?\d*\.?\d+)\s*L\s*(-?\d*\.?\d+)\s*(-?\d*\.?\d+)\s*$/i
  );
  if (lMatch) {
    const x1 = parseFloat(lMatch[1]);
    const y1 = parseFloat(lMatch[2]);
    const x2 = parseFloat(lMatch[3]);
    const y2 = parseFloat(lMatch[4]);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return null;
    const nx = (-dy / len) * (strokeWidth / 2);
    const ny = (dx / len) * (strokeWidth / 2);
    return `M ${x1 + nx} ${y1 + ny} L ${x2 + nx} ${y2 + ny} L ${x2 - nx} ${y2 - ny} L ${x1 - nx} ${y1 - ny} Z`;
  }

  return null;
}

function rewriteStrokeOnlyPaths(pathEl: Element) {
  const d = pathEl.getAttribute("d");
  if (!d) return;

  const styleRaw = pathEl.getAttribute("style") || "";
  const styleEntries = styleRaw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(":");
      if (idx < 0) return ["", ""] as const;
      return [entry.slice(0, idx).trim(), entry.slice(idx + 1).trim()] as const;
    });
  const styleMap = new Map(styleEntries);

  const stroke = pathEl.getAttribute("stroke") || styleMap.get("stroke") || null;
  const fill = pathEl.getAttribute("fill") || styleMap.get("fill") || null;
  const strokeWidth =
    parseNumber(pathEl.getAttribute("stroke-width")) ??
    parseNumber(styleMap.get("stroke-width")) ??
    0;

  const hasVisibleStroke = !!stroke && stroke.toLowerCase() !== "none" && strokeWidth > 0;
  const hasNoFill = !fill || fill.toLowerCase() === "none";
  if (!hasVisibleStroke || !hasNoFill) return;

  const rewritten = strokeLineToFilledPath(d, strokeWidth);
  if (!rewritten) return;

  pathEl.setAttribute("d", rewritten);
  pathEl.setAttribute("fill", stroke);
  pathEl.removeAttribute("stroke");
  pathEl.removeAttribute("stroke-width");
  pathEl.removeAttribute("stroke-miterlimit");
  pathEl.removeAttribute("stroke-linecap");
  pathEl.removeAttribute("stroke-linejoin");
  pathEl.removeAttribute("style");
}

function parseStyleMap(styleRaw: string): Map<string, string> {
  return new Map(
    styleRaw
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const idx = entry.indexOf(":");
        if (idx < 0) return ["", ""] as const;
        return [entry.slice(0, idx).trim(), entry.slice(idx + 1).trim()] as const;
      })
      .filter(([k]) => k.length > 0)
  );
}

function resolveEffectivePaint(el: Element, prop: "fill" | "opacity"): string | null {
  let cur: Element | null = el;
  while (cur) {
    const attrVal = cur.getAttribute(prop);
    if (attrVal && attrVal.trim() !== "" && attrVal.toLowerCase() !== "none") return attrVal;
    const styleVal = parseStyleMap(cur.getAttribute("style") || "").get(prop);
    if (styleVal && styleVal.trim() !== "" && styleVal.toLowerCase() !== "none") return styleVal;
    cur = cur.parentNode && (cur.parentNode as any).nodeType === 1 ? (cur.parentNode as Element) : null;
  }
  return null;
}

function rewritePagePathsToDefsUses(doc: Document) {
  const svg = doc.getElementsByTagName("svg")[0];
  const page = doc.getElementById("page1");
  if (!svg || !page) return;

  let defs: Element | null = svg.getElementsByTagName("defs")[0] || null;
  if (!defs) {
    defs = doc.createElement("defs");
    if (svg.firstChild) svg.insertBefore(defs, svg.firstChild);
    else svg.appendChild(defs);
  }

  let pathIndex = 0;
  const materializePathAsUse = (pathEl: Element) => {
    const d = pathEl.getAttribute("d");
    if (!d) return;

    rewriteStrokeOnlyPaths(pathEl);
    const finalD = pathEl.getAttribute("d");
    if (!finalD) return;

    const id = `auto-path-${pathIndex++}`;
    const defPath = doc.createElement("path");
    defPath.setAttribute("id", id);
    defPath.setAttribute("d", finalD);
    defs!.appendChild(defPath);

    const use = doc.createElement("use");
    use.setAttribute("x", "0");
    use.setAttribute("y", "0");
    use.setAttribute("xlink:href", `#${id}`);
    const transform = pathEl.getAttribute("transform");
    if (transform) {
      use.setAttribute("transform", transform);
    }
    const fill = resolveEffectivePaint(pathEl, "fill");
    if (fill) {
      use.setAttribute("fill", fill);
    }
    const opacity = resolveEffectivePaint(pathEl, "opacity");
    if (opacity) {
      use.setAttribute("opacity", opacity);
    }
    pathEl.parentNode?.replaceChild(use, pathEl);
  };

  for (const child of Array.from(page.childNodes)) {
    if (child.nodeType !== 1) continue;
    const el = child as Element;
    if (el.tagName === "path") {
      materializePathAsUse(el);
      continue;
    }
    if (el.tagName === "g") {
      for (const sub of Array.from(el.childNodes)) {
        if (sub.nodeType !== 1) continue;
        const subEl = sub as Element;
        if (subEl.tagName === "path") {
          materializePathAsUse(subEl);
        }
      }
    }
  }
}

function applyLegacyCompatibleNormalization(concmathSvg: string, legacySvg: string): string {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  const concmathDoc = parser.parseFromString(concmathSvg, "image/svg+xml");
  const legacyDoc = parser.parseFromString(legacySvg, "image/svg+xml");

  const concmathRoot = concmathDoc.getElementsByTagName("svg")[0];
  if (!concmathRoot) throw new Error("Concmath SVG has no root element.");

  const legacyRoot = legacyDoc.getElementsByTagName("svg")[0];
  if (!legacyRoot) throw new Error("Legacy SVG has no root element.");

  const concmathViewBox = parseViewBox(concmathRoot);
  if (!concmathViewBox) throw new Error("Concmath SVG has invalid viewBox.");
  const [, , concmathVw, concmathVh] = concmathViewBox;
  const legacyViewBox = parseViewBox(legacyRoot);
  if (!legacyViewBox) throw new Error("Legacy SVG has invalid viewBox.");
  const [, , , legacyVh] = legacyViewBox;

  const concmathMarker = findMarkerUse(concmathDoc);
  if (!concmathMarker) throw new Error("Concmath SVG marker not found.");
  const legacyMarker = findMarkerUse(legacyDoc);
  if (!legacyMarker) throw new Error("Legacy SVG marker not found.");

  const [concmathMarkerXFinal, concmathMarkerYFinal] = getFinalXY(concmathMarker, concmathRoot);
  const [legacyMarkerXFinal, legacyMarkerYFinal] = getFinalXY(legacyMarker, legacyRoot);
  const dx = legacyMarkerXFinal - concmathMarkerXFinal;
  // Compensate for different engine box heights so inline baseline lands where
  // immersion's layout expects (bottom of viewBox after normalization).
  const baselineCompensationY = legacyVh - concmathVh;
  const dy = legacyMarkerYFinal - concmathMarkerYFinal - baselineCompensationY;

  const concmathPage = concmathDoc.getElementById("page1");
  if (!concmathPage) throw new Error("Concmath SVG has no page1.");

  // Remove the synthetic marker after re-anchoring.
  concmathMarker.parentNode?.removeChild(concmathMarker);

  // Translate each top-level page1 element in-place. Avoid adding an extra wrapper
  // group because immersion's svg parser expects the original page1 child structure.
  const pageChildren = Array.from(concmathPage.childNodes);
  for (const child of pageChildren) {
    if (child.nodeType !== 1) continue;
    const el = child as Element;
    const existingTransform = el.getAttribute("transform");
    const translate = `translate(${dx} ${dy})`;
    el.setAttribute("transform", existingTransform ? `${translate} ${existingTransform}` : translate);
  }

  // Preserve concmath dimensions while matching legacy baseline semantics.
  const newVx = legacyMarkerXFinal;
  const newVy = legacyMarkerYFinal - legacyVh;
  concmathRoot.setAttribute("viewBox", [newVx, newVy, concmathVw, concmathVh].join(" "));

  rewritePagePathsToDefsUses(concmathDoc);
  return serializer.serializeToString(concmathDoc);
}

function parseLatexErrors(output: string): string[] {
  if (!output) return ["Unknown LaTeX error"];

  const errorLines = output.split("\n");
  const errors: string[] = [];
  let currentError: string | null = null;

  for (const line of errorLines) {
    if (line.startsWith("!")) {
      if (currentError) errors.push(currentError.trim());
      currentError = line;
    } else if (currentError && line.trim() !== "") {
      currentError += `\n${line}`;
    } else if (currentError) {
      errors.push(currentError.trim());
      currentError = null;
    }
  }

  if (currentError) errors.push(currentError.trim());
  return errors.length > 0 ? errors : ["Unknown LaTeX error"];
}

function extractInlineBaselineMetrics(
  svgString: string,
  texBoxMetrics?: TeXBoxMetrics | null,
  advanceWidthPt?: number
): InlineBaselineMetrics | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svg = doc.getElementsByTagName("svg")[0];
  if (!svg) return null;

  const width = parseFloat((svg.getAttribute("width") || "").replace("pt", ""));
  const height = parseFloat((svg.getAttribute("height") || "").replace("pt", ""));
  const viewBoxAttr = svg.getAttribute("viewBox") || "";
  const viewBoxValues = viewBoxAttr.split(/\s+/).map(Number);
  if (
    Number.isNaN(width) ||
    Number.isNaN(height) ||
    viewBoxValues.length !== 4 ||
    viewBoxValues.some((n) => Number.isNaN(n))
  ) {
    return null;
  }

  const [vx, vy, vw, vh] = viewBoxValues as [number, number, number, number];
  const baselineFromTopPt = texBoxMetrics?.heightPt ?? -vy;
  const descentFromBaselinePt = texBoxMetrics?.depthPt ?? vy + vh;

  return {
    version: "v1",
    widthPt: width,
    advanceWidthPt,
    heightPt: height,
    viewBox: [vx, vy, vw, vh],
    baselineFromTopPt,
    descentFromBaselinePt,
  };
}

async function compileAndNormalize(
  texInput: string,
  preambleInput: string,
  meta: string,
  requestId: string
): Promise<CompiledResponse> {
  let tConcmathMs = 0;
  let tLegacyMs = 0;
  let tNormalizeMs = 0;
  let usedLegacyMetrics = false;
  console.log(
    `[concmath][${requestId}] compile start engine=${ENGINE} parallel=${ENABLE_PARALLEL_COMPILE}`
  );

  let concmathSvg: string;
  let texBoxMetrics: TeXBoxMetrics | null = null;
  let legacySvg: string | null = null;

  if (ENABLE_PARALLEL_COMPILE) {
    const concmathStartNs = nowNs();
    const legacyStartNs = nowNs();
    const [concmathResult, legacyResult] = await Promise.allSettled([
      compileConcmathLaTeXToSVG(texInput, preambleInput),
      compileLegacyLaTeXToSVG(texInput, preambleInput),
    ]);
    tConcmathMs = elapsedMs(concmathStartNs);
    tLegacyMs = elapsedMs(legacyStartNs);

    if (concmathResult.status === "rejected") {
      throw concmathResult.reason;
    }
    concmathSvg = concmathResult.value.svg;
    texBoxMetrics = concmathResult.value.texBoxMetrics;

    if (legacyResult.status === "fulfilled") {
      legacySvg = legacyResult.value;
    } else {
      const legacyError: any = legacyResult.reason;
      console.warn(
        `[concmath][${requestId}] legacy-metrics compile failed during parallel mode; fallback normalization path will be used.`,
        {
          message: legacyError?.message,
          name: legacyError?.name,
        }
      );
    }
  } else {
    const concmathStartNs = nowNs();
    const concmathResult = await compileConcmathLaTeXToSVG(texInput, preambleInput);
    tConcmathMs = elapsedMs(concmathStartNs);
    concmathSvg = concmathResult.svg;
    texBoxMetrics = concmathResult.texBoxMetrics;

    const legacyStartNs = nowNs();
    try {
      legacySvg = await compileLegacyLaTeXToSVG(texInput, preambleInput);
    } finally {
      tLegacyMs = elapsedMs(legacyStartNs);
    }
  }

  let finalSvg: string;
  const normalizeStartNs = nowNs();
  if (legacySvg) {
    usedLegacyMetrics = true;
    finalSvg = applyLegacyCompatibleNormalization(concmathSvg, legacySvg);
  } else {
    finalSvg = fallbackAdjustSvgViewBox(concmathSvg);
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const fallbackDoc = parser.parseFromString(finalSvg, "image/svg+xml");
    rewritePagePathsToDefsUses(fallbackDoc);
    finalSvg = serializer.serializeToString(fallbackDoc);
  }
  tNormalizeMs = elapsedMs(normalizeStartNs);
  console.log(`[concmath][${requestId}] compile ok`);

  return {
    svg: finalSvg,
    metrics:
      meta === "1"
        ? extractInlineBaselineMetrics(finalSvg, texBoxMetrics, texBoxMetrics?.widthPt)
        : null,
    timing: {
      tConcmathMs,
      tLegacyMs,
      tNormalizeMs,
      usedLegacyMetrics,
    },
  };
}

app.get("/latex", async (req: Request, res: Response) => {
  const requestId = randomUUID().slice(0, 8);
  const reqStartNs = nowNs();
  let queueWaitMs = 0;
  let compileSlotAcquired = false;
  console.log("Received request:", req.query);
  const { tex, preamble = "", meta = "0" } = req.query;

  if (!tex) {
    return res.status(400).json({
      name: "BadRequest",
      message: "Missing 'tex' parameter",
    });
  }

  try {
    const texInput = tex as string;
    const preambleInput = preamble as string;
    const metaInput = String(meta);
    const cacheKey = hashRequestKey({
      tex: texInput,
      preamble: preambleInput,
      meta: metaInput,
      engine: ENGINE,
      schemaVersion: CACHE_SCHEMA_VERSION,
    });

    const cached = readCache(cacheKey);
    if (cached) {
      if (metaInput === "1") {
        res.json({
          svg: cached.svg,
          metrics: cached.metrics,
        });
      } else {
        res.type("image/svg+xml").send(cached.svg);
      }
      const tTotalMs = elapsedMs(reqStartNs);
      console.log(
        `[concmath][${requestId}] timings total=${tTotalMs.toFixed(
          1
        )}ms cacheHit=1 inflightShared=0 queueWaitMs=0.0 queueDepth=${getQueueDepth()} activeCompiles=${activeCompileJobs} meta=${metaInput}`
      );
      return;
    }

    const slot = await acquireCompileSlot(QUEUE_TIMEOUT_MS);
    queueWaitMs = slot.queueWaitMs;
    if (slot.timedOut) {
      const tTotalMs = elapsedMs(reqStartNs);
      console.warn(
        `[concmath][${requestId}] queue timeout total=${tTotalMs.toFixed(
          1
        )}ms queueWaitMs=${queueWaitMs.toFixed(1)} queueDepth=${getQueueDepth()} activeCompiles=${activeCompileJobs}`
      );
      res.status(503).json({
        name: "QueueTimeout",
        message: "Compile queue saturated, request timed out while waiting for execution slot.",
        details: "",
        tex: texInput,
        engine: ENGINE,
        queueWaitMs,
        queueDepth: getQueueDepth(),
        activeCompiles: activeCompileJobs,
      });
      return;
    }
    compileSlotAcquired = true;

    let inflightShared = false;
    let workPromise = inflightRequests.get(cacheKey);
    if (!workPromise || !ENABLE_INFLIGHT_DEDUPE) {
      workPromise = compileAndNormalize(texInput, preambleInput, metaInput, requestId);
      if (ENABLE_INFLIGHT_DEDUPE) {
        inflightRequests.set(cacheKey, workPromise);
      }
    } else {
      inflightShared = true;
      console.log(`[concmath][${requestId}] waiting on in-flight request`);
    }

    const compiled = await workPromise;
    if (ENABLE_INFLIGHT_DEDUPE) {
      inflightRequests.delete(cacheKey);
    }

    writeCache(cacheKey, {
      svg: compiled.svg,
      metrics: compiled.metrics,
    });

    if (metaInput === "1") {
      res.json({
        svg: compiled.svg,
        metrics: compiled.metrics,
      });
    } else {
      res.type("image/svg+xml").send(compiled.svg);
    }

    const tTotalMs = elapsedMs(reqStartNs);
    console.log(
      `[concmath][${requestId}] timings total=${tTotalMs.toFixed(1)}ms concmath=${compiled.timing.tConcmathMs.toFixed(
        1
      )}ms legacy=${compiled.timing.tLegacyMs.toFixed(
        1
      )}ms normalize=${compiled.timing.tNormalizeMs.toFixed(1)}ms legacyMetrics=${
        compiled.timing.usedLegacyMetrics ? "1" : "0"
      } cacheHit=0 inflightShared=${inflightShared ? "1" : "0"} queueWaitMs=${queueWaitMs.toFixed(
        1
      )} queueDepth=${getQueueDepth()} activeCompiles=${activeCompileJobs} meta=${meta}`
    );
  } catch (error: any) {
    if (ENABLE_INFLIGHT_DEDUPE) {
      const texInput = tex as string;
      const preambleInput = preamble as string;
      const metaInput = String(meta);
      const cacheKey = hashRequestKey({
        tex: texInput,
        preamble: preambleInput,
        meta: metaInput,
        engine: ENGINE,
        schemaVersion: CACHE_SCHEMA_VERSION,
      });
      inflightRequests.delete(cacheKey);
    }
    const tTotalMs = elapsedMs(reqStartNs);
    console.error(`[concmath][${requestId}] Error during LaTeX compilation:`, error);
    console.error(
      `[concmath][${requestId}] timings total=${tTotalMs.toFixed(1)}ms queueWaitMs=${queueWaitMs.toFixed(
        1
      )} queueDepth=${getQueueDepth()} activeCompiles=${activeCompileJobs}`
    );
    res.status(500).json({
      name: error.name || "ServerError",
      message: error.message || "An unexpected error occurred.",
      details: error.details || "",
      tex: error.tex || tex,
      engine: error.engine || ENGINE,
      latexErrors: error.latexErrors || ["Unknown error during processing."],
    });
  } finally {
    if (compileSlotAcquired) {
      releaseCompileSlot();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Concmath server (${ENGINE}) is running on http://localhost:${PORT}`);
});
