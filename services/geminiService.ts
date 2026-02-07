
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// FIXED: Use named parameter for apiKey and use process.env.API_KEY directly as required.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFireEngineAdvice = async (prompt: string, config: any): Promise<string> => {
  try {
    // FIXED: Use gemini-3-pro-preview for complex technical reasoning tasks.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class fire engine design expert. 
      The user is currently configuring a 3D model of a yellow ladder truck. 
      Current Specs: ${JSON.stringify(config)}.
      
      User Question: ${prompt}
      
      Provide professional, technical, and encouraging advice about fire engine mechanics, history, or 3D modeling tips. Keep it concise.`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    // FIXED: Ensure property access of .text matches the corrected SDK implementation.
    return response.text || "I'm sorry, I couldn't process that advice right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Technical difficulty connecting to the Fire Engine Database. Please try again.";
  }
};
