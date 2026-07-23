import { useState } from "react";
import { Loader2, Volume2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { translateAndSave, type VocabEntry } from "@/lib/vocabulary";
import { toast } from "@/hooks/use-toast";

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "nl-NL";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

interface Props {
  storyId?: string;
  className?: string;
}

export function TranslateSidePanel({ storyId, className }: Props) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"word" | "sentence">("word");
  const [direction, setDirection] = useState<"nl" | "en">("nl");
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<VocabEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = text.trim();
    if (!value || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await translateAndSave({ text: value, type: mode, storyId, source: direction });
      setEntry(result);
      toast({
        title: "Toegevoegd aan woordenschat ✨",
        description: `"${value}" opgeslagen`,
      });
    } catch (e: any) {
      setError(e?.message || "Kon niet vertalen");
    } finally {
      setLoading(false);
    }
  };

  const placeholderWord = direction === "nl" ? "bijv. hond" : "e.g. dog";
  const placeholderSentence = direction === "nl" ? "bijv. Waar is het station?" : "e.g. Where is the station?";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="bg-[hsl(var(--fun-purple))] px-4 py-2.5 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-white" />
        <h3 className="text-sm font-semibold text-white">Vertaal iets</h3>
      </div>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          Typ een woord of zin — we vertalen tussen Nederlands en Engels en bewaren het in je woordenschat.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-border p-0.5 bg-background text-xs">
            <button
              onClick={() => setDirection("nl")}
              className={cn(
                "px-2.5 py-1 rounded-full transition-colors",
                direction === "nl" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              🇳🇱 NL → EN
            </button>
            <button
              onClick={() => setDirection("en")}
              className={cn(
                "px-2.5 py-1 rounded-full transition-colors",
                direction === "en" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              🇬🇧 EN → NL
            </button>
          </div>

          <div className="inline-flex items-center rounded-full border border-border p-0.5 bg-background text-xs">
            <button
              onClick={() => setMode("word")}
              className={cn(
                "px-2.5 py-1 rounded-full transition-colors",
                mode === "word" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              🔤 Woord
            </button>
            <button
              onClick={() => setMode("sentence")}
              className={cn(
                "px-2.5 py-1 rounded-full transition-colors",
                mode === "sentence" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              📝 Zin
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={mode === "word" ? placeholderWord : placeholderSentence}
            disabled={loading}
          />
          <Button onClick={submit} disabled={loading || !text.trim()} size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vertaal"}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {entry && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2 relative">
            <button
              onClick={() => setEntry(null)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-background"
              title="Sluiten"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <div className="flex items-start justify-between gap-2 pr-6">
              <div className="min-w-0">
                <p className="font-serif text-base font-bold text-foreground leading-tight break-words">
                  {entry.dutch_text}
                </p>
                {entry.part_of_speech && (
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {entry.part_of_speech}
                    {entry.lemma && entry.lemma !== entry.dutch_text && ` · ${entry.lemma}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => speak(entry.dutch_text)}
                className="p-1.5 rounded-full hover:bg-background shrink-0"
                title="Luister"
              >
                <Volume2 className="w-4 h-4 text-primary" />
              </button>
            </div>
            <p className="text-sm font-medium text-primary">{entry.translation}</p>
            {entry.explanation && (
              <p className="text-xs text-muted-foreground leading-snug">{entry.explanation}</p>
            )}
            {entry.example && (
              <p className="text-[11px] italic text-muted-foreground border-l-2 border-border pl-2">
                {entry.example}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
