const mongoose = require('mongoose');

const wordPairSchema = new mongoose.Schema({
  locale: {
    type: String,
    required: true,
    default: 'en',
    index: true
  },
  commonWord: {
    type: String,
    required: true,
    trim: true
  },
  intruderWord: {
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
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

wordPairSchema.index({ locale: 1, category: 1, difficulty: 1, isActive: 1 });
wordPairSchema.index({ locale: 1, usageCount: 1 });

wordPairSchema.statics.getRandomPair = function(category = null, difficulty = null, locale = 'en') {
  const query = { isActive: true, locale: locale || 'en' };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  return this.aggregate([
    { $match: query },
    { $sample: { size: 1 } }
  ]);
};

wordPairSchema.statics.getRandomPairs = function(count = 5, category = null, difficulty = null, locale = 'en') {
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

// Increment usage count
wordPairSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Update rating
wordPairSchema.methods.updateRating = function(newRating) {
  const totalRating = this.averageRating * this.usageCount + newRating;
  this.usageCount += 1;
  this.averageRating = totalRating / this.usageCount;
  return this.save();
};

module.exports = mongoose.model('WordPair', wordPairSchema); 