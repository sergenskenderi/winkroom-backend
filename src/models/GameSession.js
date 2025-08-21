const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  // Game Reference
  gameId: {
    type: String,
    required: true,
    lowercase: true
  },
  gameName: {
    type: String,
    required: true
  },
  
  // Session Information
  sessionName: {
    type: String,
    required: true
  },
  lobbyCode: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['lobby', 'playing', 'paused', 'finished', 'cancelled'],
    default: 'lobby'
  },
  
  // Host Information
  hostUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Players
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isReady: {
      type: Boolean,
      default: false
    },
    isHost: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    leftAt: Date,
    score: {
      type: Number,
      default: 0
    },
    // Game-specific player data
    gameData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Game Settings (merged from registry defaults + custom settings)
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Game Progress
  currentRound: {
    type: Number,
    default: 0
  },
  totalRounds: {
    type: Number,
    required: true
  },
  
  // Rounds Data (game-specific structure)
  rounds: [{
    roundNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'paused', 'finished'],
      default: 'waiting'
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // in seconds
    
    // Game-specific round data
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Player actions in this round
    actions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      actionType: String,
      actionData: mongoose.Schema.Types.Mixed,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Round results
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Game State (current state of the game)
  gameState: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Game Statistics
  statistics: {
    totalPlayTime: {
      type: Number,
      default: 0 // in seconds
    },
    averageRoundTime: {
      type: Number,
      default: 0
    },
    totalActions: {
      type: Number,
      default: 0
    }
  },
  
  // Session Metadata
  isPrivate: {
    type: Boolean,
    default: false
  },
  maxPlayers: {
    type: Number,
    required: true
  },
  minPlayers: {
    type: Number,
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  endedAt: Date,
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
// lobbyCode index is already created by unique: true
gameSessionSchema.index({ gameId: 1 });
gameSessionSchema.index({ status: 1 });
gameSessionSchema.index({ hostUserId: 1 });
gameSessionSchema.index({ 'players.userId': 1 });
gameSessionSchema.index({ createdAt: -1 });
gameSessionSchema.index({ lastActivityAt: -1 });

// Generate unique lobby code
gameSessionSchema.statics.generateLobbyCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (this.findOne({ lobbyCode: code }));
  return code;
};

// Check if session can start
gameSessionSchema.methods.canStart = function() {
  const activePlayers = this.players.filter(p => p.isActive && p.isReady);
  return activePlayers.length >= this.minPlayers && 
         activePlayers.length <= this.maxPlayers &&
         this.status === 'lobby';
};

// Get current round
gameSessionSchema.methods.getCurrentRound = function() {
  return this.rounds[this.currentRound];
};

// Add player to session
gameSessionSchema.methods.addPlayer = function(userId, username) {
  // Check if player already exists
  const existingPlayer = this.players.find(p => p.userId.equals(userId));
  if (existingPlayer) {
    if (!existingPlayer.isActive) {
      // Reactivate player
      existingPlayer.isActive = true;
      existingPlayer.leftAt = null;
      return existingPlayer;
    }
    throw new Error('Player already in session');
  }
  
  // Check if session is full
  const activePlayers = this.players.filter(p => p.isActive);
  if (activePlayers.length >= this.maxPlayers) {
    throw new Error('Session is full');
  }
  
  // Add new player
  const player = {
    userId,
    username,
    joinedAt: new Date(),
    isReady: false,
    isHost: false,
    isActive: true,
    score: 0,
    gameData: {}
  };
  
  this.players.push(player);
  this.lastActivityAt = new Date();
  
  return player;
};

// Remove player from session
gameSessionSchema.methods.removePlayer = function(userId) {
  const playerIndex = this.players.findIndex(p => p.userId.equals(userId));
  if (playerIndex === -1) {
    throw new Error('Player not in session');
  }
  
  const player = this.players[playerIndex];
  player.isActive = false;
  player.leftAt = new Date();
  
  // If host left, assign new host
  if (player.isHost) {
    const activePlayers = this.players.filter(p => p.isActive);
    if (activePlayers.length > 0) {
      activePlayers[0].isHost = true;
      this.hostUserId = activePlayers[0].userId;
    }
  }
  
  this.lastActivityAt = new Date();
  
  // If no active players left, end session
  const activePlayers = this.players.filter(p => p.isActive);
  if (activePlayers.length === 0) {
    this.status = 'cancelled';
    this.endedAt = new Date();
  }
  
  return player;
};

// Toggle player ready status
gameSessionSchema.methods.togglePlayerReady = function(userId) {
  const player = this.players.find(p => p.userId.equals(userId) && p.isActive);
  if (!player) {
    throw new Error('Player not found or not active');
  }
  
  player.isReady = !player.isReady;
  this.lastActivityAt = new Date();
  
  return player;
};

// Start the session
gameSessionSchema.methods.start = function() {
  if (!this.canStart()) {
    throw new Error('Session cannot start');
  }
  
  this.status = 'playing';
  this.startedAt = new Date();
  this.currentRound = 0;
  this.lastActivityAt = new Date();
  
  // Initialize first round
  this.rounds.push({
    roundNumber: 1,
    status: 'waiting',
    startTime: new Date(),
    data: {},
    actions: [],
    results: {}
  });
  
  return this;
};

// Add action to current round
gameSessionSchema.methods.addAction = function(userId, actionType, actionData) {
  const currentRound = this.getCurrentRound();
  if (!currentRound) {
    throw new Error('No active round');
  }
  
  const action = {
    userId,
    actionType,
    actionData,
    timestamp: new Date()
  };
  
  currentRound.actions.push(action);
  this.statistics.totalActions++;
  this.lastActivityAt = new Date();
  
  return action;
};

// Update game state
gameSessionSchema.methods.updateGameState = function(newState) {
  this.gameState = { ...this.gameState, ...newState };
  this.lastActivityAt = new Date();
  return this.gameState;
};

// Finish the session
gameSessionSchema.methods.finish = function() {
  this.status = 'finished';
  this.endedAt = new Date();
  this.lastActivityAt = new Date();
  
  // Calculate final statistics
  if (this.startedAt && this.endedAt) {
    this.statistics.totalPlayTime = Math.floor((this.endedAt - this.startedAt) / 1000);
    
    const finishedRounds = this.rounds.filter(r => r.endTime);
    if (finishedRounds.length > 0) {
      const totalRoundTime = finishedRounds.reduce((sum, round) => {
        return sum + (round.endTime - round.startTime) / 1000;
      }, 0);
      this.statistics.averageRoundTime = Math.floor(totalRoundTime / finishedRounds.length);
    }
  }
  
  return this;
};

// Get session summary
gameSessionSchema.methods.getSummary = function() {
  const activePlayers = this.players.filter(p => p.isActive);
  const finishedRounds = this.rounds.filter(r => r.status === 'finished');
  
  return {
    sessionId: this._id,
    gameId: this.gameId,
    gameName: this.gameName,
    sessionName: this.sessionName,
    lobbyCode: this.lobbyCode,
    status: this.status,
    hostUserId: this.hostUserId,
    playerCount: activePlayers.length,
    maxPlayers: this.maxPlayers,
    currentRound: this.currentRound,
    totalRounds: this.totalRounds,
    finishedRounds: finishedRounds.length,
    createdAt: this.createdAt,
    startedAt: this.startedAt,
    endedAt: this.endedAt,
    totalPlayTime: this.statistics.totalPlayTime,
    totalActions: this.statistics.totalActions
  };
};

// Get public sessions
gameSessionSchema.statics.getPublicSessions = function() {
  return this.find({
    status: 'lobby',
    isPrivate: false
  })
  .select('lobbyCode sessionName gameId gameName players.length maxPlayers createdAt')
  .sort({ createdAt: -1 });
};

module.exports = mongoose.model('GameSession', gameSessionSchema); 