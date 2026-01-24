import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ChallengeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "purple" | "yellow" | "teal" | "pink" | "blue" | "orange" | "green";
  progress?: number;
  onClick: () => void;
}

const colorMap = {
  purple: "bg-[hsl(var(--fun-purple))]",
  yellow: "bg-[hsl(var(--fun-yellow))]",
  teal: "bg-[hsl(var(--fun-teal))]",
  pink: "bg-[hsl(var(--fun-pink))]",
  blue: "bg-[hsl(var(--fun-blue))]",
  orange: "bg-[hsl(var(--fun-orange))]",
  green: "bg-[hsl(var(--fun-green))]",
};

const ChallengeCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  progress = 0,
  onClick 
}: ChallengeCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full p-6 rounded-2xl text-left transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/30",
        "overflow-hidden",
        colorMap[color]
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[hsl(0_0%_100%/0.1)] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[hsl(0_0%_100%/0.08)] translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "p-3 rounded-xl bg-[hsl(0_0%_100%/0.2)]",
            "group-hover:scale-110 transition-transform duration-300"
          )}>
            <Icon className="w-7 h-7 text-[hsl(0_0%_100%)]" />
          </div>
          {progress > 0 && (
            <div className="text-[hsl(0_0%_100%)] text-sm font-semibold bg-[hsl(0_0%_100%/0.2)] px-3 py-1 rounded-full">
              {progress}%
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-[hsl(0_0%_100%)] mb-1">{title}</h3>
        <p className="text-[hsl(0_0%_100%/0.85)] text-sm">{description}</p>
        
        {/* Progress bar */}
        {progress > 0 && (
          <div className="mt-4 h-2 bg-[hsl(0_0%_100%/0.2)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[hsl(0_0%_100%)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </button>
  );
};

export default ChallengeCard;
