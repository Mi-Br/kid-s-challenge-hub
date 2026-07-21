import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, Loader2, Trophy, Clock, BookOpen, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchTeacherOverview, isTeacherMode, type ProfileSummary } from "@/lib/teacher";
import { fetchVocabForProfileId } from "@/lib/teacher";
import { cn } from "@/lib/utils";

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" }) : "—";
const fmtMin = (sec: number) => `${Math.round(sec / 60)} min`;

const Teacher = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [vocab, setVocab] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!isTeacherMode()) {
      navigate("/dashboard");
      return;
    }
    fetchTeacherOverview()
      .then((rows) => {
        setProfiles(rows);
        if (rows.length) setOpenId(rows[0].profile_id);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const toggle = async (pid: string) => {
    const next = openId === pid ? null : pid;
    setOpenId(next);
    if (next && !vocab[pid]) {
      const rows = await fetchVocabForProfileId(pid);
      setVocab((v) => ({ ...v, [pid]: rows }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" /> Terug
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-sm">Docentmodus</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-serif">Overzicht leerlingen 👩‍🏫</h2>
          <p className="text-sm text-muted-foreground">
            Bekijk voortgang, voltooide uitdagingen en woordenschat per profiel.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Laden…
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-2">
              <p className="text-4xl">📊</p>
              <p className="font-semibold">Nog geen activiteit</p>
              <p className="text-sm text-muted-foreground">Zodra een leerling een uitdaging doet, verschijnt het hier.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {profiles.map((p) => {
              const open = openId === p.profile_id;
              const words = vocab[p.profile_id] || [];
              return (
                <Card key={p.profile_id}>
                  <button
                    onClick={() => toggle(p.profile_id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <div>
                        <p className="font-semibold text-lg">{p.label}</p>
                        <p className="text-xs text-muted-foreground">Laatst actief: {fmtDate(p.last_active)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <Stat icon={Trophy} value={p.total_score} label="pt" />
                      <Stat icon={Clock} value={fmtMin(p.total_time)} label="" />
                      <Stat icon={BookOpen} value={p.completions.length} label="ronden" />
                      <Stat icon={Sparkles} value={p.vocab_count} label="woorden" />
                    </div>
                  </button>

                  {open && (
                    <CardContent className="pt-0 space-y-4">
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Voltooide uitdagingen
                        </h3>
                        {p.completions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nog geen voltooiingen.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="text-xs text-muted-foreground border-b">
                                <tr>
                                  <th className="text-left py-2">Uitdaging</th>
                                  <th className="text-left">Type</th>
                                  <th className="text-right">Score</th>
                                  <th className="text-right">Goed</th>
                                  <th className="text-right">Tijd</th>
                                  <th className="text-right">Wanneer</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.completions.map((c) => (
                                  <tr key={c.id} className="border-b last:border-0">
                                    <td className="py-2 font-medium">{c.challenge_title || c.challenge_id}</td>
                                    <td className="text-muted-foreground">{c.challenge_type}</td>
                                    <td className="text-right">{c.score}</td>
                                    <td className="text-right">
                                      {c.correct_count ?? "—"}
                                      {c.total_questions ? ` / ${c.total_questions}` : ""}
                                    </td>
                                    <td className="text-right text-muted-foreground">{c.duration_seconds ? fmtMin(c.duration_seconds) : "—"}</td>
                                    <td className="text-right text-muted-foreground text-xs">{fmtDate(c.completed_at)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>

                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Woordenschat ({p.vocab_count})
                        </h3>
                        {words.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Geen woorden opgeslagen.</p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2 max-h-80 overflow-auto">
                            {words.slice(0, 40).map((w: any) => (
                              <div key={w.id} className="text-sm border rounded-lg p-2">
                                <div className="flex justify-between gap-2">
                                  <span className="font-serif font-semibold">{w.entry?.dutch_text}</span>
                                  <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full border shrink-0",
                                    w.entry?.type === "word"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-purple-50 text-purple-700 border-purple-200",
                                  )}>{w.entry?.type === "word" ? "woord" : "zin"}</span>
                                </div>
                                <p className="text-primary">{w.entry?.translation}</p>
                                <p className="text-[11px] text-muted-foreground">{w.lookup_count}× opgezocht</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

function Stat({ icon: Icon, value, label }: { icon: any; value: any; label: string }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <Icon className="w-4 h-4" />
      <span className="font-semibold text-foreground">{value}</span>
      {label && <span className="text-xs">{label}</span>}
    </span>
  );
}

export default Teacher;
