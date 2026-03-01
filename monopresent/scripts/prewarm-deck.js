#!/usr/bin/env node

function parseArgs(argv) {
  const options = {
    url: "http://localhost:3000",
    path: "/",
    steps: 300,
    delayMs: 120,
    initialWaitMs: 1200,
    headless: true,
    key: "ArrowRight",
    stopOnStable: false,
    stableSteps: 12,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--url" && argv[i + 1]) options.url = argv[++i];
    else if (arg === "--path" && argv[i + 1]) options.path = argv[++i];
    else if (arg === "--steps" && argv[i + 1]) options.steps = Number(argv[++i]);
    else if (arg === "--delay" && argv[i + 1]) options.delayMs = Number(argv[++i]);
    else if (arg === "--initial-wait" && argv[i + 1]) options.initialWaitMs = Number(argv[++i]);
    else if (arg === "--key" && argv[i + 1]) options.key = argv[++i];
    else if (arg === "--stable-steps" && argv[i + 1]) options.stableSteps = Number(argv[++i]);
    else if (arg === "--stop-on-stable") options.stopOnStable = true;
    else if (arg === "--headed") options.headless = false;
    else if (arg === "--help") options.help = true;
  }

  return options;
}

function printHelp() {
  console.log(
    [
      "Usage: node scripts/prewarm-deck.js [options]",
      "",
      "Options:",
      "  --url <url>            Base URL (default: http://localhost:3000)",
      "  --path <path>          Start path (default: /)",
      "  --steps <n>            Number of key presses (default: 300)",
      "  --delay <ms>           Delay between steps (default: 120)",
      "  --initial-wait <ms>    Initial wait after load (default: 1200)",
      "  --key <key>            Keyboard key to advance (default: ArrowRight)",
      "  --stop-on-stable       Exit early when slide state stops changing",
      "  --stable-steps <n>     Consecutive unchanged steps before exit (default: 12)",
      "  --headed               Run with a visible browser window",
      "  --help                 Show this help",
      "",
      "Example:",
      "  node scripts/prewarm-deck.js --url http://localhost:3000 --path / --steps 450 --delay 100",
    ].join("\n")
  );
}

function normalizeTarget(url, path) {
  const base = url.endsWith("/") ? url.slice(0, -1) : url;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function runWithPlaywright(target, opts) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: opts.headless });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(target, { waitUntil: "networkidle", timeout: 0 });
  await page.waitForTimeout(opts.initialWaitMs);

  const getSignature = async () =>
    page.evaluate(() => {
      const text = (document.body?.innerText || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 1200);
      const htmlLen = (document.body?.innerHTML || "").length;
      return `${window.location.href}::${document.title}::${htmlLen}::${text}`;
    });

  let unchangedSteps = 0;
  let prevSignature = await getSignature();
  for (let i = 0; i < opts.steps; i += 1) {
    await page.keyboard.press(opts.key);
    await page.waitForTimeout(opts.delayMs);
    if (opts.stopOnStable) {
      const currentSignature = await getSignature();
      if (currentSignature === prevSignature) {
        unchangedSteps += 1;
      } else {
        unchangedSteps = 0;
        prevSignature = currentSignature;
      }
      if (unchangedSteps >= opts.stableSteps) {
        console.log(`[prewarm] stopping early after ${i + 1} steps (stable for ${opts.stableSteps}).`);
        break;
      }
    }
    if ((i + 1) % 50 === 0) {
      console.log(`[prewarm] advanced ${i + 1}/${opts.steps}`);
    }
  }
  await browser.close();
}

async function runWithPuppeteer(target, opts) {
  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch({
    headless: opts.headless ? true : false,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto(target, { waitUntil: "networkidle2", timeout: 0 });
  await page.waitForTimeout(opts.initialWaitMs);

  const getSignature = async () =>
    page.evaluate(() => {
      const text = (document.body?.innerText || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 1200);
      const htmlLen = (document.body?.innerHTML || "").length;
      return `${window.location.href}::${document.title}::${htmlLen}::${text}`;
    });

  let unchangedSteps = 0;
  let prevSignature = await getSignature();
  for (let i = 0; i < opts.steps; i += 1) {
    await page.keyboard.press(opts.key);
    await page.waitForTimeout(opts.delayMs);
    if (opts.stopOnStable) {
      const currentSignature = await getSignature();
      if (currentSignature === prevSignature) {
        unchangedSteps += 1;
      } else {
        unchangedSteps = 0;
        prevSignature = currentSignature;
      }
      if (unchangedSteps >= opts.stableSteps) {
        console.log(`[prewarm] stopping early after ${i + 1} steps (stable for ${opts.stableSteps}).`);
        break;
      }
    }
    if ((i + 1) % 50 === 0) {
      console.log(`[prewarm] advanced ${i + 1}/${opts.steps}`);
    }
  }
  await browser.close();
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  if (!Number.isFinite(opts.steps) || opts.steps <= 0) {
    throw new Error("--steps must be a positive number.");
  }
  if (!Number.isFinite(opts.delayMs) || opts.delayMs < 0) {
    throw new Error("--delay must be >= 0.");
  }
  if (!Number.isFinite(opts.stableSteps) || opts.stableSteps <= 0) {
    throw new Error("--stable-steps must be a positive number.");
  }

  const target = normalizeTarget(opts.url, opts.path);
  console.log(
    `[prewarm] target=${target} steps=${opts.steps} delayMs=${opts.delayMs} headless=${opts.headless} stopOnStable=${opts.stopOnStable} stableSteps=${opts.stableSteps}`
  );

  try {
    await runWithPlaywright(target, opts);
    console.log("[prewarm] completed with Playwright.");
    return;
  } catch (error) {
    if (!String(error && error.message).includes("Cannot find module 'playwright'")) {
      throw error;
    }
  }

  try {
    await runWithPuppeteer(target, opts);
    console.log("[prewarm] completed with Puppeteer.");
    return;
  } catch (error) {
    if (!String(error && error.message).includes("Cannot find module 'puppeteer'")) {
      throw error;
    }
  }

  throw new Error(
    "No browser automation package found. Install one: `yarn add -D playwright` (recommended) or `yarn add -D puppeteer`."
  );
}

main().catch((error) => {
  console.error(`[prewarm] failed: ${error.message}`);
  process.exit(1);
});
