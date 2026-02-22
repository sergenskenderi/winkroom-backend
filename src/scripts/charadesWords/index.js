const SUPPORTED = ['en', 'tr', 'it', 'de', 'fr', 'es', 'sq'];

function getCharadesWords(locale) {
  const code = (locale || 'en').toLowerCase();
  const use = SUPPORTED.includes(code) ? code : 'en';
  try {
    return require(`./${use}.js`);
  } catch (err) {
    return require('./en.js');
  }
}

module.exports = { getCharadesWords, SUPPORTED };
