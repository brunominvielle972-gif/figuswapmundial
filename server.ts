import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required on the server to use AI features.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for AI assistant helper
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, chatHistory } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "User prompt is required" });
      return;
    }

    const ai = getGemini();

    const systemInstruction = `
      You are "FiguSwap Expert AI", a friendly virtual assistant specialized in football/soccer, World Cup sticker trading (like Panini), safe negotiation tactics, and football/soccer trivia.
      Speak in a super enthusiastic, friendly, soccer-loving, and very cool tone (you can use terms like "champ", "goalscorer", "champion", "the stands", "crack"). Keep your style energetic and warm!
      Your goal is to help the user organize their collection, suggest which teams or stickers are historically harder to find, give fun football facts, and draft funny or clever draft messages to send over WhatsApp/messengers to convince friends to trade.
      
      CRITICAL: You MUST respond EXCLUSIVELY in English, regardless of what language the user greets you with or if the previous chat history contains Spanish. If there are previous Spanish messages in the history, ignore the Spanish language and continue responding solely in English. Do not write excessively long blocks of text; keep it concise and fun.
    `;

    // Construct format or contents based on query
    const contents = chatHistory && chatHistory.length > 0
      ? [...chatHistory, { role: "user", parts: [{ text: prompt }] }]
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const text = response.text || "Oops, it seems my shot hit the crossbar! Try asking me again.";
    res.json({ text });
  } catch (error: any) {
    console.error("Error in Gemini API:", error);
    res.status(500).json({ 
      error: error?.message || "Error connecting to the Expert AI assistant. Please make sure the API key is configured properly."
    });
  }
});

// Vite middleware development check
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully booted on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error("Critical server boot error:", err);
});
