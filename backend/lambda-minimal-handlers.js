/**
 * Minimal Lambda Handlers for Testing
 * These handlers return simple responses to verify API Gateway integration
 * 
 * Deploy each as a separate Lambda function:
 * - GetRandomRiddleFunction
 * - ValidateAnswerFunction
 * - SolveRiddleFunction
 * - GetPlayerProgressFunction
 */

// ============================================================================
// GET Random Riddle Handler
// ============================================================================
exports.getRandomRiddleHandler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify({
      success: true,
      status: 'ok',
      route: '/riddles/random',
      message: 'Random riddle retrieved successfully',
      data: {
        riddleId: 'level-1-riddle-1',
        question: 'I am a city known for its dark knights. What am I?',
        hint: 'Home of Batman',
        difficulty: 'easy',
        type: 'cipher',
        levelId: 1,
        points: 100
      }
    })
  };
};

// ============================================================================
// POST Validate Answer Handler
// ============================================================================
exports.validateAnswerHandler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  let body = {};
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (e) {
    console.error('Failed to parse body:', e);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify({
      success: true,
      status: 'ok',
      route: '/riddles/validate',
      message: 'Answer validated successfully',
      data: {
        riddleId: body.riddleId || 'test-riddle',
        isValid: body.answer === 'ARKHAM', // Simple test logic
        message: body.answer === 'ARKHAM' ? 'Correct answer!' : 'Try again'
      }
    })
  };
};

// ============================================================================
// POST Solve Riddle Handler
// ============================================================================
exports.solveRiddleHandler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  let body = {};
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (e) {
    console.error('Failed to parse body:', e);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify({
      success: true,
      status: 'ok',
      route: '/riddles/solve',
      message: 'Riddle solved and progress updated',
      data: {
        playerId: 'test-player-123',
        riddleId: body.riddleId || 'test-riddle',
        levelId: body.levelId || 1,
        stars: body.stars || 3,
        completionTime: body.completionTime || 0,
        totalScore: 300,
        solvedAt: new Date().toISOString()
      }
    })
  };
};

// ============================================================================
// GET Player Progress Handler
// ============================================================================
exports.playerProgressHandler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify({
      success: true,
      status: 'ok',
      route: '/riddles/progress',
      message: 'Player progress retrieved successfully',
      data: {
        playerId: 'test-player-123',
        totalScore: 300,
        levelsCompleted: 1,
        levelsInProgress: 1,
        solvedRiddles: ['level-1-riddle-1'],
        levelProgress: {
          '1': {
            completed: true,
            stars: 3,
            riddlesSolved: 1,
            totalRiddles: 5,
            completedAt: new Date().toISOString()
          }
        }
      }
    })
  };
};

// ============================================================================
// Health Check Handler (for testing)
// ============================================================================
exports.healthCheckHandler = async (event) => {
  console.log('Health check invoked:', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify({
      status: 'ok',
      message: 'API Gateway is working correctly',
      timestamp: new Date().toISOString(),
      requestId: event.requestContext?.requestId || 'unknown'
    })
  };
};

// ============================================================================
// Export all handlers for individual function deployment
// ============================================================================
module.exports = {
  getRandomRiddleHandler: exports.getRandomRiddleHandler,
  validateAnswerHandler: exports.validateAnswerHandler,
  solveRiddleHandler: exports.solveRiddleHandler,
  playerProgressHandler: exports.playerProgressHandler,
  healthCheckHandler: exports.healthCheckHandler
};
