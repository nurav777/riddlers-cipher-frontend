const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("jwtToken", token);
    else localStorage.removeItem("jwtToken");
  }
};

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jwtToken");
};

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = authToken || getStoredToken();
  
  try {
    const res = await fetch(`${apiBaseUrl}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
      ...options,
    });

    // Handle non-JSON responses
    const contentType = res.headers.get("content-type");
    let data: any;
    
    if (contentType?.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error(`Non-JSON response from ${path}:`, text);
      throw new Error(`Invalid response format from ${path}`);
    }

    // Check for HTTP errors
    if (!res.ok) {
      console.error(`API Error [${res.status}] ${path}:`, data);
      throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
    }

    return data as T;
  } catch (error) {
    console.error(`Request failed for ${path}:`, error);
    throw error;
  }
}

export const AuthApi = {
  async login(payload: LoginPayload) {
    const data = await request<ApiResponse<{ 
      user: unknown; 
      tokens?: unknown; 
      jwtToken?: string;
      profile?: any;
    }>>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    
    // Store the JWT token for future requests
    if (data.success && data.data?.jwtToken) {
      setAuthToken(data.data.jwtToken);
    }
    
    return data;
  },
  async register(payload: RegisterPayload) {
    const data = await request<ApiResponse<unknown>>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return data;
  },
  async forgotPassword(payload: ForgotPasswordPayload) {
    const data = await request<ApiResponse<unknown>>(
      "/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return data;
  },
  async resetPassword(payload: ResetPasswordPayload) {
    const data = await request<ApiResponse<unknown>>(
      "/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return data;
  },
  async logout() {
    // Save final progress to DynamoDB before logout
    try {
      const gameProfile = localStorage.getItem('gotham_user_profile');
      const levelsState = localStorage.getItem('gotham_levels_state');

      if (gameProfile && levelsState) {
        const profile = JSON.parse(gameProfile);
        const levels = JSON.parse(levelsState);

        const totalStars = levels.reduce((sum: number, level: any) => sum + level.bestStars, 0);
        const levelsCompleted = levels.filter((level: any) => level.bestStars > 0).length;

        const gameStats = {
          totalScore: totalStars,
          levelsCompleted,
          achievements: [],
          playTime: profile.totalStars || 0,
          lastLevelPlayed: levels.find((level: any) => level.bestStars > 0)?.title || null
        };

        await this.updateGameStats(gameStats);
        await this.updateLevelProgress({ levels });
        console.log('Final progress saved to DynamoDB on logout');
      }
    } catch (error) {
      console.error('Failed to save final progress on logout:', error);
    }

    const data = await request<ApiResponse<unknown>>(
      "/api/auth/logout",
      {
        method: "POST",
      }
    );

    // Clear all user data from localStorage
    localStorage.removeItem('userProfile');
    localStorage.removeItem('gotham_user_profile');
    localStorage.removeItem('gotham_levels_state');
    localStorage.removeItem('gotham_ui_state');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('CURRENT_USER_ID');

    // Clear the auth token
    setAuthToken(null);

    return data;
  },
};

// Main API object with all endpoints
export const api = {
  // Auth endpoints
  auth: AuthApi,
  
  // Logout function that clears all user data
  async logout() {
    return await AuthApi.logout();
  },
  
  // Profile endpoints
  async getProfile() {
    const data = await request<ApiResponse<{ profile: unknown }>>("/api/profile/me");
    return data;
  },
  
  async updateProfile(updates: any) {
    const data = await request<ApiResponse<{ profile: unknown }>>(
      "/api/profile/me",
      {
        method: "PUT",
        body: JSON.stringify(updates),
      }
    );
    return data;
  },
  
  async checkUsernameAvailability(username: string) {
    const data = await request<ApiResponse<{ available: boolean }>>(
      `/api/profile/username/${username}`
    );
    return data;
  },
  
  async getUserProfile(userId: string) {
    const data = await request<ApiResponse<{ profile: unknown }>>(
      `/api/profile/user/${userId}`
    );
    return data;
  },
  
  async updateGameStats(gameStats: any) {
    const data = await request<ApiResponse<{ profile: unknown }>>(
      "/api/profile/game-stats",
      {
        method: "PUT",
        body: JSON.stringify(gameStats),
      }
    );
    return data;
  },

  async updateLevelProgress(levelProgress: any) {
    const data = await request<ApiResponse<{ profile: unknown }>>(
      "/api/profile/level-progress",
      {
        method: "PUT",
        body: JSON.stringify(levelProgress),
      }
    );
    return data;
  },
  
  async deleteProfile() {
    const data = await request<ApiResponse<unknown>>("/api/profile/me", {
      method: "DELETE",
    });
    return data;
  },
  
  // Generic HTTP methods for flexibility
  async get(url: string) {
    return request<ApiResponse<any>>(url);
  },
  
  async post(url: string, data?: any) {
    return request<ApiResponse<any>>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  async put(url: string, data?: any) {
    return request<ApiResponse<any>>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  async delete(url: string) {
    return request<ApiResponse<any>>(url, {
      method: "DELETE",
    });
  },
  
  // Riddle endpoints
  async getRandomRiddle(params?: {
    levelId?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    type?: string;
    excludeSolved?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.levelId) queryParams.append('levelId', params.levelId.toString());
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.excludeSolved !== undefined) queryParams.append('excludeSolved', params.excludeSolved.toString());
    
    const url = `/riddles/random${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<ApiResponse<{
      riddle: {
        riddleId: string;
        levelId: number;
        question: string;
        answer: string;
        hint?: string;
        type: string;
        difficulty: 'easy' | 'medium' | 'hard';
        metadata?: any;
      };
      isNew: boolean;
      playerProgress: {
        playerId: string;
        solvedRiddleIds: string[];
        currentDifficulty: 'easy' | 'medium' | 'hard';
        lastPlayedTimestamp: string;
        levelProgress: Record<number, {
          completed: boolean;
          bestStars: number;
          attempts: number;
          bestTime?: number;
        }>;
        totalScore: number;
        achievements: string[];
      };
      nextRiddleHint?: string;
    }>>(url);
  },
  
  async getRiddlesByLevel(levelId: number) {
    return request<ApiResponse<Array<{
      riddleId: string;
      levelId: number;
      question: string;
      answer: string;
      hint?: string;
      type: string;
      difficulty: 'easy' | 'medium' | 'hard';
      metadata?: any;
    }>>>(`/riddles/level/${levelId}`);
  },
  
  async getRiddlesByDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
    return request<ApiResponse<Array<{
      riddleId: string;
      levelId: number;
      question: string;
      answer: string;
      hint?: string;
      type: string;
      difficulty: 'easy' | 'medium' | 'hard';
      metadata?: any;
    }>>>(`/riddles/difficulty/${difficulty}`);
  },
  
  async getRiddlesByType(type: string) {
    return request<ApiResponse<Array<{
      riddleId: string;
      levelId: number;
      question: string;
      answer: string;
      hint?: string;
      type: string;
      difficulty: 'easy' | 'medium' | 'hard';
      metadata?: any;
    }>>>(`/riddles/type/${type}`);
  },
  
  async validateRiddleAnswer(riddleId: string, answer: string) {
    return request<ApiResponse<{
      isValid?: boolean;
      isCorrect?: boolean;
      updatedProgress?: any;
    }>>("/riddles/validate", {
      method: "POST",
      body: JSON.stringify({ riddleId, answer }),
    });
  },
  
  async solveRiddle(riddleId: string, levelId: number, stars: number, completionTime?: number) {
    return request<ApiResponse<{
      playerId: string;
      solvedRiddleIds: string[];
      currentDifficulty: 'easy' | 'medium' | 'hard';
      lastPlayedTimestamp: string;
      levelProgress: Record<number, {
        completed: boolean;
        bestStars: number;
        attempts: number;
        bestTime?: number;
      }>;
      totalScore: number;
      achievements: string[];
    }>>("/riddles/solve", {
      method: "POST",
      body: JSON.stringify({ riddleId, levelId, stars, completionTime }),
    });
  },
  
  async getPlayerProgress() {
    return request<ApiResponse<{
      playerId: string;
      solvedRiddleIds: string[];
      currentDifficulty: 'easy' | 'medium' | 'hard';
      lastPlayedTimestamp: string;
      levelProgress: Record<number, {
        completed: boolean;
        bestStars: number;
        attempts: number;
        bestTime?: number;
      }>;
      totalScore: number;
      achievements: string[];
    }>>("/riddles/progress");
  },
};


