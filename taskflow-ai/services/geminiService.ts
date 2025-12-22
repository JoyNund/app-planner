
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Priority, TaskStatus } from "../types";

export const generateTasksFromAI = async (prompt: string): Promise<{ text: string; tasks?: Partial<Task>[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `User wants to generate tasks for: ${prompt}. Break this down into actionable, discrete tasks. 
      Return a brief encouraging response followed by a JSON array of tasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "An encouraging conversational response to the user."
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { 
                    type: Type.STRING,
                    enum: ['low', 'medium', 'high']
                  }
                },
                required: ["title", "priority"]
              }
            }
          },
          required: ["message", "tasks"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text from AI");
    }
    
    const result = JSON.parse(response.text);
    return {
      text: result.message,
      tasks: result.tasks
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to communicate with the AI agent.");
  }
};

export const chatWithAI = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are TaskFlow AI, an expert productivity assistant. Help the user organize their life and work. Be concise, professional, and helpful. If asked for a plan, offer specific actionable steps."
    }
  });

  // We can pass the existing history if needed, but for simplicity we'll handle single turns or manual history management
  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "No response from AI";
};
