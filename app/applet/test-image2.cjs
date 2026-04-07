const { GoogleGenAI } = require("@google/genai");

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: "A red apple",
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });
    console.log("Success!");
    console.log("Parts:", response.candidates[0].content.parts.map(p => Object.keys(p)));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
