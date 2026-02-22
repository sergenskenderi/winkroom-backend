const fs = require('fs');
const path = require('path');
const en = require('./en.js');
const SUPPORTED = ['tr', 'de', 'fr', 'es', 'it', 'sq'];

const first100 = {};
SUPPORTED.forEach((loc) => {
  first100[loc] = require(`./${loc}.js`).map((x) => x.word);
});

let rest;
try {
  rest = require('./charadesWordsRest.js');
} catch (e) {
  console.error('Missing charadesWordsRest.js');
  process.exit(1);
}

function escape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const restByEn = Object.fromEntries(rest.map((r) => [r.en, r]));
SUPPORTED.forEach((locale) => {
  const words = first100[locale].slice(0, 100).concat(en.slice(100).map((e) => (restByEn[e.word] ? restByEn[e.word][locale] : e.word)));
  const out = en.map((e, i) => ({ word: words[i] || e.word, category: e.category, difficulty: e.difficulty }));
  const lines = out.map((o) => `  { word: '${escape(o.word)}', category: '${o.category}', difficulty: '${o.difficulty}' }`);
  fs.writeFileSync(path.join(__dirname, `${locale}.js`), 'module.exports = [\n' + lines.join(',\n') + '\n];\n');
  console.log(`${locale}.js: ${out.length} words`);
});
console.log('Done.');
