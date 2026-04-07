import { GoogleGenAI } from "@google/genai";

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `A Renaissance style painting featuring Blueberry, Black Cherry, Lime, Sweet Aftertaste. Artistic, masterpiece, oil painting, rich colors, classical composition, suitable for a coffee bag label background. No text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });
    
    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }
    console.log("imageUrl length:", imageUrl.length);
    console.log("imageUrl start:", imageUrl.substring(0, 50));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

test();
