const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: function() { return this.authType === 'manual'; },
    trim: true,
    maxlength: 100,
    default: function() { 
      return this.authType !== 'manual' ? `User_${Date.now()}` : undefined;
    }
  },
  email: {
    type: String,
    required: function() { return this.authType === 'manual'; },
    unique: true,
    sparse: true, // Allow multiple null values
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() { return this.authType === 'manual'; },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // Authentication Type
  authType: {
    type: String,
    enum: ['manual', 'google', 'apple', 'facebook', 'twitter', 'linkedin'],
    default: 'manual'
  },
  
  // Social Media Profiles
  socialProfiles: {
    google: {
      id: String,
      email: String,
      name: String,
      picture: String
    },
    apple: {
      id: String,
      email: String,
      name: String
    },
    facebook: {
      id: String,
      email: String,
      name: String,
      picture: String
    },
    twitter: {
      id: String,
      username: String,
      name: String,
      picture: String
    },
    linkedin: {
      id: String,
      email: String,
      name: String,
      picture: String
    }
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  
  // Account Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  
  // Verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Game Statistics
  gameStats: {
    totalGames: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    intruderCount: {
      type: Number,
      default: 0
    },
    correctGuesses: {
      type: Number,
      default: 0
    },
    fooledEveryoneCount: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    bestScore: {
      type: Number,
      default: 0
    },
    lastGameAt: Date
  },
  
  // Timestamps
  lastLoginAt: Date,
  lastSeenAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
// Email index is already created by unique: true
userSchema.index({ 'socialProfiles.google.id': 1 });
userSchema.index({ 'socialProfiles.apple.id': 1 });
userSchema.index({ 'socialProfiles.facebook.id': 1 });
userSchema.index({ 'socialProfiles.twitter.id': 1 });
userSchema.index({ 'socialProfiles.linkedin.id': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

// Static method to find user by social profile
userSchema.statics.findBySocialId = function(provider, socialId) {
  const query = {};
  query[`socialProfiles.${provider}.id`] = socialId;
  return this.findOne(query);
};

// Static method to find or create user by social profile
userSchema.statics.findOrCreateBySocialProfile = async function(provider, profile) {
  let user = await this.findBySocialId(provider, profile.id);
  
  if (!user) {
    // Handle empty/null email and name
    const email = profile.email || `temp_${profile.id}@${provider}.temp`;
    const name = profile.name || `User_${profile.id}`;
    
    // Create new user with social profile
    const userData = {
      email: email,
      authType: provider,
      isEmailVerified: true,
      fullName: name,
      socialProfiles: {
        [provider]: {
          id: profile.id,
          email: email,
          name: name,
          picture: profile.picture || profile.avatar_url
        }
      }
    };
    
    // Add username for Twitter
    if (provider === 'twitter' && profile.username) {
      userData.socialProfiles.twitter.username = profile.username;
    }
    
    user = new this(userData);
    await user.save();
  } else {
    // Update existing user's social profile data if needed
    const updateData = {};
    
    if (profile.email && profile.email !== user.socialProfiles[provider]?.email) {
      updateData[`socialProfiles.${provider}.email`] = profile.email;
      if (!user.email || user.email.includes('temp_')) {
        updateData.email = profile.email;
      }
    }
    
    if (profile.name && profile.name !== user.socialProfiles[provider]?.name) {
      updateData[`socialProfiles.${provider}.name`] = profile.name;
      if (!user.fullName || user.fullName.includes('User_')) {
        updateData.fullName = profile.name;
      }
    }
    
    if (profile.picture && profile.picture !== user.socialProfiles[provider]?.picture) {
      updateData[`socialProfiles.${provider}.picture`] = profile.picture;
    }
    
    if (Object.keys(updateData).length > 0) {
      await this.findByIdAndUpdate(user._id, updateData);
      user = await this.findById(user._id);
    }
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema); 