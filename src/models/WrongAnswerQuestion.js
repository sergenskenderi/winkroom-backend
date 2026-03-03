const mongoose = require('mongoose');

const wrongAnswerQuestionSchema = new mongoose.Schema(
  {
    locale: {
      type: String,
      required: true,
      default: 'en',
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'general',
        'funny',
        'would_you_rather',
        'random',
        'science',
        'geography',
        'food',
        'sports',
        'music',
        'movies',
      ],
      default: 'general',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

wrongAnswerQuestionSchema.index({
  locale: 1,
  category: 1,
  difficulty: 1,
  isActive: 1,
});
wrongAnswerQuestionSchema.index({ locale: 1, usageCount: 1 });

wrongAnswerQuestionSchema.statics.getRandomQuestions = function (
  count = 20,
  category = null,
  difficulty = null,
  locale = 'en'
) {
  const query = { isActive: true, locale: locale || 'en' };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  const poolSize = Math.max(50, count * 3);
  return this.aggregate([
    { $match: query },
    { $sort: { usageCount: 1 } },
    { $limit: poolSize },
    { $sample: { size: count } },
  ]);
};

wrongAnswerQuestionSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

module.exports = mongoose.model('WrongAnswerQuestion', wrongAnswerQuestionSchema);

