import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "purple" | "yellow" | "teal" | "pink";
}

const colorMap = {
  purple: {
    bg: "bg-[hsl(var(--fun-purple)/0.1)]",
    icon: "text-[hsl(var(--fun-purple))]",
    border: "border-[hsl(var(--fun-purple)/0.2)]"
  },
  yellow: {
    bg: "bg-[hsl(var(--fun-yellow)/0.1)]",
    icon: "text-[hsl(var(--fun-yellow))]",
    border: "border-[hsl(var(--fun-yellow)/0.2)]"
  },
  teal: {
    bg: "bg-[hsl(var(--fun-teal)/0.1)]",
    icon: "text-[hsl(var(--fun-teal))]",
    border: "border-[hsl(var(--fun-teal)/0.2)]"
  },
  pink: {
    bg: "bg-[hsl(var(--fun-pink)/0.1)]",
    icon: "text-[hsl(var(--fun-pink))]",
    border: "border-[hsl(var(--fun-pink)/0.2)]"
  },
};

const StatsCard = ({ title, value, icon: Icon, color }: StatsCardProps) => {
  const colors = colorMap[color];
  
  return (
    <div className={cn(
      "bg-card rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-md",
      colors.border
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl",
          colors.bg
        )}>
          <Icon className={cn("w-6 h-6", colors.icon)} />
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
