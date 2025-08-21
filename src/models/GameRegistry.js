const mongoose = require('mongoose');

const gameRegistrySchema = new mongoose.Schema({
  // Game Information
  gameId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['word', 'drawing', 'story', 'puzzle', 'social'],
    required: true
  },
  
  // Game Requirements
  minPlayers: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },
  defaultRounds: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  
  // Game Settings Schema (defines what settings this game accepts)
  settingsSchema: {
    type: Map,
    of: {
      type: {
        type: String,
        enum: ['number', 'boolean', 'string', 'select'],
        required: true
      },
      default: mongoose.Schema.Types.Mixed,
      min: Number,
      max: Number,
      options: [String], // For select type
      required: Boolean,
      description: String
    }
  },
  
  // Default Settings Values
  defaultSettings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Game Rules and Instructions
  rules: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  
  // Game Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Game Metadata
  version: {
    type: String,
    default: '1.0.0'
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  
  // Game Assets
  icon: String,
  thumbnail: String,
  color: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
// gameId index is already created by unique: true
gameRegistrySchema.index({ isActive: 1 });
gameRegistrySchema.index({ category: 1 });
gameRegistrySchema.index({ isPublic: 1 });

// Get all active games
gameRegistrySchema.statics.getActiveGames = function() {
  return this.find({ isActive: true, isPublic: true })
    .select('gameId name description category minPlayers maxPlayers defaultRounds difficulty estimatedDuration icon thumbnail color tags')
    .sort({ name: 1 });
};

// Get game by ID
gameRegistrySchema.statics.getGameById = function(gameId) {
  return this.findOne({ gameId: gameId.toLowerCase(), isActive: true });
};

// Validate settings against schema
gameRegistrySchema.methods.validateSettings = function(settings) {
  const errors = [];
  
  for (const [key, value] of Object.entries(settings)) {
    const schemaField = this.settingsSchema.get(key);
    
    if (!schemaField) {
      errors.push(`Unknown setting: ${key}`);
      continue;
    }
    
    // Type validation
    switch (schemaField.type) {
      case 'number':
        if (typeof value !== 'number') {
          errors.push(`${key} must be a number`);
        } else if (schemaField.min !== undefined && value < schemaField.min) {
          errors.push(`${key} must be at least ${schemaField.min}`);
        } else if (schemaField.max !== undefined && value > schemaField.max) {
          errors.push(`${key} must be at most ${schemaField.max}`);
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
        }
        break;
        
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${key} must be a string`);
        }
        break;
        
      case 'select':
        if (!schemaField.options.includes(value)) {
          errors.push(`${key} must be one of: ${schemaField.options.join(', ')}`);
        }
        break;
    }
  }
  
  // Check required fields
  for (const [key, schemaField] of this.settingsSchema) {
    if (schemaField.required && !(key in settings)) {
      errors.push(`Required setting missing: ${key}`);
    }
  }
  
  return errors;
};

// Get merged settings (defaults + provided)
gameRegistrySchema.methods.getMergedSettings = function(providedSettings = {}) {
  const merged = {};
  
  // Start with defaults
  for (const [key, value] of this.defaultSettings) {
    merged[key] = value;
  }
  
  // Override with provided settings
  Object.assign(merged, providedSettings);
  
  return merged;
};

module.exports = mongoose.model('GameRegistry', gameRegistrySchema); 