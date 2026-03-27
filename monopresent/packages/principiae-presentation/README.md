# Principiae Presentation

Starter presentation using `immersion-presentation`.

## Run

```bash
yarn workspace principiae-presentation start
```

## Prewarm Deck (Server Cache)

Use this to auto-advance through the deck and warm LaTeX cache before presenting.

1. Start the LaTeX server (from `latex-server`):

```bash
ENABLE_QUEUE=1 MAX_COMPILE_CONCURRENCY=6 QUEUE_TIMEOUT_MS=15000 ENABLE_CACHE=1 ENABLE_INFLIGHT_DEDUPE=1 npm run start:concmath
```

2. Start the presentation (from `monopresent`):

```bash
yarn start:principiae-presentation
```

3. Prewarm in another terminal (from `monopresent`):

```bash
yarn prewarm:deck --url http://localhost:3000 --path /fullscreen --steps 400 --delay 250 --initial-wait 2000 --stop-on-stable --stable-steps 12
```

If Playwright browsers are not installed yet:

```bash
yarn playwright install chromium
```

## Paper Catalog

The package now includes a paper-ingestion pipeline rooted at `public/assets/papers`.

Initialize the manifest scaffolding:

```bash
yarn workspace principiae-presentation papers:init
```

Process papers interactively one-by-one:

```bash
yarn workspace principiae-presentation papers:interactive
```

Ingest a single paper non-interactively:

```bash
yarn workspace principiae-presentation papers:ingest --title "Paper Title" --pdf-path /absolute/path/to/paper.pdf
```

Rebuild the top-level manifest and Markdown summary from per-paper catalogs:

```bash
yarn workspace principiae-presentation papers:rebuild
```

Run the pipeline smoke tests:

```bash
yarn workspace principiae-presentation papers:test
```
