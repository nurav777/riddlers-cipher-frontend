import { Router, Request, Response } from 'express';
import { RiddleService } from '../services/riddleService';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const riddleService = new RiddleService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/riddles/random
 * Get a random riddle for the authenticated player
 */
router.get('/random', async (req: Request, res: Response) => {
  try {
    const playerId = req.user?.sub;
    if (!playerId) {
      return res.status(401).json({
        success: false,
        message: 'Player ID not found in token',
      });
    }

    const { levelId, difficulty, type, excludeSolved } = req.query;
    
    const request = {
      playerId,
      levelId: levelId ? parseInt(levelId as string) : undefined,
      difficulty: difficulty as 'easy' | 'medium' | 'hard' | undefined,
      type: type as string | undefined,
      excludeSolved: excludeSolved !== 'false',
    };

    const result = await riddleService.getRandomRiddle(request);
    
    res.json({
      success: true,
      data: result,
      message: 'Random riddle retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get random riddle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get random riddle',
      error: error.message,
    });
  }
});

/**
 * GET /api/riddles/level/:levelId
 * Get all riddles for a specific level
 */
router.get('/level/:levelId', async (req: Request, res: Response) => {
  try {
    const levelId = parseInt(req.params.levelId);
    if (isNaN(levelId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid level ID',
      });
    }

    const riddles = await riddleService.getRiddlesByLevel(levelId);
    
    res.json({
      success: true,
      data: riddles,
      message: `Retrieved ${riddles.length} riddles for level ${levelId}`,
    });
  } catch (error: any) {
    console.error('Get riddles by level error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get riddles for level',
      error: error.message,
    });
  }
});

/**
 * GET /api/riddles/difficulty/:difficulty
 * Get riddles by difficulty level
 */
router.get('/difficulty/:difficulty', async (req: Request, res: Response) => {
  try {
    const difficulty = req.params.difficulty as 'easy' | 'medium' | 'hard';
    
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty level. Must be easy, medium, or hard',
      });
    }

    const riddles = await riddleService.getRiddlesByDifficulty(difficulty);
    
    res.json({
      success: true,
      data: riddles,
      message: `Retrieved ${riddles.length} riddles for difficulty ${difficulty}`,
    });
  } catch (error: any) {
    console.error('Get riddles by difficulty error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get riddles by difficulty',
      error: error.message,
    });
  }
});

/**
 * GET /api/riddles/type/:type
 * Get riddles by type
 */
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type;
    const riddles = await riddleService.getRiddlesByType(type);
    
    res.json({
      success: true,
      data: riddles,
      message: `Retrieved ${riddles.length} riddles for type ${type}`,
    });
  } catch (error: any) {
    console.error('Get riddles by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get riddles by type',
      error: error.message,
    });
  }
});

/**
 * POST /api/riddles/validate
 * Validate a riddle answer
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { riddleId, answer } = req.body;
    
    if (!riddleId || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Riddle ID and answer are required',
      });
    }

    const isValid = await riddleService.validateAnswer(riddleId, answer);
    
    res.json({
      success: true,
      data: { isValid },
      message: 'Validation completed',
    });
  } catch (error: any) {
    console.error('Validate answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate answer',
      error: error.message,
    });
  }
});

/**
 * POST /api/riddles/solve
 * Mark a riddle as solved and update player progress
 */
router.post('/solve', async (req: Request, res: Response) => {
  try {
    const playerId = req.user?.sub;
    if (!playerId) {
      return res.status(401).json({
        success: false,
        message: 'Player ID not found in token',
      });
    }

    const { riddleId, levelId, stars, completionTime } = req.body;
    
    if (!riddleId || !levelId || stars === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Riddle ID, level ID, and stars are required',
      });
    }

    const updatedProgress = await riddleService.updatePlayerProgress(
      playerId,
      riddleId,
      levelId,
      stars,
      completionTime
    );
    
    res.json({
      success: true,
      data: updatedProgress,
      message: 'Riddle solved and progress updated',
    });
  } catch (error: any) {
    console.error('Solve riddle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to solve riddle',
      error: error.message,
    });
  }
});

/**
 * GET /api/riddles/progress
 * Get player's progress
 */
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const playerId = req.user?.sub;
    if (!playerId) {
      return res.status(401).json({
        success: false,
        message: 'Player ID not found in token',
      });
    }

    const progress = await riddleService.getPlayerProgress(playerId);
    
    res.json({
      success: true,
      data: progress,
      message: 'Player progress retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get player progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get player progress',
      error: error.message,
    });
  }
});

/**
 * GET /api/riddles/stats
 * Get riddle statistics (admin only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check
    const stats = await riddleService.getRiddleStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Riddle statistics retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get riddle stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get riddle statistics',
      error: error.message,
    });
  }
});

/**
 * GET /api/riddles/all
 * Get all riddles (admin only)
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check
    const riddles = await riddleService.getAllRiddles();
    
    res.json({
      success: true,
      data: riddles,
      message: `Retrieved ${riddles.length} riddles`,
    });
  } catch (error: any) {
    console.error('Get all riddles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get all riddles',
      error: error.message,
    });
  }
});

export { router as riddleRoutes };
