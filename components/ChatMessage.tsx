"use client";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { BotAvatar } from "./bot-avatar";
import { BeatLoader } from "react-spinners";
import { UserAvatar } from "./user-avatar";
import { Button } from "./ui/button";
import { Copy, Speaker, SpeakerIcon, Volume, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useState } from "react";

export interface ChatMessageProps {
  role: "system" | "user";
  content?: string;
  isLoading?: boolean;
  src?: string;
}

export const ChatMessage = ({
  role,
  content,
  isLoading,
  src,
}: ChatMessageProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [utterance, setUtterance] = useState<any>(null);

  const onCopy = () => {
    if (!content) {
      return;
    }

    navigator.clipboard.writeText(content);
    toast({
      description: "Message copied to clipboard",
    });
  };


  const handleSpeak = (text:string) => {
    if (isSpeaking) {
      if (utterance) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } else {
      const newUtterance = new SpeechSynthesisUtterance(text);
      newUtterance.onend = () => setIsSpeaking(false);
      setUtterance(newUtterance);
      window.speechSynthesis.speak(newUtterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-x-3 py-4 w-full",
        role === "user" && "justify-end"
      )}
    >
      {role !== "user" && src && <BotAvatar src={src} />}
      <div className="rounded-md px-4 py-2 max-w-sm text-sm bg-primary/10">
        {isLoading ? (
          <BeatLoader size={5} color={theme === "light" ? "black" : "white"} />
        ) : (
          <div className="flex w-full h-full">
          <p dangerouslySetInnerHTML={{ __html: content! }}>
          </p>
          {
            role === "system" && (
              <div className="flex items-end justify-end">
              <Button variant={"ghost"} className="m-0 p-0 hover:bg-transparent" onClick={()=> handleSpeak(content!) }>
                {
                  !isSpeaking ? <Volume2 /> : <VolumeOff />
                }
              </Button>
              </div>
          )
        }
          </div>
        )}
      </div>
      {role === "user" && <UserAvatar />}
      {role !== "user" && !isLoading && (
        <Button
          onClick={onCopy}
          className="opacity-0 group-hover:opacity-100 transition"
          size="icon"
          variant="ghost"
        >
          <Copy className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
