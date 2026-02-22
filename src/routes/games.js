const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     GameRegistry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         gameId:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [word, drawing, story, puzzle, social]
 *         minPlayers:
 *           type: number
 *         maxPlayers:
 *           type: number
 *         defaultRounds:
 *           type: number
 *         estimatedDuration:
 *           type: number
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *         settingsSchema:
 *           type: object
 *         defaultSettings:
 *           type: object
 *     
 *     GameSession:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         gameId:
 *           type: string
 *         gameName:
 *           type: string
 *         sessionName:
 *           type: string
 *         lobbyCode:
 *           type: string
 *         status:
 *           type: string
 *           enum: [lobby, playing, paused, finished, cancelled]
 *         hostUserId:
 *           type: string
 *         players:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               username:
 *                 type: string
 *               isHost:
 *                 type: boolean
 *               isReady:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               score:
 *                 type: number
 *         currentRound:
 *           type: number
 *         totalRounds:
 *           type: number
 *         settings:
 *           type: object
 *         gameState:
 *           type: object
 *     
 *     GameStats:
 *       type: object
 *       properties:
 *         totalGames:
 *           type: number
 *         gamesWon:
 *           type: number
 *         totalPoints:
 *           number
 *         intruderCount:
 *           type: number
 *         correctGuesses:
 *           type: number
 *         fooledEveryoneCount:
 *           type: number
 *         averageScore:
 *           type: number
 *         bestScore:
 *           type: number
 *         lastGameAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateSessionRequest:
 *       type: object
 *       required:
 *         - gameId
 *         - sessionName
 *       properties:
 *         gameId:
 *           type: string
 *           description: ID of the game from registry
 *         sessionName:
 *           type: string
 *           description: Name for the session
 *         settings:
 *           type: object
 *           description: Custom settings to override defaults
 *     
 *     JoinSessionRequest:
 *       type: object
 *       required:
 *         - lobbyCode
 *       properties:
 *         lobbyCode:
 *           type: string
 *           description: Lobby code to join
 *     
 *     SubmitActionRequest:
 *       type: object
 *       required:
 *         - actionType
 *         - actionData
 *       properties:
 *         actionType:
 *           type: string
 *           description: Type of action (e.g., 'submit_clue', 'submit_vote', 'submit_word')
 *         actionData:
 *           type: object
 *           description: Data for the action
 */

/**
 * @swagger
 * tags:
 *   name: Games
 *   description: Game management and gameplay endpoints
 */

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Get available games
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     games:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GameRegistry'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, gameController.getAvailableGames);

router.get('/words/pairs', gameController.getWordPairs);
router.post('/words/pairs/usage', gameController.reportWordPairUsage);
router.get('/charades/words', gameController.getCharadesWords);

/**
 * @swagger
 * /api/games/{gameId}/config:
 *   get:
 *     summary: Get game configuration
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     gameConfig:
 *                       $ref: '#/components/schemas/GameRegistry'
 *       404:
 *         description: Game not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:gameId/config', authenticate, gameController.getGameConfig);

/**
 * @swagger
 * /api/games/sessions:
 *   post:
 *     summary: Create a new game session
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSessionRequest'
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     lobbyCode:
 *                       type: string
 *                     session:
 *                       $ref: '#/components/schemas/GameSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/sessions', authenticate, gameController.createSession);

/**
 * @swagger
 * /api/games/sessions/join:
 *   post:
 *     summary: Join a game session
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinSessionRequest'
 *     responses:
 *       200:
 *         description: Joined session successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     lobbyCode:
 *                       type: string
 *                     session:
 *                       $ref: '#/components/schemas/GameSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/sessions/join', authenticate, gameController.joinSession);

/**
 * @swagger
 * /api/games/sessions:
 *   get:
 *     summary: Get public sessions
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lobbyCode:
 *                             type: string
 *                           sessionName:
 *                             type: string
 *                           gameId:
 *                             type: string
 *                           gameName:
 *                             type: string
 *                           players:
 *                             type: number
 *                           maxPlayers:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions', authenticate, gameController.getPublicSessions);

/**
 * @swagger
 * /api/games/sessions/{sessionId}:
 *   get:
 *     summary: Get session by ID
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/GameSession'
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions/:sessionId', authenticate, gameController.getSessionById);

/**
 * @swagger
 * /api/games/sessions/{sessionId}/leave:
 *   delete:
 *     summary: Leave a game session
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Left session successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.delete('/sessions/:sessionId/leave', authenticate, gameController.leaveSession);

/**
 * @swagger
 * /api/games/sessions/{sessionId}/ready:
 *   post:
 *     summary: Toggle player ready status
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Ready status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/GameSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/sessions/:sessionId/ready', authenticate, gameController.toggleReady);

/**
 * @swagger
 * /api/games/sessions/{sessionId}/start:
 *   post:
 *     summary: Start the game session (host only)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/GameSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/sessions/:sessionId/start', authenticate, gameController.startSession);

/**
 * @swagger
 * /api/games/sessions/{sessionId}/action:
 *   post:
 *     summary: Submit a game action
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitActionRequest'
 *     responses:
 *       200:
 *         description: Action submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       $ref: '#/components/schemas/GameSession'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/sessions/:sessionId/action', authenticate, gameController.submitAction);

/**
 * @swagger
 * /api/games/sessions/{sessionId}/state:
 *   get:
 *     summary: Get session state for current player
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session state retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     gameState:
 *                       type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions/:sessionId/state', authenticate, gameController.getSessionState);

/**
 * @swagger
 * /api/games/stats:
 *   get:
 *     summary: Get user's game statistics
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       $ref: '#/components/schemas/GameStats'
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticate, gameController.getUserStats);

/**
 * @swagger
 * /api/games/history:
 *   get:
 *     summary: Get game history for user
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Game history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GameSession'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/history', authenticate, gameController.getGameHistory);

/**
 * @swagger
 * /api/games/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of players to return
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fullName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           totalScore:
 *                             type: number
 *                           totalGames:
 *                             type: number
 *                           winRate:
 *                             type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/leaderboard', authenticate, gameController.getLeaderboard);

module.exports = router; 