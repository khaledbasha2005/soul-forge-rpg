import { GoogleGenAI, Type } from "@google/genai";
import { Race, Rarity } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCustomRace = async (prompt: string): Promise<Race> => {
  const model = "gemini-2.5-flash";
  
  const systemInstruction = `You are a game designer for a fantasy RPG. 
  Your task is to create a unique, balanced race based on a user's prompt.
  The race should fit into one of these rarities: Common, Uncommon, Rare, Epic, Legendary, Mythical.
  Assign a percentage chance that feels appropriate for the power level (Common ~25%, Mythical ~0.5%).
  Return ONLY valid JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model,
    contents: `Create a new RPG race based on this theme: ${prompt}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          rarity: { type: Type.STRING, enum: Object.values(Rarity) },
          chance: { type: Type.NUMBER, description: "Percentage chance between 0.1 and 30" },
          description: { type: Type.STRING },
          traits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["name", "description"]
            }
          }
        },
        required: ["name", "rarity", "chance", "traits", "description"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate race data.");
  }

  const data = JSON.parse(response.text);
  
  return {
    ...data,
    id: `custom-${Date.now()}`,
    isCustom: true
  };
};