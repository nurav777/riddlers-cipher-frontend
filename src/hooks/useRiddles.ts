import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Riddle {
  riddleId: string;
  levelId: number;
  question: string;
  answer: string;
  hint?: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  metadata?: any;
}

export interface PlayerProgress {
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
}

export interface RiddleResponse {
  riddle: Riddle;
  isNew: boolean;
  playerProgress: PlayerProgress;
  nextRiddleHint?: string;
}

export const useRiddles = () => {
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get a random riddle
  const getRandomRiddle = useCallback(async (params?: {
    levelId?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    type?: string;
    excludeSolved?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getRandomRiddle(params);
      
      if (response.success && response.data) {
        setCurrentRiddle(response.data.riddle);
        setPlayerProgress(response.data.playerProgress);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get random riddle');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch riddle';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get riddles for a specific level
  const getRiddlesByLevel = useCallback(async (levelId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getRiddlesByLevel(levelId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get riddles for level');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch riddles';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate riddle answer
  const validateAnswer = useCallback(async (riddleId: string, answer: string) => {
    try {
      const response = await api.validateRiddleAnswer(riddleId, answer);
      
      console.log('🔍 Validation Response:', {
        success: response.success,
        message: response.message,
        data: response.data,
        isCorrect: response.data?.isCorrect,
      });
      
      // Handle validation response
      if (response.data !== undefined && response.data.isCorrect !== undefined) {
        console.log(`✅ Validation result: ${response.data.isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        return response.data.isCorrect;
      } else {
        // Only set error if there's no data at all
        const errorMessage = response.message || 'Failed to validate answer';
        console.error('❌ Validation error:', errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to validate answer';
      console.error('❌ Validation error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Solve riddle and update progress
  const solveRiddle = useCallback(async (
    riddleId: string, 
    levelId: number, 
    stars: number, 
    completionTime?: number
  ) => {
    try {
      const response = await api.solveRiddle(riddleId, levelId, stars, completionTime);
      
      if (response.success && response.data) {
        setPlayerProgress(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to solve riddle');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to solve riddle';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get player progress
  const getPlayerProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getPlayerProgress();
      
      if (response.success && response.data) {
        setPlayerProgress(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get player progress');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch player progress';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if riddle is solved
  const isRiddleSolved = useCallback((riddleId: string) => {
    return playerProgress?.solvedRiddleIds.includes(riddleId) || false;
  }, [playerProgress]);

  // Get level progress
  const getLevelProgress = useCallback((levelId: number) => {
    return playerProgress?.levelProgress[levelId] || {
      completed: false,
      bestStars: 0,
      attempts: 0,
    };
  }, [playerProgress]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentRiddle,
    playerProgress,
    loading,
    error,
    getRandomRiddle,
    getRiddlesByLevel,
    validateAnswer,
    solveRiddle,
    getPlayerProgress,
    isRiddleSolved,
    getLevelProgress,
    clearError,
  };
};
