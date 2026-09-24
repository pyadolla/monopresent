// normalize.ts - functions copied VERBATIM from server-concmath.ts (lines 166-182, 357-766).
// Do not edit: byte-identical logic is what guarantees identical SVG output.
import { DOMParser, XMLSerializer } from "xmldom";

export type InlineBaselineMetrics = {
  version: string;
  widthPt: number;
  advanceWidthPt?: number;
  heightPt: number;
  viewBox: [number, number, number, number];
  baselineFromTopPt: number;
  descentFromBaselinePt: number;
};

export type TeXBoxMetrics = {
  widthPt: number;
  heightPt: number;
  depthPt: number;
};

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

export {
  buildLaTeXBoxContent,
  parseTeXBoxMetrics,
  fallbackAdjustSvgViewBox,
  applyLegacyCompatibleNormalization,
  parseLatexErrors,
  extractInlineBaselineMetrics,
  rewritePagePathsToDefsUses,
};
