const mongoose = require('mongoose');
const GameRegistry = require('../models/GameRegistry');
require('dotenv').config();

const games = [
  {
    gameId: 'one_word_unites',
    name: 'One Word Unites',
    description: 'One word unites the group — but one player is the intruder with a different word. Can you speak in hints without revealing too much? Can you spot the odd one out before it\'s too late?',
    category: 'word',
    minPlayers: 3,
    maxPlayers: 8,
    defaultRounds: 5,
    estimatedDuration: 15,
    difficulty: 'medium',
    tags: ['social deduction', 'word association', 'bluffing'],
    color: '#FF6B6B',
    icon: '🎭',
    thumbnail: '/images/one-word-unites.jpg',
    rules: `🔹 How to Play:
• Each player receives a secret word
• All but one will see the same word — the intruder gets a different one
• In turn, each player gives a single-word clue to hint at their word
• After all clues are revealed, everyone votes on who they think the intruder is

🎯 Scoring:
✅ Guess the intruder correctly? You earn 1 point
😈 Fool everyone as the intruder? You earn 3 points
🤷‍♂️ Got some votes but weren't the intruder? No points

💡 Strategy:
Choose your word carefully — too obvious and you reveal your secret, too vague and you'll look suspicious.

📱 Game Modes:
• Single Device: Pass one phone around the group
• Multi-Device: Each player uses their own device`,
    instructions: `1. Choose your game mode (Single Device or Multi-Device)
2. Wait for all players to join and get ready
3. Each player receives their secret word
4. Take turns giving one-word clues
5. Vote on who you think is the intruder
6. See the results and earn points!`,
    settingsSchema: {
      gameMode: {
        type: 'select',
        default: 'multi_device',
        options: ['single_device', 'multi_device'],
        required: true,
        description: 'Game mode: single device (pass phone around) or multi-device (each player uses own device)'
      },
      clueTimeLimit: {
        type: 'number',
        default: 30,
        min: 10,
        max: 120,
        required: false,
        description: 'Time limit for submitting clues (seconds) - only for multi-device mode'
      },
      votingTimeLimit: {
        type: 'number',
        default: 20,
        min: 10,
        max: 60,
        required: false,
        description: 'Time limit for voting (seconds) - only for multi-device mode'
      },
      autoStart: {
        type: 'boolean',
        default: true,
        required: false,
        description: 'Automatically start when all players are ready'
      },
      difficulty: {
        type: 'select',
        default: 'medium',
        options: ['easy', 'medium', 'hard'],
        required: false,
        description: 'Word difficulty level'
      },
      manualScoring: {
        type: 'boolean',
        default: false,
        required: false,
        description: 'Manual scoring mode (host sets points manually) - only for single device mode'
      },
      autoAssignIntruder: {
        type: 'boolean',
        default: true,
        required: false,
        description: 'Automatically assign intruder randomly'
      },
      showWordButton: {
        type: 'boolean',
        default: true,
        required: false,
        description: 'Show word button for players to reveal their word - only for multi-device mode'
      },
      autoAdvanceClues: {
        type: 'boolean',
        default: true,
        required: false,
        description: 'Automatically advance to next player after clue submission - only for multi-device mode'
      }
    },
    defaultSettings: {
      gameMode: 'multi_device',
      clueTimeLimit: 30,
      votingTimeLimit: 20,
      autoStart: true,
      difficulty: 'medium',
      manualScoring: false,
      autoAssignIntruder: true,
      showWordButton: true,
      autoAdvanceClues: true
    }
  },
  {
    gameId: 'word_association',
    name: 'Word Association',
    description: 'Build creative word chains through associations. Each player adds a word that connects to the previous one, creating an evolving chain of ideas.',
    category: 'word',
    minPlayers: 2,
    maxPlayers: 10,
    defaultRounds: 10,
    estimatedDuration: 20,
    difficulty: 'easy',
    tags: ['creativity', 'word association', 'collaborative'],
    color: '#4ECDC4',
    icon: '🔗',
    thumbnail: '/images/word-association.jpg',
    rules: `🔹 How to Play:
• A starting word is given to the group
• Each player adds one word that associates with the previous word
• Build a chain of connected words
• Be creative and think outside the box!

🎯 Scoring:
• Points based on creativity and relevance
• Earlier words in the chain get bonus points
• Collaborative scoring encourages teamwork

💡 Strategy:
Think of unique connections that others might not see. The more creative your association, the more points you earn!`,
    instructions: `1. A starting word is displayed
2. Each player adds one word to the chain
3. Your word should connect to the previous word
4. Continue until the chain is complete
5. See creativity scores and continue to the next round!`,
    settingsSchema: {
      wordTimeLimit: {
        type: 'number',
        default: 15,
        min: 5,
        max: 30,
        required: true,
        description: 'Time limit for submitting words (seconds)'
      },
      chainLength: {
        type: 'number',
        default: 5,
        min: 3,
        max: 10,
        required: true,
        description: 'Number of words in each chain'
      },
      autoStart: {
        type: 'boolean',
        default: true,
        required: false,
        description: 'Automatically start when all players are ready'
      }
    },
    defaultSettings: {
      wordTimeLimit: 15,
      chainLength: 5,
      autoStart: true
    }
  },
  {
    gameId: 'story_builder',
    name: 'Story Builder',
    description: 'Collaboratively build stories one sentence at a time. Each player contributes to create unique, often hilarious narratives together.',
    category: 'story',
    minPlayers: 3,
    maxPlayers: 8,
    defaultRounds: 3,
    estimatedDuration: 25,
    difficulty: 'medium',
    tags: ['storytelling', 'collaborative', 'creative'],
    color: '#45B7D1',
    icon: '📚',
    thumbnail: '/images/story-builder.jpg',
    rules: `🔹 How to Play:
• A story prompt is given to start
• Each player adds one sentence to continue the story
• Build an engaging narrative together
• Be creative and build on others' ideas!

🎯 Scoring:
• Points for creativity and story flow
• Bonus for connecting well with previous sentences
• Collaborative storytelling encourages teamwork

💡 Strategy:
Read the story carefully and add sentences that flow naturally. Be creative but maintain story coherence!`,
    instructions: `1. A story prompt is displayed
2. Each player adds one sentence to continue
3. Build on the previous sentences
4. Create an engaging narrative together
5. Read the final story and see creativity scores!`,
    settingsSchema: {
      sentenceTimeLimit: {
        type: 'number',
        default: 45,
        min: 20,
        max: 90,
        required: true,
        description: 'Time limit for writing sentences (seconds)'
      },
      storyLength: {
        type: 'number',
        default: 5,
        min: 3,
        max: 8,
        required: true,
        description: 'Number of sentences in each story'
      },
      autoStart: {
        type: 'boolean',
        default: true,
        required: false,
        description: 'Automatically start when all players are ready'
      }
    },
    defaultSettings: {
      sentenceTimeLimit: 45,
      storyLength: 5,
      autoStart: true
    }
  },
  {
    gameId: 'quick_draw',
    name: 'Quick Draw',
    description: 'Fast-paced drawing and guessing game. Draw words while others try to guess what you\'re drawing in real-time.',
    category: 'drawing',
    minPlayers: 2,
    maxPlayers: 6,
    defaultRounds: 8,
    estimatedDuration: 30,
    difficulty: 'hard',
    tags: ['drawing', 'real-time', 'fast-paced'],
    color: '#96CEB4',
    icon: '🎨',
    thumbnail: '/images/quick-draw.jpg',
    rules: `🔹 How to Play:
• Each player gets a word to draw
• Draw the word while others guess in real-time
• Fastest correct guess wins points
• Be quick and creative with your drawings!

🎯 Scoring:
• Points for correct guesses (faster = more points)
• Points for successful drawings (more guesses = more points)
• Speed and accuracy both matter

💡 Strategy:
Draw clearly and quickly. Simple, recognizable shapes work best under time pressure!`,
    instructions: `1. Each player gets a word to draw
2. Start drawing immediately when your turn begins
3. Other players guess in real-time
4. Fastest correct guess wins
5. Continue until all rounds are complete!`,
    settingsSchema: {
      drawTimeLimit: {
        type: 'number',
        default: 60,
        min: 30,
        max: 120,
        required: true,
        description: 'Time limit for drawing (seconds)'
      },
      guessTimeLimit: {
        type: 'number',
        default: 30,
        min: 15,
        max: 60,
        required: true,
        description: 'Time limit for guessing (seconds)'
      },
      autoStart: {
        type: 'boolean',
        default: true,
        required: false,
        description: 'Automatically start when all players are ready'
      }
    },
    defaultSettings: {
      drawTimeLimit: 60,
      guessTimeLimit: 30,
      autoStart: true
    }
  }
];

async function seedGames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing games
    await GameRegistry.deleteMany({});
    console.log('Cleared existing games');

    // Insert new games
    const insertedGames = await GameRegistry.insertMany(games);
    console.log(`Successfully seeded ${insertedGames.length} games:`);
    
    insertedGames.forEach(game => {
      console.log(`- ${game.name} (${game.gameId})`);
    });

    console.log('\nGame registry seeding completed!');
  } catch (error) {
    console.error('Error seeding games:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding
seedGames(); 