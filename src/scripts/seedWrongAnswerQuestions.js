const mongoose = require('mongoose');
const WrongAnswerQuestion = require('../models/WrongAnswerQuestion');
const { getWrongAnswerQuestions, SUPPORTED } = require('./wrongAnswerQuestions');
require('dotenv').config();

async function seedWrongAnswerQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkroom');
    console.log('Connected to MongoDB');

    for (const locale of SUPPORTED) {
      const questions = getWrongAnswerQuestions(locale);
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.log(`Skipping locale ${locale}: no questions`);
        continue;
      }
      await WrongAnswerQuestion.deleteMany({ locale });
      const withLocale = questions
        .map((q) => ({
          question: (q.question || '').toString().trim(),
          category: q.category || 'general',
          difficulty: q.difficulty || 'medium',
          locale,
        }))
        .filter((q) => q.question.length > 0);
      const result = await WrongAnswerQuestion.insertMany(withLocale);
      console.log(`[${locale}] Seeded ${result.length} wrong-answer questions`);
    }

    const total = await WrongAnswerQuestion.countDocuments({});
    console.log(`\nTotal wrong-answer questions: ${total}`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding wrong-answer questions:', error);
    process.exit(1);
  }
}

seedWrongAnswerQuestions();
