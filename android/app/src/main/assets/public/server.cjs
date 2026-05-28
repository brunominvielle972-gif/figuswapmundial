var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiClient = null;
function getGemini() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required on the server to use AI features.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
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
    const contents = chatHistory && chatHistory.length > 0 ? [...chatHistory, { role: "user", parts: [{ text: prompt }] }] : prompt;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.8
      }
    });
    const text = response.text || "Oops, it seems my shot hit the crossbar! Try asking me again.";
    res.json({ text });
  } catch (error) {
    console.error("Error in Gemini API:", error);
    res.status(500).json({
      error: error?.message || "Error connecting to the Expert AI assistant. Please make sure the API key is configured properly."
    });
  }
});
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully booted on http://0.0.0.0:${PORT}`);
  });
}
bootstrap().catch((err) => {
  console.error("Critical server boot error:", err);
});
//# sourceMappingURL=server.cjs.map
