const mongoose = require('mongoose');
const WordPair = require('../models/WordPair');
require('dotenv').config();

const wordPairs = [
  // Animals
  { commonWord: 'cat', intruderWord: 'dog', category: 'animals', difficulty: 'easy' },
  { commonWord: 'elephant', intruderWord: 'giraffe', category: 'animals', difficulty: 'easy' },
  { commonWord: 'penguin', intruderWord: 'dolphin', category: 'animals', difficulty: 'medium' },
  { commonWord: 'butterfly', intruderWord: 'dragonfly', category: 'animals', difficulty: 'medium' },
  { commonWord: 'octopus', intruderWord: 'squid', category: 'animals', difficulty: 'hard' },
  
  // Food
  { commonWord: 'pizza', intruderWord: 'burger', category: 'food', difficulty: 'easy' },
  { commonWord: 'apple', intruderWord: 'orange', category: 'food', difficulty: 'easy' },
  { commonWord: 'sushi', intruderWord: 'ramen', category: 'food', difficulty: 'medium' },
  { commonWord: 'croissant', intruderWord: 'bagel', category: 'food', difficulty: 'medium' },
  { commonWord: 'truffle', intruderWord: 'caviar', category: 'food', difficulty: 'hard' },
  
  // Colors
  { commonWord: 'blue', intruderWord: 'green', category: 'colors', difficulty: 'easy' },
  { commonWord: 'red', intruderWord: 'pink', category: 'colors', difficulty: 'easy' },
  { commonWord: 'purple', intruderWord: 'violet', category: 'colors', difficulty: 'medium' },
  { commonWord: 'turquoise', intruderWord: 'teal', category: 'colors', difficulty: 'medium' },
  { commonWord: 'magenta', intruderWord: 'fuchsia', category: 'colors', difficulty: 'hard' },
  
  // Emotions
  { commonWord: 'happy', intruderWord: 'sad', category: 'emotions', difficulty: 'easy' },
  { commonWord: 'angry', intruderWord: 'furious', category: 'emotions', difficulty: 'medium' },
  { commonWord: 'excited', intruderWord: 'thrilled', category: 'emotions', difficulty: 'medium' },
  { commonWord: 'anxious', intruderWord: 'worried', category: 'emotions', difficulty: 'hard' },
  { commonWord: 'ecstatic', intruderWord: 'elated', category: 'emotions', difficulty: 'hard' },
  
  // Objects
  { commonWord: 'chair', intruderWord: 'table', category: 'objects', difficulty: 'easy' },
  { commonWord: 'phone', intruderWord: 'computer', category: 'objects', difficulty: 'easy' },
  { commonWord: 'lamp', intruderWord: 'candle', category: 'objects', difficulty: 'medium' },
  { commonWord: 'mirror', intruderWord: 'window', category: 'objects', difficulty: 'medium' },
  { commonWord: 'sculpture', intruderWord: 'painting', category: 'objects', difficulty: 'hard' },
  
  // Nature
  { commonWord: 'tree', intruderWord: 'flower', category: 'nature', difficulty: 'easy' },
  { commonWord: 'mountain', intruderWord: 'hill', category: 'nature', difficulty: 'easy' },
  { commonWord: 'ocean', intruderWord: 'lake', category: 'nature', difficulty: 'medium' },
  { commonWord: 'forest', intruderWord: 'jungle', category: 'nature', difficulty: 'medium' },
  { commonWord: 'volcano', intruderWord: 'geyser', category: 'nature', difficulty: 'hard' },
  
  // Sports
  { commonWord: 'soccer', intruderWord: 'football', category: 'sports', difficulty: 'easy' },
  { commonWord: 'basketball', intruderWord: 'volleyball', category: 'sports', difficulty: 'easy' },
  { commonWord: 'tennis', intruderWord: 'badminton', category: 'sports', difficulty: 'medium' },
  { commonWord: 'swimming', intruderWord: 'diving', category: 'sports', difficulty: 'medium' },
  { commonWord: 'curling', intruderWord: 'bobsled', category: 'sports', difficulty: 'hard' },
  
  // Professions
  { commonWord: 'doctor', intruderWord: 'nurse', category: 'professions', difficulty: 'easy' },
  { commonWord: 'teacher', intruderWord: 'professor', category: 'professions', difficulty: 'medium' },
  { commonWord: 'chef', intruderWord: 'baker', category: 'professions', difficulty: 'medium' },
  { commonWord: 'architect', intruderWord: 'engineer', category: 'professions', difficulty: 'hard' },
  { commonWord: 'astronaut', intruderWord: 'pilot', category: 'professions', difficulty: 'hard' },
  
  // Places
  { commonWord: 'restaurant', intruderWord: 'cafe', category: 'places', difficulty: 'easy' },
  { commonWord: 'school', intruderWord: 'university', category: 'places', difficulty: 'medium' },
  { commonWord: 'museum', intruderWord: 'gallery', category: 'places', difficulty: 'medium' },
  { commonWord: 'library', intruderWord: 'bookstore', category: 'places', difficulty: 'medium' },
  { commonWord: 'castle', intruderWord: 'palace', category: 'places', difficulty: 'hard' },
  
  // Activities
  { commonWord: 'reading', intruderWord: 'writing', category: 'activities', difficulty: 'easy' },
  { commonWord: 'cooking', intruderWord: 'baking', category: 'activities', difficulty: 'medium' },
  { commonWord: 'dancing', intruderWord: 'singing', category: 'activities', difficulty: 'medium' },
  { commonWord: 'painting', intruderWord: 'drawing', category: 'activities', difficulty: 'medium' },
  { commonWord: 'meditation', intruderWord: 'yoga', category: 'activities', difficulty: 'hard' }
];

async function seedWords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkroom');
    console.log('Connected to MongoDB');

    // Clear existing word pairs
    await WordPair.deleteMany({});
    console.log('Cleared existing word pairs');

    // Insert new word pairs
    const result = await WordPair.insertMany(wordPairs);
    console.log(`Successfully seeded ${result.length} word pairs`);

    // Log some statistics
    const easyCount = await WordPair.countDocuments({ difficulty: 'easy' });
    const mediumCount = await WordPair.countDocuments({ difficulty: 'medium' });
    const hardCount = await WordPair.countDocuments({ difficulty: 'hard' });

    console.log('\nWord pairs by difficulty:');
    console.log(`Easy: ${easyCount}`);
    console.log(`Medium: ${mediumCount}`);
    console.log(`Hard: ${hardCount}`);

    // Log by category
    const categories = ['animals', 'food', 'colors', 'emotions', 'objects', 'nature', 'sports', 'professions', 'places', 'activities'];
    console.log('\nWord pairs by category:');
    for (const category of categories) {
      const count = await WordPair.countDocuments({ category });
      console.log(`${category}: ${count}`);
    }

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding words:', error);
    process.exit(1);
  }
}

// Run the seed function
seedWords(); 