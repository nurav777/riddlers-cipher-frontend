import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, UserProfile, LevelState } from '@/types/game';
import { api } from '@/lib/api';

const STORAGE_KEYS = {
  USER_PROFILE: 'gotham_user_profile',
  LEVELS_STATE: 'gotham_levels_state',
  UI_STATE: 'gotham_ui_state',
};

// Initial levels data
const INITIAL_LEVELS: LevelState[] = [
  {
    levelId: 1,
    isLocked: false,
    bestStars: 0,
    attempts: 0,
    title: "Shadows of Arkham",
    description: "Riddler has hidden a code inside Arkham's security logs. Batman must decrypt it before chaos erupts in Gotham's most dangerous asylum.",
    difficulty: 'easy',
    position: { x: 20, y: 30 }
  },
  {
    levelId: 2,
    isLocked: true,
    bestStars: 0,
    attempts: 0,
    title: "Gotham Underground",
    description: "Riddler has taken control of Gotham's underground rail system. Navigate the dark tunnels and decrypt his twisted messages before the city's transportation network falls into chaos.",
    difficulty: 'easy',
    position: { x: 40, y: 25 }
  },
  {
    levelId: 3,
    isLocked: true,
    bestStars: 0,
    attempts: 0,
    title: "Wayne Tower Break-In",
    description: "Riddler has planted false clues in Wayne Enterprises mainframe. Infiltrate the tower's security systems and separate truth from deception in the heart of Bruce Wayne's empire.",
    difficulty: 'medium',
    position: { x: 60, y: 45 }
  },
  {
    levelId: 4,
    isLocked: true,
    bestStars: 0,
    attempts: 0,
    title: "The Narrows Pursuit",
    description: "Chase clues across the Narrows before Riddler escapes into Gotham's most dangerous district. Time is running out as rain washes away the evidence.",
    difficulty: 'medium',
    position: { x: 35, y: 65 }
  },
  {
    levelId: 5,
    isLocked: true,
    bestStars: 0,
    attempts: 0,
    title: "Final Confrontation",
    description: "The ultimate puzzle that holds Gotham's fate. Face Riddler in a rooftop showdown where only the sharpest mind will prevent the city's destruction.",
    difficulty: 'hard',
    position: { x: 70, y: 25 }
  }
];

export const useGameState = () => {
  const saveToDynamoDBRef = useRef<any>();

  const [gameState, setGameState] = useState<GameState>(() => {
    // Load from localStorage or use defaults
    const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const savedLevels = localStorage.getItem(STORAGE_KEYS.LEVELS_STATE);
    const savedUI = localStorage.getItem(STORAGE_KEYS.UI_STATE);

    return {
      userProfile: savedProfile ? JSON.parse(savedProfile) : {
        username: 'BATMAN_01',
        totalStars: 0,
        tutorialSeen: false,
      },
      levelsState: savedLevels ? JSON.parse(savedLevels) : INITIAL_LEVELS,
      uiState: savedUI ? JSON.parse(savedUI) : {
        currentPage: 'map', // Start on map instead of tutorial
        modalOpen: null,
        narrationOn: false,
      },
    };
  });

  // Listen for localStorage changes to sync with login
  useEffect(() => {
    const handleStorageChange = () => {
      const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      const savedLevels = localStorage.getItem(STORAGE_KEYS.LEVELS_STATE);
      if (savedProfile && savedLevels) {
        const profileData = JSON.parse(savedProfile);
        const levelsData = JSON.parse(savedLevels);
        setGameState(prev => ({
          ...prev,
          userProfile: profileData,
          levelsState: levelsData
        }));
        console.log('Game state updated from localStorage:', profileData, levelsData);
      }
    };

    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom userProfileUpdated event (from login)
    const handleUserProfileUpdate = (event: CustomEvent) => {
      console.log('Custom userProfileUpdated event received:', event.detail);
      setGameState(prev => ({
        ...prev,
        userProfile: event.detail
      }));
    };
    window.addEventListener('userProfileUpdated', handleUserProfileUpdate as EventListener);

    // Periodic sync DISABLED to prevent reverting progress after level completion
    // const interval = setInterval(() => {
    //   const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    //   const savedLevels = localStorage.getItem(STORAGE_KEYS.LEVELS_STATE);
    //   if (savedProfile && savedLevels) {
    //     const profileData = JSON.parse(savedProfile);
    //     const levelsData = JSON.parse(savedLevels);
    //     setGameState(prev => {
    //       // Only update if the profile or levels have actually changed
    //       if (JSON.stringify(prev.userProfile) !== JSON.stringify(profileData) ||
    //           JSON.stringify(prev.levelsState) !== JSON.stringify(levelsData)) {
    //         console.log('Game state synced with localStorage:', profileData, levelsData);
    //         return {
    //           ...prev,
    //           userProfile: profileData,
    //           levelsState: levelsData
    //         };
    //       }
    //       return prev;
    //     });
    //   }
    // }, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleUserProfileUpdate as EventListener);
      // clearInterval(interval);
    };
  }, []);

  // Save to localStorage only (DynamoDB saves happen on specific actions)
  const saveProgress = useCallback(() => {
    const timestamp = new Date().toISOString();
    const updatedProfile = { ...gameState.userProfile, lastSavedAt: timestamp };
    
    // Save to localStorage only
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
    localStorage.setItem(STORAGE_KEYS.LEVELS_STATE, JSON.stringify(gameState.levelsState));
    localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(gameState.uiState));
    
    setGameState(prev => ({ ...prev, userProfile: updatedProfile }));
  }, [gameState]);

  // Save to DynamoDB only when user makes actual progress
  const saveToDynamoDB = useCallback(async (updatedLevels?: LevelState[]) => {
    try {
      // Use provided updated levels or current state
      const levelsToUse = updatedLevels || gameState.levelsState;

      // Calculate game stats from current state
      const totalStars = levelsToUse.reduce((sum, level) => sum + level.bestStars, 0);
      const levelsCompleted = levelsToUse.filter(level => level.bestStars > 0).length;
      const playTime = gameState.userProfile.totalStars || 0;

      const gameStats = {
        totalScore: totalStars,
        levelsCompleted,
        achievements: [],
        playTime,
        lastLevelPlayed: levelsToUse.find(level => level.bestStars > 0)?.title || null
      };

      console.log('Attempting to save to DynamoDB:', { gameStats, levels: levelsToUse });

      // Save to DynamoDB - these are PUT requests
      const gameStatsResponse = await api.updateGameStats(gameStats);
      console.log('Game stats response:', gameStatsResponse);

      const levelProgressResponse = await api.updateLevelProgress({ levels: levelsToUse });
      console.log('Level progress response:', levelProgressResponse);

      console.log('Progress saved to DynamoDB successfully');

      // Also update localStorage with the latest data
      const updatedProfile = { ...gameState.userProfile, totalStars, lastSavedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
      localStorage.setItem(STORAGE_KEYS.LEVELS_STATE, JSON.stringify(levelsToUse));

      // Also update the 'userProfile' key that login uses
      const existingProfile = localStorage.getItem('userProfile');
      if (existingProfile) {
        const profile = JSON.parse(existingProfile);
        localStorage.setItem('userProfile', JSON.stringify({
          ...profile,
          gameStats: {
            ...profile.gameStats,
            totalScore: totalStars,
            levelsCompleted,
            playTime,
            lastLevelPlayed: levelsToUse.find(level => level.bestStars > 0)?.title || null
          },
          levelProgress: { levels: levelsToUse }
        }));
      }
    } catch (error) {
      console.error('Failed to save progress to DynamoDB:', error);
      // Don't throw error to prevent breaking the game flow
    }
  }, [gameState]);

  // Update user profile
  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setGameState(prev => ({
      ...prev,
      userProfile: { ...prev.userProfile, ...updates },
    }));
  }, []);

  // Force refresh from localStorage (useful after login)
  const refreshFromStorage = useCallback(() => {
    const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const savedLevels = localStorage.getItem(STORAGE_KEYS.LEVELS_STATE);
    const savedUI = localStorage.getItem(STORAGE_KEYS.UI_STATE);

    console.log('refreshFromStorage - savedProfile:', savedProfile);
    console.log('refreshFromStorage - savedLevels:', savedLevels);
    console.log('refreshFromStorage - savedUI:', savedUI);

    // Always refresh the entire game state from localStorage
    const newGameState = {
      userProfile: savedProfile ? JSON.parse(savedProfile) : {
        username: 'BATMAN_01',
        totalStars: 0,
        tutorialSeen: false,
      },
      levelsState: savedLevels ? JSON.parse(savedLevels) : INITIAL_LEVELS,
      uiState: savedUI ? JSON.parse(savedUI) : {
        currentPage: 'map', // Start on map instead of tutorial
        modalOpen: null,
        narrationOn: false,
      },
    };

    console.log('refreshFromStorage - newGameState:', newGameState);
    setGameState(newGameState);
    console.log('Game state completely refreshed from localStorage');

    // Also update the 'userProfile' key that login uses to match
    const existingProfile = localStorage.getItem('userProfile');
    if (existingProfile) {
      const profile = JSON.parse(existingProfile);
      const totalStars = newGameState.levelsState.reduce((sum, level) => sum + level.bestStars, 0);
      const levelsCompleted = newGameState.levelsState.filter(level => level.bestStars > 0).length;

      localStorage.setItem('userProfile', JSON.stringify({
        ...profile,
        gameStats: {
          ...profile.gameStats,
          totalScore: totalStars,
          levelsCompleted,
          playTime: profile.gameStats?.playTime || 0,
          lastLevelPlayed: newGameState.levelsState.find(level => level.bestStars > 0)?.title || null
        },
        levelProgress: { levels: newGameState.levelsState }
      }));
    }
  }, []);

  // Update level state
  const updateLevelState = useCallback((levelId: number, updates: Partial<LevelState>) => {
    setGameState(prev => ({
      ...prev,
      levelsState: prev.levelsState.map(level => 
        level.levelId === levelId ? { ...level, ...updates } : level
      ),
    }));
  }, []);

  // Earn stars and check for unlocks
  const earnStars = useCallback((levelId: number, stars: number) => {
    let levelsWithUnlocks: LevelState[] = [];

    setGameState(prev => {
      const updatedLevels = prev.levelsState.map(level => {
        if (level.levelId === levelId) {
          return {
            ...level,
            bestStars: Math.max(level.bestStars, stars),
            attempts: level.attempts + 1
          };
        }
        return level;
      });

      // Calculate total stars
      const totalStars = updatedLevels.reduce((sum, level) => sum + level.bestStars, 0);

      // Check for level unlocks based on stars earned
      levelsWithUnlocks = updatedLevels.map(level => {
        if (level.isLocked) {
          // Level 2 unlocks after earning 2 stars
          if (level.levelId === 2 && totalStars >= 2) {
            return { ...level, isLocked: false };
          }
          // Level 3 unlocks after earning 4 stars
          if (level.levelId === 3 && totalStars >= 4) {
            return { ...level, isLocked: false };
          }
          // Level 4 unlocks after earning 7 stars
          if (level.levelId === 4 && totalStars >= 7) {
            return { ...level, isLocked: false };
          }
          // Level 5 unlocks after earning 10 stars
          if (level.levelId === 5 && totalStars >= 10) {
            return { ...level, isLocked: false };
          }
        }
        return level;
      });

      return {
        ...prev,
        userProfile: { ...prev.userProfile, totalStars },
        levelsState: levelsWithUnlocks,
      };
    });

    // Save to DynamoDB when stars are earned (actual progress)
    setTimeout(() => {
      saveToDynamoDB(levelsWithUnlocks);
    }, 1000); // Small delay to ensure state is updated
  }, []);

  // Complete tutorial
  const completeTutorial = useCallback(() => {
    updateUserProfile({ tutorialSeen: true });
    setGameState(prev => ({
      ...prev,
      uiState: { ...prev.uiState, currentPage: 'map' },
    }));
  }, [updateUserProfile]);

  // Update UI state
  const updateUIState = useCallback((updates: Partial<typeof gameState.uiState>) => {
    setGameState(prev => ({
      ...prev,
      uiState: { ...prev.uiState, ...updates },
    }));
  }, []);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [gameState, saveProgress]);

  return {
    gameState,
    updateUserProfile,
    updateLevelState,
    earnStars,
    completeTutorial,
    updateUIState,
    saveProgress,
    saveToDynamoDB,
    refreshFromStorage,
  };
};