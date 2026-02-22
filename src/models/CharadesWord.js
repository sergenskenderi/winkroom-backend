const mongoose = require('mongoose');

const charadesWordSchema = new mongoose.Schema({
  locale: {
    type: String,
    required: true,
    default: 'en',
    index: true
  },
  word: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['animals', 'food', 'colors', 'emotions', 'objects', 'nature', 'sports', 'professions', 'places', 'activities']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

charadesWordSchema.index({ locale: 1, category: 1, difficulty: 1, isActive: 1 });
charadesWordSchema.index({ locale: 1, usageCount: 1 });

charadesWordSchema.statics.getRandomWords = function(count = 20, category = null, difficulty = null, locale = 'en') {
  const query = { isActive: true, locale: locale || 'en' };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  const poolSize = Math.max(50, count * 3);
  return this.aggregate([
    { $match: query },
    { $sort: { usageCount: 1 } },
    { $limit: poolSize },
    { $sample: { size: count } }
  ]);
};

charadesWordSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

module.exports = mongoose.model('CharadesWord', charadesWordSchema);
