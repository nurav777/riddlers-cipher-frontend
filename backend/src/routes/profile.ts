import { Router, Request, Response } from "express";
import { DynamoService } from "../services/dynamoService";
import { authenticateToken } from "../middleware/auth";
import { ProfileUpdateRequest } from "../types";

const router = Router();
const dynamoService = new DynamoService();

/**
 * GET /api/profile/me
 * Get current user's profile
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        error: "No user data found",
      });
    }

    const profile = await dynamoService.getUserProfile(req.user.sub);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
        error: "User profile does not exist",
      });
    }

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: { profile },
    });
  } catch (error: any) {
    console.error("Get profile route error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message || "Internal server error",
    });
  }
});

/**
 * PUT /api/profile/me
 * Update current user's profile
 */
router.put("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        error: "No user data found",
      });
    }

    const updates: ProfileUpdateRequest = req.body;

    // Validate username availability if username is being updated
    if (updates.username) {
      const isAvailable = await dynamoService.isUsernameAvailable(updates.username);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
          error: "Username not available",
        });
      }
    }

    const updatedProfile = await dynamoService.updateUserProfile(req.user.sub, updates);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { profile: updatedProfile },
    });
  } catch (error: any) {
    console.error("Update profile route error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message || "Internal server error",
    });
  }
});

/**
 * GET /api/profile/username/:username
 * Check if username is available
 */
router.get("/username/:username", async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
        error: "Missing username parameter",
      });
    }

    const isAvailable = await dynamoService.isUsernameAvailable(username);

    res.json({
      success: true,
      message: isAvailable ? "Username is available" : "Username is taken",
      data: { available: isAvailable },
    });
  } catch (error: any) {
    console.error("Check username route error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check username availability",
      error: error.message || "Internal server error",
    });
  }
});

/**
 * GET /api/profile/user/:userId
 * Get user profile by userId (public profile)
 */
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        error: "Missing userId parameter",
      });
    }

    const profile = await dynamoService.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
        error: "User profile does not exist",
      });
    }

    // Return only public profile information
    const publicProfile = {
      userId: profile.userId,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      bio: profile.bio,
      gameStats: {
        totalScore: profile.gameStats?.totalScore || 0,
        levelsCompleted: profile.gameStats?.levelsCompleted || 0,
        achievements: profile.gameStats?.achievements || [],
      },
      createdAt: profile.createdAt,
    };

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: { profile: publicProfile },
    });
  } catch (error: any) {
    console.error("Get user profile route error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message || "Internal server error",
    });
  }
});

/**
 * PUT /api/profile/game-stats
 * Update user's game statistics
 */
router.put("/game-stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        error: "No user data found",
      });
    }

    const gameStats = req.body;

    const updatedProfile = await dynamoService.updateGameStats(req.user.sub, gameStats);

    res.json({
      success: true,
      message: "Game statistics updated successfully",
      data: { profile: updatedProfile },
    });
  } catch (error: any) {
    console.error("Update game stats route error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update game statistics",
      error: error.message || "Internal server error",
    });
  }
});

/**
 * DELETE /api/profile/me
 * Delete current user's profile
 */
router.delete("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        error: "No user data found",
      });
    }

    await dynamoService.deleteUserProfile(req.user.sub);

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete profile route error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete profile",
      error: error.message || "Internal server error",
    });
  }
});

/**
 * PUT /api/profile/level-progress
 * Update user's level progress
 */
router.put("/level-progress", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        error: "No user data found",
      });
    }

    const levelProgress = req.body;

    const updatedProfile = await dynamoService.updateLevelProgress(req.user.sub, levelProgress);

    res.json({
      success: true,
      message: "Level progress updated successfully",
      data: { profile: updatedProfile },
    });
  } catch (error) {
    console.error("Level progress update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update level progress",
      error: "Internal server error",
    });
  }
});

export { router as profileRoutes };
