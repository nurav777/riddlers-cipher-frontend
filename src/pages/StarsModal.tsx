import { Star, Trophy, Target, Clock } from 'lucide-react';
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
import { LevelState, UserProfile } from '@/types/game';

interface StarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  levelsState: LevelState[];
}

export const StarsModal = ({ isOpen, onClose, userProfile, levelsState }: StarsModalProps) => {
  const completedLevels = levelsState.filter(level => level.bestStars > 0);
  const perfectLevels = levelsState.filter(level => level.bestStars === 9);
  const averageStarsPerLevel = completedLevels.length > 0 
    ? (userProfile.totalStars / completedLevels.length).toFixed(1)
    : '0.0';

  const getStarsByDifficulty = (difficulty: string) => {
    return levelsState
      .filter(level => level.difficulty === difficulty)
      .reduce((sum, level) => sum + level.bestStars, 0);
  };

  const achievements = [
    {
      id: 1,
      name: 'First Steps',
      description: 'Complete your first riddle',
      earned: userProfile.totalStars > 0,
      icon: <Star className="h-5 w-5" />,
    },
    {
      id: 2,
      name: 'Rising Detective',
      description: 'Earn 10 total stars',
      earned: userProfile.totalStars >= 10,
      icon: <Target className="h-5 w-5" />,
    },
    {
      id: 3,
      name: 'Perfect Solver',
      description: 'Get 9 stars on any level',
      earned: perfectLevels.length > 0,
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      id: 4,
      name: 'Speed Demon',
      description: 'Complete 5 levels',
      earned: completedLevels.length >= 5,
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gotham-card max-w-4xl max-h-[90vh] overflow-y-auto border-batman/20">
        <DialogHeader>
          <DialogTitle className="font-game text-2xl text-batman flex items-center gap-2">
            <Star className="h-6 w-6 gold-star" fill="currentColor" />
            Detective Progress
          </DialogTitle>
          <DialogDescription>
            Your journey through Gotham's challenges
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-gold/20 bg-gold/5">
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 gold-star" fill="currentColor" />
                <div className="font-game text-2xl font-bold text-gold">
                  {userProfile.totalStars}
                </div>
                <div className="text-sm text-muted-foreground">Total Stars</div>
              </CardContent>
            </Card>

            <Card className="border-batman/20">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-batman" />
                <div className="font-game text-2xl font-bold">
                  {completedLevels.length}
                </div>
                <div className="text-sm text-muted-foreground">Levels Completed</div>
              </CardContent>
            </Card>

            <Card className="border-batman/20">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-riddler" />
                <div className="font-game text-2xl font-bold">
                  {perfectLevels.length}
                </div>
                <div className="text-sm text-muted-foreground">Perfect Scores</div>
              </CardContent>
            </Card>

            <Card className="border-batman/20">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-foreground" />
                <div className="font-game text-2xl font-bold">
                  {averageStarsPerLevel}
                </div>
                <div className="text-sm text-muted-foreground">Avg Stars/Level</div>
              </CardContent>
            </Card>
          </div>

          {/* Stars by Difficulty */}
          <Card>
            <CardHeader>
              <CardTitle className="font-game">Stars by Difficulty</CardTitle>
              <CardDescription>
                Your performance across different challenge levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['easy', 'medium', 'hard'].map((difficulty) => {
                  const stars = getStarsByDifficulty(difficulty);
                  const maxStars = levelsState.filter(l => l.difficulty === difficulty).length * 3;
                  const percentage = maxStars > 0 ? (stars / maxStars) * 100 : 0;
                  
                  return (
                    <div key={difficulty} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className={
                              difficulty === 'easy' 
                                ? 'border-green-500/40 text-green-400'
                                : difficulty === 'medium'
                                ? 'border-yellow-500/40 text-yellow-400'
                                : 'border-red-500/40 text-red-400'
                            }
                          >
                            {difficulty.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="font-game text-sm">
                          {stars}/{maxStars} stars
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Level Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="font-game">Level Performance</CardTitle>
              <CardDescription>
                Detailed breakdown of your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {levelsState.map((level) => (
                  <div key={level.levelId} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-batman text-batman-foreground flex items-center justify-center font-game text-sm font-bold">
                        {level.levelId}
                      </div>
                      <div>
                        <div className="font-medium">{level.title}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {level.difficulty} • {level.attempts} attempt{level.attempts !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((starIndex) => (
                          <Star
                            key={starIndex}
                            className={`h-3 w-3 ${
                              starIndex <= level.bestStars && !level.isLocked
                                ? 'gold-star' 
                                : 'text-muted-foreground'
                            }`}
                            fill={starIndex <= level.bestStars && !level.isLocked ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                      {level.isLocked && (
                        <Badge variant="outline" className="text-xs">
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="font-game">Achievements</CardTitle>
              <CardDescription>
                Milestones in your detective career
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      achievement.earned
                        ? 'border-gold/40 bg-gold/5 batman-glow'
                        : 'border-border bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        achievement.earned 
                          ? 'bg-gold text-gold-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          achievement.earned ? 'text-gold' : 'text-muted-foreground'
                        }`}>
                          {achievement.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {achievement.description}
                        </div>
                      </div>
                      {achievement.earned && (
                        <Badge className="bg-gold text-gold-foreground">
                          Earned
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose} className="batman-glow">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};