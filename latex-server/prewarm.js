#!/usr/bin/env node
/**
 * Extract every static m`...` / M`...` expression from one or more deck sources
 * and POST them to the fast LaTeX server's /latex/batch endpoint in prewarm
 * mode. Read-only with respect to the deck.
 *
 *   node prewarm.js --port 3001 <deck.js> [<deck2.js> ...]
 */
const fs = require('fs');
const http = require('http');

function extract(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = [];
  const re = /(^|[^A-Za-z0-9_$.])(m|M)`/g;
  let mm;
  while ((mm = re.exec(src))) {
    const tag = mm[2];
    let i = mm.index + mm[0].length, depth = 0, buf = '', dynamic = false;
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { buf += c + src[i + 1]; i += 2; continue; }
      if (c === '$' && src[i + 1] === '{') { dynamic = true; depth++; buf += '${'; i += 2; continue; }
      if (depth > 0) { if (c === '{') depth++; if (c === '}') depth--; buf += c; i++; continue; }
      if (c === '`') break;
      buf += c; i++;
    }
    if (!dynamic) out.push(tag === 'M' ? '$\\displaystyle ' + buf + '$' : '$' + buf + '$');
  }
  return out;
}

const args = process.argv.slice(2);
let port = 3001, host = '127.0.0.1';
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port') port = Number(args[++i]);
  else if (args[i] === '--host') host = args[++i];
  else files.push(args[i]);
}
if (!files.length) { console.error('usage: prewarm.js [--host H] [--port P] <deck.js> ...'); process.exit(2); }

const all = [];
for (const f of files) all.push(...extract(f));
const corpus = [...new Set(all)];
console.log(`prewarm: ${corpus.length} distinct expressions from ${files.length} file(s)`);

const body = JSON.stringify({ tex: corpus, preamble: '', results: false });
const t0 = Date.now();
const req = http.request({ host, port, path: '/latex/batch', method: 'POST',
  headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } },
  (res) => {
    let b = ''; res.on('data', (c) => b += c);
    res.on('end', () => {
      const ms = Date.now() - t0;
      try {
        const j = JSON.parse(b);
        console.log(`prewarm: ${j.ok}/${j.n} compiled in ${(ms/1000).toFixed(1)}s (${(ms/corpus.length).toFixed(0)} ms/expr)`);
        process.exit(j.ok === j.n ? 0 : 1);
      } catch { console.error('unexpected response:', b.slice(0, 300)); process.exit(1); }
    });
  });
req.on('error', (e) => { console.error('prewarm failed:', e.message); process.exit(1); });
req.end(body);
