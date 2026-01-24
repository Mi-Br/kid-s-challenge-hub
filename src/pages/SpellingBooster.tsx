import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Trophy, 
  Heart, 
  Zap, 
  Star,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface WordPair {
  dutch: string;
  english: string;
  hint?: string;
}

const wordPairs: WordPair[] = [
  { dutch: "Hond", english: "Dog", hint: "🐕 Woof woof!" },
  { dutch: "Kat", english: "Cat", hint: "🐱 Meow!" },
  { dutch: "Appel", english: "Apple", hint: "🍎 A red fruit" },
  { dutch: "Boek", english: "Book", hint: "📚 You read it" },
  { dutch: "Water", english: "Water", hint: "💧 You drink it" },
  { dutch: "Huis", english: "House", hint: "🏠 Where you live" },
  { dutch: "Zon", english: "Sun", hint: "☀️ In the sky" },
  { dutch: "Maan", english: "Moon", hint: "🌙 Night light" },
  { dutch: "Boom", english: "Tree", hint: "🌳 Has leaves" },
  { dutch: "Vogel", english: "Bird", hint: "🐦 Can fly" },
  { dutch: "Vis", english: "Fish", hint: "🐟 Swims in water" },
  { dutch: "Brood", english: "Bread", hint: "🍞 For sandwiches" },
];

const generateOptions = (correctAnswer: string, allAnswers: string[]): string[] => {
  const options = [correctAnswer];
  const otherAnswers = allAnswers.filter(a => a !== correctAnswer);
  
  while (options.length < 4 && otherAnswers.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherAnswers.length);
    options.push(otherAnswers.splice(randomIndex, 1)[0]);
  }
  
  return options.sort(() => Math.random() - 0.5);
};

const SpellingBooster = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledPairs, setShuffledPairs] = useState<WordPair[]>([]);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const shuffled = [...wordPairs].sort(() => Math.random() - 0.5);
    setShuffledPairs(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setLives(3);
    setStreak(0);
    setGameOver(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowHint(false);
    
    const allEnglish = wordPairs.map(p => p.english);
    setOptions(generateOptions(shuffled[0].english, allEnglish));
  };

  useEffect(() => {
    if (shuffledPairs.length > 0 && currentIndex < shuffledPairs.length) {
      const allEnglish = wordPairs.map(p => p.english);
      setOptions(generateOptions(shuffledPairs[currentIndex].english, allEnglish));
    }
  }, [currentIndex, shuffledPairs]);

  const currentWord = shuffledPairs[currentIndex];
  const progress = ((currentIndex) / shuffledPairs.length) * 100;

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    const correct = answer === currentWord.english;
    setIsCorrect(correct);

    if (correct) {
      const points = 10 + (streak * 2);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
    } else {
      setLives(prev => prev - 1);
      setStreak(0);
      if (lives <= 1) {
        setGameOver(true);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex >= shuffledPairs.length - 1) {
      setGameOver(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowHint(false);
    }
  };

  const playPronunciation = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.dutch);
      utterance.lang = 'nl-NL';
      speechSynthesis.speak(utterance);
    }
  };

  if (gameOver) {
    const isWin = lives > 0;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl p-8 shadow-xl max-w-md w-full text-center animate-in zoom-in-95">
          <div className="text-7xl mb-4">
            {isWin ? "🎉" : "😢"}
          </div>
          <h1 className="text-2xl font-bold text-card-foreground mb-2">
            {isWin ? "Amazing Job!" : "Game Over!"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isWin 
              ? "You completed all the words!" 
              : "Don't worry, practice makes perfect!"}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[hsl(var(--fun-yellow)/0.1)] rounded-xl p-4">
              <Trophy className="w-8 h-8 text-[hsl(var(--fun-yellow))] mx-auto mb-2" />
              <p className="text-2xl font-bold text-card-foreground">{score}</p>
              <p className="text-sm text-muted-foreground">Points</p>
            </div>
            <div className="bg-[hsl(var(--fun-purple)/0.1)] rounded-xl p-4">
              <Star className="w-8 h-8 text-[hsl(var(--fun-purple))] mx-auto mb-2" />
              <p className="text-2xl font-bold text-card-foreground">{currentIndex}</p>
              <p className="text-sm text-muted-foreground">Words</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={startNewGame}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors font-medium"
            >
              Back to Challenges
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="flex items-center gap-4">
              {/* Lives */}
              <div className="flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <Heart
                    key={i}
                    className={cn(
                      "w-6 h-6 transition-all",
                      i < lives 
                        ? "text-[hsl(var(--fun-pink))] fill-[hsl(var(--fun-pink))]" 
                        : "text-muted"
                    )}
                  />
                ))}
              </div>
              
              {/* Score */}
              <div className="flex items-center gap-1 bg-[hsl(var(--fun-yellow)/0.15)] px-3 py-1.5 rounded-full">
                <Trophy className="w-5 h-5 text-[hsl(var(--fun-yellow))]" />
                <span className="font-bold text-foreground">{score}</span>
              </div>
              
              {/* Streak */}
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-[hsl(var(--fun-orange)/0.15)] px-3 py-1.5 rounded-full animate-in zoom-in-50">
                  <Zap className="w-5 h-5 text-[hsl(var(--fun-orange))]" />
                  <span className="font-bold text-foreground">{streak}x</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {currentIndex + 1} of {shuffledPairs.length} words
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Word Card */}
        <div className="bg-[hsl(var(--fun-purple))] rounded-3xl p-8 text-center mb-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[hsl(0_0%_100%/0.1)] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[hsl(0_0%_100%/0.08)] translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <p className="text-[hsl(0_0%_100%/0.7)] text-sm font-medium mb-2">
              Translate from Dutch 🇳🇱
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[hsl(0_0%_100%)] mb-4">
              {currentWord.dutch}
            </h2>
            
            <button
              onClick={playPronunciation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(0_0%_100%/0.2)] text-[hsl(0_0%_100%)] hover:bg-[hsl(0_0%_100%/0.3)] transition-colors"
            >
              <Volume2 className="w-5 h-5" />
              <span className="text-sm">Listen</span>
            </button>
          </div>
        </div>

        {/* Hint */}
        {showHint && currentWord.hint && (
          <div className="bg-[hsl(var(--fun-yellow)/0.15)] border-2 border-[hsl(var(--fun-yellow)/0.3)] rounded-2xl p-4 mb-6 text-center animate-in slide-in-from-top-2">
            <p className="text-foreground font-medium">{currentWord.hint}</p>
          </div>
        )}

        {/* Answer Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === currentWord.english;
            
            let buttonClass = "bg-card border-2 border-border hover:border-primary hover:bg-primary/5";
            
            if (selectedAnswer) {
              if (isCorrectAnswer) {
                buttonClass = "bg-[hsl(var(--fun-green)/0.15)] border-2 border-[hsl(var(--fun-green))]";
              } else if (isSelected && !isCorrect) {
                buttonClass = "bg-destructive/10 border-2 border-destructive";
              } else {
                buttonClass = "bg-card border-2 border-border opacity-50";
              }
            }
            
            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={cn(
                  "p-5 rounded-2xl text-lg font-semibold transition-all duration-200",
                  "focus:outline-none focus:ring-4 focus:ring-primary/30",
                  buttonClass,
                  !selectedAnswer && "hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {selectedAnswer && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-[hsl(var(--fun-green))]" />
                  )}
                  {selectedAnswer && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className={cn(
                    selectedAnswer && isCorrectAnswer 
                      ? "text-[hsl(var(--fun-green))]" 
                      : selectedAnswer && isSelected && !isCorrect
                        ? "text-destructive"
                        : "text-card-foreground"
                  )}>
                    {option}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        {!selectedAnswer ? (
          <button
            onClick={() => setShowHint(true)}
            disabled={showHint}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-colors",
              showHint 
                ? "text-muted-foreground cursor-not-allowed" 
                : "text-[hsl(var(--fun-yellow))] hover:bg-[hsl(var(--fun-yellow)/0.1)]"
            )}
          >
            💡 Need a hint?
          </button>
        ) : (
          <div className="space-y-3">
            {isCorrect ? (
              <div className="text-center py-3 text-[hsl(var(--fun-green))] font-semibold animate-in zoom-in-50">
                ✨ Correct! +{10 + ((streak - 1) * 2)} points
              </div>
            ) : (
              <div className="text-center py-3 text-destructive font-semibold animate-in zoom-in-50">
                ❌ The answer was: {currentWord.english}
              </div>
            )}
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"
            >
              {currentIndex >= shuffledPairs.length - 1 ? "See Results" : "Next Word →"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SpellingBooster;
