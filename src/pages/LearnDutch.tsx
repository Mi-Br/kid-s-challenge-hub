import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, BookOpen, CheckCircle2, XCircle, HelpCircle,
  ChevronRight, RotateCcw, Sparkles, Loader2, Star, Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TranslatableText } from "@/components/TranslatableText";
import { TranslateSidePanel } from "@/components/TranslateSidePanel";
import { getChallengesByGroep, getAvailableGroepLevels, getAvailableDifficulties, getChallengeCount, getChallengeById } from "@/lib/challenges";
import type { DutchChallenge, GroepLevel, Difficulty } from "@/types/challenges";
import { pickSessionChallenges, markCompleted } from "@/lib/challenge-session";
import { validateAnswerAsync, getValidationMode } from "@/lib/answer-validation";
import { setAiApiKey, isAiAvailable } from "@/lib/ai-evaluation";
import { recordCompletion } from "@/lib/teacher";
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

// ── Story Picker ────────────────────────────────────────

const DIFF_META: Record<Difficulty, { label: string; emoji: string; chip: string; card: string }> = {
  low:    { label: "Makkelijk",  emoji: "🟢", chip: "bg-green-100 text-green-700 border-green-200",   card: "border-green-200 hover:border-green-400 bg-green-50/40" },
  medium: { label: "Gemiddeld",  emoji: "🔵", chip: "bg-blue-100 text-blue-700 border-blue-200",     card: "border-blue-200 hover:border-blue-400 bg-blue-50/40" },
  high:   { label: "Moeilijk",   emoji: "🟣", chip: "bg-purple-100 text-purple-700 border-purple-200", card: "border-purple-200 hover:border-purple-400 bg-purple-50/40" },
};

function StoryPicker({
  groep,
  onBack,
  onPickStory,
  onRandom,
}: {
  groep: GroepLevel;
  onBack: () => void;
  onPickStory: (challenge: DutchChallenge) => void;
  onRandom: (difficulty: Difficulty | "all") => void;
}) {
  const [filter, setFilter] = useState<Difficulty | "all">("all");
  const all = useMemo(() => getChallengesByGroep(groep), [groep]);
  const diffs = getAvailableDifficulties(groep);
  const visible = filter === "all" ? all : all.filter((c) => c.difficulty === filter);

  const info = GROEP_INFO[groep];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Niveau</span>
          </button>
          <h1 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <span>{info.emoji}</span> {info.label}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold font-serif text-foreground">Kies je verhaal</h2>
          <p className="text-sm text-muted-foreground">Of laat de app 3 verhalen voor je uitkiezen</p>
        </div>

        {/* Difficulty filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "text-sm px-3 py-1.5 rounded-full border-2 font-medium transition-colors",
              filter === "all" ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"
            )}
          >
            Alles ({all.length})
          </button>
          {diffs.map((d) => {
            const count = getChallengeCount(groep, d);
            const active = filter === d;
            return (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-full border-2 font-medium transition-colors",
                  active ? "bg-foreground text-background border-foreground" : cn("bg-background hover:border-foreground/40", DIFF_META[d].chip)
                )}
              >
                {DIFF_META[d].emoji} {DIFF_META[d].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Random button */}
        <Button
          onClick={() => onRandom(filter)}
          variant="outline"
          className="w-full gap-2 border-2 border-dashed h-auto py-4"
        >
          <Shuffle className="w-4 h-4" />
          <span className="font-semibold">Verras me</span>
          <span className="text-muted-foreground text-sm">— 3 willekeurige verhalen{filter !== "all" ? ` (${DIFF_META[filter].label.toLowerCase()})` : ""}</span>
        </Button>

        {/* Story grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((c) => {
            const meta = c.difficulty ? DIFF_META[c.difficulty] : null;
            const hasAi = c.questions.some((q) => q.validation?.mode === "ai");
            return (
              <button
                key={c.id}
                onClick={() => onPickStory(c)}
                className={cn(
                  "text-left p-4 rounded-xl border-2 transition-all bg-card hover:shadow-md",
                  meta?.card ?? "border-border hover:border-foreground/40"
                )}
              >
                <div className="flex items-start gap-3">
                  {c.images?.[0]?.src && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={c.images[0].src}
                        alt={c.images[0].alt}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-foreground leading-tight">{c.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {meta && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", meta.chip)}>
                          {meta.emoji} {meta.label}
                        </span>
                      )}
                      {c.topic && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {c.topic}
                        </span>
                      )}
                      {hasAi && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                          ✨ AI
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        {c.questions.length} vragen
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {visible.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">Geen verhalen gevonden voor dit filter.</p>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────

const LearnDutch = () => {
  const navigate = useNavigate();
  const [selectedGroep, setSelectedGroep] = useState<GroepLevel | null>(null);
  const [challenges, setChallenges] = useState<DutchChallenge[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
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
  const [translateMode, setTranslateMode] = useState<"word" | "sentence">("word");
  const sessionStartRef = useRef<number>(Date.now());
  const completionSavedRef = useRef(false);


  // Initialize AI from env (legacy — AI now runs through the edge function)
  useEffect(() => {
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (key) setAiApiKey(key);
  }, []);

  // Deep-link: /learn-dutch?story=<id> jumps straight into that story
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const storyParam = searchParams.get("story");
    if (!storyParam || sessionStarted) return;
    const c = getChallengeById(storyParam);
    if (!c) return;
    setSelectedGroep(c.groepLevel ?? "groep4-5");
    setChallenges([c]);
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
    setValidationResult(null);
    setSessionStarted(true);
    // Clear the param so back navigation returns to the picker instead of re-triggering
    const next = new URLSearchParams(searchParams);
    next.delete("story");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPicker = useCallback((groep: GroepLevel) => {
    setSelectedGroep(groep);
    setSessionStarted(false);
    setChallenges([]);
  }, []);

  const startWithChallenges = useCallback((picked: DutchChallenge[]) => {
    setChallenges(picked);
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
    setValidationResult(null);
    setSessionStarted(true);
  }, []);

  const startRandom = useCallback((difficulty: Difficulty | "all") => {
    if (!selectedGroep) return;
    const pool = getChallengesByGroep(selectedGroep).filter(
      (c) => difficulty === "all" || c.difficulty === difficulty
    );
    if (pool.length === 0) return;
    const sessionKey = DUTCH_SESSION_KEY + "-" + selectedGroep + "-" + difficulty;
    const picked = pickSessionChallenges(pool, sessionKey, Math.min(3, pool.length));
    startWithChallenges(picked);
  }, [selectedGroep, startWithChallenges]);

  const startSingle = useCallback((challenge: DutchChallenge) => {
    startWithChallenges([challenge]);
  }, [startWithChallenges]);


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
      const result = await validateAnswerAsync(answer, currentQuestion, selectedGroep || undefined, currentChallenge?.text);
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
    // Return to picker so kid can choose again
    setSessionStarted(false);
    setChallenges([]);
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

  const handleBackToPicker = () => {
    setSessionStarted(false);
    setChallenges([]);
    setChallengeIndex(0);
    setQuestionIndex(0);
    setScore(0);
    setGameOver(false);
  };

  const handleBackToGroep = () => {
    setSelectedGroep(null);
    setSessionStarted(false);
    setChallenges([]);
    setChallengeIndex(0);
    setQuestionIndex(0);
    setScore(0);
    setGameOver(false);
  };

  // ── Groep selector ──
  if (!selectedGroep) {
    return <GroepSelector onSelect={openPicker} />;
  }

  // ── Story picker ──
  if (!sessionStarted) {
    return (
      <StoryPicker
        groep={selectedGroep}
        onBack={handleBackToGroep}
        onPickStory={startSingle}
        onRandom={startRandom}
      />
    );
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
              <Button variant="outline" onClick={handleBackToPicker}>Ander verhaal kiezen</Button>
              <Button variant="ghost" onClick={handleBackToGroep}>Ander niveau kiezen</Button>
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
            <button onClick={handleBackToPicker} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
            <div className="flex items-center justify-between gap-2 -mt-1">
              <p className="text-[11px] text-muted-foreground">
                💡 Klik op {translateMode === "word" ? "een woord" : "een zin"} voor de vertaling
              </p>
              <div className="inline-flex items-center rounded-full border border-border p-0.5 bg-background text-xs">
                <button
                  onClick={() => setTranslateMode("word")}
                  className={cn(
                    "px-2.5 py-1 rounded-full transition-colors",
                    translateMode === "word" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  🔤 Woord
                </button>
                <button
                  onClick={() => setTranslateMode("sentence")}
                  className={cn(
                    "px-2.5 py-1 rounded-full transition-colors",
                    translateMode === "sentence" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  📝 Zin
                </button>
              </div>
            </div>
            <div className="bg-muted/40 rounded-xl p-5 border border-border space-y-3">
              <TranslatableText
                text={currentChallenge.text}
                mode={translateMode}
                storyId={currentChallenge.id}
              />
            </div>
          </CardContent>
        </Card>

        {/* On-demand translator */}
        <TranslateSidePanel storyId={currentChallenge.id} />



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
