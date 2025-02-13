"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

export const UserAvatar = () => {
  const { user } = useUser();
  return (
    <div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.imageUrl} />
      </Avatar>
    </div>
  );
};
