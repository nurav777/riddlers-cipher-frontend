import { Router, Request, Response } from "express";
import { CognitoService } from "../services/cognitoService";
import { DynamoService } from "../services/dynamoService";
import { JWTService } from "../services/jwtService";
import { authenticateToken } from "../middleware/auth";
import {
  LoginRequest,
  RegisterRequest,
  VerifyRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types";

const router = Router();
const cognitoService = new CognitoService();
const dynamoService = new DynamoService();

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post("/login", async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log("[LOGIN] ========== LOGIN REQUEST STARTED ==========");
  console.log("[LOGIN] Request body:", { email: req.body.email, password: "***" });
  
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      console.warn("[LOGIN] Validation failed: Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        error: "Missing required fields",
      });
    }
    console.log("[LOGIN] ✓ Input validation passed");

    // Authenticate with Cognito
    console.log("[LOGIN] Authenticating with Cognito...");
    const result = await cognitoService.login({ email, password });
    console.log("[LOGIN] Cognito auth result:", {
      success: result.success,
      hasTokens: !!result.data?.tokens,
      message: result.message,
    });

    if (result.success && result.data?.tokens) {
      // Extract Cognito sub from ID token
      console.log("[LOGIN] Extracting Cognito sub from ID token...");
      const cognitoSub = extractSubFromIdToken(result.data.tokens.idToken);
      console.log("[LOGIN] ✓ Cognito sub extracted:", cognitoSub);
      
      if (!cognitoSub) {
        console.error("[LOGIN] ERROR: Failed to extract Cognito sub from ID token");
        return res.status(500).json({
          success: false,
          message: "Failed to extract user ID",
          error: "Invalid ID token",
        });
      }

      // Get user profile from DynamoDB using the Cognito sub
      console.log("[LOGIN] Fetching profile from DynamoDB with cognitoSub:", cognitoSub);
      let profile = await dynamoService.getUserProfile(cognitoSub);
      console.log("[LOGIN] DynamoDB profile lookup result:", {
        found: !!profile,
        profileData: profile ? { userId: profile.userId, email: profile.email, username: profile.username } : null,
      });

      // If profile doesn't exist, try to find it by email and migrate it
      if (!profile) {
        console.log("[LOGIN] Profile not found by cognitoSub, attempting email lookup...");
        const emailProfile = await dynamoService.getUserProfileByEmail(email);
        console.log("[LOGIN] Email lookup result:", {
          found: !!emailProfile,
          profileData: emailProfile ? { userId: emailProfile.userId, email: emailProfile.email } : null,
        });

        if (emailProfile) {
          console.log("[LOGIN] Found existing profile by email, migrating to Cognito sub...");
          console.log("[LOGIN] Migration details - Old userId:", emailProfile.userId, "New cognitoSub:", cognitoSub);
          
          try {
            await dynamoService.migrateProfileToCognitoSub(emailProfile.userId, cognitoSub);
            console.log("[LOGIN] ✓ Profile migration completed");
            
            // Verify migration by fetching the migrated profile
            profile = await dynamoService.getUserProfile(cognitoSub);
            console.log("[LOGIN] ✓ Migrated profile verification:", {
              found: !!profile,
              profileData: profile ? { userId: profile.userId, email: profile.email } : null,
            });
          } catch (migrationError) {
            console.error("[LOGIN] ERROR during profile migration:", migrationError);
            throw migrationError;
          }
        } else {
          console.log("[LOGIN] No existing profile found by email, creating new profile...");
          
          try {
            const user = await cognitoService.getUserByEmail(email);
            console.log("[LOGIN] Cognito user lookup result:", {
              found: !!user,
              userData: user ? { username: user.username, firstName: user.firstName, lastName: user.lastName } : null,
            });

            if (user) {
              console.log("[LOGIN] Creating new user profile with data:", {
                cognitoSub,
                email,
                username: user.username || email.split("@")[0],
              });
              
              profile = await dynamoService.createUserProfile(
                cognitoSub,
                email,
                user.username || email.split("@")[0],
                user.firstName || "",
                user.lastName || ""
              );
              console.log("[LOGIN] ✓ New profile created:", {
                userId: profile.userId,
                email: profile.email,
                username: profile.username,
              });
            } else {
              console.warn("[LOGIN] WARNING: User not found in Cognito for email:", email);
            }
          } catch (createError) {
            console.error("[LOGIN] ERROR during profile creation:", createError);
            throw createError;
          }
        }
      }

      // Update last login time
      if (profile) {
        console.log("[LOGIN] Updating last login time for userId:", profile.userId);
        try {
          await dynamoService.updateLastLogin(profile.userId);
          console.log("[LOGIN] ✓ Last login updated");
        } catch (updateError) {
          console.error("[LOGIN] ERROR updating last login:", updateError);
          // Don't fail the login if this fails
        }
      } else {
        console.warn("[LOGIN] WARNING: No profile available to update last login");
      }

      // Generate our own JWT token for additional security
      console.log("[LOGIN] Generating JWT token...");
      const jwtToken = JWTService.generateToken({
        sub: cognitoSub,
        email: result.data.user?.email || "",
        username: result.data.user?.username || "",
      });
      console.log("[LOGIN] ✓ JWT token generated successfully");

      console.log("[LOGIN] ✓ Login successful - Final profile data:", {
        userId: profile?.userId,
        email: profile?.email,
        username: profile?.username,
        hasGameStats: !!profile?.gameStats,
        hasLevelProgress: !!profile?.levelProgress,
      });
      console.log("[LOGIN] Total time:", Date.now() - startTime, "ms");
      console.log("[LOGIN] ========== LOGIN REQUEST COMPLETED ==========");

      res.json({
        ...result,
        data: {
          ...result.data,
          jwtToken,
          profile, // Include the user profile in the response
        },
      });
    } else {
      console.error("[LOGIN] Cognito authentication failed:", result);
      res.status(401).json(result);
    }
  } catch (error) {
    console.error("[LOGIN] ========== LOGIN ERROR ==========");
    console.error("[LOGIN] Error details:", error);
    console.error("[LOGIN] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("[LOGIN] Total time before error:", Date.now() - startTime, "ms");
    console.error("[LOGIN] ========== END ERROR ==========");
    
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log("[REGISTER] ========== REGISTRATION REQUEST STARTED ==========");
  console.log("[REGISTER] Request body:", { 
    email: req.body.email, 
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    password: "***" 
  });
  
  try {
    const { email, password, firstName, lastName, username }: RegisterRequest =
      req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !username) {
      console.warn("[REGISTER] Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        error: "Missing required fields",
      });
    }
    console.log("[REGISTER] ✓ Input validation passed");

    // Validate password strength
    if (password.length < 8) {
      console.warn("[REGISTER] Password validation failed: Too short");
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        error: "Weak password",
      });
    }
    console.log("[REGISTER] ✓ Password strength validation passed");

    // Check if username is available
    console.log("[REGISTER] Checking username availability:", username);
    const isUsernameAvailable = await dynamoService.isUsernameAvailable(username);
    console.log("[REGISTER] Username availability result:", isUsernameAvailable);
    
    if (!isUsernameAvailable) {
      console.warn("[REGISTER] Username already taken:", username);
      return res.status(400).json({
        success: false,
        message: "Username is already taken",
        error: "Username not available",
      });
    }
    console.log("[REGISTER] ✓ Username is available");

    // Register with Cognito
    console.log("[REGISTER] Registering user with Cognito...");
    const result = await cognitoService.register({
      email,
      password,
      firstName,
      lastName,
      username,
    });
    console.log("[REGISTER] Cognito registration result:", {
      success: result.success,
      message: result.message,
    });

    if (result.success) {
      try {
        console.log("[REGISTER] Creating user profile in DynamoDB...");
        // Get the Cognito sub from the registration response
        // For now, we'll use email as userId and update it on first login
        // This is a temporary solution until we can get the sub from registration
        const profile = await dynamoService.createUserProfile(
          email, // Temporary: using email as userId
          email,
          username,
          firstName,
          lastName
        );
        console.log("[REGISTER] ✓ User profile created:", {
          userId: profile.userId,
          email: profile.email,
          username: profile.username,
        });
      } catch (profileError) {
        console.error("[REGISTER] ERROR creating user profile:", profileError);
        // Don't fail registration if profile creation fails
        // The user can still log in and we can create the profile later
      }
    } else {
      console.error("[REGISTER] Cognito registration failed:", result);
    }

    console.log("[REGISTER] Total time:", Date.now() - startTime, "ms");
    console.log("[REGISTER] ========== REGISTRATION REQUEST COMPLETED ==========");
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error("[REGISTER] ========== REGISTRATION ERROR ==========");
    console.error("[REGISTER] Error details:", error);
    console.error("[REGISTER] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("[REGISTER] Total time before error:", Date.now() - startTime, "ms");
    console.error("[REGISTER] ========== END ERROR ==========");
    
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify user email with code
 */
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { email, code }: VerifyRequest = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
        error: "Missing required fields",
      });
    }

    // Verify with Cognito
    const result = await cognitoService.verifyEmail({ email, code });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Verify route error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiate forgot password flow
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email }: ForgotPasswordRequest = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        error: "Missing required fields",
      });
    }

    // Initiate forgot password with Cognito
    const result = await cognitoService.forgotPassword({ email });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Forgot password route error:", error);
    res.status(500).json({
      success: false,
      message: "Forgot password failed",
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with verification code
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword }: ResetPasswordRequest = req.body;

    // Validate input
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, code, and new password are required",
        error: "Missing required fields",
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        error: "Weak password",
      });
    }

    // Reset password with Cognito
    const result = await cognitoService.resetPassword({
      email,
      code,
      newPassword,
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Reset password route error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
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

    // Get user details from Cognito
    const user = await cognitoService.getUserByEmail(req.user.email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "User data not available",
      });
    }

    res.json({
      success: true,
      message: "User information retrieved",
      data: { user },
    });
  } catch (error) {
    console.error("Get user route error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post(
  "/refresh",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          error: "No user data found",
        });
      }

      // Generate new JWT token
      const newToken = JWTService.generateToken({
        sub: req.user.sub,
        email: req.user.email,
        username: req.user.username,
      });

      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          jwtToken: newToken,
        },
      });
    } catch (error) {
      console.error("Refresh token route error:", error);
      res.status(500).json({
        success: false,
        message: "Token refresh failed",
        error: "Internal server error",
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post(
  "/logout",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return success as the client will remove the token
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout route error:", error);
      res.status(500).json({
        success: false,
        message: "Logout failed",
        error: "Internal server error",
      });
    }
  }
);

/**
 * Extract Cognito sub from ID token
 */
function extractSubFromIdToken(idToken: string): string {
  try {
    // Decode the JWT token (without verification since it's from Cognito)
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.aud || '';
  } catch (error) {
    console.error('Error extracting sub from ID token:', error);
    return '';
  }
}

export { router as authRoutes };
