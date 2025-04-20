"use client";

import axios from "axios";
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
  content: string;
  isLoading?: boolean;
  src?: string;
  gender:"male" | "female";
  
}

export const ChatMessage = ({
  role,
  content,
  isLoading,
  src,
  gender,
}: ChatMessageProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

 
  const onCopy = () => {
    if (!content) {
      return;
    }

    navigator.clipboard.writeText(content);
    toast({
      description: "Message copied to clipboard",
    });
  };


  // const handleSpeak = (text:string) => {
  //   if (isSpeaking) {
  //     if (utterance) {
  //       window.speechSynthesis.cancel();
  //       setIsSpeaking(false);
  //     }
  //   } else {
  //     const newUtterance = new SpeechSynthesisUtterance(text);
  //     newUtterance.onend = () => setIsSpeaking(false);
  //     setUtterance(newUtterance);
  //     window.speechSynthesis.speak(newUtterance);
  //     setIsSpeaking(true);
  //   }
  // };
  
  // for eleven labs
  // const handleSpeak = async () => {
  //   if (!content) return;

  //   try {
  //     const response = await axios.post("/api/text-to-speech", {
  //       text: content,
  //       gender:gender,
  //     },{responseType:"arraybuffer"});

  //     const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
  //     const audioUrl = URL.createObjectURL(audioBlob);

  //     const audio = new Audio(audioUrl);
  //     console.log("Audio URL:", audioUrl);
  //     console.log("Supported formats:", audio.canPlayType("audio/mpeg"));

  //     setIsSpeaking(true);
  //     audio.play();
  //     audio.onended = () => setIsSpeaking(false);

  //   } catch (error) {
  //     console.error("Failed to generate voice:", error);
  //     toast({ 
  //       variant: "destructive", 
  //       description: "Failed to generate voice." });
  //   }
  // };

  const handlePlayVoice = async () => {
    if (!content || !gender) {
      toast({ 
        variant: "destructive", 
        description: "Content or gender missing." 
      });
      return;
    }
  
    try {
      setIsSpeaking(true);
      const response = await axios.post("/api/text-to-speech", {
        text: content,
        gender,
      });
  
      const { audioUrl } = response.data;
  
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => setIsSpeaking(false);
      } else {
        throw new Error("No audio URL received");
      }
    } catch (error) {
      console.error("Failed to generate voice:", error);
      toast({ 
        variant: "destructive", 
        description: "Failed to generate AI voice." 
      });
    } finally {
      setIsSpeaking(false);
    }
  };
  

  // if (isSpeaking) {
    //     if (utterance) {
    //       window.speechSynthesis.cancel();
    //       setIsSpeaking(false);
    //     }
    //   } else {
    //     const newUtterance = new SpeechSynthesisUtterance(text);
    //     newUtterance.onend = () => setIsSpeaking(false);
    //     setUtterance(newUtterance);
    //     window.speechSynthesis.speak(newUtterance);
    //     setIsSpeaking(true);
    //   }

    // const speakText = (text: string, gender: "male" | "female") => {
    //   if (isSpeaking) {
    //     if (utterance) {
    //       window.speechSynthesis.cancel();
    //       setIsSpeaking(false);
    //     }
    //   } else {
    //     const newUtterance = new SpeechSynthesisUtterance(text);
    
    //     const voices = window.speechSynthesis.getVoices();

    //     const maleVoices = voices.filter((voice) =>
    //       ["Microsoft David", "Microsoft Ravi", "Microsoft Mark", "Google UK English Male"].some((name) =>
    //         voice.name.includes(name)
    //       )
    //     );
    
    //     const femaleVoices = voices.filter((voice) =>
    //       ["Microsoft Heera", "Microsoft Zira", "Google UK English Female"].some((name) =>
    //         voice.name.includes(name)
    //       )
    //     );
    
    //     newUtterance.voice = gender === "female" ? femaleVoices[1] : maleVoices[2];
    
    //     newUtterance.onend = () => setIsSpeaking(false);
    //     setUtterance(newUtterance);
    
    //     window.speechSynthesis.speak(newUtterance);
    //     setIsSpeaking(true);
    //   }
    // };

    const speakText = (text: string, gender: "male" | "female") => {
      if (isSpeaking) {
        if (utterance) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
      } else {
        const newUtterance = new SpeechSynthesisUtterance(text);
    
        const voices = window.speechSynthesis.getVoices();
    
        // 🧠 Detect language from the message (basic check for Hindi vs English)
        const isHindi = /[\u0900-\u097F]/.test(text); // Unicode range for Devanagari
    
        // ✅ Filter voice list by language and gender
        const filteredVoices = voices.filter((voice) => {
          const matchLang = isHindi ? voice.lang.includes("hi") : voice.lang.includes("en");
          const matchGender = gender === "male"
            ? voice.name.toLowerCase().includes("male") || voice.name.toLowerCase().includes("Microsoft Mark") || voice.name.toLowerCase().includes("Microsoft Ravi") || voice.name.toLowerCase().includes("Microsoft David") || voice.name.toLowerCase().includes("Google UK English Male") || voice.name.toLowerCase().includes("mark")
            : voice.name.toLowerCase().includes("female") || voice.name.toLowerCase().includes("Microsoft Zira") || voice.name.toLowerCase().includes("Microsoft Heera");
          return matchLang && matchGender;
        });
    
        // 🗣️ Fallback voice selection if no filtered voice found
        const selectedVoice = filteredVoices[0] || voices.find(v => v.lang.includes(isHindi ? "hi" : "en")) || voices[0];
    
        newUtterance.voice = selectedVoice;
        newUtterance.lang = isHindi ? "hi-IN" : "en-US"; // Set language
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
              <Button variant={"ghost"} className="m-0 p-0 hover:bg-transparent" onClick={()=>speakText(content,gender)}>
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
