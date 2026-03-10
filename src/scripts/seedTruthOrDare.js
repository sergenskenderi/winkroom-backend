const mongoose = require('mongoose');
const TruthOrDare = require('../models/TruthOrDare');
const { getTruthOrDare, SUPPORTED } = require('./truthOrDare');
require('dotenv').config();

async function seedTruthOrDare() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkroom');
    console.log('Connected to MongoDB');

    for (const locale of SUPPORTED) {
      const { truths = [], dares = [] } = getTruthOrDare(locale);
      if (truths.length === 0 && dares.length === 0) {
        console.log(`Skipping locale ${locale}: no data`);
        continue;
      }
      await TruthOrDare.deleteMany({ locale });

      const truthDocs = truths.map((t) => ({
        locale,
        type: 'truth',
        text: (t.text || '').toString().trim(),
        category: t.category || 'general',
      })).filter((t) => t.text.length > 0);

      const dareDocs = dares.map((d) => ({
        locale,
        type: 'dare',
        text: (d.text || '').toString().trim(),
        category: d.category || 'general',
      })).filter((d) => d.text.length > 0);

      await TruthOrDare.insertMany([...truthDocs, ...dareDocs]);
      console.log(`[${locale}] Seeded ${truthDocs.length} truths and ${dareDocs.length} dares`);
    }

    const total = await TruthOrDare.countDocuments({});
    console.log(`Total Truth or Dare items: ${total}`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding truth or dare:', error);
    process.exit(1);
  }
}

seedTruthOrDare();
