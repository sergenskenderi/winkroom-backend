const SUPPORTED_LOCALES = ['en', 'tr', 'it', 'de', 'fr', 'es', 'sq'];

function getWordPairsForLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return null;
  try {
    return require(`./${locale}.js`);
  } catch (err) {
    console.warn(`No word pairs file for locale: ${locale}`);
    return null;
  }
}

module.exports = { SUPPORTED_LOCALES, getWordPairsForLocale };
