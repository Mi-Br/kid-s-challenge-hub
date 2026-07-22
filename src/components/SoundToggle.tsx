import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export default function SoundToggle({ className }: { className?: string }) {
  const [muted, setMutedState] = useState(false);

  useEffect(() => { setMutedState(isMuted()); }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playSound("sparkle");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      data-sound="off"
      aria-label={muted ? "Geluid aan" : "Geluid uit"}
      title={muted ? "Geluid aan" : "Geluid uit"}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
        className,
      )}
    >
      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );
}
