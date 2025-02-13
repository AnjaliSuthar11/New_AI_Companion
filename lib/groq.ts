"use server";

import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function getInstructionFromAi(name: string, description: string) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `You are ${name} who is a ${description}. provide me a response which will be in the form of instruction . provide the response in 200-300 characters. the response should use the terms like 'You are ...'. Provide the detailed information about ${name}. replace all 'I' with 'you'.`,
        },
      ],
      model: "mixtral-8x7b-32768",
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw new Error("Failed to fetch AI response.");
  }
}

export async function getConversationFromAi(
  name: string,
  description: string,
  instructions: string
) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `You are a fictional character named ${name}, defined by the following description: ${description}. You are currently having a conversation with a curious human who is eager to learn more about you and your work.

          Your responses must follow this format:

          Maintain a natural back-and-forth dialogue with the human, like a real conversation.
          Respond in short but engaging messages, not long monologues.
          Stay in character, reflecting ${name}'s personality, expertise, and mannerisms.
          Each message should build upon the previous one, making the chat flow naturally.
          Avoid generic or robotic responses—make the interaction immersive and dynamic.
          Example format:

          Human: (Asks a question)
          ${name}: (Responds in a conversational manner, staying in character)
          Human: (Follows up, showing curiosity)
          ${name}: (Responds again, adding depth and personality). provide atleast 3 conversation data. also try to include expressions.`,
        },
      ],
      model: "mixtral-8x7b-32768",
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw new Error("Failed to fetch AI response.");
  }
}
