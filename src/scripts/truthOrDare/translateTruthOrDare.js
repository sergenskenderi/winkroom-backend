/**
 * Script to translate en.js truths and dares to de, es, fr, it, tr, sq.
 * Uses MyMemory API (no key, rate-limited). Run: node translateTruthOrDare.js
 */
const fs = require('fs');
const path = require('path');

const LOCALES = [
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'it', name: 'Italian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sq', name: 'Albanian' },
];

const DELAY_MS = 350; // avoid rate limits (MyMemory allows ~1000 req/day free)

function escapeJsString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

const https = require('https');

function translate(text, targetLang) {
  const langPair = targetLang === 'sq' ? 'en|sq' : `en|${targetLang}`;
  const path = `/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  return new Promise((resolve) => {
    const req = https.get(
      { hostname: 'api.mymemory.translated.net', path },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
              return resolve(data.responseData.translatedText);
            }
          } catch (_) {}
          resolve(text);
        });
      }
    );
    req.on('error', () => resolve(text));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve(text);
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateAll(items, targetLang) {
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const translated = await translate(items[i].text, targetLang);
    out.push({ text: translated, category: items[i].category });
    if ((i + 1) % 50 === 0) console.log(`  ${targetLang}: ${i + 1}/${items.length}`);
    await sleep(DELAY_MS);
  }
  return out;
}

function formatFile(truths, dares) {
  const line = (item) => `  { text: '${escapeJsString(item.text)}', category: '${item.category}' },`;
  return `const truths = [\n${truths.map(line).join('\n')}\n];\n\nconst dares = [\n${dares.map(line).join('\n')}\n];\n\nmodule.exports = { truths, dares };\n`;
}

async function main() {
  const dir = __dirname;
  const { truths, dares } = require('./en.js');

  console.log(`Loaded ${truths.length} truths, ${dares.length} dares from en.js`);

  const only = process.argv[2]; // e.g. "de" to run only German
  const toRun = only ? LOCALES.filter((l) => l.code === only) : LOCALES;
  if (only && toRun.length === 0) {
    console.error('Unknown locale:', only);
    process.exit(1);
  }

  for (const { code } of toRun) {
    console.log(`\nTranslating to ${code}...`);
    const truthsTranslated = await translateAll(truths, code);
    const daresTranslated = await translateAll(dares, code);
    const output = formatFile(truthsTranslated, daresTranslated);
    const outPath = path.join(dir, `${code}.js`);
    fs.writeFileSync(outPath, output, 'utf8');
    console.log(`Wrote ${outPath}`);
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
