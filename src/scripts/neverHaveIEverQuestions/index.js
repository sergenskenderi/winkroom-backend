const SUPPORTED = ['en', 'de', 'es', 'fr', 'it', 'tr', 'sq'];

function getNeverHaveIEverQuestions(locale) {
  const code = (locale || 'en').toLowerCase();
  const use = SUPPORTED.includes(code) ? code : 'en';
  try {
    return require(`./${use}.js`);
  } catch (err) {
    return require('./en.js');
  }
}

module.exports = { getNeverHaveIEverQuestions, SUPPORTED };
