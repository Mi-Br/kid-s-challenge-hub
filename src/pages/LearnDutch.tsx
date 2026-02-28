import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, CheckCircle2, XCircle, HelpCircle,
  ChevronRight, RotateCcw, Sparkles, Loader2, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getChallengesByGroep, getAvailableGroepLevels, getAvailableDifficulties, getChallengeCount } from "@/lib/challenges";
import type { DutchChallenge, GroepLevel } from "@/types/challenges";
import { pickSessionChallenges, markCompleted } from "@/lib/challenge-session";
import { validateAnswerAsync, getValidationMode } from "@/lib/answer-validation";
import { setAiApiKey, isAiAvailable } from "@/lib/ai-evaluation";
import type { ValidationResult } from "@/types/validation";

const DUTCH_SESSION_KEY = "challenge-dutch";

type AnswerState = "idle" | "checking" | "correct" | "partial" | "incorrect";

// ── Groep Selector ──────────────────────────────────────

const GROEP_INFO: Record<GroepLevel, { label: string; ages: string; emoji: string; color: string; desc: string }> = {
  "groep4-5": { label: "Groep 4-5", ages: "7-9 jaar", emoji: "🌱", color: "bg-green-50 border-green-200 hover:border-green-400", desc: "Korte verhalen, eenvoudige vragen" },
  "groep5-6": { label: "Groep 5-6", ages: "8-10 jaar", emoji: "🌿", color: "bg-blue-50 border-blue-200 hover:border-blue-400", desc: "Langere verhalen, nadenkvragen" },
  "groep7-8": { label: "Groep 7-8", ages: "10-12 jaar", emoji: "🌳", color: "bg-purple-50 border-purple-200 hover:border-purple-400", desc: "Uitdagende teksten, diepere vragen" },
};

function GroepSelector({ onSelect }: { onSelect: (g: GroepLevel) => void }) {
  const navigate = useNavigate();
  const available = getAvailableGroepLevels();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto mb-4">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-3xl font-bold font-serif text-foreground">Lezen 🇳🇱</h1>
          <p className="text-muted-foreground">Kies je niveau</p>
        </div>

        <div className="space-y-3">
          {(["groep4-5", "groep5-6", "groep7-8"] as GroepLevel[]).map((g) => {
            const info = GROEP_INFO[g];
            const isAvailable = available.includes(g);
            const count = getChallengeCount(g);
            const diffs = getAvailableDifficulties(g);

            return (
              <button
                key={g}
                onClick={() => isAvailable && onSelect(g)}
                disabled={!isAvailable}
                className={cn(
                  "w-full p-5 rounded-xl border-2 transition-all text-left",
                  isAvailable ? info.color + " cursor-pointer" : "bg-muted border-muted opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{info.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-foreground">{info.label}</span>
                      <span className="text-xs text-muted-foreground">({info.ages})</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{info.desc}</p>
                    <div className="flex gap-2 mt-2">
                      {diffs.map((d) => {
                        const dc = getChallengeCount(g, d);
                        const colors = { low: "bg-green-100 text-green-700", medium: "bg-blue-100 text-blue-700", high: "bg-purple-100 text-purple-700" };
                        const labels = { low: "Makkelijk", medium: "Gemiddeld", high: "Moeilijk" };
                        return <span key={d} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors[d])}>{labels[d]} ({dc})</span>;
                      })}
                      {count === 0 && <span className="text-xs text-muted-foreground">Geen verhalen beschikbaar</span>}
                    </div>
                  </div>
                  {isAvailable && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                </div>
              </button>
            );
          })}
        </div>

        {isAiAvailable() && (
          <p className="text-center text-xs text-muted-foreground">✨ AI-beoordeelde vragen beschikbaar</p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────

const LearnDutch = () => {
  const navigate = useNavigate();
  const [selectedGroep, setSelectedGroep] = useState<GroepLevel | null>(null);
  const [challenges, setChallenges] = useState<DutchChallenge[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalPartial, setTotalPartial] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Initialize AI from env
  useEffect(() => {
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (key) setAiApiKey(key);
  }, []);

  const startSession = useCallback((groep: GroepLevel) => {
    const available = getChallengesByGroep(groep);
    if (available.length === 0) return;
    const sessionKey = DUTCH_SESSION_KEY + "-" + groep;
    const picked = pickSessionChallenges(available, sessionKey, 3);
    setChallenges(picked);
    setSelectedGroep(groep);
  }, []);

  const currentChallenge = challenges[challengeIndex];
  const currentQuestion = currentChallenge?.questions[questionIndex];
  const totalQuestions = challenges.reduce((sum, c) => sum + c.questions.length, 0);
  const questionsCompleted = challenges.slice(0, challengeIndex).reduce((sum, c) => sum + c.questions.length, 0) + questionIndex;
  const progressPercent = totalQuestions > 0 ? (questionsCompleted / totalQuestions) * 100 : 0;

  const isOpenEnded = currentQuestion?.answerType === "explanation" || 
    (currentQuestion?.validation && currentQuestion.validation.mode !== "literal");
  const isAiQuestion = currentQuestion?.validation?.mode === "ai";

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || answerState !== "idle") return;
    setAnswerState("checking");

    try {
      const result = await validateAnswerAsync(answer, currentQuestion, selectedGroep || undefined);
      setValidationResult(result);

      const points = result.points ?? (result.isCorrect ? 25 : 0);
      setScore((p) => p + points);
      setTotalAnswered((p) => p + 1);

      if (result.judgement === "partial") {
        setAnswerState("partial");
        setTotalPartial((p) => p + 1);
      } else if (result.isCorrect) {
        setAnswerState("correct");
        setTotalCorrect((p) => p + 1);
      } else {
        setAnswerState("incorrect");
      }
    } catch {
      setAnswerState("incorrect");
      setValidationResult({ isCorrect: false, feedback: { mode: "literal" } });
    }
  }, [answer, answerState, currentQuestion, selectedGroep]);

  const handleNext = () => {
    setAnswer("");
    setAnswerState("idle");
    setShowHint(false);
    setValidationResult(null);

    if (questionIndex < (currentChallenge?.questions.length ?? 0) - 1) {
      setQuestionIndex((p) => p + 1);
    } else {
      const sessionKey = DUTCH_SESSION_KEY + "-" + selectedGroep;
      markCompleted(sessionKey, currentChallenge.id);
      if (challengeIndex < challenges.length - 1) {
        setChallengeIndex((p) => p + 1);
        setQuestionIndex(0);
      } else {
        setGameOver(true);
      }
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlePlayAgain = () => {
    if (selectedGroep) startSession(selectedGroep);
    setChallengeIndex(0);
    setQuestionIndex(0);
    setAnswer("");
    setAnswerState("idle");
    setShowHint(false);
    setScore(0);
    setTotalAnswered(0);
    setTotalCorrect(0);
    setTotalPartial(0);
    setGameOver(false);
  };

  const handleBack = () => {
    setSelectedGroep(null);
    setChallenges([]);
    setChallengeIndex(0);
    setQuestionIndex(0);
    setScore(0);
    setGameOver(false);
  };

  // ── Groep selector ──
  if (!selectedGroep) {
    return <GroepSelector onSelect={startSession} />;
  }

  if (challenges.length === 0) return null;

  // ── Game over screen ──
  if (gameOver) {
    const totalPoints = totalAnswered * 25;
    const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="text-6xl">
              {pct >= 80 ? "🏆" : pct >= 50 ? "⭐" : "💪"}
            </div>
            <h2 className="text-2xl font-bold text-foreground font-serif">
              {pct >= 80 ? "Geweldig!" : pct >= 50 ? "Goed gedaan!" : "Blijf oefenen!"}
            </h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">Score: <span className="font-bold text-foreground">{score} punten</span></p>
              <p className="text-muted-foreground">
                Goed: <span className="font-bold text-green-600">{totalCorrect}</span>
                {totalPartial > 0 && <> · Bijna: <span className="font-bold text-amber-600">{totalPartial}</span></>}
                {" "}· Totaal: <span className="font-bold text-foreground">{totalAnswered}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{GROEP_INFO[selectedGroep].label}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handlePlayAgain} className="gap-2"><RotateCcw className="w-4 h-4" /> Nog een keer</Button>
              <Button variant="outline" onClick={handleBack}>Ander niveau kiezen</Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main game ──
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Terug</span>
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="font-semibold text-foreground text-sm">
                {GROEP_INFO[selectedGroep].label}
                {currentChallenge?.difficulty && (
                  <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded-full", {
                    "bg-green-100 text-green-700": currentChallenge.difficulty === "low",
                    "bg-blue-100 text-blue-700": currentChallenge.difficulty === "medium",
                    "bg-purple-100 text-purple-700": currentChallenge.difficulty === "high",
                  })}>
                    {{ low: "🟢", medium: "🔵", high: "🟣" }[currentChallenge.difficulty]}
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <Sparkles className="w-4 h-4" />{score}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Tekst {challengeIndex + 1} van {challenges.length}</span>
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
            <h2 className="text-xl font-bold text-[hsl(0_0%_100%)] font-serif">{currentChallenge.title}</h2>
          </div>
          <CardContent className="p-6 space-y-5">
            {currentChallenge.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {currentChallenge.images.slice(0, 2).map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ))}
              </div>
            )}
            <div className="bg-muted/40 rounded-xl p-5 border border-border space-y-3">
              {currentChallenge.text.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-lg leading-relaxed font-serif text-foreground indent-4 first:indent-0">{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Vraag {questionIndex + 1} van {currentChallenge.questions.length}
                </p>
                {isAiQuestion && isAiAvailable() && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">✨ AI</span>
                )}
              </div>
              {currentQuestion?.hint && !showHint && answerState === "idle" && (
                <button onClick={() => setShowHint(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <HelpCircle className="w-3.5 h-3.5" /> Hint
                </button>
              )}
            </div>

            <h3 className="text-lg font-semibold text-foreground">{currentQuestion?.question}</h3>

            {showHint && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic">💡 {currentQuestion?.hint}</p>
            )}

            <div className="flex gap-2">
              {isOpenEnded ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Schrijf je antwoord..."
                  disabled={answerState !== "idle"}
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (answerState === "idle") handleSubmit();
                      else if (answerState !== "checking") handleNext();
                    }
                  }}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-base resize-none bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    answerState === "correct" && "border-[hsl(var(--fun-green))] bg-[hsl(var(--fun-green)/0.08)]",
                    answerState === "partial" && "border-amber-400 bg-amber-50",
                    answerState === "incorrect" && "border-destructive bg-destructive/5"
                  )}
                />
              ) : (
                <Input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Typ je antwoord..."
                  disabled={answerState !== "idle"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (answerState === "idle") handleSubmit();
                      else if (answerState !== "checking") handleNext();
                    }
                  }}
                  className={cn(
                    "text-base",
                    answerState === "correct" && "border-[hsl(var(--fun-green))] bg-[hsl(var(--fun-green)/0.08)]",
                    answerState === "partial" && "border-amber-400 bg-amber-50",
                    answerState === "incorrect" && "border-destructive bg-destructive/5"
                  )}
                  autoFocus
                />
              )}

              {answerState === "idle" ? (
                <Button onClick={handleSubmit} disabled={!answer.trim()} className="self-end">Check</Button>
              ) : answerState === "checking" ? (
                <Button disabled className="self-end gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Even kijken...</Button>
              ) : (
                <Button onClick={handleNext} className="gap-1 self-end">Volgende <ChevronRight className="w-4 h-4" /></Button>
              )}
            </div>

            {/* ── Feedback ── */}
            {answerState === "correct" && (
              <div className="flex items-center gap-2 text-[hsl(var(--fun-green))]">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">
                  Goed zo! +{validationResult?.points ?? 25} punten
                </span>
              </div>
            )}

            {answerState === "partial" && validationResult && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-600">
                  <Star className="w-5 h-5" />
                  <span className="font-semibold">Bijna goed! +{validationResult.points ?? 15} punten</span>
                </div>
                {validationResult.feedback?.aiFeedback && (
                  <p className="text-sm text-muted-foreground bg-amber-50 rounded-lg px-3 py-2">
                    {validationResult.feedback.aiFeedback}
                  </p>
                )}
              </div>
            )}

            {answerState === "incorrect" && validationResult && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Niet helemaal!</span>
                </div>

                {/* AI feedback */}
                {validationResult.feedback?.aiFeedback && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    {validationResult.feedback.aiFeedback}
                  </p>
                )}

                {/* Literal mode: show accepted answers */}
                {validationResult.feedback?.mode === "literal" && validationResult.feedback.acceptableAnswers?.length && (
                  <p className="text-sm text-muted-foreground">
                    Goede antwoorden: {validationResult.feedback.acceptableAnswers.join(", ")}
                  </p>
                )}

                {/* Keywords mode: gentle guidance */}
                {validationResult.feedback?.mode === "keywords" && !validationResult.feedback.aiFeedback && (
                  <div className="text-sm text-muted-foreground">
                    {validationResult.feedback.wordCount !== undefined && validationResult.feedback.wordCount < 3 && (
                      <p>Probeer iets meer te schrijven!</p>
                    )}
                    {validationResult.feedback.missingKeywordGroups && validationResult.feedback.missingKeywordGroups.length > 0 && (
                      <p>Tip: Probeer deze ideeën in je antwoord te noemen: {validationResult.feedback.missingKeywordGroups.map((g) => g.slice(0, 2).join(" of ")).join("; ")}</p>
                    )}
                  </div>
                )}

                {/* AI mode without AI response: don't reveal keywords */}
                {validationResult.feedback?.mode === "ai" && !validationResult.feedback.aiFeedback && !validationResult.feedback.aiEvaluated && (
                  <p className="text-sm text-muted-foreground">Probeer het verhaal nog eens goed te lezen en denk na over je antwoord.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LearnDutch;
