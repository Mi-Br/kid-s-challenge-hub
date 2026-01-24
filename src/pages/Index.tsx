import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, User } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import PinInput from "@/components/PinInput";
import CreateProfileModal from "@/components/CreateProfileModal";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  name: string;
  avatar: string;
  pin: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showPinInput, setShowPinInput] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const storedProfiles = localStorage.getItem("kidsProfiles");
    if (storedProfiles) {
      setProfiles(JSON.parse(storedProfiles));
    }
  }, []);

  const handleProfileClick = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setShowPinInput(true);
  };

  const handlePinComplete = (pin: string) => {
    if (selectedProfile && pin === selectedProfile.pin) {
      sessionStorage.setItem("currentProfile", JSON.stringify(selectedProfile));
      sessionStorage.removeItem("guestMode");
      navigate("/dashboard");
    } else {
      toast({
        title: "Oops! Wrong PIN 🙈",
        description: "Try again with the correct code",
        variant: "destructive",
      });
      setShowPinInput(false);
      setSelectedProfile(null);
    }
  };

  const handleCreateProfile = (name: string, avatar: string, pin: string) => {
    const newProfile = { name, avatar, pin };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem("kidsProfiles", JSON.stringify(updatedProfiles));
    setShowCreateModal(false);
    toast({
      title: "Profile Created! 🎉",
      description: `Welcome, ${name}! Your profile is ready.`,
    });
  };

  const handleGuestMode = () => {
    sessionStorage.setItem("guestMode", "true");
    sessionStorage.removeItem("currentProfile");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Kids Challenge Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Learn, play and have fun! 🌟
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="w-full max-w-2xl">
          <h2 className="text-lg font-semibold text-foreground text-center mb-4">
            Who's playing today?
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {profiles.map((profile, index) => (
              <ProfileCard
                key={index}
                name={profile.name}
                avatar={profile.avatar}
                onClick={() => handleProfileClick(profile)}
              />
            ))}
            
            {/* Add New Profile */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border bg-card/50 hover:bg-card hover:border-primary transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-7 h-7 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                New Profile
              </span>
            </button>
          </div>

          {/* Guest Mode */}
          <div className="text-center">
            <button
              onClick={handleGuestMode}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-secondary/30"
            >
              <User className="w-5 h-5" />
              Continue as Guest
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        Made with ❤️ for learning
      </footer>

      {/* Modals */}
      {showPinInput && selectedProfile && (
        <PinInput
          profileName={selectedProfile.name}
          onComplete={handlePinComplete}
          onCancel={() => {
            setShowPinInput(false);
            setSelectedProfile(null);
          }}
        />
      )}

      {showCreateModal && (
        <CreateProfileModal
          onComplete={handleCreateProfile}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default Index;
