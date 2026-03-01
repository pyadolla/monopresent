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
