// import { error } from "console";
// import { NextResponse } from "next/server";
// import { buffer } from "stream/consumers";

// export async function POST(request:Request){
//     try{
//         const apiKey=process.env.ELEVENLABS_API_KEY;

//         const voiceMap: Record<string, string> = {
//             male: "CwhRBWXzGAHq8TQ4Fs17",
//             female: "cgSgspJ2msm6clMCkdW9",
//           };
        

//         if(!apiKey){
//             console.error("ELEVENLABS_API_KEY is not configured");
//             return NextResponse.json(
//                 {error:"API Key not configured"},
//                 {status:500}
//             );
//         }

    
//         const {text,voice}=await request.json();

//         if(!text||!voice){
//             return NextResponse.json(
//                 {error:"Missing required fields: 'text' and 'voice'"},
//                 {status:400}
//             );
//         }

//         const response= await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`,{
//             method:"POST",
//             headers:{
//                 Accept:"audio/mpeg",
//                 "Content-Type":"application/json",
//                 "xi-api-key":apiKey,
//             },
//             body:JSON.stringify({
//                 text,
//                 model_id:"",
//                 voice_settings:{
//                     stability:0.5,
//                     similarity_boost:0.75,
//                  }
//             })
//         }
//      );

//      if(!response.ok){
//         const errorData= await response.json();
//         console.error("API Error Response",errorData);
//         const errorMessage= errorData.detail?.message||"Failed to generate speech";
//         return NextResponse.json(
//             {error:errorMessage},
//             {status:response.status}
//         );
//      }

//      const audioBuffer = await response.arrayBuffer();
//      const audioBase64=Buffer.from(audioBuffer).toString("base64");
//      return NextResponse.json({audio:audioBase64});

//     }catch(error:any){
//         console.error("text to Speech generation error:",error);
//         const errorMessage = typeof error === "object" && error !== null ? JSON.stringify(error)
//         :error.message||"Failed to generate speech";

//         return NextResponse.json({error:errorMessage},{status:500});

//     }
// }

// import axios from "axios";
// import { NextResponse } from "next/server";
// import { json } from "stream/consumers";

// type Gender = "male" | "female";

// const voiceMap: Record<Gender, string> = {
//   male: "CwhRBWXzGAHq8TQ4Fs17",
//   female: "cgSgspJ2msm6clMCkdW9",
// };

// const apiKey = process.env.ELEVENLABS_API_KEY;

// export async function POST(req: Request) {
//   try {
//     if(!apiKey){
//             console.error("ELEVENLABS_API_KEY is not configured");
//                   return NextResponse.json(
//                       {error:"API Key not configured"},
//                       {status:500}
//                   );
//               }
      
//     const { text, gender } = await req.json();

//     // Assign voice IDs based on gender
//     const voiceId = gender === "male" ? "CwhRBWXzGAHq8TQ4Fs17" : "cgSgspJ2msm6clMCkdW9";

//     // Call ElevenLabs or any TTS service
//     const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "xi-api-key": process.env.ELEVENLABS_API_KEY!,
//       },
//       body: JSON.stringify({ text, voiceId }),
//     });
//     console.log("API Key:", process.env.ELEVENLABS_API_KEY);
    


//     if (!response.ok) {
//       console.error("TTS API error:", await response.text());
//       return new Response("Error generating voice", { status: 500 });
//     }

//     const audioData = await response.arrayBuffer();
//     return new Response(audioData, {
//       headers: { "Content-Type": "audio/mpeg" },
//     });

//   } catch (error) {
//     console.error("Error in TTS route:", error);
//     return new Response("Error generating voice", { status: 500 });
//   }
// }

// /app/api/text-to-speech/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, gender } = await req.json();

    if (!text || !gender) {
      return NextResponse.json({ error: "Text or gender missing" }, { status: 400 });
    }

    const voiceId = gender === "female" ? "s3://voice-cloning-zero-shot/f3c22a65-87e8-441f-aea5-10a1c201e522/original/manifest.json" : "s3://voice-cloning-zero-shot/71cdb799-1e03-41c6-8a05-f7cd55134b0b/original/manifest.json";

    const response = await fetch("https://api.play.ht/api/v1/convert", {
      method: "POST",
      headers: {
        "Authorization": process.env.PLAYHT_API_KEY ?? "",
        "X-User-Id": process.env.PLAYHT_USER_ID ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        text, 
        voice: voiceId,
        voiceEngine:"PlayHT2.0" }),
    });
    console.log("API Key:", process.env.PLAYHT_API_KEY);
    console.log("User ID:", process.env.PLAYHT_USER_ID);
    
    const result=await response.json();
    console.log("API Response",result)

    if (!response.ok) {
      const error = await response.text();
      console.error("Text-to-Speech Error:", error);
      return NextResponse.json({ error: "Failed to generate voice" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ audioUrl: data.audioUrl });
  } catch (error) {
    console.error("Error generating AI voice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
