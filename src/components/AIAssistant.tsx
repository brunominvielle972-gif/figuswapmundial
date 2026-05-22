import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, RefreshCw, Trash2, HelpCircle, ArrowRight, MessageSquareCode } from "lucide-react";
import { useApp } from "../context/AppContext";

interface Message {
  role: "user" | "model";
  text: string;
}

export default function AIAssistant() {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sticker_ai_chat");
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        role: "model",
        text: "¡Hola, crack! Bicicleta y al ángulo. ⚽ Soy **FiguSabelotodo**, tu asistente personal de canjes. Preguntame cómo convencer a tus amigos de pasarte esa repu que querés, o pedime un tip seguro de negociación futbolera. ¿Qué consulta tenés para hoy, ídolo?"
      }
    ];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sticker_ai_chat", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input.trim();
    if (!promptToSend || isLoading) return;

    if (!customPrompt) {
      setInput("");
    }

    // Intercept client chat deletion request phrases
    const promptLower = promptToSend.toLowerCase();
    if (
      promptLower.includes("borra el chat") || 
      promptLower.includes("borrar chat") || 
      promptLower.includes("limpiar chat") || 
      promptLower.includes("vaciar chat") || 
      promptLower.includes("reiniciar chat") ||
      promptLower.includes("borrar el chat") ||
      promptLower.includes("limpia el chat")
    ) {
      const newUserMessage: Message = { role: "user", text: promptToSend };
      setMessages((prev) => [...prev, newUserMessage]);
      setIsLoading(true);
      setTimeout(() => {
        const reset: Message[] = [
          {
            role: "model",
            text: "¡Hecho, crack! 🧹 Borré todo nuestro historial de conversación como me pediste. Contame, ¿en qué más te puedo ayudar sobre el álbum de figuritas, ídolo?"
          }
        ];
        setMessages(reset);
        setErrorMsg(null);
        setIsLoading(false);
      }, 800);
      return;
    }

    const newUserMessage: Message = { role: "user", text: promptToSend };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Map history format for server side API
      const chatHistory = updatedMessages.slice(0, -1).map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptToSend,
          chatHistory: chatHistory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al conectar con la tribuna");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "No pude conectar con el servidor. Revisá tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    const reset = [
      {
        role: "model",
        text: "¡Pizarrón en blanco! 📋 Decime qué necesitás consultar sobre las figus de tu álbum."
      } as Message
    ];
    setMessages(reset);
    setErrorMsg(null);
  };

  const QUICK_PROMPTS = [
    {
      label: "📲 Mensaje gracioso de WhatsApp",
      prompt: "Escribime un mensaje muy divertido, futbolero y ganchero para mandarle a un amigo por WhatsApp exigiéndole de buena onda que me entregue una figurita repetida difícil que él tiene y yo quiero desesperadamente a cambio de mis repetidas comunes. Usa modismos argentinos."
    },
    {
      label: "🏆 ¿Qué figuritas son las más difíciles?",
      prompt: "¿Cuáles son históricamente las figuritas y cromos más difíciles de conseguir en los álbumes del Mundial de Panini, qué leyendas o cromos especiales brillaron más y qué técnica hay para conseguirlos?"
    },
    {
      label: "⚽ ¿Cómo negociar una brillante?",
      prompt: "Dame 3 tips infalibles de canje para cambiar figuritas comunes por una brillante o cromos con hologramas difíciles sin quedar en desventaja."
    }
  ];

  return (
    <div className="bg-brand-panel/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[480px] sm:h-[550px]" id="ai-assistant-wrapper">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-950/40 via-brand-emerald/10 to-blue-950/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-emerald/15 border border-brand-emerald/40 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-brand-emerald animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider leading-none">FiguSabelotodo IA</h4>
            <span className="text-[10px] text-brand-emerald font-semibold font-mono uppercase tracking-widest mt-0.5 block">🧠 Gemini Activa</span>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
          title="Borrar historial"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[150px] scrollbar-thin scrollbar-thumb-white/10" id="ai-chat-messages-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user" ? "self-end ml-auto items-end" : "self-start mr-auto items-start"
            }`}
          >
            <span className="text-[9px] text-slate-400 font-mono uppercase mb-0.5 tracking-wider font-semibold">
              {msg.role === "user" ? `@${currentUser?.displayName || "Jugador"}` : "⚽ FiguSabelotodo"}
            </span>
            <div
              className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-medium break-words ${
                msg.role === "user"
                  ? "bg-brand-emerald text-brand-bg rounded-tr-none font-bold shadow-[0_3px_12px_rgba(16,185,129,0.2)]"
                  : "bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none tabular-nums"
              }`}
            >
              {msg.text.split("\n").map((line, lIdx) => {
                // simple markdown bolding handler
                let content: React.ReactNode = line;
                if (line.includes("**")) {
                  const parts = line.split("**");
                  content = parts.map((part, pIdx) => 
                    pIdx % 2 === 1 ? <strong key={pIdx} className="text-brand-gold font-black">{part}</strong> : part
                  );
                }
                return (
                  <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>
                    {content}
                  </p>
                );
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col max-w-[80%] self-start mr-auto items-start">
            <span className="text-[9px] text-brand-emerald font-mono uppercase mb-0.5 tracking-wider font-bold animate-pulse">
              ⚽ Analizando jugada...
            </span>
            <div className="bg-slate-900 border border-brand-emerald/20 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 text-[11px] text-rose-300">
            ⚠ {errorMsg}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions if history is short */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 py-2 border-t border-white/5 bg-[#070c14] flex flex-col gap-1.5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-brand-gold" /> Sugerencias tácticas de un click:
          </span>
          <div className="flex flex-col gap-1">
            {QUICK_PROMPTS.map((qp, id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                className="w-full text-left px-2.5 py-1.5 bg-white/5 hover:bg-brand-emerald/10 border border-white/5 hover:border-brand-emerald/20 rounded-lg text-[10px] text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate pr-2 font-medium">{qp.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-brand-emerald shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input panel */}
      <div className="p-3 bg-[#03060a] border-t border-white/10 flex gap-2 items-center">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Consultale al sabelotodo futbolero..."
          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald resize-none scrollbar-none"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={isLoading || !input.trim()}
          className="h-9 w-9 bg-brand-emerald hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-brand-bg rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-lg disabled:shadow-none"
        >
          <Send className="w-4 h-4 font-black" />
        </button>
      </div>
    </div>
  );
}
