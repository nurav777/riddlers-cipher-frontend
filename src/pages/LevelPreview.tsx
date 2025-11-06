import { Star, Clock, Target, Play, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LevelState } from '@/types/game';
import { LevelDetailPage } from './LevelDetailPage';

interface LevelPreviewProps {
  level: LevelState | null;
  isOpen: boolean;
  onClose: () => void;
  onStartLevel: (levelId: number) => void;
  totalStars: number;
  showFullPage?: boolean;
}

export const LevelPreview = ({ level, isOpen, onClose, onStartLevel, totalStars, showFullPage }: LevelPreviewProps) => {
  if (!level) return null;

  // Show full page version for detailed level view
  if (showFullPage) {
    return (
      <LevelDetailPage 
        level={level}
        totalStars={totalStars}
        onBack={onClose}
        onStart={() => onStartLevel(level.levelId)}
      />
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case 'hard': return 'bg-red-500/20 border-red-500/40 text-red-400';
      default: return 'bg-secondary border-border';
    }
  };

  const getDifficultyDescription = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Perfect for warming up your detective skills';
      case 'medium': return 'A balanced challenge for experienced sleuths';
      case 'hard': return 'Only the sharpest minds prevail here';
      default: return '';
    }
  };

  const getTimePerRiddle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '3:00';
      case 'medium': return '2:30';
      case 'hard': return '2:00';
      default: return '2:30';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gotham-card max-w-6xl w-[95vw] border-batman/20">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Badge className={getDifficultyColor(level.difficulty)} variant="outline">
              {level.difficulty.toUpperCase()}
            </Badge>
            <div className="w-8 h-8 rounded-full bg-batman text-batman-foreground flex items-center justify-center font-game text-sm font-bold">
              {level.levelId}
            </div>
          </div>
          <DialogTitle className="font-game text-3xl text-batman">
            {level.title}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {getDifficultyDescription(level.difficulty)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column - Mission Brief */}
          <div className="space-y-4">
            <Card className="border-batman/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-game">Mission Brief</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-foreground text-base leading-relaxed">
                  {level.description}
                </p>
              </CardContent>
            </Card>

            {/* Level Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-batman/10">
                <CardContent className="p-3 text-center">
                  <Target className="h-5 w-5 mx-auto mb-1 text-batman" />
                  <div className="font-game text-base font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Riddles</div>
                </CardContent>
              </Card>

              <Card className="border-batman/10">
                <CardContent className="p-3 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-riddler" />
                  <div className="font-game text-base font-bold">{getTimePerRiddle(level.difficulty)}</div>
                  <div className="text-sm text-muted-foreground">Per Riddle</div>
                </CardContent>
              </Card>

              <Card className="border-batman/10">
                <CardContent className="p-3 text-center">
                  <Star className="h-5 w-5 mx-auto mb-1 gold-star" fill="currentColor" />
                  <div className="font-game text-base font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Max Stars</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Progress and Scoring */}
          <div className="space-y-4">
            {/* Current Progress */}
            {level.attempts > 0 && (
              <Card className="border-gold/20 bg-gold/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-game flex items-center gap-2">
                    <Star className="h-5 w-5 gold-star" fill="currentColor" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((starIndex) => (
                        <Star
                          key={starIndex}
                          className={`h-4 w-4 ${
                            starIndex <= level.bestStars 
                              ? 'gold-star' 
                              : 'text-muted-foreground'
                          }`}
                          fill={starIndex <= level.bestStars ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {level.attempts} attempt{level.attempts !== 1 ? 's' : ''}
                      {level.bestTime && ` • ${level.bestTime}s`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Star Scoring System */}
            <Card className="border-riddler/20 bg-riddler/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-game text-riddler">
                  Star Scoring System
                </CardTitle>
                <CardDescription className="text-sm">
                  How to maximize your detective score
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Solve within 30% of time limit</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((star) => (
                        <Star key={star} className="h-3 w-3 gold-star" fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Solve within 60% of time limit</span>
                    <div className="flex gap-1">
                      {[1, 2].map((star) => (
                        <Star key={star} className="h-3 w-3 gold-star" fill="currentColor" />
                      ))}
                      <Star className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Solve before timeout</span>
                    <div className="flex gap-1">
                      <Star className="h-3 w-3 gold-star" fill="currentColor" />
                      <Star className="h-3 w-3 text-muted-foreground" />
                      <Star className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-sm">Use hint or timeout</span>
                    <div className="flex gap-1">
                      <Star className="h-3 w-3 text-muted-foreground" />
                      <Star className="h-3 w-3 text-muted-foreground" />
                      <Star className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons - Full Width */}
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose} size="sm">
            Back to Map
          </Button>
          <Button 
            className="batman-glow font-game flex items-center gap-2"
            onClick={() => onStartLevel(level.levelId)}
            size="sm"
          >
            <Play className="h-4 w-4" />
            Start Level
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};