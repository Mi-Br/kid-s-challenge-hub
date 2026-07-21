import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Volume2, BookmarkPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { translateAndSave, getCachedEntry, type VocabEntry } from "@/lib/vocabulary";
import { toast } from "@/hooks/use-toast";

type Mode = "word" | "sentence";

interface Props {
  text: string;
  mode: Mode;
  storyId?: string;
  className?: string;
}

// Split a paragraph into sentences (keeps terminator with sentence).
function splitSentences(paragraph: string): string[] {
  const parts = paragraph.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g);
  return (parts || [paragraph]).map((s) => s.trim()).filter(Boolean);
}

// Split a sentence into word tokens with punctuation/spaces preserved.
function tokenize(sentence: string): { text: string; isWord: boolean }[] {
  const parts = sentence.match(/[A-Za-zÀ-ÿ']+|[^A-Za-zÀ-ÿ']+/g) || [];
  return parts.map((p) => ({ text: p, isWord: /[A-Za-zÀ-ÿ']/.test(p) }));
}

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "nl-NL";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

function TranslationPopover({
  raw,
  mode,
  contextSentence,
  storyId,
  children,
}: {
  raw: string;
  mode: Mode;
  contextSentence?: string;
  storyId?: string;
  children: React.ReactNode;
}) {
  const cached = getCachedEntry(raw, mode);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<VocabEntry | null>(cached);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (entry || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await translateAndSave({
        text: raw,
        type: mode,
        context: mode === "word" ? contextSentence : undefined,
        storyId,
      });
      setEntry(result);
    } catch (e: any) {
      setError(e?.message || "Kon niet vertalen");
    } finally {
      setLoading(false);
    }
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      const wasCached = !!entry;
      load().then(() => {
        if (!wasCached && entry) {
          toast({
            title: "Toegevoegd aan woordenschat ✨",
            description: `"${raw}" opgeslagen`,
          });
        }
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span onMouseEnter={load} onTouchStart={load}>{children}</span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top" align="center">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI is aan het vertalen…
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {entry && (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-serif text-lg font-bold text-foreground leading-tight">
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
                className="p-1.5 rounded-full hover:bg-muted"
                title="Luister"
              >
                <Volume2 className="w-4 h-4 text-primary" />
              </button>
            </div>
            <p className="text-base font-medium text-primary">{entry.translation}</p>
            {entry.explanation && (
              <p className="text-sm text-muted-foreground leading-snug">{entry.explanation}</p>
            )}
            {entry.example && (
              <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                {entry.example}
              </p>
            )}
            <div className="flex items-center gap-1 pt-1 text-[11px] text-muted-foreground">
              <BookmarkPlus className="w-3 h-3" />
              Opgeslagen in je woordenschat
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function TranslatableText({ text, mode, storyId, className }: Props) {
  const paragraphs = text.split("\n\n");
  return (
    <>
      {paragraphs.map((para, pi) => {
        const sentences = splitSentences(para);
        return (
          <p
            key={pi}
            className={cn(
              "text-lg leading-relaxed font-serif text-foreground indent-4 first:indent-0",
              className,
            )}
          >
            {sentences.map((sentence, si) => {
              if (mode === "sentence") {
                return (
                  <TranslationPopover key={si} raw={sentence} mode="sentence" storyId={storyId}>
                    <span className="cursor-pointer rounded px-0.5 -mx-0.5 transition-colors hover:bg-primary/15 hover:text-primary">
                      {sentence}
                    </span>
                  </TranslationPopover>
                );
              }
              // word mode
              const tokens = tokenize(sentence);
              return (
                <span key={si}>
                  {tokens.map((tok, ti) =>
                    tok.isWord ? (
                      <TranslationPopover
                        key={ti}
                        raw={tok.text}
                        mode="word"
                        contextSentence={sentence}
                        storyId={storyId}
                      >
                        <span className="cursor-pointer rounded transition-colors hover:bg-primary/15 hover:text-primary">
                          {tok.text}
                        </span>
                      </TranslationPopover>
                    ) : (
                      <span key={ti}>{tok.text}</span>
                    ),
                  )}
                </span>
              );
            }).reduce<React.ReactNode[]>((acc, node, idx) => {
              if (idx > 0) acc.push(" ");
              acc.push(node);
              return acc;
            }, [])}
          </p>
        );
      })}
    </>
  );
}
