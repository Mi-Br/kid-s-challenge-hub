import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Calculator, 
  Gamepad2, 
  Trophy,
  Clock,
  Star,
  Flame,
  LogOut,
  Sparkles
} from "lucide-react";
import ChallengeCard from "@/components/ChallengeCard";
import StatsCard from "@/components/StatsCard";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  name: string;
  avatar: string;
  pin: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const storedProfile = sessionStorage.getItem("currentProfile");
    const guestMode = sessionStorage.getItem("guestMode");
    
    if (guestMode === "true") {
      setIsGuest(true);
    } else if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("currentProfile");
    sessionStorage.removeItem("guestMode");
    navigate("/");
  };

  const handleChallengeClick = (challengeName: string) => {
    toast({
      title: "Coming Soon! 🚀",
      description: `The ${challengeName} challenge will be available soon!`,
    });
  };

  const displayName = isGuest ? "Guest" : profile?.name;
  const displayAvatar = isGuest ? "👤" : profile?.avatar;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{displayAvatar}</div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Hey, {displayName}! 
                  <span className="ml-2">👋</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ready for some fun challenges?
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Switch Profile</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Stats Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Today's Progress</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Daily Score"
              value="125"
              icon={Trophy}
              color="yellow"
            />
            <StatsCard
              title="Time Today"
              value="45 min"
              icon={Clock}
              color="teal"
            />
            <StatsCard
              title="Stars Earned"
              value="12"
              icon={Star}
              color="pink"
            />
            <StatsCard
              title="Day Streak"
              value="5 🔥"
              icon={Flame}
              color="purple"
            />
          </div>
        </section>

        {/* Challenges Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Challenges</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChallengeCard
              title="Learn Dutch 🇳🇱"
              description="Practice words, sentences and speaking"
              icon={BookOpen}
              color="purple"
              progress={35}
              onClick={() => navigate("/learn-dutch")}
            />
        
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
