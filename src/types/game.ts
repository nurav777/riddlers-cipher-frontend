// Game state types for Gotham Riddle Game

export interface UserProfile {
  username: string;
  avatarUrl?: string;
  totalStars: number;
  tutorialSeen: boolean;
  lastSavedAt?: string;
}

export interface LevelState {
  levelId: number;
  isLocked: boolean;
  bestStars: number;
  bestTime?: number;
  attempts: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  position: { x: number; y: number };
  background?: string;
  objectives?: string[];
  startButtonText?: string;
  riddleCount?: number;
  timeLimit?: number;
}

export interface GameState {
  userProfile: UserProfile;
  levelsState: LevelState[];
  uiState: {
    currentPage: 'tutorial' | 'map' | 'level';
    modalOpen: string | null;
    narrationOn: boolean;
  };
}

export interface TutorialSlide {
  id: number;
  title: string;
  content: string;
  microcopy?: string;
  visual?: string;
  bullets?: string[];
}