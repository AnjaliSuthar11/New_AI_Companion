import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface BotAvatarProps {
  src: string;
}

export const BotAvatar = ({ src }: BotAvatarProps) => {
  return (
    <div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={src} />
      </Avatar>
    </div>
  );
};
