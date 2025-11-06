import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, Star, CheckCircle, XCircle } from 'lucide-react';
import { LevelState } from '@/types/game';
import { cn } from '@/lib/utils';

interface Riddle {
  id: number;
  question: string;
  answer: string;
  hint?: string;
}

interface LevelPlaygroundProps {
  level: LevelState;
  onBack: () => void;
  onComplete: (levelId: number, stars: number) => void;
  backgroundImage?: string;
}

const getLevelRiddles = (levelId: number): Riddle[] => {
  const riddles = {
    1: [ // Shadows of Arkham
      {
        id: 1,
        question: "In Arkham's halls where madness dwells, decode this cipher that the Riddler tells: DUKKDP",
        answer: "ARKHAM",
        hint: "Caesar cipher shifted by 3"
      },
      {
        id: 2,
        question: "The patients' files are scrambled tight, rearrange to see the light: ELYUMS",
        answer: "ASYLUM",
        hint: "Simple anagram"
      },
      {
        id: 3,
        question: "Security code in binary sight: 01000010 01000001 01010100",
        answer: "BAT",
        hint: "Binary to ASCII"
      }
    ],
    2: [ // Gotham Underground  
      {
        id: 1,
        question: "In tunnels deep where trains once ran, solve this riddle if you can: QRWKDP",
        answer: "GOTHAM",
        hint: "Caesar cipher shifted by 3"
      },
      {
        id: 2,
        question: "The subway map shows stations three, but backwards they spell mystery: LIAR",
        answer: "RAIL",
        hint: "Reverse the word"
      },
      {
        id: 3,
        question: "Morse code echoes in the night: .... . .-.. .--.",
        answer: "HELP",
        hint: "Morse code translation"
      }
    ],
    3: [ // Wayne Tower Break-In
      {
        id: 1,
        question: "Wayne's empire stands so tall and bright, decode the message hidden from sight: ZDAQH",
        answer: "WAYNE",
        hint: "Caesar cipher shifted by 3"
      },
      {
        id: 2,
        question: "The mainframe password lies within: 20 15 23 5 18",
        answer: "TOWER",
        hint: "A=1, B=2, C=3..."
      },
      {
        id: 3,
        question: "Corporate secrets in plain view, rearrange to find what's true: RECESU",
        answer: "SECURE",
        hint: "Anagram of the letters"
      }
    ],
    4: [ // The Narrows Pursuit
      {
        id: 1,
        question: "Through narrow streets the chase begins, decode to see where Riddler wins: QDUUZZV",
        answer: "NARROWS",
        hint: "Caesar cipher shifted by 3"
      },
      {
        id: 2,
        question: "Rain washes clues but not this code: 16-21-18-19-21-9-20",
        answer: "PURSUIT",
        hint: "A=1, B=2, C=3..."
      },
      {
        id: 3,
        question: "Time runs out, the trail grows cold, reverse this word to be bold: ECAHC",
        answer: "CHASE",
        hint: "Read it backwards"
      }
    ],
    5: [ // Final Confrontation
      {
        id: 1,
        question: "The final battle on rooftop high, crack this code before you die: ILQDO",
        answer: "FINAL",
        hint: "Caesar cipher shifted by 3"
      },
      {
        id: 2,
        question: "Question marks light up the sky: 01000110 01000001 01010100 01000101",
        answer: "FATE",
        hint: "Binary to ASCII"
      },
      {
        id: 3,
        question: "Gotham's destiny in your hand, unscramble this to save the land: YRCTOVI",
        answer: "VICTORY",
        hint: "Anagram puzzle"
      }
    ]
  };
  return riddles[levelId as keyof typeof riddles] || riddles[1];
};

const getTimeLimit = (difficulty: string): number => {
  switch (difficulty) {
    case 'easy': return 180; // 3 minutes
    case 'medium': return 150; // 2.5 minutes  
    case 'hard': return 120; // 2 minutes
    default: return 150;
  }
};

export const LevelPlayground: React.FC<LevelPlaygroundProps> = ({
  level,
  onBack,
  onComplete,
  backgroundImage
}) => {
  const [currentRiddle, setCurrentRiddle] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [solvedRiddles, setSolvedRiddles] = useState<boolean[]>([false, false, false]);
  const [timeLeft, setTimeLeft] = useState(getTimeLimit(level.difficulty));
  const [riddleStartTime, setRiddleStartTime] = useState(Date.now());
  const [riddleTimes, setRiddleTimes] = useState<number[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const riddles = getLevelRiddles(level.levelId);
  const timeLimit = getTimeLimit(level.difficulty);

  // Timer effect
  useEffect(() => {
    if (gameComplete) return;

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
  }, [gameComplete]);

  // Reset riddle start time when changing riddles
  useEffect(() => {
    setRiddleStartTime(Date.now());
    setUserAnswer('');
    setShowHint(false);
  }, [currentRiddle]);

  const handleTimeUp = () => {
    const completedCount = solvedRiddles.filter(Boolean).length;
    const stars = Math.min(completedCount, 3);
    setGameComplete(true);
    
    setTimeout(() => {
      onComplete(level.levelId, stars);
    }, 2000);
  };

  const handleSubmitAnswer = () => {
    const currentRiddleData = riddles[currentRiddle];
    const isCorrect = userAnswer.toLowerCase().trim() === currentRiddleData.answer.toLowerCase();
    
    if (isCorrect) {
      const timeTaken = (Date.now() - riddleStartTime) / 1000;
      const newSolved = [...solvedRiddles];
      newSolved[currentRiddle] = true;
      setSolvedRiddles(newSolved);
      setRiddleTimes(prev => [...prev, timeTaken]);

      // Check if all riddles are solved
      const completedCount = newSolved.filter(Boolean).length;
      
      if (completedCount === 3 || currentRiddle === 2) {
        // Game complete
        let stars = completedCount;
        
        // Bonus star logic for completing under time
        const totalTimeTaken = riddleTimes.reduce((sum, time) => sum + time, 0) + timeTaken;
        const timePercentage = totalTimeTaken / timeLimit;
        
        if (completedCount === 3 && timePercentage < 0.6) {
          // All solved under 60% of time limit
          stars = 3;
        } else if (completedCount >= 2 && timePercentage < 0.8) {
          // 2+ solved under 80% of time limit
          stars = Math.min(completedCount, 3);
        }
        
        setGameComplete(true);
        setTimeout(() => {
          onComplete(level.levelId, stars);
        }, 2000);
      } else {
        // Move to next riddle
        setCurrentRiddle(prev => prev + 1);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const percentage = timeLeft / timeLimit;
    if (percentage > 0.6) return 'bg-green-500';
    if (percentage > 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (gameComplete) {
    const stars = solvedRiddles.filter(Boolean).length;
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
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
        <Card className="gotham-card border-red-500/30 bg-black/80 backdrop-blur-sm max-w-md mx-4">
          <div className="p-8 text-center">
            <div className="mb-6">
              {stars > 0 ? (
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              )}
              
              <h2 className="font-game text-2xl text-red-300 mb-2">
                {stars > 0 ? 'Mission Complete!' : 'Mission Failed'}
              </h2>
              
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-8 h-8",
                      star <= stars ? "text-yellow-400 fill-current" : "text-gray-600"
                    )}
                  />
                ))}
              </div>
              
              <p className="text-red-200/80">
                Riddles solved: {solvedRiddles.filter(Boolean).length}/3
              </p>
            </div>
            
            <Button onClick={onBack} className="w-full bg-red-600 hover:bg-red-700">
              Return to Map
            </Button>
          </div>
        </Card>
        </div>
      </div>
    );
  }

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
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="text-red-300 hover:text-red-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Map
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="font-game text-lg text-red-300">{formatTime(timeLeft)}</span>
            </div>
            
            <div className="flex gap-1">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    solvedRiddles[star - 1] ? "text-yellow-400 fill-current" : "text-gray-600"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000", getProgressColor())}
            style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
          />
        </div>

        {/* Level Title */}
        <div className="text-center mb-8">
          <h1 className="font-game text-4xl font-bold text-red-300 mb-2">
            {level.title}
          </h1>
          <Badge variant="outline" className="text-red-200 border-red-500/50">
            Riddle {currentRiddle + 1} of 3
          </Badge>
        </div>

        {/* Main Riddle Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="gotham-card border-red-500/30 bg-black/60 backdrop-blur-sm">
            <div className="p-8">
              <h2 className="font-game text-xl text-red-300 mb-6 text-center">
                {riddles[currentRiddle].question}
              </h2>
              
              <div className="space-y-4">
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="bg-black/50 border-red-500/30 text-red-100 placeholder:text-red-300/50"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                />
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Submit Answer
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowHint(!showHint)}
                    className="border-red-500/50 text-red-300 hover:bg-red-900/20"
                  >
                    {showHint ? 'Hide' : 'Show'} Hint
                  </Button>
                </div>
                
                {showHint && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-200 text-sm">
                      💡 {riddles[currentRiddle].hint}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Riddle Progress */}
          <div className="mt-6 flex justify-center gap-4">
            {riddles.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center font-game",
                  index === currentRiddle
                    ? "border-red-400 bg-red-900/50 text-red-300"
                    : solvedRiddles[index]
                    ? "border-green-400 bg-green-900/50 text-green-300"
                    : "border-gray-600 bg-gray-900/50 text-gray-400"
                )}
              >
                {solvedRiddles[index] ? <CheckCircle className="w-6 h-6" /> : index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};