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
  console.log("Login request:", req.body);
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        error: "Missing required fields",
      });
    }

    // Authenticate with Cognito
    const result = await cognitoService.login({ email, password });

    if (result.success && result.data?.tokens) {
      // Extract Cognito sub from ID token
      const cognitoSub = extractSubFromIdToken(result.data.tokens.idToken);
      
      // Get user profile from DynamoDB using the Cognito sub
      let profile = await dynamoService.getUserProfile(cognitoSub);
      
      // If profile doesn't exist, try to find it by email and migrate it
      if (!profile) {
        const emailProfile = await dynamoService.getUserProfileByEmail(email);
        if (emailProfile) {
          // Migrate the profile to use the correct Cognito sub
          await dynamoService.migrateProfileToCognitoSub(emailProfile.userId, cognitoSub);
          profile = await dynamoService.getUserProfile(cognitoSub);
        } else {
          // Create a new profile with the Cognito sub
          const user = await cognitoService.getUserByEmail(email);
          if (user) {
            profile = await dynamoService.createUserProfile(
              cognitoSub,
              email,
              user.username || email.split('@')[0],
              user.firstName || '',
              user.lastName || ''
            );
          }
        }
      }
      
      // Update last login time
      if (profile) {
        await dynamoService.updateLastLogin(profile.userId);
      }

      // Generate our own JWT token for additional security
      const jwtToken = JWTService.generateToken({
        sub: cognitoSub,
        email: result.data.user?.email || "",
        username: result.data.user?.username || "",
      });

      console.log('Login successful - Profile data:', profile);
      console.log('Login successful - JWT token generated');

      res.json({
        ...result,
        data: {
          ...result.data,
          jwtToken,
          profile, // Include the user profile in the response
        },
      });
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, username }: RegisterRequest =
      req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !username) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        error: "Missing required fields",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        error: "Weak password",
      });
    }

    // Check if username is available
    const isUsernameAvailable = await dynamoService.isUsernameAvailable(username);
    if (!isUsernameAvailable) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken",
        error: "Username not available",
      });
    }

    // Register with Cognito
    const result = await cognitoService.register({
      email,
      password,
      firstName,
      lastName,
      username,
    });

    if (result.success) {
      try {
        // Get the Cognito sub from the registration response
        // For now, we'll use email as userId and update it on first login
        // This is a temporary solution until we can get the sub from registration
        await dynamoService.createUserProfile(
          email, // Temporary: using email as userId
          email,
          username,
          firstName,
          lastName
        );
      } catch (profileError) {
        console.error("Failed to create user profile:", profileError);
        // Don't fail registration if profile creation fails
        // The user can still log in and we can create the profile later
      }
    }

    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error("Register route error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: "Internal server error",
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
