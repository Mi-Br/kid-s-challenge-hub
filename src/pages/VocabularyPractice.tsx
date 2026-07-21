import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, Check, X, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchVocabForProfile, type VocabLookup, type VerbForms } from "@/lib/vocabulary";
import { recordCompletion } from "@/lib/teacher";
import { cn } from "@/lib/utils";

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "nl-NL";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:"'()]/g, "");

type QKind = "translate" | "verb-present" | "verb-past" | "verb-perfect";
interface Q {
  kind: QKind;
  dutch: string;
  prompt: string;
  accepted: string[];
  hint?: string;
  entryId: string;
}

function buildQuestions(items: VocabLookup[], count: number): Q[] {
  const pool: Q[] = [];
  for (const it of items) {
    const e = it.entry;
    if (!e || !e.translation) continue;
    // Base NL → EN
    pool.push({
      kind: "translate",
      dutch: e.dutch_text,
      prompt: `Wat betekent "${e.dutch_text}" in het Engels?`,
      accepted: e.translation.split(/[,/]/).map(norm).filter(Boolean),
      hint: e.explanation || undefined,
      entryId: e.id,
    });
    const vf = e.verb_forms as VerbForms | null;
    if (e.part_of_speech === "verb" && vf) {
      if (vf.past?.ik) {
        pool.push({
          kind: "verb-past",
          dutch: vf.infinitive || e.dutch_text,
          prompt: `Verleden tijd: ik ___ (${vf.infinitive || e.dutch_text})`,
          accepted: [norm(vf.past.ik)],
          entryId: e.id,
        });
      }
      if (vf.perfect) {
        pool.push({
          kind: "verb-perfect",
          dutch: vf.infinitive || e.dutch_text,
          prompt: `Voltooid: ik ___ (${vf.infinitive || e.dutch_text})`,
          accepted: [norm(vf.perfect)],
          hint: "bijv. 'heb gewerkt'",
          entryId: e.id,
        });
      }
      if (vf.present?.wij) {
        pool.push({
          kind: "verb-present",
          dutch: vf.infinitive || e.dutch_text,
          prompt: `Tegenwoordige tijd: wij ___ (${vf.infinitive || e.dutch_text})`,
          accepted: [norm(vf.present.wij)],
          entryId: e.id,
        });
      }
    }
  }
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

const VocabularyPractice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VocabLookup[]>([]);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef<number>(Date.now());
  const savedRef = useRef(false);

  useEffect(() => {
    fetchVocabForProfile()
      .then((rows) => {
        setItems(rows);
        setQuestions(buildQuestions(rows, 10));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const q = questions[idx];
  const total = questions.length;

  const submit = () => {
    if (!q || state !== "idle") return;
    const ok = q.accepted.some((a) => a === norm(answer));
    if (ok) {
      setState("correct");
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
    } else {
      setState("wrong");
    }
  };

  const next = () => {
    setState("idle");
    setAnswer("");
    setShowHint(false);
    if (idx < total - 1) {
      setIdx(idx + 1);
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setDone(true);
    }
  };

  useEffect(() => {
    if (done && !savedRef.current && total > 0) {
      savedRef.current = true;
      recordCompletion({
        challenge_type: "vocab-practice",
        challenge_id: "vocab-practice",
        challenge_title: "Woordoefening",
        groep_level: null,
        score,
        total_questions: total,
        correct_count: correctCount,
        partial_count: 0,
        duration_seconds: Math.round((Date.now() - startedAt.current) / 1000),
      });
    }
  }, [done, score, correctCount, total]);

  const restart = () => {
    setQuestions(buildQuestions(items, 10));
    setIdx(0);
    setAnswer("");
    setState("idle");
    setScore(0);
    setCorrectCount(0);
    setDone(false);
    setShowHint(false);
    startedAt.current = Date.now();
    savedRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Laden…
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header onBack={() => navigate("/vocabulary")} />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-5xl">📖</p>
          <h2 className="text-2xl font-bold font-serif">Nog geen woorden om te oefenen</h2>
          <p className="text-muted-foreground">
            Klik tijdens het lezen op woorden om je woordenschat te vullen — daarna kun je hier oefenen.
          </p>
          <Button onClick={() => navigate("/learn-dutch")}>Ga lezen</Button>
        </main>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((correctCount / total) * 100);
    return (
      <div className="min-h-screen bg-background">
        <Header onBack={() => navigate("/vocabulary")} />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-6xl">{pct >= 80 ? "🏆" : pct >= 50 ? "👏" : "💪"}</p>
              <h2 className="text-2xl font-bold font-serif">Klaar!</h2>
              <p className="text-muted-foreground">
                {correctCount} van {total} goed · {score} punten
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Button onClick={restart}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Opnieuw
                </Button>
                <Button variant="outline" onClick={() => navigate("/vocabulary")}>Terug</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onBack={() => navigate("/vocabulary")} />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Vraag {idx + 1} van {total}</span>
          <span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-primary" /> {score} pt</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((idx) / total) * 100}%` }} />
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {q.kind === "translate" ? "Vertaling" : q.kind === "verb-past" ? "Verleden tijd" : q.kind === "verb-perfect" ? "Voltooid" : "Tegenwoordig"}
              </span>
              <button onClick={() => speak(q.dutch)} className="p-2 rounded-full hover:bg-muted" title="Luister">
                <Volume2 className="w-4 h-4 text-primary" />
              </button>
            </div>
            <p className="text-lg font-serif font-medium">{q.prompt}</p>

            <Input
              ref={inputRef}
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (state === "idle") submit();
                  else next();
                }
              }}
              placeholder="Jouw antwoord…"
              disabled={state !== "idle"}
              className={cn(
                state === "correct" && "border-green-500 bg-green-50",
                state === "wrong" && "border-red-500 bg-red-50",
              )}
            />

            {state === "correct" && (
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <Check className="w-4 h-4" /> Goed gedaan!
              </div>
            )}
            {state === "wrong" && (
              <div className="flex items-start gap-2 text-red-700 text-sm">
                <X className="w-4 h-4 mt-0.5" />
                <span>Bijna! Juist: <b>{q.accepted[0]}</b></span>
              </div>
            )}
            {q.hint && state === "idle" && (
              <button
                onClick={() => setShowHint((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showHint ? "Verberg hint" : "Toon hint"}
              </button>
            )}
            {showHint && q.hint && <p className="text-xs text-muted-foreground italic">{q.hint}</p>}

            <div className="flex gap-2 pt-2">
              {state === "idle" ? (
                <Button onClick={submit} disabled={!answer.trim()} className="flex-1">Controleer</Button>
              ) : (
                <Button onClick={next} className="flex-1">{idx < total - 1 ? "Volgende" : "Bekijk resultaat"}</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
          <ArrowLeft className="w-4 h-4" /> Terug
        </button>
        <h1 className="font-semibold text-sm">Woordoefening ✨</h1>
        <div className="w-16" />
      </div>
    </header>
  );
}

export default VocabularyPractice;
