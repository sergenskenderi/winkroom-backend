const SUPPORTED = ['en', 'de', 'es', 'fr', 'it', 'tr', 'sq'];

function getTruthOrDare(locale) {
  const code = (locale || 'en').toLowerCase().split(/[-_]/)[0];
  const use = SUPPORTED.includes(code) ? code : 'en';
  try {
    return require(`./${use}.js`);
  } catch (err) {
    return require('./en.js');
  }
}

module.exports = { getTruthOrDare, SUPPORTED };
