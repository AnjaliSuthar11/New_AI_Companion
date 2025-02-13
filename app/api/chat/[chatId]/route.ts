import { StreamingTextResponse, LangChainStream } from "ai";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import { NextRequest, NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq"; // Import Groq from LangChain

import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";
import { Readable } from "stream";

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const user = await currentUser();
    if (!user || !user.firstName || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);
    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    const companion = await prismadb.companion.update({
      where: { id: params.chatId },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: user.id,
          },
        },
      },
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }

    const name = companion.id;
    const companion_file_name = name + ".txt";

    const companionKey = {
      companionName: name,
      userId: user.id,
      modelName: "llama2-13b", // Update this if Groq uses a different model name
    };

    const memoryManager = await MemoryManager.getInstance();
    const records = await memoryManager.readLatestHistory(companionKey);

    if (records.length === 0) {
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
    }

    await memoryManager.writeToHistory("User: " + prompt + "\n", companionKey);
    const recentChatHistory = await memoryManager.readLatestHistory(
      companionKey
    );

    const similarDocs = await memoryManager.vectorSearch(
      recentChatHistory,
      companion_file_name
    );

    let relevantHistory = "";
    if (similarDocs && similarDocs.length > 0) {
      relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
    }

    // Use LangChainStream to handle streaming
    const { handlers, stream } = LangChainStream();

    // Initialize Groq model
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      modelName: "mixtral-8x7b-32768",
      streaming: true,
      callbackManager: CallbackManager.fromHandlers(handlers),
    });

    // Call the model and let it stream the response
    const responsePromise = model.invoke(`
      You are ${name}, a friendly and helpful companion. Always respond in the FIRST PERSON (use "I" or "we") as if you are ${name}. 
      NEVER use third-person pronouns like "he/she" or refer to yourself as "${name}".

      Below are your instructions:
      ${companion.instructions}

      Below are relevant details about your past and the conversation you are in:
      ${relevantHistory}

      Here is the recent chat history:
      ${recentChatHistory}

      Respond to the user's message below:
      ${prompt}
    `);

    const response = (await responsePromise).content;

    await memoryManager.writeToHistory(response.toString(), companionKey);

    await prismadb.companion.update({
      where: {
        id: params.chatId,
      },
      data: {
        messages: {
          create: {
            content: response.toString(),
            role: "system",
            userId: user.id,
          },
        },
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("[CHAT_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
