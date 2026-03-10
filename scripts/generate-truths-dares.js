const fs = require('fs');
const path = require('path');

const categories = ['general', 'funny', 'risky', 'challenge', 'friendship'];

const newTruths = [
  { text: 'What is the last thing you searched for online?', category: 'general' },
  { text: 'Have you ever had a fake ID?', category: 'risky' },
  { text: 'What is your go-to karaoke song?', category: 'funny' },
  { text: 'Have you ever been caught picking your nose?', category: 'funny' },
  { text: 'What is the weirdest food combination you enjoy?', category: 'general' },
  { text: 'Have you ever cried at a movie?', category: 'friendship' },
  { text: 'What is your most used excuse for being late?', category: 'general' },
  { text: 'Have you ever had a wardrobe malfunction in public?', category: 'funny' },
  { text: 'What is the last thing you bought that you regret?', category: 'general' },
  { text: 'Have you ever had a crush on a cartoon character?', category: 'funny' },
  { text: 'What is your biggest fear about relationships?', category: 'general' },
  { text: 'Have you ever snooped through someone else\'s phone?', category: 'risky' },
  { text: 'What is the most embarrassing thing in your room?', category: 'funny' },
  { text: 'Have you ever pretended to read a book you never finished?', category: 'funny' },
  { text: 'What is your secret hobby?', category: 'general' },
  { text: 'Have you ever been caught singing in the shower?', category: 'funny' },
  { text: 'What is the worst haircut you have ever had?', category: 'funny' },
  { text: 'Have you ever had a crush on a coworker?', category: 'risky' },
  { text: 'What is something you are weirdly good at?', category: 'general' },
  { text: 'Have you ever blamed a sibling for something you did?', category: 'friendship' },
  { text: 'What is your most embarrassing moment from childhood?', category: 'funny' },
  { text: 'Have you ever sent a text to the wrong person?', category: 'risky' },
  { text: 'What is the strangest compliment you have received?', category: 'general' },
  { text: 'Have you ever had a dream that felt too real?', category: 'general' },
  { text: 'What is your guilty pleasure snack?', category: 'general' },
  { text: 'Have you ever been caught in a white lie?', category: 'funny' },
  { text: 'What is the worst fashion phase you went through?', category: 'funny' },
  { text: 'Have you ever had a near-miss while driving?', category: 'risky' },
  { text: 'What is something you would never admit in person?', category: 'challenge' },
  { text: 'Have you ever had a crush on a friend\'s ex?', category: 'risky' },
  { text: 'What is your most embarrassing autocorrect fail?', category: 'funny' },
  { text: 'Have you ever pretended to be on a call to avoid someone?', category: 'funny' },
  { text: 'What is the worst present you have ever given?', category: 'general' },
  { text: 'Have you ever been caught doing something embarrassing?', category: 'funny' },
  { text: 'What is your biggest fear about getting older?', category: 'general' },
  { text: 'Have you ever had a secret handshake with someone?', category: 'friendship' },
  { text: 'What is the most childish thing you still find funny?', category: 'funny' },
  { text: 'Have you ever lied about your age?', category: 'risky' },
  { text: 'What is the worst advice you have ever followed?', category: 'general' },
  { text: 'Have you ever had a crush on someone you just met?', category: 'friendship' },
  { text: 'What is your most embarrassing moment from a party?', category: 'funny' },
  { text: 'Have you ever been caught talking in your sleep?', category: 'funny' },
  { text: 'What is the weirdest thing you have ever eaten?', category: 'general' },
  { text: 'Have you ever had a friendship that started with a lie?', category: 'risky' },
  { text: 'What is your biggest fear about being judged?', category: 'general' },
  { text: 'Have you ever pretended to like a song to fit in?', category: 'funny' },
  { text: 'What is the most embarrassing thing you have said out loud?', category: 'funny' },
  { text: 'Have you ever had a secret code with a friend?', category: 'friendship' },
  { text: 'What is the worst date idea you have ever had?', category: 'general' },
  { text: 'Have you ever been caught dancing when you thought no one was watching?', category: 'funny' },
];

// Export for use - we need 410 truths total, so 410 - 50 = 360 more. This script will just output.
// Actually we need to generate all 410 in the script. Let me build a longer list in the script
// and then run it to append to the file. I'll do the file edit in chunks via search_replace.

// For now output first 50 as sample - we need to generate 410 programmatically with more variety.
let out = newTruths.map(t => `  { text: '${t.text.replace(/'/g, "\\'")}', category: '${t.category}' },`).join('\n');
console.log('TRUTHS_BLOCK_START');
console.log(out);
console.log('TRUTHS_BLOCK_END');
