export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UserProfile {
  userId: string;
  profileType: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
    soundEnabled?: boolean;
  };
  gameStats?: {
    totalScore: number;
    levelsCompleted: number;
    achievements: string[];
    playTime: number;
    lastLevelPlayed?: string;
  };
  levelProgress?: {
    levels: Array<{
      levelId: number;
      isLocked: boolean;
      bestStars: number;
      attempts: number;
      title: string;
      description: string;
      difficulty: string;
      position: { x: number; y: number };
    }>;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: User;
    tokens?: {
      accessToken: string;
      refreshToken: string;
      idToken: string;
    };
  };
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}


export interface JWTPayload {
  sub: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
    soundEnabled?: boolean;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    profile?: UserProfile;
  };
  error?: string;
}
