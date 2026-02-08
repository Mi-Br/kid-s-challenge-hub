import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, HelpCircle, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import dutchChallenges, { DutchChallenge } from "@/data/dutch-challenges";
import { pickSessionChallenges, markCompleted } from "@/lib/challenge-session";

const DUTCH_SESSION_KEY = "challenge-dutch";

type AnswerState = "idle" | "correct" | "incorrect";

const LearnDutch = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<DutchChallenge[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    setChallenges(pickSessionChallenges(dutchChallenges, DUTCH_SESSION_KEY, 3));
  }, []);

  const currentChallenge = challenges[challengeIndex];
  const currentQuestion = currentChallenge?.questions[questionIndex];

  const totalQuestions = challenges.reduce((sum, c) => sum + c.questions.length, 0);
  const questionsCompleted = challenges
    .slice(0, challengeIndex)
    .reduce((sum, c) => sum + c.questions.length, 0) + questionIndex;

  const progressPercent = totalQuestions > 0 ? (questionsCompleted / totalQuestions) * 100 : 0;

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || answerState !== "idle") return;
    const normalized = answer.trim().toLowerCase();
    const isCorrect = currentQuestion.acceptableAnswers.some(
      (a) => a.toLowerCase() === normalized
    );
    setAnswerState(isCorrect ? "correct" : "incorrect");
    setTotalAnswered((p) => p + 1);
    if (isCorrect) {
      setScore((p) => p + 25);
      setTotalCorrect((p) => p + 1);
    }
  }, [answer, answerState, currentQuestion]);

  const handleNext = () => {
    setAnswer("");
    setAnswerState("idle");
    setShowHint(false);

    if (questionIndex < (currentChallenge?.questions.length ?? 0) - 1) {
      setQuestionIndex((p) => p + 1);
    } else {
      // Finished this challenge text
      markCompleted(DUTCH_SESSION_KEY, currentChallenge.id);
      if (challengeIndex < challenges.length - 1) {
        setChallengeIndex((p) => p + 1);
        setQuestionIndex(0);
      } else {
        setGameOver(true);
      }
    }
  };

  const handlePlayAgain = () => {
    setChallenges(pickSessionChallenges(dutchChallenges, DUTCH_SESSION_KEY, 3));
    setChallengeIndex(0);
    setQuestionIndex(0);
    setAnswer("");
    setAnswerState("idle");
    setShowHint(false);
    setScore(0);
    setTotalAnswered(0);
    setTotalCorrect(0);
    setGameOver(false);
  };

  if (challenges.length === 0) return null;

  if (gameOver) {
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="text-6xl">
              {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "⭐" : "💪"}
            </div>
            <h2 className="text-2xl font-bold text-foreground font-serif">
              {accuracy >= 80 ? "Geweldig!" : accuracy >= 50 ? "Goed gedaan!" : "Blijf oefenen!"}
            </h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">Score: <span className="font-bold text-foreground">{score}</span></p>
              <p className="text-muted-foreground">Accuracy: <span className="font-bold text-foreground">{accuracy}%</span></p>
              <p className="text-muted-foreground">Correct: <span className="font-bold text-foreground">{totalCorrect}/{totalAnswered}</span></p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handlePlayAgain} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Play Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
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
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="font-semibold text-foreground">Learn Dutch 🇳🇱</h1>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <Sparkles className="w-4 h-4" />
              {score}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Text {challengeIndex + 1} of {challenges.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Story Card */}
        <Card className="overflow-hidden">
          <div className="bg-[hsl(var(--fun-purple))] px-6 py-4">
            <h2 className="text-xl font-bold text-[hsl(0_0%_100%)] font-serif">
              {currentChallenge.title}
            </h2>
          </div>
          <CardContent className="p-6 space-y-5">
            {/* Images */}
            <div className={cn(
              "grid gap-3",
              currentChallenge.images.length === 3 ? "grid-cols-3" : "grid-cols-2"
            )}>
              {currentChallenge.images.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            {/* Dutch Text */}
            <div className="bg-muted/40 rounded-xl p-5 border border-border space-y-3">
              {currentChallenge.text.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-lg leading-relaxed font-serif text-foreground indent-4 first:indent-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Question {questionIndex + 1} of {currentChallenge.questions.length}
              </p>
              {currentQuestion?.hint && !showHint && answerState === "idle" && (
                <button
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Hint
                </button>
              )}
            </div>

            <h3 className="text-lg font-semibold text-foreground">
              {currentQuestion?.question}
            </h3>

            {showHint && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic">
                💡 {currentQuestion?.hint}
              </p>
            )}

            <div className="flex gap-2">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                disabled={answerState !== "idle"}
                onKeyDown={(e) => e.key === "Enter" && (answerState === "idle" ? handleSubmit() : handleNext())}
                className={cn(
                  "text-base",
                  answerState === "correct" && "border-[hsl(var(--fun-green))] bg-[hsl(var(--fun-green)/0.08)]",
                  answerState === "incorrect" && "border-destructive bg-destructive/5"
                )}
                autoFocus
              />
              {answerState === "idle" ? (
                <Button onClick={handleSubmit} disabled={!answer.trim()}>
                  Check
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Feedback */}
            {answerState === "correct" && (
              <div className="flex items-center gap-2 text-[hsl(var(--fun-green))]">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Correct! +25 points</span>
              </div>
            )}
            {answerState === "incorrect" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Not quite!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Accepted answers: {currentQuestion?.acceptableAnswers.join(", ")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LearnDutch;
