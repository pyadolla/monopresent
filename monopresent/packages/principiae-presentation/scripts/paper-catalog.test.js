const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  ingestPaper,
  slugify,
  rebuildCollection,
} = require("./paper-catalog");

const SAMPLE_PDF = path.resolve(__dirname, "..", "public", "assets", "science.aan0693.pdf");

test("slugify normalizes titles to stable directory names", () => {
  assert.equal(
    slugify("Global analysis of protein folding using massively parallel design, synthesis, and testing"),
    "global-analysis-of-protein-folding-using-massively-parallel-design-synthesis-and",
  );
});

test("ingestPaper catalogs a local PDF into a temp collection", async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "paper-catalog-"));
  const collectionRoot = path.join(tempRoot, "assets", "papers");
  const publicRoot = path.join(tempRoot);

  const catalog = await ingestPaper({
    title: "Global analysis of protein folding using massively parallel design, synthesis, and testing",
    pdfPath: SAMPLE_PDF,
    collectionRoot,
    publicRoot,
  });

  assert.equal(catalog.processing_status, "processed");
  assert.ok(catalog.figures.length >= 1);
  assert.ok(catalog.extracted_assets.length >= 1);

  const paperDir = path.join(collectionRoot, catalog.slug);
  assert.ok(fs.existsSync(path.join(paperDir, "paper.pdf")));
  assert.ok(fs.existsSync(path.join(paperDir, "catalog.json")));
  assert.ok(fs.existsSync(path.join(paperDir, "README.md")));

  const manifest = rebuildCollection(collectionRoot, publicRoot);
  assert.equal(manifest.papers.length, 1);
  assert.equal(manifest.papers[0].slug, catalog.slug);
});
