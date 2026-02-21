const mongoose = require('mongoose');
const WordPair = require('../models/WordPair');
const { SUPPORTED_LOCALES, getWordPairsForLocale } = require('./wordPairs');
require('dotenv').config();

async function seedWords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkroom');
    console.log('Connected to MongoDB');

    for (const locale of SUPPORTED_LOCALES) {
      const pairs = getWordPairsForLocale(locale);
      if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
        console.log(`Skipping locale ${locale}: no pairs`);
        continue;
      }
      await WordPair.deleteMany({ locale });
      const withLocale = pairs.map((p) => ({ ...p, locale }));
      const result = await WordPair.insertMany(withLocale);
      console.log(`[${locale}] Seeded ${result.length} word pairs`);
    }

    const total = await WordPair.countDocuments({});
    console.log(`\nTotal word pairs: ${total}`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding words:', error);
    process.exit(1);
  }
}

seedWords();
