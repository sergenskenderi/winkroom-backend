const GameRegistry = require('../models/GameRegistry');
const GameSession = require('../models/GameSession');
const User = require('../models/User');
const WordPair = require('../models/WordPair');

class GameService {
  // Get all available games
  async getAvailableGames() {
    return await GameRegistry.getActiveGames();
  }

  // Get game by ID
  async getGameById(gameId) {
    return await GameRegistry.getGameById(gameId);
  }

  // Create a new game session
  async createSession(hostUserId, gameId, sessionName, customSettings = {}) {
    // Get game configuration from registry
    const gameConfig = await GameRegistry.getGameById(gameId);
    if (!gameConfig) {
      throw new Error(`Game '${gameId}' not found`);
    }

    // Validate custom settings
    const validationErrors = gameConfig.validateSettings(customSettings);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid settings: ${validationErrors.join(', ')}`);
    }

    // Merge settings (defaults + custom)
    const mergedSettings = gameConfig.getMergedSettings(customSettings);

    // Generate lobby code
    const lobbyCode = await GameSession.generateLobbyCode();

    // Create session
    const session = new GameSession({
      gameId: gameConfig.gameId,
      gameName: gameConfig.name,
      sessionName,
      lobbyCode,
      hostUserId,
      maxPlayers: gameConfig.maxPlayers,
      minPlayers: gameConfig.minPlayers,
      totalRounds: mergedSettings.totalRounds || gameConfig.defaultRounds,
      settings: mergedSettings,
      isPrivate: customSettings.isPrivate || false
    });

    // Add host as first player
    const hostUser = await User.findById(hostUserId);
    if (!hostUser) {
      throw new Error('Host user not found');
    }

    session.addPlayer(hostUserId, hostUser.fullName || hostUser.username);
    session.players[0].isHost = true;
    session.players[0].isReady = true;

    await session.save();
    return session;
  }

  // Join a game session
  async joinSession(lobbyCode, userId) {
    const session = await GameSession.findOne({ lobbyCode, status: 'lobby' });
    if (!session) {
      throw new Error('Session not found or already started');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    session.addPlayer(userId, user.fullName || user.username);
    await session.save();

    return session;
  }

  // Leave a game session
  async leaveSession(sessionId, userId) {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.removePlayer(userId);
    await session.save();

    return session;
  }

  // Toggle player ready status
  async toggleReady(sessionId, userId) {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.togglePlayerReady(userId);
    await session.save();

    // Check if session can start
    if (session.canStart() && session.settings.get('autoStart')) {
      await this.startSession(sessionId);
    }

    return session;
  }

  // Start a game session
  async startSession(sessionId) {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.canStart()) {
      throw new Error('Session cannot start yet');
    }

    session.start();
    await session.save();

    // Initialize game-specific logic
    await this.initializeGameLogic(session);

    return session;
  }

  // Initialize game-specific logic based on game type
  async initializeGameLogic(session) {
    switch (session.gameId) {
      case 'one_word_unites':
        await this.initializeOneWordUnites(session);
        break;
      case 'word_association':
        await this.initializeWordAssociation(session);
        break;
      case 'story_builder':
        await this.initializeStoryBuilder(session);
        break;
      case 'quick_draw':
        await this.initializeQuickDraw(session);
        break;
      default:
        throw new Error(`Unknown game type: ${session.gameId}`);
    }
  }

  // Initialize One Word Unites game
  async initializeOneWordUnites(session) {
    const currentRound = session.getCurrentRound();
    if (!currentRound) return;

    const gameMode = session.settings.get('gameMode');
    const autoAssignIntruder = session.settings.get('autoAssignIntruder');

    // Get word pairs for this round
    const wordPairs = await WordPair.getRandomPairs(3);
    const selectedPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];

    // Get active players
    const activePlayers = session.players.filter(p => p.isActive);

    // Assign intruder
    let intruderId;
    if (autoAssignIntruder) {
      const intruderIndex = Math.floor(Math.random() * activePlayers.length);
      intruderId = activePlayers[intruderIndex].userId;
    } else {
      // Host will manually assign intruder later
      intruderId = null;
    }

    // Assign words to players
    const playerWords = activePlayers.map((player, index) => ({
      userId: player.userId,
      word: intruderId && player.userId.equals(intruderId) ? selectedPair.intruderWord : selectedPair.commonWord,
      isIntruder: intruderId ? player.userId.equals(intruderId) : false
    }));

    // Determine who starts giving clues
    const clueStartPlayer = this.determineClueStartPlayer(session);

    // Update round data based on game mode
    const roundData = {
      wordPairs,
      selectedPair: {
        commonWord: selectedPair.commonWord,
        intruderWord: selectedPair.intruderWord
      },
      playerWords,
      intruderId,
      clueStartPlayer,
      phase: gameMode === 'single_device' ? 'word_assignment' : 'word_reveal',
      gameMode
    };

    // Add mode-specific data
    if (gameMode === 'single_device') {
      roundData.singleDeviceData = {
        currentWordReader: null,
        wordReadingOrder: [],
        manualScoring: session.settings.get('manualScoring'),
        hostAssignedPoints: {}
      };
    } else {
      roundData.multiDeviceData = {
        currentClueGiver: clueStartPlayer,
        cluesSubmitted: [],
        votesSubmitted: [],
        showWordButton: session.settings.get('showWordButton'),
        autoAdvanceClues: session.settings.get('autoAdvanceClues')
      };
    }

    // Update round data
    currentRound.data = roundData;
    currentRound.status = 'active';
    currentRound.startTime = new Date();

    // Update game state
    session.updateGameState({
      currentPhase: roundData.phase,
      gameMode,
      wordPairs,
      selectedPair,
      playerWords,
      intruderId,
      clueStartPlayer
    });

    await session.save();

    // Increment usage count for the word pair
    await WordPair.findByIdAndUpdate(selectedPair._id, { $inc: { usageCount: 1 } });
  }

  // Determine who starts giving clues
  determineClueStartPlayer(session) {
    const activePlayers = session.players.filter(p => p.isActive);
    
    // Check if there's a specific setting for clue start player
    const clueStartSetting = session.settings.get('clueStartPlayer');
    if (clueStartSetting) {
      const player = activePlayers.find(p => p.userId.toString() === clueStartSetting);
      if (player) return player.userId;
    }

    // Random selection
    const randomIndex = Math.floor(Math.random() * activePlayers.length);
    return activePlayers[randomIndex].userId;
  }

  // Initialize Word Association game
  async initializeWordAssociation(session) {
    const currentRound = session.getCurrentRound();
    if (!currentRound) return;

    // Get a random starting word
    const startingWords = ['happy', 'blue', 'fast', 'big', 'soft', 'bright', 'quiet', 'warm', 'cold', 'loud'];
    const startingWord = startingWords[Math.floor(Math.random() * startingWords.length)];

    // Update round data
    currentRound.data = {
      startingWord,
      wordChain: [],
      phase: 'word_prompt'
    };

    currentRound.status = 'active';
    currentRound.startTime = new Date();

    // Update game state
    session.updateGameState({
      currentPhase: 'word_prompt',
      startingWord,
      wordChain: []
    });

    await session.save();
  }

  // Initialize Story Builder game
  async initializeStoryBuilder(session) {
    const currentRound = session.getCurrentRound();
    if (!currentRound) return;

    // Get a random story prompt
    const storyPrompts = [
      'A mysterious package arrives at your doorstep...',
      'You discover a hidden door in your house...',
      'A talking animal asks for your help...',
      'You wake up with a superpower...',
      'A time traveler appears in your room...'
    ];
    const storyPrompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)];

    // Update round data
    currentRound.data = {
      storyPrompt,
      story: [storyPrompt],
      currentSentence: 0,
      phase: 'story_building'
    };

    currentRound.status = 'active';
    currentRound.startTime = new Date();

    // Update game state
    session.updateGameState({
      currentPhase: 'story_building',
      storyPrompt,
      story: [storyPrompt],
      currentSentence: 0
    });

    await session.save();
  }

  // Initialize Quick Draw game
  async initializeQuickDraw(session) {
    const currentRound = session.getCurrentRound();
    if (!currentRound) return;

    // Get a random word to draw
    const drawWords = ['cat', 'house', 'tree', 'car', 'sun', 'moon', 'star', 'flower', 'bird', 'fish'];
    const drawWord = drawWords[Math.floor(Math.random() * drawWords.length)];

    // Select current drawer
    const activePlayers = session.players.filter(p => p.isActive);
    const currentDrawerIndex = currentRound.roundNumber % activePlayers.length;
    const currentDrawerId = activePlayers[currentDrawerIndex].userId;

    // Update round data
    currentRound.data = {
      drawWord,
      currentDrawerId,
      guesses: [],
      phase: 'drawing'
    };

    currentRound.status = 'active';
    currentRound.startTime = new Date();

    // Update game state
    session.updateGameState({
      currentPhase: 'drawing',
      drawWord,
      currentDrawerId,
      guesses: []
    });

    await session.save();
  }

  // Submit a game action
  async submitAction(sessionId, userId, actionType, actionData) {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add action to current round
    session.addAction(userId, actionType, actionData);

    // Handle game-specific action logic
    await this.handleGameAction(session, userId, actionType, actionData);

    await session.save();
    return session;
  }

  // Handle game-specific actions
  async handleGameAction(session, userId, actionType, actionData) {
    const currentRound = session.getCurrentRound();
    if (!currentRound) return;

    switch (session.gameId) {
      case 'one_word_unites':
        await this.handleOneWordUnitesAction(session, currentRound, userId, actionType, actionData);
        break;
      case 'word_association':
        await this.handleWordAssociationAction(session, currentRound, userId, actionType, actionData);
        break;
      case 'story_builder':
        await this.handleStoryBuilderAction(session, currentRound, userId, actionType, actionData);
        break;
      case 'quick_draw':
        await this.handleQuickDrawAction(session, currentRound, userId, actionType, actionData);
        break;
    }
  }

  // Handle One Word Unites actions
  async handleOneWordUnitesAction(session, currentRound, userId, actionType, actionData) {
    const gameMode = session.settings.get('gameMode');
    
    if (gameMode === 'single_device') {
      await this.handleSingleDeviceAction(session, currentRound, userId, actionType, actionData);
    } else {
      await this.handleMultiDeviceAction(session, currentRound, userId, actionType, actionData);
    }
  }

  // Handle Single Device Mode actions
  async handleSingleDeviceAction(session, currentRound, userId, actionType, actionData) {
    const activePlayers = session.players.filter(p => p.isActive);
    
    switch (actionType) {
      case 'ready_to_read_word':
        // Player is ready to read their word
        currentRound.data.singleDeviceData.currentWordReader = userId;
        currentRound.data.phase = 'word_reading';
        session.updateGameState({ currentPhase: 'word_reading', currentWordReader: userId });
        break;

      case 'word_read':
        // Player has read their word, move to next player
        const currentReaderIndex = activePlayers.findIndex(p => p.userId.equals(userId));
        const nextReaderIndex = (currentReaderIndex + 1) % activePlayers.length;
        const nextReader = activePlayers[nextReaderIndex];

        if (nextReaderIndex === 0) {
          // All players have read their words, move to clue phase
          currentRound.data.phase = 'clue_gathering';
          currentRound.data.singleDeviceData.currentWordReader = null;
          session.updateGameState({ 
            currentPhase: 'clue_gathering',
            currentClueGiver: currentRound.data.clueStartPlayer
          });
        } else {
          // Move to next player
          currentRound.data.singleDeviceData.currentWordReader = nextReader.userId;
          session.updateGameState({ currentPhase: 'word_reading', currentWordReader: nextReader.userId });
        }
        break;

      case 'submit_clue':
        // Submit clue in single device mode
        if (!currentRound.data.singleDeviceData.clues) {
          currentRound.data.singleDeviceData.clues = [];
        }
        
        currentRound.data.singleDeviceData.clues.push({
          userId,
          clue: actionData.clue.trim(),
          submittedAt: new Date()
        });

        // Move to next clue giver
        const currentClueGiverIndex = activePlayers.findIndex(p => p.userId.equals(currentRound.data.clueStartPlayer));
        const nextClueGiverIndex = (currentClueGiverIndex + 1) % activePlayers.length;
        const nextClueGiver = activePlayers[nextClueGiverIndex];

        if (nextClueGiverIndex === 0) {
          // All clues submitted, move to voting
          currentRound.data.phase = 'voting';
          session.updateGameState({ currentPhase: 'voting' });
        } else {
          // Update next clue giver
          currentRound.data.clueStartPlayer = nextClueGiver.userId;
          session.updateGameState({ currentPhase: 'clue_gathering', currentClueGiver: nextClueGiver.userId });
        }
        break;

      case 'submit_vote':
        // Submit vote in single device mode
        if (!currentRound.data.singleDeviceData.votes) {
          currentRound.data.singleDeviceData.votes = [];
        }
        
        currentRound.data.singleDeviceData.votes.push({
          voterId: userId,
          votedForId: actionData.votedForId,
          submittedAt: new Date()
        });

        // Check if all votes submitted
        if (currentRound.data.singleDeviceData.votes.length === activePlayers.length) {
          currentRound.data.phase = 'manual_scoring';
          session.updateGameState({ currentPhase: 'manual_scoring' });
        }
        break;

      case 'set_manual_points':
        // Host sets manual points for each player
        if (!session.players.find(p => p.userId.equals(userId) && p.isHost)) {
          throw new Error('Only host can set manual points');
        }

        currentRound.data.singleDeviceData.hostAssignedPoints = actionData.points;
        
        // Apply points to players
        Object.entries(actionData.points).forEach(([playerId, points]) => {
          const player = session.players.find(p => p.userId.toString() === playerId);
          if (player) {
            player.score += points;
          }
        });

        currentRound.data.phase = 'results';
        currentRound.status = 'finished';
        currentRound.endTime = new Date();
        session.updateGameState({ currentPhase: 'results' });

        // Check if game is finished
        if (session.currentRound >= session.totalRounds - 1) {
          await this.finishSession(session._id);
        } else {
          // Start next round
          session.currentRound++;
          session.rounds.push({
            roundNumber: session.currentRound + 1,
            status: 'waiting',
            startTime: new Date(),
            data: {},
            actions: [],
            results: {}
          });
          await this.initializeGameLogic(session);
        }
        break;

      case 'assign_intruder':
        // Host manually assigns intruder
        if (!session.players.find(p => p.userId.equals(userId) && p.isHost)) {
          throw new Error('Only host can assign intruder');
        }

        const intruderId = actionData.intruderId;
        currentRound.data.intruderId = intruderId;

        // Update player words
        currentRound.data.playerWords.forEach(playerWord => {
          playerWord.isIntruder = playerWord.userId.equals(intruderId);
          playerWord.word = playerWord.isIntruder ? 
            currentRound.data.selectedPair.intruderWord : 
            currentRound.data.selectedPair.commonWord;
        });

        currentRound.data.phase = 'word_assignment';
        session.updateGameState({ 
          currentPhase: 'word_assignment',
          intruderId,
          playerWords: currentRound.data.playerWords
        });
        break;
    }
  }

  // Handle Multi Device Mode actions
  async handleMultiDeviceAction(session, currentRound, userId, actionType, actionData) {
    const activePlayers = session.players.filter(p => p.isActive);
    
    switch (actionType) {
      case 'reveal_word':
        // Player reveals their word
        const playerWord = currentRound.data.playerWords.find(pw => pw.userId.equals(userId));
        if (playerWord) {
          playerWord.revealed = true;
          session.updateGameState({ 
            currentPhase: 'word_reveal',
            revealedWords: currentRound.data.playerWords.filter(pw => pw.revealed)
          });
        }
        break;

      case 'ready_for_clues':
        // Player is ready for clue phase
        if (!currentRound.data.multiDeviceData.readyPlayers) {
          currentRound.data.multiDeviceData.readyPlayers = [];
        }
        
        if (!currentRound.data.multiDeviceData.readyPlayers.includes(userId.toString())) {
          currentRound.data.multiDeviceData.readyPlayers.push(userId.toString());
        }

        // Check if all players are ready
        if (currentRound.data.multiDeviceData.readyPlayers.length === activePlayers.length) {
          currentRound.data.phase = 'clue_gathering';
          session.updateGameState({ 
            currentPhase: 'clue_gathering',
            currentClueGiver: currentRound.data.clueStartPlayer
          });
        }
        break;

      case 'submit_clue':
        // Submit clue in multi-device mode
        if (!currentRound.data.multiDeviceData.cluesSubmitted) {
          currentRound.data.multiDeviceData.cluesSubmitted = [];
        }
        
        currentRound.data.multiDeviceData.cluesSubmitted.push({
          userId,
          clue: actionData.clue.trim(),
          submittedAt: new Date()
        });

        // Check if all clues submitted
        if (currentRound.data.multiDeviceData.cluesSubmitted.length === activePlayers.length) {
          currentRound.data.phase = 'voting';
          session.updateGameState({ currentPhase: 'voting' });
        } else {
          // Move to next clue giver
          const currentClueGiverIndex = activePlayers.findIndex(p => p.userId.equals(currentRound.data.clueStartPlayer));
          const nextClueGiverIndex = (currentClueGiverIndex + 1) % activePlayers.length;
          const nextClueGiver = activePlayers[nextClueGiverIndex];
          
          currentRound.data.clueStartPlayer = nextClueGiver.userId;
          session.updateGameState({ 
            currentPhase: 'clue_gathering', 
            currentClueGiver: nextClueGiver.userId 
          });
        }
        break;

      case 'submit_vote':
        // Submit vote in multi-device mode
        if (!currentRound.data.multiDeviceData.votesSubmitted) {
          currentRound.data.multiDeviceData.votesSubmitted = [];
        }
        
        currentRound.data.multiDeviceData.votesSubmitted.push({
          voterId: userId,
          votedForId: actionData.votedForId,
          submittedAt: new Date()
        });

        // Check if all votes submitted
        if (currentRound.data.multiDeviceData.votesSubmitted.length === activePlayers.length) {
          await this.calculateOneWordUnitesResults(session, currentRound);
        }
        break;
    }
  }

  // Handle Word Association actions
  async handleWordAssociationAction(session, currentRound, userId, actionType, actionData) {
    switch (actionType) {
      case 'submit_word':
        if (currentRound.data.phase !== 'word_chain') {
          throw new Error('Not in word chain phase');
        }

        // Add word to chain
        currentRound.data.wordChain.push({
          userId,
          word: actionData.word.trim(),
          position: currentRound.data.wordChain.length + 1,
          submittedAt: new Date()
        });

        // Check if chain is complete
        const chainLength = session.settings.get('chainLength');
        if (currentRound.data.wordChain.length >= chainLength) {
          await this.calculateWordAssociationResults(session, currentRound);
        }
        break;
    }
  }

  // Handle Story Builder actions
  async handleStoryBuilderAction(session, currentRound, userId, actionType, actionData) {
    switch (actionType) {
      case 'submit_sentence':
        if (currentRound.data.phase !== 'story_building') {
          throw new Error('Not in story building phase');
        }

        // Add sentence to story
        currentRound.data.story.push(actionData.sentence.trim());
        currentRound.data.currentSentence++;

        // Check if story is complete
        const storyLength = session.settings.get('storyLength');
        if (currentRound.data.story.length >= storyLength) {
          await this.calculateStoryBuilderResults(session, currentRound);
        }
        break;
    }
  }

  // Handle Quick Draw actions
  async handleQuickDrawAction(session, currentRound, userId, actionType, actionData) {
    switch (actionType) {
      case 'submit_guess':
        if (currentRound.data.phase !== 'guessing') {
          throw new Error('Not in guessing phase');
        }

        // Add guess
        currentRound.data.guesses.push({
          userId,
          guess: actionData.guess.trim().toLowerCase(),
          submittedAt: new Date()
        });

        // Check if correct guess
        if (actionData.guess.trim().toLowerCase() === currentRound.data.drawWord.toLowerCase()) {
          await this.calculateQuickDrawResults(session, currentRound, userId);
        }
        break;
    }
  }

  // Calculate One Word Unites results (for multi-device mode)
  async calculateOneWordUnitesResults(session, currentRound) {
    const voteCounts = {};
    
    // Count votes
    const votes = currentRound.data.multiDeviceData.votesSubmitted;
    votes.forEach(vote => {
      voteCounts[vote.votedForId] = (voteCounts[vote.votedForId] || 0) + 1;
    });

    // Find who got the most votes
    const mostVotedFor = Object.keys(voteCounts).reduce((a, b) => 
      voteCounts[a] > voteCounts[b] ? a : b
    );

    // Calculate scores
    const roundScores = [];
    const intruderId = currentRound.data.intruderId.toString();

    session.players.forEach(player => {
      let points = 0;
      let reason = '';

      if (player.userId.toString() === intruderId) {
        // Intruder logic
        if (mostVotedFor === intruderId) {
          points = 0;
          reason = 'caught';
        } else {
          points = 3;
          reason = 'fooled_everyone';
        }
      } else {
        // Regular player logic
        if (mostVotedFor === intruderId) {
          points = 1;
          reason = 'correct_guess';
        } else {
          points = 0;
          reason = 'wrong_guess';
        }
      }

      roundScores.push({
        userId: player.userId,
        points,
        reason
      });

      // Update player score
      player.score += points;
    });

    // Update round results
    currentRound.data.results = {
      intruderCaught: mostVotedFor === intruderId,
      mostVotedFor,
      roundScores
    };

    currentRound.data.phase = 'results';
    currentRound.status = 'finished';
    currentRound.endTime = new Date();

    session.updateGameState({ currentPhase: 'results' });

    // Check if game is finished
    if (session.currentRound >= session.totalRounds - 1) {
      await this.finishSession(session._id);
    } else {
      // Start next round
      session.currentRound++;
      session.rounds.push({
        roundNumber: session.currentRound + 1,
        status: 'waiting',
        startTime: new Date(),
        data: {},
        actions: [],
        results: {}
      });
      await this.initializeGameLogic(session);
    }
  }

  // Calculate Word Association results
  async calculateWordAssociationResults(session, currentRound) {
    // Simple scoring based on position in chain
    const roundScores = [];
    
    currentRound.data.wordChain.forEach((chainWord, index) => {
      const points = Math.max(1, 10 - index); // Earlier words get more points
      
      roundScores.push({
        userId: chainWord.userId,
        points,
        word: chainWord.word,
        position: chainWord.position
      });

      // Update player score
      const player = session.players.find(p => p.userId.equals(chainWord.userId));
      if (player) {
        player.score += points;
      }
    });

    // Update round results
    currentRound.data.results = {
      roundScores,
      finalChain: currentRound.data.wordChain.map(w => w.word)
    };

    currentRound.data.phase = 'results';
    currentRound.status = 'finished';
    currentRound.endTime = new Date();

    session.updateGameState({ currentPhase: 'results' });

    // Check if game is finished
    if (session.currentRound >= session.totalRounds - 1) {
      await this.finishSession(session._id);
    } else {
      // Start next round
      session.currentRound++;
      session.rounds.push({
        roundNumber: session.currentRound + 1,
        status: 'waiting',
        startTime: new Date(),
        data: {},
        actions: [],
        results: {}
      });
      await this.initializeGameLogic(session);
    }
  }

  // Calculate Story Builder results
  async calculateStoryBuilderResults(session, currentRound) {
    // Simple scoring - everyone gets points for participation
    const roundScores = [];
    const pointsPerSentence = 5;
    
    currentRound.data.story.forEach((sentence, index) => {
      if (index === 0) return; // Skip the prompt
      
      roundScores.push({
        userId: session.players[index - 1].userId,
        points: pointsPerSentence,
        sentence
      });

      // Update player score
      session.players[index - 1].score += pointsPerSentence;
    });

    // Update round results
    currentRound.data.results = {
      roundScores,
      finalStory: currentRound.data.story
    };

    currentRound.data.phase = 'results';
    currentRound.status = 'finished';
    currentRound.endTime = new Date();

    session.updateGameState({ currentPhase: 'results' });

    // Check if game is finished
    if (session.currentRound >= session.totalRounds - 1) {
      await this.finishSession(session._id);
    } else {
      // Start next round
      session.currentRound++;
      session.rounds.push({
        roundNumber: session.currentRound + 1,
        status: 'waiting',
        startTime: new Date(),
        data: {},
        actions: [],
        results: {}
      });
      await this.initializeGameLogic(session);
    }
  }

  // Calculate Quick Draw results
  async calculateQuickDrawResults(session, currentRound, winnerId) {
    const roundScores = [];
    
    // Winner gets points based on speed
    const winner = session.players.find(p => p.userId.equals(winnerId));
    if (winner) {
      const timeBonus = Math.max(1, 10); // Simple time bonus
      winner.score += timeBonus;
      
      roundScores.push({
        userId: winnerId,
        points: timeBonus,
        reason: 'correct_guess'
      });
    }

    // Update round results
    currentRound.data.results = {
      roundScores,
      correctWord: currentRound.data.drawWord,
      winnerId
    };

    currentRound.data.phase = 'results';
    currentRound.status = 'finished';
    currentRound.endTime = new Date();

    session.updateGameState({ currentPhase: 'results' });

    // Check if game is finished
    if (session.currentRound >= session.totalRounds - 1) {
      await this.finishSession(session._id);
    } else {
      // Start next round
      session.currentRound++;
      session.rounds.push({
        roundNumber: session.currentRound + 1,
        status: 'waiting',
        startTime: new Date(),
        data: {},
        actions: [],
        results: {}
      });
      await this.initializeGameLogic(session);
    }
  }

  // Finish a game session
  async finishSession(sessionId) {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.finish();
    await session.save();

    // Update user statistics
    await this.updateUserGameStats(session);

    return session;
  }

  // Update user game statistics
  async updateUserGameStats(session) {
    const userUpdates = [];

    for (const player of session.players) {
      const userStats = {
        totalGames: 1,
        totalPoints: player.score,
        lastGameAt: new Date()
      };

      // Get game-specific statistics
      const gameSpecificStats = this.getUserGameStats(session, player.userId);
      Object.assign(userStats, gameSpecificStats);

      userUpdates.push({
        updateOne: {
          filter: { _id: player.userId },
          update: {
            $inc: {
              'gameStats.totalGames': userStats.totalGames,
              'gameStats.totalPoints': userStats.totalPoints,
              'gameStats.gamesWon': userStats.gamesWon || 0,
              ...gameSpecificStats
            },
            $set: {
              'gameStats.lastGameAt': userStats.lastGameAt
            }
          }
        }
      });
    }

    if (userUpdates.length > 0) {
      await User.bulkWrite(userUpdates);
    }
  }

  // Get user-specific game statistics
  getUserGameStats(session, userId) {
    switch (session.gameId) {
      case 'one_word_unites':
        return this.getOneWordUnitesUserStats(session, userId);
      case 'word_association':
        return this.getWordAssociationUserStats(session, userId);
      case 'story_builder':
        return this.getStoryBuilderUserStats(session, userId);
      case 'quick_draw':
        return this.getQuickDrawUserStats(session, userId);
      default:
        return {};
    }
  }

  // Get One Word Unites user statistics
  getOneWordUnitesUserStats(session, userId) {
    const stats = {
      intruderCount: 0,
      correctGuesses: 0,
      fooledEveryoneCount: 0
    };

    session.rounds.forEach(round => {
      if (round.data.intruderId && round.data.intruderId.equals(userId)) {
        stats.intruderCount++;
        
        // Check votes based on game mode
        let votes;
        if (round.data.gameMode === 'single_device') {
          votes = round.data.singleDeviceData?.votes || [];
        } else {
          votes = round.data.multiDeviceData?.votesSubmitted || [];
        }
        
        const intruderVotes = votes.filter(v => v.votedForId.equals(userId)).length;
        if (intruderVotes === 0) {
          stats.fooledEveryoneCount++;
        }
      } else {
        // Check if player correctly identified intruder
        let votes;
        if (round.data.gameMode === 'single_device') {
          votes = round.data.singleDeviceData?.votes || [];
        } else {
          votes = round.data.multiDeviceData?.votesSubmitted || [];
        }
        
        const playerVote = votes.find(v => v.voterId.equals(userId));
        if (playerVote && playerVote.votedForId.equals(round.data.intruderId)) {
          stats.correctGuesses++;
        }
      }
    });

    return stats;
  }

  // Get Word Association user statistics
  getWordAssociationUserStats(session, userId) {
    const stats = {
      wordsContributed: 0,
      averagePosition: 0
    };

    let totalPosition = 0;

    session.rounds.forEach(round => {
      const userContributions = round.data.wordChain?.filter(w => w.userId.equals(userId)) || [];
      stats.wordsContributed += userContributions.length;
      
      userContributions.forEach(contribution => {
        totalPosition += contribution.position;
      });
    });

    if (stats.wordsContributed > 0) {
      stats.averagePosition = totalPosition / stats.wordsContributed;
    }

    return stats;
  }

  // Get Story Builder user statistics
  getStoryBuilderUserStats(session, userId) {
    const stats = {
      sentencesContributed: 0,
      averageCreativity: 0
    };

    session.rounds.forEach(round => {
      const userSentences = round.data.story?.filter((sentence, index) => 
        index > 0 && session.players[index - 1]?.userId.equals(userId)
      ) || [];
      stats.sentencesContributed += userSentences.length;
    });

    return stats;
  }

  // Get Quick Draw user statistics
  getQuickDrawUserStats(session, userId) {
    const stats = {
      correctGuesses: 0,
      averageGuessTime: 0
    };

    let totalGuessTime = 0;

    session.rounds.forEach(round => {
      const userGuess = round.data.guesses?.find(g => g.userId.equals(userId));
      if (userGuess && userGuess.guess === round.data.drawWord) {
        stats.correctGuesses++;
        const guessTime = (userGuess.submittedAt - round.startTime) / 1000;
        totalGuessTime += guessTime;
      }
    });

    if (stats.correctGuesses > 0) {
      stats.averageGuessTime = totalGuessTime / stats.correctGuesses;
    }

    return stats;
  }

  // Get public sessions
  async getPublicSessions() {
    return await GameSession.getPublicSessions();
  }

  // Get session by ID
  async getSessionById(sessionId) {
    return await GameSession.findById(sessionId);
  }

  // Get session by lobby code
  async getSessionByLobbyCode(lobbyCode) {
    return await GameSession.findOne({ lobbyCode });
  }

  // Get player game state
  async getPlayerGameState(sessionId, userId) {
    const session = await GameSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const player = session.players.find(p => p.userId.equals(userId));
    if (!player) {
      throw new Error('Player not in session');
    }

    return this.buildPlayerGameState(session, userId);
  }

  // Build player-specific game state
  buildPlayerGameState(session, userId) {
    const gameState = {
      sessionId: session._id,
      gameId: session.gameId,
      gameName: session.gameName,
      sessionName: session.sessionName,
      lobbyCode: session.lobbyCode,
      status: session.status,
      hostUserId: session.hostUserId,
      currentRound: session.currentRound,
      totalRounds: session.totalRounds,
      players: session.players.map(p => ({
        userId: p.userId,
        username: p.username,
        isHost: p.isHost,
        isReady: p.isReady,
        isActive: p.isActive,
        score: p.score
      })),
      settings: Object.fromEntries(session.settings),
      gameState: session.gameState
    };

    const currentRound = session.getCurrentRound();
    if (currentRound) {
      gameState.round = {
        roundNumber: currentRound.roundNumber,
        status: currentRound.status,
        startTime: currentRound.startTime,
        data: currentRound.data
      };
    }

    return gameState;
  }
}

module.exports = new GameService(); 