import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, Star, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { LevelState } from '@/types/game';
import { cn } from '@/lib/utils';
import { useRiddles, Riddle } from '@/hooks/useRiddles';

interface LevelPlaygroundProps {
  level: LevelState;
  onBack: () => void;
  onComplete: (levelId: number, stars: number) => void;
  backgroundImage?: string;
}

const getTimeLimit = (difficulty: string): number => {
  switch (difficulty) {
    case 'easy': return 120; // 2 minutes
    case 'medium': return 90; // 1.5 minutes
    case 'hard': return 60; // 1 minute
    default: return 150; // 2.5 minutes
  }
};

export const LevelPlaygroundAPI: React.FC<LevelPlaygroundProps> = ({
  level,
  onBack,
  onComplete,
  backgroundImage
}) => {
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [solvedRiddles, setSolvedRiddles] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(getTimeLimit(level.difficulty));
  const [riddleStartTime, setRiddleStartTime] = useState(Date.now());
  const [riddleTimes, setRiddleTimes] = useState<number[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'correct' | 'incorrect' | null>(null);

  const {
    getRiddlesByLevel,
    validateAnswer,
    solveRiddle,
    loading,
    error,
    clearError
  } = useRiddles();

  const timeLimit = getTimeLimit(level.difficulty);

  // Load riddles for the level
  useEffect(() => {
    const loadRiddles = async () => {
      try {
        clearError();
        const levelRiddles = await getRiddlesByLevel(level.levelId);
        setRiddles(levelRiddles);
        setSolvedRiddles(new Array(levelRiddles.length).fill(false));
      } catch (err) {
        console.error('Failed to load riddles:', err);
      }
    };

    loadRiddles();
  }, [level.levelId, getRiddlesByLevel, clearError]);

  // Timer effect
  useEffect(() => {
    if (gameComplete || riddles.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameComplete, riddles.length]);

  // Reset riddle start time when changing riddles
  useEffect(() => {
    setRiddleStartTime(Date.now());
    setUserAnswer('');
    setShowHint(false);
    setValidationResult(null);
  }, [currentRiddleIndex]);

  const handleTimeUp = () => {
    const completedCount = solvedRiddles.filter(Boolean).length;
    const stars = Math.min(completedCount, 3);
    setGameComplete(true);
    
    setTimeout(() => {
      onComplete(level.levelId, stars);
    }, 2000);
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || riddles.length === 0) return;

    const currentRiddle = riddles[currentRiddleIndex];
    if (!currentRiddle) return;

    console.log('📝 Submitting answer:', {
      riddleId: currentRiddle.riddleId,
      userAnswer: userAnswer.trim(),
      expectedAnswer: currentRiddle.answer,
    });

    setIsValidating(true);
    setValidationResult(null);

    try {
      const isValid = await validateAnswer(currentRiddle.riddleId, userAnswer.trim());
      
      console.log('📊 Validation received:', isValid);
      
      if (isValid) {
        setValidationResult('correct');
        
        // Record solve time
        const solveTime = Date.now() - riddleStartTime;
        const newRiddleTimes = [...riddleTimes];
        newRiddleTimes[currentRiddleIndex] = solveTime;
        setRiddleTimes(newRiddleTimes);

        // Mark as solved
        const newSolvedRiddles = [...solvedRiddles];
        newSolvedRiddles[currentRiddleIndex] = true;
        setSolvedRiddles(newSolvedRiddles);

        // Update progress in backend
        try {
          await solveRiddle(
            currentRiddle.riddleId,
            level.levelId,
            1, // 1 star for solving
            solveTime
          );
        } catch (err) {
          console.error('Failed to update progress:', err);
        }

        // Move to next riddle or complete level
        setTimeout(() => {
          if (currentRiddleIndex < riddles.length - 1) {
            setCurrentRiddleIndex(prev => prev + 1);
          } else {
            handleLevelComplete();
          }
        }, 1500);
      } else {
        setValidationResult('incorrect');
        setTimeout(() => {
          setValidationResult(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setValidationResult('incorrect');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLevelComplete = () => {
    const completedCount = solvedRiddles.filter(Boolean).length;
    const stars = Math.min(completedCount, 3);
    setGameComplete(true);
    
    setTimeout(() => {
      onComplete(level.levelId, stars);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && riddles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-white">Loading riddles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-white mb-4">Failed to load riddles</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (riddles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">No riddles available for this level</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentRiddle = riddles[currentRiddleIndex];
  const progress = ((currentRiddleIndex + 1) / riddles.length) * 100;
  const completedCount = solvedRiddles.filter(Boolean).length;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black relative overflow-hidden"
      style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Map
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-white">
              <Star className="h-4 w-4" />
              <span>{completedCount}/{riddles.length}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Level info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{level.title}</h1>
          <p className="text-gray-300 mb-4">{level.description}</p>
          <div className="flex justify-center space-x-2">
            <Badge variant="secondary" className="bg-red-900/50 text-red-200">
              {currentRiddle?.type || 'Puzzle'}
            </Badge>
            <Badge variant="secondary" className="bg-red-900/50 text-red-200">
              {currentRiddle?.difficulty || level.difficulty}
            </Badge>
          </div>
        </div>
      </div>

      {/* Game content */}
      <div className="relative z-10 px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black/80 border-red-900/50 backdrop-blur-sm">
            <div className="p-8">
              {!gameComplete ? (
                <>
                  {/* Riddle content */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      Riddle {currentRiddleIndex + 1} of {riddles.length}
                    </h2>
                    
                    <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
                      <p className="text-xl text-white leading-relaxed">
                        {currentRiddle?.question}
                      </p>
                    </div>

                    {/* Hint section */}
                    {currentRiddle?.hint && (
                      <div className="mb-6">
                        <Button
                          onClick={() => setShowHint(!showHint)}
                          variant="outline"
                          className="text-white border-red-500 hover:bg-red-500/10"
                        >
                          {showHint ? 'Hide Hint' : 'Show Hint'}
                        </Button>
                        
                        {showHint && (
                          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-200 italic">
                              💡 {currentRiddle.hint}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Answer input */}
                    <div className="space-y-4">
                      <Input
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter your answer..."
                        className="text-center text-lg py-3 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
                        disabled={isValidating}
                      />
                      
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!userAnswer.trim() || isValidating}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          'Submit Answer'
                        )}
                      </Button>
                    </div>

                    {/* Validation result */}
                    {validationResult && (
                      <div className={cn(
                        "mt-4 p-4 rounded-lg flex items-center justify-center space-x-2",
                        validationResult === 'correct' 
                          ? "bg-green-900/20 border border-green-500/30" 
                          : "bg-red-900/20 border border-red-500/30"
                      )}>
                        {validationResult === 'correct' ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="text-green-200 font-semibold">Correct!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-400" />
                            <span className="text-red-200 font-semibold">Incorrect. Try again!</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Game complete screen */
                <div className="text-center">
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold text-white mb-4">Level Complete!</h2>
                    <div className="flex justify-center space-x-2 mb-6">
                      {[...Array(3)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-8 w-8",
                            i < completedCount ? "text-yellow-400 fill-current" : "text-gray-600"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xl text-gray-300">
                      You solved {completedCount} out of {riddles.length} riddles!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
