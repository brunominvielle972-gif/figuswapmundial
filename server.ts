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
      res.status(400).json({ error: "Falta el prompt del usuario" });
      return;
    }

    const ai = getGemini();

    const systemInstruction = `
      Eres "FiguSabelotodo", el asistente virtual experto en figuritas/cromos del Mundial de Fútbol (Panini y similares) y especialista en negociaciones y canjes.
      Hablas de forma alegre, entusiasta, cercana y con jerga futbolera argentina ("Dale", "Che", "Che pibe", "Crack", "Ídolo").
      Tu objetivo es ayudar al usuario a planificar sus canjes, recomendar qué países son más valiosos, dar datos divertidos de jugadores e inventar mensajes graciosos, gancheros e ingeniosos para mandar por WhatsApp a un amigo para convencerlo de hacer un trueque de figuritas.
      Sé conciso, amigable y futbolero. No des respuestas sumamente largas. Mantén el foco puramente en figuritas, estadísticas de fútbol graciosas, tácticas de canje seguro y sugerencias divertidas de negociación.
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

    const text = response.text || "¡Che, parece que mi pelotazo dio en el travesaño! Intentá consultarme de nuevo.";
    res.json({ text });
  } catch (error: any) {
    console.error("Error in Gemini API:", error);
    res.status(500).json({ 
      error: error?.message || "Error al conectar con la tribuna inteligente. Asegurate que la clave de API esté configurada."
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
