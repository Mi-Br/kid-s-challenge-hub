import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  onComplete: (pin: string) => void;
  onCancel: () => void;
  profileName: string;
}

const PinInput = ({ onComplete, onCancel, profileName }: PinInputProps) => {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(digit => digit !== "")) {
      onComplete(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-xl font-bold text-card-foreground">
            Enter PIN for {profileName}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Type your 4-digit secret code
          </p>
        </div>
        
        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                "w-14 h-16 text-center text-2xl font-bold rounded-xl border-2",
                "bg-background transition-all duration-200",
                "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20",
                digit ? "border-primary bg-primary/5" : "border-border"
              )}
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PinInput;
