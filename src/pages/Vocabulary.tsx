import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, BookOpen, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchVocabForProfile, getCurrentProfileId, type VocabLookup } from "@/lib/vocabulary";

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "nl-NL";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

type Filter = "all" | "word" | "sentence";
type Sort = "recent" | "most" | "az";

const Vocabulary = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<VocabLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [q, setQ] = useState("");

  const profileId = getCurrentProfileId();
  const profileLabel = profileId.startsWith("profile:") ? profileId.slice(8) : "Gast";

  useEffect(() => {
    fetchVocabForProfile()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items
    .filter((i) => i.entry)
    .filter((i) => (filter === "all" ? true : i.entry!.type === filter))
    .filter((i) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        i.entry!.dutch_text.toLowerCase().includes(needle) ||
        i.entry!.translation.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => {
      if (sort === "most") return b.lookup_count - a.lookup_count;
      if (sort === "az") return a.entry!.dutch_text.localeCompare(b.entry!.dutch_text);
      return new Date(b.last_looked_up_at).getTime() - new Date(a.last_looked_up_at).getTime();
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Terug</span>
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-foreground text-sm">
              Woordenschat · {profileLabel}
            </h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold font-serif text-foreground">Jouw woorden 📚</h2>
          <p className="text-sm text-muted-foreground">
            Woorden en zinnen die je hebt opgezocht tijdens het lezen
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek in je woordenschat…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "word", "sentence"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-colors",
                  filter === f
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background border-border hover:border-foreground/40",
                )}
              >
                {f === "all" ? "Alles" : f === "word" ? "Woorden" : "Zinnen"}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="text-xs px-3 py-1.5 rounded-full border-2 border-border bg-background font-medium"
          >
            <option value="recent">Meest recent</option>
            <option value="most">Vaakst opgezocht</option>
            <option value="az">A–Z</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Laden…
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-2">
              <p className="text-4xl">📖</p>
              <p className="font-semibold text-foreground">Nog geen woorden</p>
              <p className="text-sm text-muted-foreground">
                Klik tijdens het lezen op een woord of zin — die verschijnt hier automatisch.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((item) => {
              const e = item.entry!;
              return (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-serif text-lg font-bold text-foreground leading-tight break-words">
                            {e.dutch_text}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                              e.type === "word"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-purple-50 text-purple-700 border-purple-200",
                            )}
                          >
                            {e.type === "word" ? "woord" : "zin"}
                          </span>
                        </div>
                        {e.part_of_speech && (
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {e.part_of_speech}
                            {e.lemma && e.lemma !== e.dutch_text && ` · ${e.lemma}`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => speak(e.dutch_text)}
                        className="p-1.5 rounded-full hover:bg-muted shrink-0"
                        title="Luister"
                      >
                        <Volume2 className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                    <p className="text-base font-medium text-primary">{e.translation}</p>
                    {e.explanation && (
                      <p className="text-sm text-muted-foreground leading-snug">{e.explanation}</p>
                    )}
                    {e.example && (
                      <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                        {e.example}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Opgezocht: {item.lookup_count}× · laatst{" "}
                      {new Date(item.last_looked_up_at).toLocaleDateString("nl-NL")}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Vocabulary;
