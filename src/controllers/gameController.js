const gameService = require('../services/gameService');
const User = require('../models/User');
const GameSession = require('../models/GameSession');
const WordPair = require('../models/WordPair');

class GameController {
  async getWordPairs(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const locale = (req.query.locale || 'en').toLowerCase();
      let pairs = await WordPair.getRandomPairs(limit, null, null, locale);
      if (pairs.length === 0 && locale !== 'en') {
        pairs = await WordPair.getRandomPairs(limit, null, null, 'en');
      }
      const capitalize = (s) => (s && s[0].toUpperCase() + s.slice(1).toLowerCase()) || s;
      res.json({
        message: 'Word pairs retrieved successfully',
        data: pairs.map(p => ({
          id: p._id.toString(),
          normal: capitalize(p.commonWord),
          imposter: capitalize(p.intruderWord)
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async reportWordPairUsage(req, res) {
    try {
      const { usages } = req.body;
      if (!Array.isArray(usages) || usages.length === 0) {
        return res.status(400).json({ error: 'usages array is required' });
      }
      for (const { pairId, rating } of usages) {
        if (!pairId) continue;
        const pair = await WordPair.findById(pairId);
        if (!pair) continue;
        if (rating != null && typeof rating === 'number' && rating >= 0 && rating <= 5) {
          await pair.updateRating(rating);
        } else {
          await pair.incrementUsage();
        }
      }
      res.json({ message: 'Word pair usage updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAvailableGames(req, res) {
    try {
      const games = await gameService.getAvailableGames();

      res.json({
        message: 'Available games retrieved successfully',
        data: { games }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get game configuration
  async getGameConfig(req, res) {
    try {
      const { gameId } = req.params;
      const gameConfig = await gameService.getGameById(gameId);

      if (!gameConfig) {
        return res.status(404).json({
          error: 'Game not found'
        });
      }

      res.json({
        message: 'Game configuration retrieved successfully',
        data: { gameConfig }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new game session
  async createSession(req, res) {
    try {
      const { gameId, sessionName, settings } = req.body;
      const userId = req.user._id;

      if (!gameId) {
        return res.status(400).json({
          error: 'Game ID is required'
        });
      }

      if (!sessionName) {
        return res.status(400).json({
          error: 'Session name is required'
        });
      }

      const session = await gameService.createSession(userId, gameId, sessionName, settings);

      res.status(201).json({
        message: 'Session created successfully',
        data: {
          sessionId: session._id,
          lobbyCode: session.lobbyCode,
          session
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Join a game session
  async joinSession(req, res) {
    try {
      const { lobbyCode } = req.body;
      const userId = req.user._id;

      if (!lobbyCode) {
        return res.status(400).json({
          error: 'Lobby code is required'
        });
      }

      const session = await gameService.joinSession(lobbyCode, userId);

      res.json({
        message: 'Joined session successfully',
        data: {
          sessionId: session._id,
          lobbyCode: session.lobbyCode,
          session
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Leave a game session
  async leaveSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const session = await gameService.leaveSession(sessionId, userId);

      if (!session) {
        res.json({
          message: 'Left session and session deleted',
          data: { sessionId }
        });
      } else {
        res.json({
          message: 'Left session successfully',
          data: { session }
        });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Toggle player ready status
  async toggleReady(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const session = await gameService.toggleReady(sessionId, userId);

      res.json({
        message: 'Ready status updated',
        data: { session }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Start the game session (host only)
  async startSession(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await gameService.startSession(sessionId);

      res.json({
        message: 'Session started successfully',
        data: { session }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Submit a game action
  async submitAction(req, res) {
    try {
      const { sessionId } = req.params;
      const { actionType, actionData } = req.body;
      const userId = req.user._id;

      if (!actionType) {
        return res.status(400).json({
          error: 'Action type is required'
        });
      }

      if (!actionData) {
        return res.status(400).json({
          error: 'Action data is required'
        });
      }

      const session = await gameService.submitAction(sessionId, userId, actionType, actionData);

      res.json({
        message: 'Action submitted successfully',
        data: { session }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get session state for current player
  async getSessionState(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const gameState = await gameService.getPlayerGameState(sessionId, userId);

      res.json({
        message: 'Session state retrieved successfully',
        data: { gameState }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get public sessions
  async getPublicSessions(req, res) {
    try {
      const sessions = await gameService.getPublicSessions();

      res.json({
        message: 'Public sessions retrieved successfully',
        data: { sessions }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get session by ID
  async getSessionById(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await gameService.getSessionById(sessionId);

      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }

      res.json({
        message: 'Session retrieved successfully',
        data: { session }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user's game statistics
  async getUserStats(req, res) {
    try {
      const userId = req.user._id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        message: 'User statistics retrieved successfully',
        data: {
          stats: user.gameStats || {
            totalGames: 0,
            gamesWon: 0,
            totalPoints: 0,
            intruderCount: 0,
            correctGuesses: 0,
            fooledEveryoneCount: 0,
            averageScore: 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get game history for user
  async getGameHistory(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (page - 1) * limit;

      // Find sessions where user participated
      const sessions = await GameSession.find({
        'players.userId': userId,
        status: 'finished'
      })
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('lobbyCode gameId gameName sessionName players rounds currentRound endedAt statistics');

      const total = await GameSession.countDocuments({
        'players.userId': userId,
        status: 'finished'
      });

      res.json({
        message: 'Game history retrieved successfully',
        data: {
          sessions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get leaderboard
  async getLeaderboard(req, res) {
    try {
      const { limit = 20 } = req.query;

      const leaderboard = await User.aggregate([
        {
          $project: {
            fullName: 1,
            email: 1,
            gameStats: 1,
            totalScore: { $ifNull: ['$gameStats.totalPoints', 0] },
            totalGames: { $ifNull: ['$gameStats.totalGames', 0] },
            winRate: {
              $cond: {
                if: { $gt: ['$gameStats.totalGames', 0] },
                then: { $divide: ['$gameStats.gamesWon', '$gameStats.totalGames'] },
                else: 0
              }
            }
          }
        },
        {
          $match: {
            totalGames: { $gt: 0 }
          }
        },
        {
          $sort: {
            totalScore: -1,
            winRate: -1,
            totalGames: -1
          }
        },
        {
          $limit: parseInt(limit)
        }
      ]);

      res.json({
        message: 'Leaderboard retrieved successfully',
        data: { leaderboard }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new GameController(); 