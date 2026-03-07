const mongoose = require('mongoose');

const neverHaveIEverQuestionSchema = new mongoose.Schema(
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
      enum: ['general', 'funny', 'risky', 'travel', 'food', 'work', 'childhood', 'relationships'],
      default: 'general',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

neverHaveIEverQuestionSchema.index({ locale: 1, isActive: 1 });
neverHaveIEverQuestionSchema.index({ locale: 1, usageCount: 1 });

neverHaveIEverQuestionSchema.statics.getRandomQuestions = function (count = 30, category = null, locale = 'en') {
  const query = { isActive: true, locale: locale || 'en' };
  if (category) query.category = category;
  const poolSize = Math.max(80, count * 3);
  return this.aggregate([
    { $match: query },
    { $sort: { usageCount: 1 } },
    { $limit: poolSize },
    { $sample: { size: Math.min(count, poolSize) } },
  ]);
};

module.exports = mongoose.model('NeverHaveIEverQuestion', neverHaveIEverQuestionSchema);
