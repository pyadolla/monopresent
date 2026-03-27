#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { execFileSync } = require("child_process");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const PUBLIC_ROOT = path.join(PACKAGE_ROOT, "public");
const COLLECTION_ROOT = path.join(PUBLIC_ROOT, "assets", "papers");
const INDEX_PATH = path.join(COLLECTION_ROOT, "index.json");
const README_PATH = path.join(COLLECTION_ROOT, "README.md");

function slugify(input) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80) || "untitled-paper";
}

function normalizeTitle(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDirContents(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  for (const entry of fs.readdirSync(dirPath)) {
    fs.rmSync(path.join(dirPath, entry), { recursive: true, force: true });
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function execText(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd || PACKAGE_ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 32,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function getImageDimensions(imagePath) {
  try {
    const output = execText("identify", ["-format", "%w %h", imagePath]).trim();
    const [width, height] = output.split(/\s+/).map((value) => Number.parseInt(value, 10));
    return { width, height };
  } catch (_error) {
    return { width: null, height: null };
  }
}

function commandExists(command) {
  try {
    execText("bash", ["-lc", `command -v ${command}`]);
    return true;
  } catch (_error) {
    return false;
  }
}

function createEmptyManifest() {
  return {
    generated_at: new Date().toISOString(),
    papers: [],
  };
}

function ensureCollection(collectionRoot = COLLECTION_ROOT) {
  ensureDir(collectionRoot);
  if (!fs.existsSync(path.join(collectionRoot, "index.json"))) {
    writeJson(path.join(collectionRoot, "index.json"), createEmptyManifest());
  }
  if (!fs.existsSync(path.join(collectionRoot, "README.md"))) {
    fs.writeFileSync(
      path.join(collectionRoot, "README.md"),
      renderCollectionReadme(createEmptyManifest()),
      "utf8",
    );
  }
}

function loadManifest(collectionRoot = COLLECTION_ROOT) {
  ensureCollection(collectionRoot);
  return readJson(path.join(collectionRoot, "index.json"), createEmptyManifest());
}

function saveManifest(manifest, collectionRoot = COLLECTION_ROOT) {
  manifest.generated_at = new Date().toISOString();
  writeJson(path.join(collectionRoot, "index.json"), manifest);
  fs.writeFileSync(
    path.join(collectionRoot, "README.md"),
    renderCollectionReadme(manifest),
    "utf8",
  );
}

function relativeToPublic(absolutePath, publicRoot = PUBLIC_ROOT) {
  return `/${path.relative(publicRoot, absolutePath).split(path.sep).join("/")}`;
}

function renderCollectionReadme(manifest) {
  const lines = [
    "# Paper Catalog",
    "",
    "Generated paper-ingestion manifest for `principiae-presentation`.",
    "",
    `Updated: ${manifest.generated_at || new Date().toISOString()}`,
    "",
  ];

  if (!manifest.papers || manifest.papers.length === 0) {
    lines.push("No papers have been cataloged yet.");
    lines.push("");
    lines.push("Use `yarn workspace principiae-presentation papers:interactive` to add papers one by one.");
    lines.push("");
    return `${lines.join("\n")}\n`;
  }

  lines.push("| Paper | Status | Figures | PDF | Catalog |");
  lines.push("| --- | --- | ---: | --- | --- |");

  for (const paper of manifest.papers.slice().sort((a, b) => a.title.localeCompare(b.title))) {
    const pdfLink = paper.pdf_path ? `[pdf](${paper.pdf_path})` : "missing";
    const catalogLink = paper.catalog_path ? `[catalog](${paper.catalog_path})` : "missing";
    lines.push(
      `| ${paper.title} | ${paper.processing_status} | ${paper.figure_count ?? 0} | ${pdfLink} | ${catalogLink} |`,
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function renderPaperReadme(catalog) {
  const lines = [
    `# ${catalog.title}`,
    "",
    `- Slug: \`${catalog.slug}\``,
    `- Status: \`${catalog.processing_status}\``,
    `- Source: \`${catalog.acquisition_source || "unknown"}\``,
    `- DOI: ${catalog.doi || "unknown"}`,
    `- Year: ${catalog.year || "unknown"}`,
    `- Authors: ${catalog.authors && catalog.authors.length ? catalog.authors.join(", ") : "unknown"}`,
    `- PDF: ${catalog.pdf_public_path || "missing"}`,
    "",
  ];

  if (catalog.warnings && catalog.warnings.length) {
    lines.push("## Warnings", "");
    for (const warning of catalog.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  lines.push("## Figures", "");
  if (!catalog.figures || catalog.figures.length === 0) {
    lines.push("No figure captions were detected.");
    lines.push("");
  } else {
    for (const figure of catalog.figures) {
      lines.push(`### ${figure.figure_id || "Unnumbered figure"}`);
      lines.push("");
      lines.push(`- Page: ${figure.page ?? "unknown"}`);
      lines.push(`- Section: ${figure.section_heading || "unknown"}`);
      lines.push(`- Caption: ${figure.caption || "missing"}`);
      if (figure.extracted_asset_paths && figure.extracted_asset_paths.length) {
        lines.push(`- Assets: ${figure.extracted_asset_paths.join(", ")}`);
      }
      if (figure.rendered_asset_paths && figure.rendered_asset_paths.length) {
        lines.push(`- Rendered fallback: ${figure.rendered_asset_paths.join(", ")}`);
      }
      if (figure.layout_path) {
        lines.push(`- Layout: ${figure.layout_path}`);
      }
      if (figure.composite_svg_path) {
        lines.push(`- Composite SVG: ${figure.composite_svg_path}`);
      }
      if (figure.reconstruction_svg_path) {
        lines.push(`- Reconstruction SVG: ${figure.reconstruction_svg_path}`);
      }
      if (figure.body_references && figure.body_references.length) {
        lines.push(`- Body references: ${figure.body_references.length}`);
      }
      if (figure.mapping_note) {
        lines.push(`- Note: ${figure.mapping_note}`);
      }
      lines.push("");
    }
  }

  lines.push("## Embedded Assets", "");
  if (!catalog.extracted_assets || catalog.extracted_assets.length === 0) {
    lines.push("No embedded assets were extracted.");
    lines.push("");
  } else {
    lines.push("| Asset | Page | Format | Type | Path |");
    lines.push("| --- | ---: | --- | --- | --- |");
    for (const asset of catalog.extracted_assets) {
      lines.push(
        `| ${asset.asset_id} | ${asset.page ?? ""} | ${asset.detected_format || "unknown"} | ${asset.type || "unknown"} | ${asset.public_path || ""} |`,
      );
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    if (args[key] === undefined) {
      args[key] = next;
    } else if (Array.isArray(args[key])) {
      args[key].push(next);
    } else {
      args[key] = [args[key], next];
    }
    index += 1;
  }
  return args;
}

function parseMultiValue(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => parseMultiValue(entry));
  }
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function titleSimilarityScore(a, b) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) {
    return 0;
  }
  if (left === right) {
    return 1;
  }
  if (left.includes(right) || right.includes(left)) {
    return 0.9;
  }
  const leftWords = new Set(left.split(" "));
  const rightWords = new Set(right.split(" "));
  let overlap = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) {
      overlap += 1;
    }
  }
  return overlap / Math.max(leftWords.size, rightWords.size);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "principiae-presentation-paper-catalog/1.0",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return response.json();
}

function openAlexAuthors(work) {
  return (work.authorships || [])
    .map((authorship) => authorship.author && authorship.author.display_name)
    .filter(Boolean);
}

function normalizePdfUrl(value) {
  if (!value) {
    return null;
  }
  if (value.includes("arxiv.org/abs/")) {
    return value.replace("/abs/", "/pdf/").replace(/$/, ".pdf");
  }
  return value;
}

async function searchOpenAlexByTitle(title) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=10`;
  const json = await fetchJson(url);
  const results = Array.isArray(json.results) ? json.results : [];
  const ranked = results
    .map((work) => ({
      work,
      score: titleSimilarityScore(title, work.display_name),
    }))
    .filter((entry) => entry.score >= 0.5)
    .sort((left, right) => right.score - left.score);
  return ranked.length ? ranked[0].work : null;
}

async function searchOpenAlexByDoi(doi) {
  const cleanDoi = String(doi || "").replace(/^https?:\/\/doi\.org\//, "");
  const url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}`;
  try {
    return await fetchJson(url);
  } catch (_error) {
    return null;
  }
}

async function searchCrossrefByTitle(title) {
  const url = `https://api.crossref.org/works?query.title=${encodeURIComponent(title)}&rows=5`;
  const json = await fetchJson(url);
  const items = (((json || {}).message || {}).items || [])
    .map((item) => ({
      item,
      score: titleSimilarityScore(title, (item.title || [])[0]),
    }))
    .sort((left, right) => right.score - left.score);
  return items.length && items[0].score >= 0.5 ? items[0].item : null;
}

function openAlexPdfUrl(work) {
  if (!work) {
    return null;
  }
  const primary = work.primary_location || {};
  const bestOa = work.best_oa_location || {};
  const candidates = [
    primary.pdf_url,
    bestOa.pdf_url,
    primary.landing_page_url,
    bestOa.landing_page_url,
  ]
    .filter(Boolean)
    .map(normalizePdfUrl);
  for (const candidate of candidates) {
    if (candidate && candidate.toLowerCase().endsWith(".pdf")) {
      return candidate;
    }
  }
  return candidates[0] || null;
}

function metadataFromOpenAlex(work) {
  if (!work) {
    return null;
  }
  return {
    title: work.display_name || null,
    doi: work.doi ? String(work.doi).replace(/^https?:\/\/doi\.org\//, "") : null,
    year: work.publication_year || null,
    authors: openAlexAuthors(work),
    acquisition_source: openAlexPdfUrl(work) ? "publisher" : "manual",
    remote_pdf_url: openAlexPdfUrl(work),
    remote_supplements: [],
  };
}

function metadataFromCrossref(item) {
  if (!item) {
    return null;
  }
  return {
    title: (item.title || [])[0] || null,
    doi: item.DOI || null,
    year:
      (((item.issued || {}).date-parts || [])[0] || [])[0] ||
      (((item.created || {}).date-parts || [])[0] || [])[0] ||
      null,
    authors: (item.author || [])
      .map((author) => [author.given, author.family].filter(Boolean).join(" ").trim())
      .filter(Boolean),
    acquisition_source: "manual",
    remote_pdf_url: null,
    remote_supplements: [],
  };
}

async function resolveRemoteMetadata({ title, doi }) {
  if (doi) {
    const openAlex = await searchOpenAlexByDoi(doi);
    if (openAlex) {
      return metadataFromOpenAlex(openAlex);
    }
  }

  if (title) {
    const openAlex = await searchOpenAlexByTitle(title);
    if (openAlex) {
      return metadataFromOpenAlex(openAlex);
    }

    const crossref = await searchCrossrefByTitle(title);
    if (crossref) {
      return metadataFromCrossref(crossref);
    }
  }

  return null;
}

async function downloadToFile(url, destinationPath) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "principiae-presentation-paper-catalog/1.0",
      Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(destinationPath, Buffer.from(arrayBuffer));
}

function parsePdfInfo(pdfPath) {
  const raw = execText("pdfinfo", [pdfPath]);
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      data[match[1].trim()] = match[2].trim();
    }
  }
  return data;
}

function parseIntSafe(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractPageTexts(pdfPath) {
  const info = parsePdfInfo(pdfPath);
  const pageCount = parseIntSafe(info.Pages) || 0;
  const pages = [];
  for (let page = 1; page <= pageCount; page += 1) {
    const text = execText("pdftotext", ["-layout", "-f", String(page), "-l", String(page), pdfPath, "-"]);
    const rawText = execText("pdftotext", ["-raw", "-f", String(page), "-l", String(page), pdfPath, "-"]);
    const tsvText = execText("pdftotext", ["-tsv", "-f", String(page), "-l", String(page), pdfPath, "-"]);
    pages.push({
      page,
      text,
      lines: text.split(/\r?\n/),
      raw_text: rawText,
      raw_lines: rawText.split(/\r?\n/),
      tsv_lines: parseTsvLines(tsvText),
    });
  }
  return { info, pages };
}

function parseTsvLines(tsvText) {
  const rows = String(tsvText || "").split(/\r?\n/).filter(Boolean);
  const grouped = new Map();

  for (let index = 1; index < rows.length; index += 1) {
    const parts = rows[index].split("\t");
    if (parts.length < 12 || parts[0] !== "5") {
      continue;
    }

    const key = [parts[1], parts[2], parts[3], parts[4]].join(":");
    const word = {
      page_num: parseIntSafe(parts[1]),
      par_num: parseIntSafe(parts[2]),
      block_num: parseIntSafe(parts[3]),
      line_num: parseIntSafe(parts[4]),
      word_num: parseIntSafe(parts[5]),
      left: Number.parseFloat(parts[6]),
      top: Number.parseFloat(parts[7]),
      width: Number.parseFloat(parts[8]),
      right: Number.parseFloat(parts[6]) + Number.parseFloat(parts[8]),
      height: Number.parseFloat(parts[9]),
      conf: Number.parseFloat(parts[10]),
      text: parts.slice(11).join("\t"),
    };

    if (!grouped.has(key)) {
      grouped.set(key, {
        page: word.page_num,
        par_num: word.par_num,
        block_num: word.block_num,
        line_num: word.line_num,
        words: [],
      });
    }
    grouped.get(key).words.push(word);
  }

  return Array.from(grouped.values())
    .map((line) => finalizeTsvLine(line))
    .sort((left, right) => {
      if (left.top !== right.top) {
        return left.top - right.top;
      }
      return left.left - right.left;
    });
}

function finalizeTsvLine(line) {
  const words = line.words.slice().sort((left, right) => left.word_num - right.word_num);
  const text = words.map((word) => word.text).join(" ");
  const left = Math.min(...words.map((word) => word.left));
  const top = Math.min(...words.map((word) => word.top));
  const right = Math.max(...words.map((word) => word.left + word.width));
  const bottom = Math.max(...words.map((word) => word.top + word.height));

  return {
    ...line,
    words,
    text: cleanLine(text),
    left,
    top,
    right,
    bottom,
  };
}

function cleanLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function isLikelyHeadingLine(line) {
  const cleaned = cleanLine(line);
  if (!cleaned || cleaned.length < 4 || cleaned.length > 100) {
    return false;
  }
  if (/^(fig(?:ure)?|table|references|acknowledg)/i.test(cleaned)) {
    return false;
  }
  if (/[.:;]$/.test(cleaned)) {
    return false;
  }
  if (/^\d+\s*$/.test(cleaned)) {
    return false;
  }
  if (/Downloaded from /i.test(cleaned)) {
    return false;
  }
  const words = cleaned.split(" ");
  if (words.length > 14) {
    return false;
  }
  const uppercase = cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned);
  if (uppercase) {
    return true;
  }
  const alphaWords = words.filter((word) => /[A-Za-z]/.test(word));
  const titleish = alphaWords.filter((word) => /^[A-Z][a-z0-9-]*$/.test(word)).length;
  return titleish >= Math.ceil(alphaWords.length * 0.6);
}

function detectHeadings(pages) {
  const headings = [];
  for (const page of pages) {
    const lines = page.lines.map(cleanLine);
    for (let index = 0; index < lines.length; index += 1) {
      if (!isLikelyHeadingLine(lines[index])) {
        continue;
      }
      const block = [lines[index]];
      let next = index + 1;
      while (next < lines.length && isLikelyHeadingLine(lines[next])) {
        block.push(lines[next]);
        next += 1;
      }
      const heading = block.join(" ").trim();
      if (heading && !headings.some((entry) => entry.page === page.page && entry.heading === heading)) {
        headings.push({ page: page.page, heading, line_index: index });
      }
      index = next - 1;
    }
  }
  return headings;
}

function detectFigureCaptions(pages) {
  const figures = [];
  const startPattern = /^(Fig(?:ure)?\.?\s*(S?\d+))\s*[:.]\s*(.*)$/i;

  for (const page of pages) {
    const tsvLines = page.tsv_lines || [];
    for (let index = 0; index < tsvLines.length; index += 1) {
      const startLine = tsvLines[index];
      const startSlice = captionSliceFromLine(startLine, null);
      if (!startSlice) {
        continue;
      }
      const match = startSlice.text.match(startPattern);
      if (!match) {
        continue;
      }
      if (match[3] && /^[a-z]/.test(match[3])) {
        continue;
      }

      const lines = [startSlice.text];
      let consumedLineCount = 1;
      let previousTop = startLine.top;
      for (let next = index + 1; next < tsvLines.length; next += 1) {
        const continuation = tsvLines[next];
        const continuationSlice = captionSliceFromLine(continuation, startSlice);
        const continuationText = continuationSlice ? continuationSlice.text : "";
        if (!continuationText) {
          break;
        }
        if (/^(Fig(?:ure)?\.?\s*S?\d+\s*[:.]|Table\s+\d+\s*[:.])/i.test(continuationText)) {
          break;
        }

        if (continuation.top - previousTop > 18) {
          break;
        }
        if (/^\d{4}\s*[•·]|^[A-Z][A-Za-z-]+ et al\./.test(continuationText)) {
          break;
        }

        lines.push(continuationText);
        consumedLineCount += 1;
        previousTop = continuation.top;
      }

      figures.push(finalizeFigureCaption({
        page: page.page,
        line_index: index,
        figure_id: match[2].toUpperCase().replace(/\s+/g, ""),
        raw_id: match[1],
        lines,
        caption_bbox: {
          left: startSlice.anchorLeft,
          top: startLine.top,
          bottom: previousTop + 10,
          side: startSlice.side,
        },
      }));

      if (consumedLineCount > 1) {
        index += consumedLineCount - 1;
      }
    }
  }

  const byId = new Map();
  for (const figure of figures) {
    const dedupeKey = `${figure.figure_id}@${figure.page}`;
    const existing = byId.get(dedupeKey);
    if (!existing) {
      byId.set(dedupeKey, figure);
      continue;
    }

    const existingScore = existing.caption.length;
    const figureScore = figure.caption.length;
    if (figureScore > existingScore) {
      byId.set(dedupeKey, figure);
    }
  }

  return Array.from(byId.values()).sort((left, right) => {
    if (left.page !== right.page) {
      return left.page - right.page;
    }
    return left.figure_id.localeCompare(right.figure_id, undefined, { numeric: true });
  });
}

function captionSliceFromLine(line, startSlice) {
  const words = (line.words || []).slice().sort((left, right) => left.word_num - right.word_num);
  if (!words.length) {
    return null;
  }

  let startIndex = 0;
  let anchorLeft = startSlice ? startSlice.anchorLeft : null;
  let side = startSlice ? startSlice.side : null;
  let threshold = startSlice ? startSlice.threshold : null;

  if (!startSlice) {
    if (!/^Fig(?:ure)?\.?$/i.test(words[0].text)) {
      return null;
    }
    if (words.length < 2 || !/^(?:S?\d+|[A-Za-z]?\d+[A-Za-z]?)[:.]?$/i.test(words[1].text)) {
      return null;
    }
    startIndex = 0;
    anchorLeft = words[startIndex].left;
    side = anchorLeft >= 260 ? "right" : "left";
    threshold = side === "right" ? anchorLeft - 20 : 380;
  }

  const selected = [];
  for (let index = startIndex; index < words.length; index += 1) {
    const word = words[index];
    const allowed =
      side === "right"
        ? word.left >= threshold
        : word.left <= threshold;
    if (!allowed) {
      continue;
    }
    selected.push(word);
  }

  const text = cleanLine(selected.map((word) => word.text).join(" "));
  if (!text) {
    return null;
  }

  return {
    text,
    anchorLeft,
    side,
    threshold,
  };
}

function finalizeFigureCaption(current) {
  const caption = sanitizeCaption(current.lines.join(" "));
  return {
    figure_id: current.figure_id,
    page: current.page,
    line_index: current.line_index,
    caption,
    caption_bbox: current.caption_bbox || null,
  };
}

function sanitizeCaption(input) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .replace(/\b(Fig(?:ure)?)\s*(\d)/gi, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+\d{4}\s+[•·].*?J\.\s*[A-Za-z].*$/i, "")
    .replace(/\s+[A-Z][A-Za-z-]+(?:-[A-Za-z]+)? et al\.\s+[•·].*$/i, "")
    .trim();
}

function parsePageSize(pageSize) {
  const match = String(pageSize || "").match(/([\d.]+)\s+x\s+([\d.]+)\s+pts/i);
  if (!match) {
    return { width_pts: 612, height_pts: 792 };
  }
  return {
    width_pts: Number.parseFloat(match[1]),
    height_pts: Number.parseFloat(match[2]),
  };
}

function nearestHeading(figure, headings) {
  const samePage = headings
    .filter((heading) => heading.page === figure.page && heading.line_index <= figure.line_index)
    .sort((left, right) => right.line_index - left.line_index);
  if (samePage.length) {
    return samePage[0].heading;
  }

  const previous = headings
    .filter((heading) => heading.page < figure.page)
    .sort((left, right) => {
      if (left.page !== right.page) {
        return right.page - left.page;
      }
      return right.line_index - left.line_index;
    });

  return previous.length ? previous[0].heading : null;
}

function collectBodyReferences(pages, figures) {
  const byFigure = new Map(figures.map((figure) => [figure.figure_id, []]));
  const patterns = figures.map((figure) => ({
    figure_id: figure.figure_id,
    pattern: new RegExp(`\\b(?:Fig(?:ure)?s?\\.?)\\s*${figure.figure_id.replace(/^FIG/i, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"),
  }));

  for (const page of pages) {
    const lines = page.lines;
    for (let index = 0; index < lines.length; index += 1) {
      const line = cleanLine(lines[index]);
      if (!line || /^(Fig(?:ure)?\.?\s*S?\d+)/i.test(line)) {
        continue;
      }
      for (const { figure_id, pattern } of patterns) {
        const matches = line.match(pattern);
        if (matches && byFigure.has(figure_id)) {
          byFigure.get(figure_id).push({
            page: page.page,
            snippet: line,
            count: matches.length,
          });
        }
      }
    }
  }

  return byFigure;
}

function parsePdfImagesList(pdfPath) {
  const raw = execText("pdfimages", ["-list", pdfPath]);
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const rows = [];
  let headerSeen = false;

  for (const line of lines) {
    if (line.startsWith("page")) {
      headerSeen = true;
      continue;
    }
    if (!headerSeen || /^-+$/.test(line.trim())) {
      continue;
    }
    const parts = line.trim().split(/\s+/);
    if (parts.length < 14) {
      continue;
    }
    rows.push({
      page: parseIntSafe(parts[0]),
      num: parseIntSafe(parts[1]),
      type: parts[2],
      width: parseIntSafe(parts[3]),
      height: parseIntSafe(parts[4]),
      color: parts[5],
      comp: parseIntSafe(parts[6]),
      bpc: parseIntSafe(parts[7]),
      enc: parts[8],
      interp: parts[9],
      object_id: parseIntSafe(parts[10]),
      generation: parseIntSafe(parts[11]),
      x_ppi: parseIntSafe(parts[12]),
      y_ppi: parseIntSafe(parts[13]),
      size: parts[14] || null,
      ratio: parts[15] || null,
    });
  }

  return rows;
}

function inferFormatFromPath(filePath) {
  return path.extname(filePath).replace(/^\./, "").toLowerCase() || "unknown";
}

function extractEmbeddedAssets(pdfPath, outputDir, publicRoot = PUBLIC_ROOT) {
  ensureDir(outputDir);
  removeDirContents(outputDir);

  const list = parsePdfImagesList(pdfPath);
  const prefix = path.join(outputDir, "asset");
  execText("pdfimages", ["-all", pdfPath, prefix]);
  const extractedFiles = fs
    .readdirSync(outputDir)
    .map((entry) => path.join(outputDir, entry))
    .filter((entry) => fs.statSync(entry).isFile())
    .sort((left, right) => left.localeCompare(right));

  return list.map((asset, index) => {
    const filePath = extractedFiles[index] || null;
    const sourceSize = filePath && fs.existsSync(filePath)
      ? getImageDimensions(filePath)
      : { width: null, height: null };
    return {
      asset_id: `asset-${String(index + 1).padStart(3, "0")}`,
      page: asset.page,
      object_id: asset.object_id,
      generation: asset.generation,
      type: asset.type,
      width: asset.width,
      height: asset.height,
      color: asset.color,
      bits_per_component: asset.bpc,
      encoding: asset.enc,
      x_ppi: asset.x_ppi,
      y_ppi: asset.y_ppi,
      detected_format: filePath ? inferFormatFromPath(filePath) : "unknown",
      file_path: filePath,
      public_path: filePath ? relativeToPublic(filePath, publicRoot) : null,
      source_width: sourceSize.width,
      source_height: sourceSize.height,
    };
  }).filter(isUsableEmbeddedAsset);
}

function isUsableEmbeddedAsset(asset) {
  if (!asset || !asset.file_path || !asset.public_path) {
    return false;
  }
  if (!Number.isFinite(asset.width) || !Number.isFinite(asset.height)) {
    return false;
  }
  if (asset.width <= 2 || asset.height <= 2) {
    return false;
  }
  if (
    Number.isFinite(asset.source_width) &&
    Number.isFinite(asset.source_height) &&
    (asset.source_width <= 2 || asset.source_height <= 2)
  ) {
    return false;
  }
  return true;
}

function figureAssetMapping(figures, assets) {
  const pageToFigures = new Map();
  const pageToAssets = new Map();

  for (const figure of figures) {
    if (!pageToFigures.has(figure.page)) {
      pageToFigures.set(figure.page, []);
    }
    pageToFigures.get(figure.page).push(figure);
  }

  for (const asset of assets) {
    if (!pageToAssets.has(asset.page)) {
      pageToAssets.set(asset.page, []);
    }
    pageToAssets.get(asset.page).push(asset);
  }

  for (const figure of figures) {
    const figuresOnPage = pageToFigures.get(figure.page) || [];
    const assetsOnPage = pageToAssets.get(figure.page) || [];
    figure.page_candidate_asset_paths = assetsOnPage.map((asset) => asset.public_path).filter(Boolean);
    if (figuresOnPage.length === 1) {
      figure.extracted_asset_paths = figure.page_candidate_asset_paths.slice();
      figure.mapping_note = assetsOnPage.length
        ? "Assigned all extracted assets from the figure page because only one caption was detected on that page."
        : "No extractable embedded assets were found on the figure page.";
    } else {
      figure.extracted_asset_paths = [];
      figure.mapping_note = assetsOnPage.length
        ? "Multiple figure captions were detected on this page, so extracted assets are listed as page-level candidates only."
        : "No extractable embedded assets were found on the figure page.";
    }
  }
}

function renderFallbackFigures({
  pdfPath,
  figures,
  pages,
  outputDir,
  publicRoot = PUBLIC_ROOT,
  pageSize,
  dpi = 150,
}) {
  ensureDir(outputDir);
  removeDirContents(outputDir);

  const pageGroups = new Map();
  for (const figure of figures) {
    if (!pageGroups.has(figure.page)) {
      pageGroups.set(figure.page, []);
    }
    pageGroups.get(figure.page).push(figure);
  }

  const pxPerPt = dpi / 72;
  const pageWidthPts = pageSize.width_pts;
  const pageHeightPts = pageSize.height_pts;
  const marginPts = 12;
  const columnSplitPts = pageWidthPts / 2;
  const minCropHeightPts = 50;
  const targetWindowHeightPts = 180;
  const pageByNumber = new Map((pages || []).map((page) => [page.page, page]));

  for (const [page, pageFigures] of pageGroups.entries()) {
    const pageData = pageByNumber.get(page);
    const ordered = pageFigures
      .filter((figure) => figure.caption_bbox)
      .slice()
      .sort((left, right) => left.caption_bbox.top - right.caption_bbox.top);

    for (let index = 0; index < ordered.length; index += 1) {
      const figure = ordered[index];
      figure.rendered_asset_paths = [];

      if (figure.extracted_asset_paths && figure.extracted_asset_paths.length) {
        continue;
      }

      const side = figure.caption_bbox.side || "full";
      const previousSameSide = ordered
        .slice(0, index)
        .filter((candidate) => (candidate.caption_bbox.side || "full") === side)
        .pop();

      let xPts = 0;
      let widthPts = pageWidthPts;
      if (side === "left") {
        xPts = 0;
        widthPts = columnSplitPts - marginPts / 2;
      } else if (side === "right") {
        xPts = columnSplitPts + marginPts / 2;
        widthPts = pageWidthPts - xPts;
      }

      let yStartPts = marginPts;
      if (previousSameSide) {
        yStartPts = previousSameSide.caption_bbox.bottom + marginPts;
      }
      const previousTextTop = findPreviousColumnTextTop(pageData, figure.caption_bbox.top, side, columnSplitPts);
      if (previousTextTop !== null) {
        yStartPts = Math.max(yStartPts, previousTextTop + marginPts);
      }
      yStartPts = Math.max(marginPts, Math.min(yStartPts, figure.caption_bbox.top - targetWindowHeightPts));
      const yEndPts = Math.max(yStartPts + 24, figure.caption_bbox.top - marginPts);
      const heightPts = Math.max(24, yEndPts - yStartPts);

      if (yStartPts >= pageHeightPts || heightPts < minCropHeightPts) {
        continue;
      }

      const outputBase = path.join(outputDir, `figure-${String(figure.figure_id).toLowerCase()}`);
      execText("pdftoppm", [
        "-png",
        "-singlefile",
        "-f",
        String(page),
        "-l",
        String(page),
        "-r",
        String(dpi),
        "-x",
        String(Math.round(xPts * pxPerPt)),
        "-y",
        String(Math.round(yStartPts * pxPerPt)),
        "-W",
        String(Math.round(widthPts * pxPerPt)),
        "-H",
        String(Math.round(heightPts * pxPerPt)),
        pdfPath,
        outputBase,
      ]);

      const renderedPath = `${outputBase}.png`;
      if (fs.existsSync(renderedPath)) {
        figure.rendered_asset_paths = [relativeToPublic(renderedPath, publicRoot)];
        figure.mapping_note = `${figure.mapping_note} Added rendered fallback crop from the page region above the caption.`;
      }
    }
  }
}

function findPreviousColumnTextTop(pageData, captionTop, side, columnSplitPts) {
  if (!pageData || !pageData.tsv_lines) {
    return null;
  }

  let previousTop = null;
  for (const line of pageData.tsv_lines) {
    if (!line.text || line.top >= captionTop - 20) {
      continue;
    }

    const inColumn =
      side === "left"
        ? line.left < columnSplitPts
        : line.right > columnSplitPts;

    if (!inColumn) {
      continue;
    }

    if (previousTop === null || line.top > previousTop) {
      previousTop = line.top;
    }
  }

  return previousTop;
}

function extractPageImagePlacements(pdfPath, pageNumber) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paper-layout-"));
  const basePath = path.join(tempDir, `page-${pageNumber}`);
  try {
    execText("pdftohtml", [
      "-xml",
      "-nodrm",
      "-hidden",
      "-f",
      String(pageNumber),
      "-l",
      String(pageNumber),
      pdfPath,
      basePath,
    ], { cwd: tempDir });
    const xmlPath = `${basePath}.xml`;
    const xml = fs.readFileSync(xmlPath, "utf8");
    const pageMatch = xml.match(/<page[^>]*height="([^"]+)"[^>]*width="([^"]+)"/i);
    const pageHeight = pageMatch ? Number.parseFloat(pageMatch[1]) : null;
    const pageWidth = pageMatch ? Number.parseFloat(pageMatch[2]) : null;
    const placements = [];
    const imagePattern = /<image\s+top="([^"]+)"\s+left="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"\s+src="([^"]+)"/gi;
    let match;
    let index = 0;
    while ((match = imagePattern.exec(xml))) {
      const sourcePath = match[5];
      const resolvedSourcePath = path.isAbsolute(sourcePath)
        ? sourcePath
        : path.join(tempDir, sourcePath);
      const ext = path.extname(sourcePath).toLowerCase();
      const mimeType =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".gif"
              ? "image/gif"
              : null;
      const dataUri =
        mimeType && fs.existsSync(resolvedSourcePath)
          ? `data:${mimeType};base64,${fs.readFileSync(resolvedSourcePath).toString("base64")}`
          : null;
      const sourceSize = fs.existsSync(resolvedSourcePath)
        ? getImageDimensions(resolvedSourcePath)
        : { width: null, height: null };
      placements.push({
        placement_id: `placement-${String(index + 1).padStart(3, "0")}`,
        top: Number.parseFloat(match[1]),
        left: Number.parseFloat(match[2]),
        width: Number.parseFloat(match[3]),
        height: Number.parseFloat(match[4]),
        bottom: Number.parseFloat(match[1]) + Number.parseFloat(match[4]),
        right: Number.parseFloat(match[2]) + Number.parseFloat(match[3]),
        source_name: path.basename(match[5]),
        source_ext: ext,
        source_data_uri: dataUri,
        source_width: sourceSize.width,
        source_height: sourceSize.height,
      });
      index += 1;
    }
    return {
      page: pageNumber,
      page_width: pageWidth,
      page_height: pageHeight,
      placements,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function buildFigureLayouts({
  pdfPath,
  figures,
  extractedAssets,
  pages = [],
  pageSize = { width_pts: 612, height_pts: 792 },
  outputDir,
  publicRoot = PUBLIC_ROOT,
}) {
  ensureDir(outputDir);
  removeDirContents(outputDir);

  const pageToAssets = new Map();
  for (const asset of extractedAssets) {
    if (!pageToAssets.has(asset.page)) {
      pageToAssets.set(asset.page, []);
    }
    pageToAssets.get(asset.page).push(asset);
  }

  const pageToFigures = new Map();
  for (const figure of figures) {
    if (!pageToFigures.has(figure.page)) {
      pageToFigures.set(figure.page, []);
    }
    pageToFigures.get(figure.page).push(figure);
  }

  for (const [page, pageFigures] of pageToFigures.entries()) {
    const pageAssets = pageToAssets.get(page) || [];
    if (!pageAssets.length) {
      continue;
    }

    const pageText = pages.find((entry) => entry.page === page) || null;
    const placementData = extractPageImagePlacements(pdfPath, page);
    const placements = (placementData.placements || []).filter(isUsablePlacement);
    const pairCount = Math.min(pageAssets.length, placements.length);
    const paired = [];
    for (let index = 0; index < pairCount; index += 1) {
      paired.push({
        ...placements[index],
        asset: pageAssets[index],
      });
    }

    const orderedFigures = pageFigures
      .filter((figure) => figure.caption_bbox)
      .slice()
      .sort((left, right) => left.caption_bbox.top - right.caption_bbox.top);

    for (let index = 0; index < orderedFigures.length; index += 1) {
      const figure = orderedFigures[index];
      const nextFigure = orderedFigures[index + 1] || null;
      const scaledFigureBounds = scaleCaptionBounds(figure.caption_bbox, placementData, pageSize);
      const scaledPreviousBounds =
        index === 0 ? null : scaleCaptionBounds(orderedFigures[index - 1].caption_bbox, placementData, pageSize);
      const scaledNextBounds =
        nextFigure ? scaleCaptionBounds(nextFigure.caption_bbox, placementData, pageSize) : null;
      const yMin = index === 0 ? 0 : scaledPreviousBounds.bottom + 10;
      const yMax = scaledNextBounds ? scaledNextBounds.top - 10 : scaledFigureBounds.top - 10;
      let regionPlacements = paired.filter((placement) => {
        const centerY = placement.top + placement.height / 2;
        return centerY >= yMin && centerY <= yMax;
      });

      if (!regionPlacements.length) {
        const belowYMin = scaledFigureBounds.bottom + 5;
        const belowYMax = scaledNextBounds ? scaledNextBounds.top - 10 : placementData.page_height || Number.POSITIVE_INFINITY;
        regionPlacements = paired.filter((placement) => {
          const centerY = placement.top + placement.height / 2;
          return centerY >= belowYMin && centerY <= belowYMax;
        });
      }

      if (!regionPlacements.length) {
        continue;
      }

      const figureDir = path.join(outputDir, `figure-${String(figure.figure_id).toLowerCase()}-page-${figure.page}`);
      ensureDir(figureDir);
      const minLeft = Math.min(...regionPlacements.map((placement) => placement.left));
      const minTop = Math.min(...regionPlacements.map((placement) => placement.top));
      const maxRight = Math.max(...regionPlacements.map((placement) => placement.right));
      const maxBottom = Math.max(...regionPlacements.map((placement) => placement.bottom));

      let items = regionPlacements.map((placement) => ({
        asset_id: placement.asset.asset_id,
        asset_public_path: placement.asset.public_path,
        placement_id: placement.placement_id,
        placement_source_name: placement.source_name,
        composite_href: placement.source_data_uri,
        source_width: placement.source_width,
        source_height: placement.source_height,
        x: placement.left - minLeft,
        y: placement.top - minTop,
        width: placement.width,
        height: placement.height,
        page_x: placement.left,
        page_y: placement.top,
      }));
      items = normalizeGridItems(items);

      const canvasWidth = Math.max(...items.map((item) => item.x + item.width));
      const canvasHeight = Math.max(...items.map((item) => item.y + item.height));

      const layout = {
        figure_id: figure.figure_id,
        page,
        canvas: {
          width: canvasWidth,
          height: canvasHeight,
        },
        source_region: {
          left: minLeft,
          top: minTop,
          right: maxRight,
          bottom: maxBottom,
        },
        items,
      };

      const layoutPath = path.join(figureDir, "layout.json");
      writeJson(layoutPath, layout);

      const renderedCropPath = path.join(figureDir, "composite-source.png");
      const reconstructedSvgPath = path.join(figureDir, "reconstruction.svg");
      fs.writeFileSync(
        reconstructedSvgPath,
        renderCompositeSvg(layout, publicRoot),
        "utf8",
      );

      const renderedCropUri = renderFigureCropDataUri({
        pdfPath,
        page,
        pageWidth: placementData.page_width,
        pageHeight: placementData.page_height,
        region: expandRegionWithNearbyText({
          pageData: pageText,
          figure,
          region: layout.source_region,
          pageWidth: placementData.page_width,
          pageHeight: placementData.page_height,
          pdfPageSize: pageSize,
        }),
        outputPath: renderedCropPath,
      });

      const svgPath = path.join(figureDir, "composite.svg");
      fs.writeFileSync(
        svgPath,
        renderedCropUri
          ? renderImageBackedSvg(layout.canvas.width, layout.canvas.height, renderedCropUri)
          : renderCompositeSvg(layout, publicRoot),
        "utf8",
      );

      figure.layout_path = relativeToPublic(layoutPath, publicRoot);
      figure.composite_svg_path = relativeToPublic(svgPath, publicRoot);
      figure.reconstruction_svg_path = relativeToPublic(reconstructedSvgPath, publicRoot);
      figure.layout_item_count = items.length;
    }
  }
}

function scaleCaptionBounds(captionBox, placementData, pageSize) {
  if (!captionBox || !placementData.page_height || !pageSize.height_pts) {
    return captionBox || { top: 0, bottom: 0 };
  }
  const scaleY = placementData.page_height / pageSize.height_pts;
  return {
    ...captionBox,
    top: captionBox.top * scaleY,
    bottom: captionBox.bottom * scaleY,
  };
}

function isUsablePlacement(placement) {
  if (!placement) {
    return false;
  }
  if (!Number.isFinite(placement.width) || !Number.isFinite(placement.height)) {
    return false;
  }
  if (placement.width <= 2 || placement.height <= 2) {
    return false;
  }
  if (
    Number.isFinite(placement.source_width) &&
    Number.isFinite(placement.source_height) &&
    (placement.source_width <= 2 || placement.source_height <= 2)
  ) {
    return false;
  }
  return true;
}

function normalizeGridItems(items) {
  if (!items || items.length < 4) {
    return items;
  }

  const sortedByX = items.slice().sort((left, right) => left.page_x - right.page_x);
  const medianWidth = median(items.map((item) => item.width));
  const xThreshold = Math.max(24, medianWidth * 0.5);
  const columns = [];

  for (const item of sortedByX) {
    const current = columns[columns.length - 1];
    if (!current || Math.abs(item.page_x - current.anchor) > xThreshold) {
      columns.push({ anchor: item.page_x, items: [item] });
    } else {
      current.items.push(item);
    }
  }

  if (columns.length < 2) {
    return items;
  }

  const counts = columns.map((column) => column.items.length);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  if (minCount < 2 || maxCount - minCount > 1) {
    return items;
  }

  const verticalOverlapPairs = [];
  for (const column of columns) {
    const ordered = column.items.slice().sort((left, right) => left.page_y - right.page_y);
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      const overlap = previous.page_y + previous.height - current.page_y;
      verticalOverlapPairs.push(overlap / Math.max(1, Math.min(previous.height, current.height)));
    }
  }
  if (!verticalOverlapPairs.length || Math.max(...verticalOverlapPairs) < 0.15) {
    return items;
  }

  columns.forEach((column) => {
    column.items.sort((left, right) => left.page_y - right.page_y);
  });

  const rowCount = maxCount;
  const rowHeights = Array.from({ length: rowCount }, (_, rowIndex) =>
    Math.max(...columns.map((column) => (column.items[rowIndex] ? column.items[rowIndex].height : 0))),
  );
  const colWidths = columns.map((column) => Math.max(...column.items.map((item) => item.width)));
  const gap = 8;

  const rowOffsets = [];
  let currentY = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    rowOffsets.push(currentY);
    currentY += rowHeights[rowIndex] + gap;
  }

  const colOffsets = [];
  let currentX = 0;
  for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
    colOffsets.push(currentX);
    currentX += colWidths[colIndex] + gap;
  }

  return columns.flatMap((column, colIndex) =>
    column.items.map((item, rowIndex) => ({
      ...item,
      x: colOffsets[colIndex] + (colWidths[colIndex] - item.width) / 2,
      y: rowOffsets[rowIndex] + (rowHeights[rowIndex] - item.height) / 2,
    })),
  );
}

function median(values) {
  if (!values.length) {
    return 0;
  }
  const ordered = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
}

function expandRegionWithNearbyText({
  pageData,
  figure,
  region,
  pageWidth,
  pageHeight,
  pdfPageSize,
}) {
  if (!pageData || !pageData.tsv_lines || !pageWidth || !pageHeight || !pdfPageSize) {
    return region;
  }

  const scaleX = pageWidth / pdfPageSize.width_pts;
  const scaleY = pageHeight / pdfPageSize.height_pts;
  const columnSplit = pageWidth / 2;
  const side = figure.caption_bbox && figure.caption_bbox.side ? figure.caption_bbox.side : "full";
  const expanded = { ...region };

  for (const line of pageData.tsv_lines) {
    if (!line.text) {
      continue;
    }

    const scaled = {
      left: line.left * scaleX,
      right: line.right * scaleX,
      top: line.top * scaleY,
      bottom: line.bottom * scaleY,
    };
    const overlapsFigureBand =
      scaled.bottom >= region.top - 40 &&
      scaled.top <= region.bottom + 6;
    if (!overlapsFigureBand) {
      continue;
    }

    const sameColumn =
      side === "left"
        ? scaled.left < columnSplit + 12
        : side === "right"
          ? scaled.right > columnSplit - 12
          : true;
    if (!sameColumn) {
      continue;
    }

    expanded.left = Math.min(expanded.left, scaled.left - 4);
    expanded.top = Math.min(expanded.top, scaled.top - 4);
    expanded.right = Math.max(expanded.right, scaled.right + 4);
    expanded.bottom = Math.max(expanded.bottom, scaled.bottom + 4);
  }

  return expanded;
}

function renderFigureCropDataUri({
  pdfPath,
  page,
  pageWidth,
  pageHeight,
  region,
  outputPath,
}) {
  if (!pageWidth || !pageHeight) {
    return null;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paper-crop-"));
  try {
    const pagePrefix = path.join(tempDir, `page-${page}`);
    execText("pdftocairo", [
      "-png",
      "-singlefile",
      "-f",
      String(page),
      "-l",
      String(page),
      pdfPath,
      pagePrefix,
    ]);

    const pagePngPath = `${pagePrefix}.png`;
    if (!fs.existsSync(pagePngPath)) {
      return null;
    }

    const renderedSize = getImageDimensions(pagePngPath);
    const scaleX = renderedSize.width / pageWidth;
    const scaleY = renderedSize.height / pageHeight;
    const cropX = Math.max(0, Math.floor(region.left * scaleX));
    const cropY = Math.max(0, Math.floor(region.top * scaleY));
    const cropWidth = Math.max(1, Math.ceil((region.right - region.left) * scaleX));
    const cropHeight = Math.max(1, Math.ceil((region.bottom - region.top) * scaleY));

    execText("convert", [
      pagePngPath,
      "-crop",
      `${cropWidth}x${cropHeight}+${cropX}+${cropY}`,
      "+repage",
      outputPath,
    ]);

    return embedAssetDataUri(relativeToPublic(outputPath), PUBLIC_ROOT);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function renderCompositeSvg(layout, publicRoot = PUBLIC_ROOT) {
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.canvas.width}" height="${layout.canvas.height}" viewBox="0 0 ${layout.canvas.width} ${layout.canvas.height}">`,
    `<rect width="${layout.canvas.width}" height="${layout.canvas.height}" fill="white"/>`,
  ];

  for (const item of layout.items) {
    const embeddedHref = item.composite_href || embedAssetDataUri(item.asset_public_path, publicRoot);
    if (!embeddedHref) {
      continue;
    }
    const preserveAspectRatio = shouldPreserveItemAspect(item) ? "xMidYMid meet" : "none";
    lines.push(
      `<image href="${embeddedHref}" x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" preserveAspectRatio="${preserveAspectRatio}"/>`,
    );
  }

  lines.push("</svg>");
  return `${lines.join("\n")}\n`;
}

function shouldPreserveItemAspect(item) {
  if (!item || !item.composite_href || !item.width || !item.height) {
    return false;
  }
  const tinySource =
    Number.isFinite(item.source_width) &&
    Number.isFinite(item.source_height) &&
    item.source_width <= 16 &&
    item.source_height <= 16;
  const stretchedLarge = item.width >= 64 || item.height >= 64;
  return tinySource && stretchedLarge;
}

function renderImageBackedSvg(width, height, dataUri) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="white"/>`,
    `<image href="${dataUri}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"/>`,
    "</svg>",
    "",
  ].join("\n");
}

function embedAssetDataUri(publicPath, publicRoot = PUBLIC_ROOT) {
  const absolutePath = path.join(publicRoot, publicPath.replace(/^\/+/, ""));
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  const ext = path.extname(absolutePath).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".gif"].includes(ext)) {
    return null;
  }
  const buffer = fs.readFileSync(absolutePath);
  const mimeType =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".gif"
          ? "image/gif"
          : "application/octet-stream";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function buildCatalogFromPdf({
  title,
  slug,
  pdfPath,
  publicRoot = PUBLIC_ROOT,
  doi = null,
  year = null,
  authors = [],
  acquisitionSource = "manual",
  supplements = [],
}) {
  const { info, pages } = extractPageTexts(pdfPath);
  const pageSize = parsePageSize(info["Page size"]);
  const headings = detectHeadings(pages);
  const figures = detectFigureCaptions(pages);
  const references = collectBodyReferences(pages, figures);
  const extractedAssets = extractEmbeddedAssets(
    pdfPath,
    path.join(path.dirname(pdfPath), "figures", "original"),
    publicRoot,
  );

  for (const figure of figures) {
    figure.section_heading = nearestHeading(figure, headings);
    figure.body_references = references.get(figure.figure_id) || [];
    figure.rendered_asset_paths = [];
    figure.layout_path = null;
    figure.composite_svg_path = null;
  }
  figureAssetMapping(figures, extractedAssets);
  buildFigureLayouts({
    pdfPath,
    figures,
    extractedAssets,
    pages,
    pageSize,
    outputDir: path.join(path.dirname(pdfPath), "figures", "layout"),
    publicRoot,
  });
  renderFallbackFigures({
    pdfPath,
    figures,
    pages,
    outputDir: path.join(path.dirname(pdfPath), "figures", "rendered"),
    publicRoot,
    pageSize,
  });

  const warnings = [];
  if (!figures.length) {
    warnings.push("No figure captions were detected in the PDF text extraction.");
  }
  if (!extractedAssets.length) {
    warnings.push("No embedded assets were extracted by pdfimages.");
  }

  return {
    slug,
    title: title || info.Title || slug,
    authors,
    year: year || null,
    doi,
    acquisition_source: acquisitionSource,
    processing_status: "processed",
    pdf_file_path: pdfPath,
    pdf_public_path: relativeToPublic(pdfPath, publicRoot),
    supplements,
    extracted_assets: extractedAssets,
    figures,
    headings,
    warnings,
    pdf_metadata: {
      title: info.Title || null,
      pages: parseIntSafe(info.Pages),
      page_size: info["Page size"] || null,
      file_size: info["File size"] || null,
      pdf_version: info["PDF version"] || null,
    },
  };
}

function mergeCatalogMetadata(catalog, metadata) {
  return {
    ...catalog,
    title: metadata.title || catalog.title,
    doi: metadata.doi || catalog.doi,
    year: metadata.year || catalog.year,
    authors: metadata.authors && metadata.authors.length ? metadata.authors : catalog.authors,
    acquisition_source: metadata.acquisition_source || catalog.acquisition_source,
  };
}

function upsertManifestEntry(manifest, catalog, collectionRoot = COLLECTION_ROOT, publicRoot = PUBLIC_ROOT) {
  const entry = {
    slug: catalog.slug,
    title: catalog.title,
    doi: catalog.doi,
    year: catalog.year,
    authors: catalog.authors,
    acquisition_source: catalog.acquisition_source,
    processing_status: catalog.processing_status,
    figure_count: catalog.figures ? catalog.figures.length : 0,
    embedded_asset_count: catalog.extracted_assets ? catalog.extracted_assets.length : 0,
    pdf_path: catalog.pdf_public_path,
    catalog_path: relativeToPublic(path.join(collectionRoot, catalog.slug, "catalog.json"), publicRoot),
    readme_path: relativeToPublic(path.join(collectionRoot, catalog.slug, "README.md"), publicRoot),
    warnings: catalog.warnings || [],
    updated_at: new Date().toISOString(),
  };

  const index = (manifest.papers || []).findIndex((paper) => paper.slug === catalog.slug);
  if (index >= 0) {
    manifest.papers[index] = entry;
  } else {
    manifest.papers.push(entry);
  }
}

async function resolvePdfInput({ title, doi, pdfUrl, pdfPath }) {
  const metadata = await resolveRemoteMetadata({ title, doi }).catch(() => null);

  if (pdfPath) {
    return {
      metadata,
      status: "local",
      pdfSource: pdfPath,
      acquisitionSource: "manual",
    };
  }

  if (pdfUrl) {
    return {
      metadata,
      status: "remote",
      pdfSource: pdfUrl,
      acquisitionSource: metadata && metadata.remote_pdf_url === pdfUrl ? metadata.acquisition_source : "publisher",
    };
  }

  if (metadata && metadata.remote_pdf_url) {
    return {
      metadata,
      status: "remote",
      pdfSource: metadata.remote_pdf_url,
      acquisitionSource: metadata.acquisition_source || "publisher",
    };
  }

  return {
    metadata,
    status: "needs_pdf",
    pdfSource: null,
    acquisitionSource: "manual",
  };
}

function normalizeSupplementEntry(entry) {
  return {
    source: entry.source,
    local_path: entry.local_path || null,
    public_path: entry.public_path || null,
  };
}

async function materializeSupplement(source, supplementsDir, publicRoot = PUBLIC_ROOT) {
  const basename = path.basename(source.split("?")[0]) || `supplement-${Date.now()}.pdf`;
  const destination = path.join(supplementsDir, basename);
  if (/^https?:\/\//i.test(source)) {
    await downloadToFile(source, destination);
    return normalizeSupplementEntry({
      source,
      local_path: destination,
      public_path: relativeToPublic(destination, publicRoot),
    });
  }

  const resolved = path.resolve(source);
  fs.copyFileSync(resolved, destination);
  return normalizeSupplementEntry({
    source: resolved,
    local_path: destination,
    public_path: relativeToPublic(destination, publicRoot),
  });
}

async function ingestPaper(options) {
  const collectionRoot = options.collectionRoot || COLLECTION_ROOT;
  const publicRoot = options.publicRoot || PUBLIC_ROOT;
  ensureCollection(collectionRoot);

  const title = options.title;
  if (!title) {
    throw new Error("A paper title is required.");
  }

  const slug = slugify(options.slug || title);
  const paperDir = path.join(collectionRoot, slug);
  const pdfDestination = path.join(paperDir, "paper.pdf");
  const supplementsDir = path.join(paperDir, "supplements");
  const figuresDir = path.join(paperDir, "figures", "original");

  ensureDir(paperDir);
  ensureDir(supplementsDir);
  ensureDir(figuresDir);

  const resolved = await resolvePdfInput({
    title,
    doi: options.doi || null,
    pdfUrl: options.pdfUrl || null,
    pdfPath: options.pdfPath || null,
  });

  const metadata = resolved.metadata || {};
  const warnings = [];

  if (resolved.status === "local") {
    fs.copyFileSync(path.resolve(resolved.pdfSource), pdfDestination);
  } else if (resolved.status === "remote") {
    await downloadToFile(resolved.pdfSource, pdfDestination);
  }

  const supplementSources = [
    ...parseMultiValue(options.supplements),
    ...parseMultiValue(metadata.remote_supplements),
  ];

  removeDirContents(supplementsDir);
  const supplements = [];
  for (const supplementSource of supplementSources) {
    try {
      supplements.push(await materializeSupplement(supplementSource, supplementsDir, publicRoot));
    } catch (error) {
      warnings.push(`Failed to acquire supplement ${supplementSource}: ${error.message}`);
    }
  }

  let catalog;
  if (resolved.status === "needs_pdf") {
    catalog = {
      slug,
      title: metadata.title || title,
      authors: metadata.authors || [],
      year: metadata.year || null,
      doi: metadata.doi || options.doi || null,
      acquisition_source: "manual",
      processing_status: "needs_pdf",
      pdf_file_path: null,
      pdf_public_path: null,
      supplements,
      extracted_assets: [],
      figures: [],
      headings: [],
      warnings: [
        "No open-access PDF could be resolved automatically. Provide --pdf-path or --pdf-url to continue processing this paper.",
        ...warnings,
      ],
      pdf_metadata: null,
    };
  } else {
    catalog = buildCatalogFromPdf({
      title,
      slug,
      pdfPath: pdfDestination,
      publicRoot,
      doi: options.doi || null,
      year: options.year || null,
      authors: options.authors || [],
      acquisitionSource: resolved.acquisitionSource,
      supplements,
    });
    catalog = mergeCatalogMetadata(catalog, metadata);
    catalog.warnings = [...catalog.warnings, ...warnings];
  }

  writeJson(path.join(paperDir, "catalog.json"), catalog);
  fs.writeFileSync(path.join(paperDir, "README.md"), renderPaperReadme(catalog), "utf8");

  const manifest = loadManifest(collectionRoot);
  upsertManifestEntry(manifest, catalog, collectionRoot, publicRoot);
  saveManifest(manifest, collectionRoot);

  return catalog;
}

function rebuildCollection(collectionRoot = COLLECTION_ROOT, publicRoot = PUBLIC_ROOT) {
  ensureCollection(collectionRoot);
  const manifest = createEmptyManifest();
  const entries = fs
    .readdirSync(collectionRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const slug of entries) {
    const catalogPath = path.join(collectionRoot, slug, "catalog.json");
    if (!fs.existsSync(catalogPath)) {
      continue;
    }
    const catalog = readJson(catalogPath, null);
    if (!catalog) {
      continue;
    }
    upsertManifestEntry(manifest, catalog, collectionRoot, publicRoot);
    const readmePath = path.join(collectionRoot, slug, "README.md");
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, renderPaperReadme(catalog), "utf8");
    }
  }

  saveManifest(manifest, collectionRoot);
  return manifest;
}

function printHelp() {
  console.log(`Usage:
  node ./scripts/paper-catalog.js init
  node ./scripts/paper-catalog.js interactive
  node ./scripts/paper-catalog.js ingest --title "Paper Title" [--doi DOI] [--pdf-url URL] [--pdf-path /path/to/paper.pdf] [--supplement URL_OR_PATH]
  node ./scripts/paper-catalog.js rebuild
`);
}

async function runInteractive() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    ensureCollection(COLLECTION_ROOT);
    while (true) {
      const title = (await rl.question("Paper title (leave blank to stop): ")).trim();
      if (!title) {
        break;
      }

      const doi = (await rl.question("DOI (optional): ")).trim();
      const pdfUrl = (await rl.question("PDF URL (optional): ")).trim();
      const pdfPath = (await rl.question("Local PDF path (optional): ")).trim();
      const supplements = (await rl.question("Supplement URLs or paths, comma-separated (optional): ")).trim();

      try {
        const catalog = await ingestPaper({
          title,
          doi: doi || null,
          pdfUrl: pdfUrl || null,
          pdfPath: pdfPath || null,
          supplements: supplements || null,
        });
        console.log(
          `Processed ${catalog.title} -> status=${catalog.processing_status}, figures=${catalog.figures.length}, embedded_assets=${catalog.extracted_assets.length}`,
        );
      } catch (error) {
        console.error(`Failed to process "${title}": ${error.message}`);
      }

      const next = (await rl.question("Process another paper? [Y/n]: ")).trim().toLowerCase();
      if (next === "n" || next === "no") {
        break;
      }
    }
  } finally {
    rl.close();
  }
}

async function main() {
  if (!commandExists("pdfimages") || !commandExists("pdftotext") || !commandExists("pdfinfo")) {
    throw new Error("Required PDF tools are missing. Install pdfimages, pdftotext, and pdfinfo.");
  }

  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  switch (command) {
    case "init":
      ensureCollection(COLLECTION_ROOT);
      rebuildCollection(COLLECTION_ROOT);
      console.log(`Initialized paper catalog at ${COLLECTION_ROOT}`);
      return;
    case "interactive":
      await runInteractive();
      return;
    case "ingest": {
      const catalog = await ingestPaper({
        title: args.title,
        doi: args.doi,
        pdfUrl: args["pdf-url"],
        pdfPath: args["pdf-path"],
        supplements: args.supplement,
      });
      console.log(JSON.stringify({
        title: catalog.title,
        slug: catalog.slug,
        processing_status: catalog.processing_status,
        figure_count: catalog.figures.length,
        embedded_asset_count: catalog.extracted_assets.length,
        pdf_path: catalog.pdf_public_path,
      }, null, 2));
      return;
    }
    case "rebuild": {
      const manifest = rebuildCollection(COLLECTION_ROOT);
      console.log(`Rebuilt collection manifest with ${manifest.papers.length} paper(s).`);
      return;
    }
    case "--help":
    case "-h":
    case "help":
    case undefined:
      printHelp();
      return;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  COLLECTION_ROOT,
  INDEX_PATH,
  README_PATH,
  buildCatalogFromPdf,
  detectFigureCaptions,
  detectHeadings,
  extractEmbeddedAssets,
  ingestPaper,
  normalizeTitle,
  rebuildCollection,
  renderCollectionReadme,
  renderPaperReadme,
  slugify,
};
