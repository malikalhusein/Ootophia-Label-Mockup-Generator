import { GoogleGenAI } from "@google/genai";

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: "A red apple" }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });
    const inlineData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
    console.log("inlineData mimeType:", inlineData?.mimeType);
    console.log("inlineData data type:", typeof inlineData?.data);
    console.log("inlineData data length:", inlineData?.data?.length);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
