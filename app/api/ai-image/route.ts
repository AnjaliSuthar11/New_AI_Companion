"use server";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY!);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, gender, description } = body;

    if (!userId) return NextResponse.json("Unauthorized", { status: 401 });

    if (!name || !gender || !description) {
      return NextResponse.json("Name, gender, and description are required.", { status: 400 });
    }

    const prompt = `image of a character named ${name} and who is ${description} it's size should be 512 x 512`;
    // Ultra-realistic portrait of a ${gender} character named ${name}, with ${description}. Studio lighting, 4K, intricate details, highly detailed face, soft shadows, cinematic style.size should be 512 x 512

    const image = await hf.textToImage({
      model: "runwayml/stable-diffusion-v1-5",
      inputs: prompt,
      parameters: {
        num_inference_steps: 50,
        seed: Math.floor(Math.random() * 100000),
      } as any,
    });
    if (!image) {
      console.error("No image received from Hugging Face");
      return NextResponse.json("Failed to generate image", { status: 500 });
    }
    
    const buffer = await image.arrayBuffer();
    const base64String = arrayBufferToBase64(buffer);

    const mimeType = "image/png";
    const dataUrl = `data:${mimeType};base64,${base64String}`;

    return NextResponse.json({ imageUrl: dataUrl });
  } catch (error) {
    console.error("Error generating AI image:", error);
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

