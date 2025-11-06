import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Lock, ArrowLeft, Play } from 'lucide-react';
import { LevelState } from '@/types/game';
import { cn } from '@/lib/utils';

interface LevelDetailPageProps {
  level: LevelState;
  totalStars: number;
  onBack: () => void;
  onStart: () => void;
}

const getLevelBackground = (levelId: number): string => {
  const backgrounds = {
    1: "bg-gradient-to-b from-slate-900 via-slate-800 to-red-900/20", // Arkham
    2: "bg-gradient-to-b from-gray-900 via-gray-800 to-green-900/20", // Underground
    3: "bg-gradient-to-b from-blue-900 via-slate-800 to-cyan-900/20", // Wayne Tower
    4: "bg-gradient-to-b from-slate-900 via-purple-900/50 to-red-900/30", // Narrows
    5: "bg-gradient-to-b from-red-900 via-black to-yellow-900/20" // Final
  };
  return backgrounds[levelId as keyof typeof backgrounds] || backgrounds[1];
};

const getLevelObjectives = (levelId: number): string[] => {
  const objectives = {
    1: [
      "Decrypt 3 basic substitution ciphers from Arkham's security logs",
      "Each riddle has a 5-minute time limit",
      "Uncover the hidden message before the asylum lockdown"
    ],
    2: [
      "Solve 3 transposition cipher clues in the underground tunnels", 
      "Navigate the rail system's encrypted messages",
      "Prevent the transportation network shutdown"
    ],
    3: [
      "Crack mixed cipher text and numeric puzzles",
      "Access Wayne Enterprises mainframe systems", 
      "Separate Riddler's false clues from real intelligence"
    ],
    4: [
      "Complete timed cipher hunt across multiple locations",
      "Follow location-based hints through the Narrows",
      "Catch Riddler before he disappears into the night"
    ],
    5: [
      "Master advanced cipher combinations",
      "Solve the ultimate 3-riddle sequence",
      "Save Gotham from Riddler's final scheme"
    ]
  };
  return objectives[levelId as keyof typeof objectives] || objectives[1];
};

const getStartButtonText = (levelId: number): string => {
  const buttonTexts = {
    1: "Enter Arkham",
    2: "Descend Underground", 
    3: "Secure Wayne Tower",
    4: "Pursue Riddler",
    5: "Face the Riddler"
  };
  return buttonTexts[levelId as keyof typeof buttonTexts] || "Start Mission";
};

const getRequiredStars = (levelId: number): number => {
  const requirements = { 1: 0, 2: 2, 3: 4, 4: 7, 5: 10 };
  return requirements[levelId as keyof typeof requirements] || 0;
};

export const LevelDetailPage: React.FC<LevelDetailPageProps> = ({ 
  level, 
  totalStars, 
  onBack, 
  onStart 
}) => {
  const isLocked = level.isLocked;
  const requiredStars = getRequiredStars(level.levelId);
  const objectives = getLevelObjectives(level.levelId);
  const startButtonText = getStartButtonText(level.levelId);
  const backgroundClass = getLevelBackground(level.levelId);

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      backgroundClass
    )}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-red-300 hover:text-red-100 hover:bg-red-900/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Map
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-game text-lg">{totalStars}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Level {level.levelId} of 5
            </Badge>
          </div>
        </div>

        {/* Level Title */}
        <div className="text-center mb-12">
          <h1 className="font-game text-5xl md:text-7xl font-bold text-red-300 mb-4 text-shadow-red tracking-wider">
            {level.title.toUpperCase()}
          </h1>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-lg px-4 py-2",
              level.difficulty === 'easy' && "bg-green-900/50 text-green-300 border-green-500/50",
              level.difficulty === 'medium' && "bg-yellow-900/50 text-yellow-300 border-yellow-500/50", 
              level.difficulty === 'hard' && "bg-red-900/50 text-red-300 border-red-500/50"
            )}
          >
            {level.difficulty.toUpperCase()}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Mission Briefing */}
          <Card className="gotham-card border-red-500/30 bg-black/60 backdrop-blur-sm">
            <div className="p-6">
              <h2 className="font-game text-2xl text-red-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Mission Briefing
              </h2>
              <p className="text-red-100/90 leading-relaxed font-ui">
                {level.description}
              </p>
            </div>
          </Card>

          {/* Objectives Panel */}
          <Card className="gotham-card border-red-500/30 bg-black/60 backdrop-blur-sm">
            <div className="p-6">
              <h2 className="font-game text-2xl text-red-300 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Objectives
              </h2>
              <ul className="space-y-3">
                {objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3 text-red-100/90">
                    <span className="w-6 h-6 rounded-full bg-red-900/50 border border-red-500/50 flex items-center justify-center text-xs font-bold text-red-300 shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="font-ui">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Rewards Panel */}
          <Card className="gotham-card border-yellow-500/30 bg-black/60 backdrop-blur-sm">
            <div className="p-6">
              <h2 className="font-game text-2xl text-yellow-300 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 fill-current" />
                Rewards System
              </h2>
              
              {/* Star Display */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3].map((starNum) => (
                  <div key={starNum} className="relative">
                    <Star 
                      className={cn(
                        "w-8 h-8 transition-all duration-300",
                        level.bestStars >= starNum 
                          ? "text-yellow-400 fill-current animate-pulse" 
                          : "text-gray-600"
                      )} 
                    />
                  </div>
                ))}
              </div>

              {/* Star Requirements */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-yellow-200/80">
                  <span>⭐ Solve 1 riddle</span>
                  <span>1 star</span>
                </div>
                <div className="flex items-center justify-between text-yellow-200/80">
                  <span>⭐⭐ Solve 2 riddles under time</span>
                  <span>2 stars</span>
                </div>
                <div className="flex items-center justify-between text-yellow-200/80">
                  <span>⭐⭐⭐ Solve all riddles under time</span>
                  <span>3 stars</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Progress & Start */}
          <Card className="gotham-card border-red-500/30 bg-black/60 backdrop-blur-sm">
            <div className="p-6">
              <h2 className="font-game text-2xl text-red-300 mb-4">Mission Status</h2>
              
              {level.attempts > 0 && (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm text-red-200/80">
                    <span>Previous Attempts:</span>
                    <span>{level.attempts}</span>
                  </div>
                  {level.bestStars > 0 && (
                    <div className="flex justify-between text-sm text-yellow-300">
                      <span>Best Performance:</span>
                      <span>{level.bestStars} ⭐</span>
                    </div>
                  )}
                </div>
              )}

              {isLocked ? (
                <div className="text-center">
                  <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-300 mb-2 font-ui">
                    Collect {requiredStars} stars to unlock
                  </p>
                  <p className="text-red-500 text-sm font-ui">
                    Current: {totalStars}/{requiredStars}
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={onStart}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-game text-lg py-6 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {startButtonText}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};