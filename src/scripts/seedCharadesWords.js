const mongoose = require('mongoose');
const CharadesWord = require('../models/CharadesWord');
const { SUPPORTED } = require('./charadesWords');
require('dotenv').config();

function getCharadesWordsForLocale(locale) {
  try {
    return require(`./charadesWords/${locale}.js`);
  } catch (err) {
    return null;
  }
}

async function seedCharadesWords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkroom');
    console.log('Connected to MongoDB');

    for (const locale of SUPPORTED) {
      const words = getCharadesWordsForLocale(locale);
      if (!words || !Array.isArray(words) || words.length === 0) {
        console.log(`Skipping locale ${locale}: no charades words`);
        continue;
      }
      await CharadesWord.deleteMany({ locale });
      const withLocale = words.map((w) => ({
        word: (w.word || w).toString().trim().toLowerCase(),
        category: w.category || 'activities',
        difficulty: w.difficulty || 'medium',
        locale
      })).filter((w) => w.word.length > 0);
      const result = await CharadesWord.insertMany(withLocale);
      console.log(`[${locale}] Seeded ${result.length} charades words`);
    }

    const total = await CharadesWord.countDocuments({});
    console.log(`\nTotal charades words: ${total}`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding charades words:', error);
    process.exit(1);
  }
}

seedCharadesWords();
