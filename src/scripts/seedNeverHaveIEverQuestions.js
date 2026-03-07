const mongoose = require('mongoose');
const NeverHaveIEverQuestion = require('../models/NeverHaveIEverQuestion');
const { getNeverHaveIEverQuestions, SUPPORTED } = require('./neverHaveIEverQuestions');
require('dotenv').config();

async function seedNeverHaveIEverQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkroom');
    console.log('Connected to MongoDB');

    for (const locale of SUPPORTED) {
      const questions = getNeverHaveIEverQuestions(locale);
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.log(`Skipping locale ${locale}: no questions`);
        continue;
      }
      await NeverHaveIEverQuestion.deleteMany({ locale });
      const withLocale = questions
        .map((q) => ({
          question: (q.question || '').toString().trim(),
          category: q.category || 'general',
          locale,
        }))
        .filter((q) => q.question.length > 0);
      const result = await NeverHaveIEverQuestion.insertMany(withLocale);
      console.log(`[${locale}] Seeded ${result.length} never-have-i-ever questions`);
    }

    const total = await NeverHaveIEverQuestion.countDocuments({});
    console.log(`\nTotal never-have-i-ever questions: ${total}`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding never-have-i-ever questions:', error);
    process.exit(1);
  }
}

seedNeverHaveIEverQuestions();
