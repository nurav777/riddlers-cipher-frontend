import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TutorialSlide } from '@/types/game';
import { usePollyNarration } from '@/hooks/usePollyNarration';

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  narrationOn: boolean;
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: 1,
    title: "Welcome to Gotham, Detective.",
    content: "The Riddler has scattered mind-bending puzzles across the city. Solve them to stop his plan.",
    microcopy: "You can skip the tutorial anytime.",
  },
  {
    id: 2,
    title: "What you'll do",
    content: "Navigate the challenges ahead with these simple steps:",
    bullets: [
      "Pick a level on the Gotham map",
      "Each level has 3 riddles (one at a time)",
      "Solve a riddle to earn stars — the faster you solve, the more stars"
    ],
  },
  {
    id: 3,
    title: "Earn stars. Climb the leaderboard.",
    content: "Each riddle can earn 0–3 stars. Solving quickly or without hints gives more stars. Stars are saved to your profile and unlock new levels & badges.",
    bullets: [
      "Solve within 30% of time limit → 3 stars",
      "Solve within 60% → 2 stars", 
      "Solve before timeout → 1 star",
      "Use a hint or timeout → 0 stars"
    ],
  },
  {
    id: 4,
    title: "Quick tips from Alfred",
    content: "Master these controls to become Gotham's greatest detective:",
    bullets: [
      "Use the Hint button if stuck (costs stars)",
      "Type answers in the input field",
      "Press Enter to submit your answer",
      "Press Esc to cancel current action"
    ],
    microcopy: "Pro tip: Read the Riddler's taunt — it often hides the key.",
  },
  {
    id: 5,
    title: "Ready, Detective?",
    content: "Tap 'Start Mission' to jump to the Gotham Map. You can replay this tutorial from Profile anytime.",
  },
];

export const Tutorial = ({ isOpen, onClose, onComplete, narrationOn }: TutorialProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  
  // Polly narration hook
  const { isPlaying, isProcessing, hasError, errorMessage, speak, stop, isEnabled, setEnabled, clearError } = usePollyNarration({
    enabled: narrationOn,
    onStart: () => console.log('Narration started'),
    onEnd: () => console.log('Narration ended'),
    onError: (error) => console.error('Narration error:', error)
  });

  const handleNext = () => {
    if (currentSlide < TUTORIAL_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    setShowSkipDialog(true);
  };

  const confirmSkip = () => {
    setShowSkipDialog(false);
    onComplete();
  };

  const slide = TUTORIAL_SLIDES[currentSlide];
  const isLastSlide = currentSlide === TUTORIAL_SLIDES.length - 1;

  // Auto-play narration when slide changes - DISABLED
  // useEffect(() => {
  //   if (isEnabled && isOpen && !hasError) {
  //     const slideText = `${slide.title}. ${slide.content}`;
  //     speak(slideText);
  //   }
  // }, [currentSlide, isEnabled, isOpen, hasError, speak]);

  // Play narration manually
  const playNarration = () => {
    if (isEnabled) {
      const slideText = `${slide.title}. ${slide.content}`;
      speak(slideText);
    }
  };

  // Toggle narration on/off
  const toggleNarration = () => {
    if (isPlaying) {
      stop();
    } else {
      setEnabled(!isEnabled);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="gotham-card max-w-4xl max-h-[90vh] overflow-y-auto border-batman/20">
          <DialogHeader>
            <DialogTitle className="font-game text-2xl text-batman">
              Gotham Detective Training
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Mission Briefing {currentSlide + 1} of {TUTORIAL_SLIDES.length}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex gap-2">
              {TUTORIAL_SLIDES.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    index <= currentSlide ? 'bg-batman' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>

            {/* Tutorial Slide */}
            <Card className="tutorial-slide animate-fade-in border-batman/10">
              <CardHeader>
                <CardTitle className="font-game text-xl flex items-center justify-between">
                  {slide.title}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={hasError ? clearError : toggleNarration}
                      className={hasError ? "border-red-500 text-red-500" : "batman-glow"}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : hasError ? (
                        <X className="h-3 w-3 mr-1" />
                      ) : isPlaying ? (
                        <VolumeX className="h-3 w-3 mr-1" />
                      ) : (
                        <Volume2 className="h-3 w-3 mr-1" />
                      )}
                      {isProcessing ? 'Processing...' : hasError ? errorMessage : isPlaying ? 'Stop' : isEnabled ? 'Listen' : 'Enable Audio'}
                    </Button>
                    {isEnabled && !isPlaying && !isProcessing && !hasError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={playNarration}
                        className="batman-glow"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Replay
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed">
                  {slide.content}
                </p>

                {slide.bullets && (
                  <ul className="space-y-2">
                    {slide.bullets.map((bullet, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-batman rounded-full mt-2 flex-shrink-0" />
                        <span className="text-foreground">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {slide.microcopy && (
                  <div className="p-3 bg-secondary/50 rounded-lg border-l-4 border-riddler">
                    <p className="text-sm text-riddler font-medium">
                      {slide.microcopy}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentSlide === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Skip
                </Button>
              </div>

              <Button 
                onClick={handleNext}
                className="batman-glow flex items-center gap-2"
              >
                {isLastSlide ? 'Start Mission' : 'Next'}
                {!isLastSlide && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Skip Confirmation Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent className="gotham-card border-riddler/20">
          <DialogHeader>
            <DialogTitle className="font-game text-riddler">
              Skip the briefing?
            </DialogTitle>
            <DialogDescription>
              You can replay it anytime from Profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
              No, continue
            </Button>
            <Button onClick={confirmSkip} className="riddler-glow">
              Yes, skip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default Tutorial;