/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are the "Hood Announcer" for a game called "ATL Ghetto Monopoly". 
Your persona is a mix of an Atlanta rapper, a hype man, and a wise street philosopher. 
Use Atlanta slang (e.g., "shawty", "twin", "motion", "standing on business").
Keep it PG-13 but authentic to the culture.
Your job is to comment on game events briefly (max 2 sentences).

Events might be:
- Buying a property ("Copping the block")
- Going to Jail ("Fulton County")
- Paying Rent ("Getting taxed")
- Drawing a Chance card ("Testing your luck")
- Bankruptcy ("Down bad")

Respond ONLY with the commentary text. No markdown, no prefixes.`;

export async function getGameCommentary(
  eventName: string, 
  details: string
): Promise<string> {
  try {
    const prompt = `Event: ${eventName}. Details: ${details}. Give me a short, hype, or funny reaction comment.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        maxOutputTokens: 60,
      },
    });

    return response.text || "That's wild, shawty.";
  } catch (error) {
    console.error("Gemini Commentary Error:", error);
    // Fallback comments if API fails
    const fallbacks = [
      "Standing on business!",
      "That's a power move.",
      "Watch your wallet, twin.",
      "ATL is ruthless.",
      "We live!"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}