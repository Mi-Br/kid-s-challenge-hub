import { useState } from "react";
import { cn } from "@/lib/utils";

const avatarOptions = ["🦊", "🐼", "🦁", "🐸", "🦄", "🐰", "🐻", "🐯", "🦋", "🐙", "🦖", "🐨"];

interface CreateProfileModalProps {
  onComplete: (name: string, avatar: string, pin: string) => void;
  onCancel: () => void;
}

const CreateProfileModal = ({ onComplete, onCancel }: CreateProfileModalProps) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [pin, setPin] = useState("");

  const handlePinChange = (value: string) => {
    if (/^\d{0,4}$/.test(value)) {
      setPin(value);
    }
  };

  const handleComplete = () => {
    if (name && avatar && pin.length === 4) {
      onComplete(name, avatar, pin);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                step >= s ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-xl font-bold text-card-foreground mb-2">What's your name?</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full p-4 text-center text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <button
              onClick={() => name && setStep(2)}
              disabled={!name}
              className={cn(
                "w-full mt-4 py-3 rounded-xl font-semibold transition-all",
                name 
                  ? "bg-primary text-primary-foreground hover:opacity-90" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <div className="text-5xl mb-4">{avatar || "🎭"}</div>
            <h2 className="text-xl font-bold text-card-foreground mb-4">Pick your avatar!</h2>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={cn(
                    "text-4xl p-3 rounded-xl transition-all hover:scale-110",
                    avatar === emoji 
                      ? "bg-primary shadow-lg scale-110" 
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={() => avatar && setStep(3)}
                disabled={!avatar}
                className={cn(
                  "flex-1 py-3 rounded-xl font-semibold transition-all",
                  avatar 
                    ? "bg-primary text-primary-foreground hover:opacity-90" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-xl font-bold text-card-foreground mb-2">Create your secret PIN</h2>
            <p className="text-muted-foreground text-sm mb-4">4 numbers to keep your profile safe</p>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="• • • •"
              className="w-full p-4 text-center text-2xl tracking-widest rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleComplete}
                disabled={pin.length !== 4}
                className={cn(
                  "flex-1 py-3 rounded-xl font-semibold transition-all",
                  pin.length === 4
                    ? "bg-primary text-primary-foreground hover:opacity-90" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Done! ✨
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateProfileModal;
