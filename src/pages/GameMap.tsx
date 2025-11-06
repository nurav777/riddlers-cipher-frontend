import { useState } from 'react';
import { Lock, Star, Clock, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LevelState } from '@/types/game';

interface GameMapProps {
  levelsState: LevelState[];
  totalStars: number;
  onLevelSelect: (levelId: number) => void;
  backgroundImage?: string;
}

interface LevelMarkerProps {
  level: LevelState;
  onSelect: (levelId: number) => void;
}

const LevelMarker = ({ level, onSelect }: LevelMarkerProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case 'hard': return 'bg-red-500/20 border-red-500/40 text-red-400';
      default: return 'bg-secondary border-border';
    }
  };

  const handleClick = () => {
    if (level.isLocked) {
      // Show locked tooltip
      return;
    }
    onSelect(level.levelId);
  };

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: `${level.position.x}%`, top: `${level.position.y}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className={`level-marker ${level.isLocked ? 'locked' : ''} min-w-[160px]`}>
        {/* Level Number Badge */}
        <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center font-game text-lg font-bold z-10 shadow-lg ${
          level.isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground shadow-primary/40'
        }`}>
          {level.isLocked ? <Lock className="h-5 w-5" /> : level.levelId}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-game text-base font-bold truncate">
              {level.title}
            </h3>
            <Badge className={getDifficultyColor(level.difficulty)} variant="outline">
              {level.difficulty}
            </Badge>
          </div>

          {/* Stars Display */}
          <div className="flex gap-1">
            {[1, 2, 3].map((starIndex) => (
              <Star
                key={starIndex}
                className={`h-4 w-4 ${
                  starIndex <= level.bestStars 
                    ? 'gold-star animate-sparkle' 
                    : 'text-muted-foreground'
                }`}
                fill={starIndex <= level.bestStars ? 'currentColor' : 'none'}
              />
            ))}
          </div>

          {!level.isLocked && level.attempts > 0 && (
            <div className="text-sm text-muted-foreground">
              Best: {level.bestTime ? `${level.bestTime}s` : 'N/A'} • {level.attempts} attempts
            </div>
          )}
        </div>

        {/* Hover Tooltip */}
        {isHovered && !level.isLocked && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20 animate-fade-in">
            <div className="gotham-card p-4 min-w-[240px] border-batman/20">
              <div className="text-base space-y-2">
                <div className="font-game font-bold text-lg">{level.title}</div>
                <div className="text-muted-foreground">{level.description}</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 gold-star" />
                    {level.bestStars}/3 stars
                  </span>
                  {level.bestTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Best: {level.bestTime}s
                    </span>
                  )}
                </div>
                <div className="text-batman text-sm font-medium mt-2">
                  Click to play
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Locked Tooltip */}
        {isHovered && level.isLocked && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20 animate-fade-in">
            <div className="gotham-card p-4 min-w-[200px] border-riddler/20">
              <div className="text-base text-center">
                <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-muted-foreground">
                  Locked — Earn more stars to unlock
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export const GameMap = ({ levelsState, totalStars, onLevelSelect, backgroundImage }: GameMapProps) => {
  const maxStars = levelsState.length * 3; // 3 stars per level

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        {/* Enhanced atmospheric overlays for the Batman image */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-red-900/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-800/15 via-transparent to-red-800/15" />
        {/* Subtle dark overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Map Content */}
      <div className="relative z-10 w-full h-full">
        {/* Game Title - Enhanced Red Styling */}
        <div className="absolute top-8 left-8 z-20">
          <h1 className="font-game text-6xl font-bold text-primary neon-pulse relative batman-text-glow">
            GOTHAM
            {/* Multiple layered red glow effects */}
            <div className="absolute inset-0 font-game text-6xl font-bold text-primary opacity-40 blur-md">
              GOTHAM
            </div>
            <div className="absolute inset-0 font-game text-6xl font-bold text-primary opacity-20 blur-lg">
              GOTHAM
            </div>
          </h1>
          <p className="text-primary/80 text-base mt-2 font-game tracking-[0.2em] uppercase font-bold">
            DETECTIVE MAP
          </p>
          <div className="mt-1 w-32 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
        </div>

        {/* Progress HUD - Enhanced Red Styling */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-slide-up">
          <Card className="gotham-card border-primary/30 backdrop-blur-md shadow-2xl shadow-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-4">
                  <Star className="h-6 w-6 gold-star drop-shadow-lg" fill="currentColor" />
                  <span className="font-game text-lg font-bold text-primary">
                    Total Stars: {totalStars}/{maxStars}
                  </span>
                </div>
                <div className="progress-bar w-64 h-4">
                  <div 
                    className="progress-fill h-full"
                    style={{ width: `${(totalStars / maxStars) * 100}%` }}
                  />
                </div>
                <Badge variant="outline" className="border-primary/50 text-primary font-game text-base px-3 py-1">
                  <Target className="h-5 w-5 mr-2" />
                  {levelsState.filter(l => !l.isLocked).length} Unlocked
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Connection Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Shadows of Arkham → Gotham Underground */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <path
              d="M 20% 30% Q 30% 20% 40% 25%"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="8,4"
              fill="none"
              opacity="0.6"
              className="animate-pulse"
            />
          </svg>
          
          {/* Gotham Underground → The Narrows */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <path
              d="M 40% 25% Q 35% 45% 35% 65%"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="8,4"
              fill="none"
              opacity="0.6"
              className="animate-pulse"
            />
          </svg>
          
          {/* The Narrows → Wayne Tower */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <path
              d="M 35% 65% Q 50% 55% 60% 45%"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="8,4"
              fill="none"
              opacity="0.6"
              className="animate-pulse"
            />
          </svg>
          
          {/* Wayne Tower → Final Confrontation */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <path
              d="M 60% 45% Q 65% 35% 70% 25%"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="8,4"
              fill="none"
              opacity="0.6"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Level Markers */}
        <div className="absolute inset-0">
          {levelsState.map((level) => (
            <LevelMarker 
              key={level.levelId} 
              level={level} 
              onSelect={onLevelSelect}
            />
          ))}
        </div>

        {/* Random Riddle Button - Enhanced Red Styling */}
        <div className="absolute bottom-8 right-8 z-20">
          <Button 
            className="batman-glow font-game font-bold text-lg px-8 py-4 shadow-xl shadow-primary/30"
            onClick={() => {
              const unlockedLevels = levelsState.filter(l => !l.isLocked);
              if (unlockedLevels.length > 0) {
                const randomLevel = unlockedLevels[Math.floor(Math.random() * unlockedLevels.length)];
                onLevelSelect(randomLevel.levelId);
              }
            }}
          >
            <Zap className="h-6 w-6 mr-3" />
            Random Riddle
          </Button>
        </div>
      </div>
    </div>
  );
};