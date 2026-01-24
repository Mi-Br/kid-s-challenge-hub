import { cn } from "@/lib/utils";

interface ProfileCardProps {
  name: string;
  avatar: string;
  isSelected?: boolean;
  onClick: () => void;
}

const ProfileCard = ({ name, avatar, isSelected, onClick }: ProfileCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300",
        "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/30",
        isSelected 
          ? "bg-primary shadow-lg scale-105" 
          : "bg-card hover:bg-card/80"
      )}
    >
      <div className={cn(
        "text-6xl sm:text-7xl transition-transform duration-300 group-hover:scale-110",
        isSelected && "animate-bounce"
      )}>
        {avatar}
      </div>
      <span className={cn(
        "text-lg font-semibold transition-colors",
        isSelected ? "text-primary-foreground" : "text-card-foreground"
      )}>
        {name}
      </span>
    </button>
  );
};

export default ProfileCard;
