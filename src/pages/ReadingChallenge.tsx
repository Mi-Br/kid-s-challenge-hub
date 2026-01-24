import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Trophy, 
  Heart, 
  Star,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Story {
  id: number;
  title: string;
  emoji: string;
  content: string;
  questions: Question[];
}

const stories: Story[] = [
  {
    id: 1,
    title: "The Little Red Bird",
    emoji: "🐦",
    content: `Once upon a time, there was a little red bird named Ruby. Ruby lived in a tall oak tree in the forest. Every morning, she would wake up early and sing a beautiful song.

One day, Ruby saw a baby squirrel who had fallen from its nest. The squirrel was scared and crying. Ruby flew down and said, "Don't worry, little friend! I will help you."

Ruby called her friend Oliver the owl. Together, they carefully carried the baby squirrel back to its nest. The mother squirrel was so happy! She gave Ruby and Oliver some acorns as a thank you gift.

From that day on, Ruby, Oliver, and the squirrel family became the best of friends.`,
    questions: [
      {
        question: "What color was the bird?",
        options: ["Blue", "Red", "Yellow", "Green"],
        correctIndex: 1
      },
      {
        question: "Where did Ruby live?",
        options: ["In a cave", "By the river", "In an oak tree", "In a house"],
        correctIndex: 2
      },
      {
        question: "Who helped Ruby save the baby squirrel?",
        options: ["A fox", "Oliver the owl", "A rabbit", "A deer"],
        correctIndex: 1
      },
      {
        question: "What did the mother squirrel give as a thank you?",
        options: ["Berries", "Flowers", "Acorns", "Leaves"],
        correctIndex: 2
      }
    ]
  },
  {
    id: 2,
    title: "The Magic Garden",
    emoji: "🌻",
    content: `Lily loved spending time in her grandmother's garden. It was a special place full of colorful flowers and buzzing bees.

One sunny afternoon, Lily found a golden watering can hidden behind the roses. When she used it to water the plants, something magical happened! The flowers started to glow and dance!

"This is Grandma's magic watering can," said a tiny fairy who appeared from a sunflower. "It makes plants very happy!"

Lily promised to take good care of the garden and keep the magic secret. Now, every weekend, she visits and helps the flowers dance with the golden watering can.`,
    questions: [
      {
        question: "Whose garden was it?",
        options: ["Lily's mom", "Lily's grandmother", "Lily's teacher", "Lily's friend"],
        correctIndex: 1
      },
      {
        question: "What did Lily find behind the roses?",
        options: ["A golden watering can", "A magic wand", "A treasure box", "A secret door"],
        correctIndex: 0
      },
      {
        question: "What happened when Lily used the watering can?",
        options: ["It started raining", "The flowers glowed and danced", "Birds came", "Nothing happened"],
        correctIndex: 1
      },
      {
        question: "Where did the fairy come from?",
        options: ["A rose", "A tulip", "A sunflower", "A daisy"],
        correctIndex: 2
      }
    ]
  },
  {
    id: 3,
    title: "The Brave Little Turtle",
    emoji: "🐢",
    content: `Tommy the turtle was the slowest animal in the pond. All the other animals would laugh and say, "Slow Tommy! Slow Tommy!"

One hot summer day, a fire started near the forest. All the animals ran away quickly, but they forgot about the baby ducks who were stuck in the mud!

Tommy didn't run. He walked slowly but bravely toward the baby ducks. He pushed them one by one onto his shell and carried them to the safe pond.

The fire trucks came and put out the fire. When the animals returned, they cheered for Tommy. "You're not Slow Tommy anymore," they said. "You're Brave Tommy!"

Tommy learned that being slow didn't matter. What mattered was being brave and kind.`,
    questions: [
      {
        question: "Why did other animals laugh at Tommy?",
        options: ["He was green", "He was slow", "He was small", "He was loud"],
        correctIndex: 1
      },
      {
        question: "What danger came to the forest?",
        options: ["A flood", "A storm", "A fire", "A big wave"],
        correctIndex: 2
      },
      {
        question: "Who was stuck in the mud?",
        options: ["Baby rabbits", "Baby ducks", "Baby fish", "Baby frogs"],
        correctIndex: 1
      },
      {
        question: "What did Tommy learn?",
        options: [
          "Running fast is important", 
          "Being brave and kind matters", 
          "Turtles are the best", 
          "Fire is dangerous"
        ],
        correctIndex: 1
      }
    ]
  }
];

const ReadingChallenge = () => {
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 means reading mode
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const currentStory = stories[currentStoryIndex];
  const isReading = currentQuestionIndex === -1;
  const currentQuestion = !isReading ? currentStory.questions[currentQuestionIndex] : null;

  const totalStoriesQuestions = stories.reduce((acc, s) => acc + s.questions.length, 0);
  const questionsAnswered = stories.slice(0, currentStoryIndex).reduce((acc, s) => acc + s.questions.length, 0) + 
    (currentQuestionIndex > -1 ? currentQuestionIndex : 0);
  const progress = (questionsAnswered / totalStoriesQuestions) * 100;

  const handleStartQuestions = () => {
    setCurrentQuestionIndex(0);
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion?.correctIndex;
    setIsCorrect(correct);
    setTotalQuestions(prev => prev + 1);

    if (correct) {
      setScore(prev => prev + 25);
      setTotalCorrect(prev => prev + 1);
    } else {
      setLives(prev => prev - 1);
      if (lives <= 1) {
        setGameOver(true);
      }
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);

    if (currentQuestionIndex < currentStory.questions.length - 1) {
      // More questions in current story
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentStoryIndex < stories.length - 1) {
      // Move to next story
      setCurrentStoryIndex(prev => prev + 1);
      setCurrentQuestionIndex(-1);
    } else {
      // All done
      setGameOver(true);
    }
  };

  const startNewGame = () => {
    setCurrentStoryIndex(0);
    setCurrentQuestionIndex(-1);
    setScore(0);
    setLives(3);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameOver(false);
    setTotalCorrect(0);
    setTotalQuestions(0);
  };

  if (gameOver) {
    const isWin = lives > 0;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl p-8 shadow-xl max-w-md w-full text-center animate-in zoom-in-95">
          <div className="text-7xl mb-4">
            {isWin ? "📚" : "😢"}
          </div>
          <h1 className="text-2xl font-bold text-card-foreground mb-2">
            {isWin ? "Great Reading!" : "Game Over!"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isWin 
              ? "You understood all the stories!" 
              : "Keep reading and try again!"}
          </p>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[hsl(var(--fun-yellow)/0.1)] rounded-xl p-3">
              <Trophy className="w-6 h-6 text-[hsl(var(--fun-yellow))] mx-auto mb-1" />
              <p className="text-xl font-bold text-card-foreground">{score}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <div className="bg-[hsl(var(--fun-purple)/0.1)] rounded-xl p-3">
              <BookOpen className="w-6 h-6 text-[hsl(var(--fun-purple))] mx-auto mb-1" />
              <p className="text-xl font-bold text-card-foreground">{currentStoryIndex + (isWin ? 1 : 0)}</p>
              <p className="text-xs text-muted-foreground">Stories</p>
            </div>
            <div className="bg-[hsl(var(--fun-teal)/0.1)] rounded-xl p-3">
              <Star className="w-6 h-6 text-[hsl(var(--fun-teal))] mx-auto mb-1" />
              <p className="text-xl font-bold text-card-foreground">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={startNewGame}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Read Again
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
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Story {currentStoryIndex + 1} of {stories.length}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {isReading ? (
          /* Reading Mode */
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {/* Story Header */}
            <div className="bg-[hsl(var(--fun-pink))] rounded-3xl p-6 text-center mb-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[hsl(0_0%_100%/0.1)] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-5xl mb-3">{currentStory.emoji}</div>
                <h2 className="text-2xl font-bold text-[hsl(0_0%_100%)]">
                  {currentStory.title}
                </h2>
              </div>
            </div>

            {/* Story Content */}
            <div className="bg-card rounded-2xl p-6 shadow-md mb-6">
              <div className="prose prose-lg max-w-none">
                {currentStory.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-foreground leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Start Questions Button */}
            <button
              onClick={handleStartQuestions}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <span>Answer Questions</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Question Mode */
          <div className="animate-in fade-in slide-in-from-right-4">
            {/* Question Header */}
            <div className="bg-[hsl(var(--fun-teal))] rounded-3xl p-6 text-center mb-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[hsl(0_0%_100%/0.1)] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <p className="text-[hsl(0_0%_100%/0.8)] text-sm mb-2">
                  Question {currentQuestionIndex + 1} of {currentStory.questions.length}
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-[hsl(0_0%_100%)]">
                  {currentQuestion?.question}
                </h2>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion?.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === currentQuestion.correctIndex;
                
                let buttonClass = "bg-card border-2 border-border hover:border-primary hover:bg-primary/5";
                
                if (selectedAnswer !== null) {
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
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={cn(
                      "w-full p-4 rounded-xl text-left transition-all duration-200",
                      "focus:outline-none focus:ring-4 focus:ring-primary/30",
                      buttonClass,
                      selectedAnswer === null && "hover:scale-[1.01] active:scale-[0.99]"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        selectedAnswer !== null && isCorrectAnswer
                          ? "bg-[hsl(var(--fun-green))] text-[hsl(0_0%_100%)]"
                          : selectedAnswer !== null && isSelected && !isCorrect
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground"
                      )}>
                        {selectedAnswer !== null && isCorrectAnswer ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : selectedAnswer !== null && isSelected && !isCorrect ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </span>
                      <span className={cn(
                        "font-medium",
                        selectedAnswer !== null && isCorrectAnswer 
                          ? "text-[hsl(var(--fun-green))]" 
                          : selectedAnswer !== null && isSelected && !isCorrect
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

            {/* Result & Next */}
            {selectedAnswer !== null && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                {isCorrect ? (
                  <div className="text-center py-3 text-[hsl(var(--fun-green))] font-semibold">
                    ✨ Correct! +25 points
                  </div>
                ) : (
                  <div className="text-center py-3 text-destructive font-semibold">
                    ❌ The answer was: {currentQuestion?.options[currentQuestion.correctIndex]}
                  </div>
                )}
                <button
                  onClick={handleNext}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"
                >
                  {currentQuestionIndex >= currentStory.questions.length - 1 && currentStoryIndex >= stories.length - 1
                    ? "See Results"
                    : currentQuestionIndex >= currentStory.questions.length - 1
                      ? "Next Story →"
                      : "Next Question →"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReadingChallenge;
