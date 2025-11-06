import { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { UserPanel } from '@/pages/UserPanel';
import { Tutorial } from '@/pages/Tutorial';
import { GameMap } from '@/pages/GameMap';
import { LevelPreview } from '@/pages/LevelPreview';
import { LevelPlaygroundAPI } from '@/pages/LevelPlaygroundAPI';
import { StarsModal } from '@/pages/StarsModal';
import { SettingsModal } from '@/pages/SettingsModal';
import { LevelState } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { usePollyNarration } from '@/hooks/usePollyNarration';

interface GothamGameProps {
  backgroundImage?: string;
}

export const GothamGame = ({ backgroundImage }: GothamGameProps) => {
  const { gameState, updateUserProfile, earnStars, completeTutorial, updateUIState, refreshFromStorage } = useGameState();
  const { toast } = useToast();
  
  // Track current user ID to detect user changes
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [selectedLevel, setSelectedLevel] = useState<LevelState | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLevelPreview, setShowLevelPreview] = useState(false);
  const [showStarsModal, setShowStarsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Polly narration for game events
  const { speak, isEnabled } = usePollyNarration({
    enabled: gameState.uiState.narrationOn,
    onStart: () => console.log('Game narration started'),
    onEnd: () => console.log('Game narration ended'),
    onError: (error) => console.error('Game narration error:', error)
  });

  // Initialize tutorial state - only show if tutorial not seen AND on tutorial page
  useEffect(() => {
    if (!gameState.userProfile.tutorialSeen && gameState.uiState.currentPage === 'tutorial') {
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
    }
  }, [gameState.userProfile.tutorialSeen, gameState.uiState.currentPage]);

  // Track user changes and refresh game state
  useEffect(() => {
    const storedUserId = localStorage.getItem('CURRENT_USER_ID');
    
    // If user ID changed, force refresh
    if (storedUserId !== currentUserId) {
      console.log('User changed, refreshing game state. Old:', currentUserId, 'New:', storedUserId);
      setCurrentUserId(storedUserId);
      refreshFromStorage();
    }
  }, [currentUserId, refreshFromStorage]);

  // Refresh game state from localStorage on mount (useful after login)
  useEffect(() => {
    // Immediate refresh
    refreshFromStorage();
    
    // Also refresh after a short delay to catch any delayed localStorage updates
    const timeoutId = setTimeout(() => {
      refreshFromStorage();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [refreshFromStorage]);

  // Periodic check to ensure game state stays in sync - DISABLED to prevent reverting progress
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const storedUserId = localStorage.getItem('CURRENT_USER_ID');
  //     if (storedUserId !== currentUserId) {
  //       console.log('Periodic check: User changed, refreshing');
  //       setCurrentUserId(storedUserId);
  //       refreshFromStorage();
  //     }
  //   }, 1000); // Check every second

  //   return () => clearInterval(interval);
  // }, [currentUserId, refreshFromStorage]);

  // Handle narration toggle
  const handleNarrationToggle = () => {
    const newNarrationState = !gameState.uiState.narrationOn;
    updateUIState({ narrationOn: newNarrationState });
    
    toast({
      title: newNarrationState ? "Narration enabled" : "Narration disabled",
      description: newNarrationState 
        ? "Alfred will guide you through your missions" 
        : "Silent mode activated",
      duration: 2000,
    });
  };

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    completeTutorial();
    updateUIState({ currentPage: 'map' }); // Ensure we go to map after tutorial

    // Narrate welcome message
    if (isEnabled) {
      speak("Welcome to Gotham, Detective. Your mission begins now. Choose your first challenge.");
    }

    toast({
      title: "Welcome to Gotham, Detective",
      description: "Your mission begins now. Choose your first challenge.",
      duration: 3000,
    });
  };

  // Handle level selection from map
  const handleLevelSelect = (levelId: number) => {
    const level = gameState.levelsState.find(l => l.levelId === levelId);
    if (!level) return;

    if (level.isLocked) {
      // Narrate locked level message
      if (isEnabled) {
        speak("This level is locked. Earn more stars to unlock this challenge.");
      }
      
      toast({
        title: "Level Locked",
        description: "Earn more stars to unlock this challenge",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Narrate level selection
    if (isEnabled) {
      speak(`Level ${levelId} selected. ${level.title}. ${level.description}`);
    }

    setSelectedLevel(level);
    setShowLevelPreview(true);
  };

  // Handle starting a level
  const handleStartLevel = (levelId: number) => {
    setShowLevelPreview(false);
    setSelectedLevel(null);
    
    // Navigate to level playground
    const level = gameState.levelsState.find(l => l.levelId === levelId);
    if (level) {
      // Narrate level start
      if (isEnabled) {
        speak(`Starting level ${levelId}. Good luck, Detective.`);
      }
      
      setSelectedLevel(level);
      updateUIState({ currentPage: 'level' });
    }
  };

  // Handle level completion from playground
  const handleLevelComplete = (levelId: number, stars: number) => {
    earnStars(levelId, stars);
    updateUIState({ currentPage: 'map' });
    setSelectedLevel(null);
    
    // Narrate completion message
    if (isEnabled) {
      if (stars > 0) {
        speak(`Excellent work, Detective! Level ${levelId} completed with ${stars} stars. Well done!`);
      } else {
        speak("The Riddler's challenge remains unsolved. Try again, Detective.");
      }
    }
    
    toast({
      title: stars > 0 ? `+${stars} stars earned!` : "Mission incomplete",
      description: stars > 0 
        ? `Well done, Batman! Level ${levelId} completed with ${stars} stars.`
        : "The Riddler's challenge remains unsolved. Try again?",
      variant: stars > 0 ? "default" : "destructive",
      duration: 4000,
    });
  };

  // Handle replay tutorial
  const handleReplayTutorial = () => {
    setShowTutorial(true);
    updateUIState({ currentPage: 'tutorial' }); // Set page to tutorial when replaying
    // Don't update tutorialSeen - allow replaying
  };

  // Handle stars modal
  const handleShowStarsModal = () => {
    setShowStarsModal(true);
  };

  // Handle settings modal
  const handleShowSettings = () => {
    setShowSettingsModal(true);
  };

  // Handle settings save
  const handleSaveSettings = (settings: any) => {
    // Here you would typically save settings to localStorage or a backend
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
      duration: 2000,
    });
  };

  // Handle reset progress
  const handleResetProgress = () => {
    // Reset all game progress
    updateUserProfile({ 
      totalStars: 0, 
      tutorialSeen: false 
    });
    toast({
      title: "Progress reset",
      description: "All your progress has been cleared",
      variant: "destructive",
      duration: 3000,
    });
  };

  return (
    <div 
      className="min-h-screen text-foreground"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Persistent User Panel */}
      <UserPanel
        userProfile={gameState.userProfile}
        narrationOn={gameState.uiState.narrationOn}
        onNarrationToggle={handleNarrationToggle}
        onReplayTutorial={handleReplayTutorial}
        onShowStarsModal={handleShowStarsModal}
        onShowSettings={handleShowSettings}
      />

      {/* Main Game Area */}
      {gameState.uiState.currentPage === 'map' && (
        <GameMap
          levelsState={gameState.levelsState}
          totalStars={gameState.userProfile.totalStars}
          onLevelSelect={handleLevelSelect}
          backgroundImage={backgroundImage}
        />
      )}

      {/* Level Playground */}
      {gameState.uiState.currentPage === 'level' && selectedLevel && (
        <LevelPlaygroundAPI
          level={selectedLevel}
          onBack={() => {
            updateUIState({ currentPage: 'map' });
            setSelectedLevel(null);
          }}
          onComplete={handleLevelComplete}
          backgroundImage={backgroundImage}
        />
      )}

      {/* Tutorial Modal */}
      <Tutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
        narrationOn={gameState.uiState.narrationOn}
      />

      {/* Level Preview Modal */}
      <LevelPreview
        level={selectedLevel}
        isOpen={showLevelPreview}
        onClose={() => {
          setShowLevelPreview(false);
          setSelectedLevel(null);
        }}
        onStartLevel={handleStartLevel}
        totalStars={gameState.userProfile.totalStars}
        showFullPage={false}
      />

      {/* Stars Modal */}
      <StarsModal
        isOpen={showStarsModal}
        onClose={() => setShowStarsModal(false)}
        userProfile={gameState.userProfile}
        levelsState={gameState.levelsState}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        narrationOn={gameState.uiState.narrationOn}
        onNarrationToggle={handleNarrationToggle}
        onResetProgress={handleResetProgress}
        onSaveSettings={handleSaveSettings}
      />

      {/* Welcome Message for New Users - Only show once */}
      {!gameState.userProfile.tutorialSeen && gameState.uiState.currentPage === 'map' && !showTutorial && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 animate-fade-in">
          <div className="gotham-card p-6 text-center border-batman/20 backdrop-blur-md">
            <h2 className="font-game text-xl text-batman mb-2">
              Welcome, Detective
            </h2>
            <p className="text-muted-foreground mb-4">
              Ready to start your mission? You can replay the tutorial anytime.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowTutorial(true);
                  updateUIState({ currentPage: 'tutorial' });
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Show Tutorial
              </button>
              <button
                onClick={() => updateUserProfile({ tutorialSeen: true })}
                className="px-4 py-2 bg-batman text-batman-foreground rounded-lg hover:bg-batman/90 transition-colors batman-glow"
              >
                Start Mission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default GothamGame;