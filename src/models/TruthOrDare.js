const mongoose = require('mongoose');

const truthOrDareSchema = new mongoose.Schema(
  {
    locale: { type: String, required: true, default: 'en', index: true },
    type: { type: String, required: true, enum: ['truth', 'dare'], index: true },
    text: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['general', 'funny', 'risky', 'challenge', 'friendship'],
      default: 'general',
    },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

truthOrDareSchema.index({ locale: 1, type: 1, isActive: 1 });
truthOrDareSchema.index({ locale: 1, type: 1, usageCount: 1 });

truthOrDareSchema.statics.getRandom = function (type, count = 20, category = null, locale = 'en') {
  const query = { isActive: true, locale: locale || 'en', type };
  if (category) query.category = category;
  const poolSize = Math.max(60, count * 3);
  return this.aggregate([
    { $match: query },
    { $sort: { usageCount: 1 } },
    { $limit: poolSize },
    { $sample: { size: Math.min(count, poolSize) } },
  ]);
};

module.exports = mongoose.model('TruthOrDare', truthOrDareSchema);
