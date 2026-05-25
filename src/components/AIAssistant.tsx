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
        text: "Hello there, champion! ⚽ I am **FiguSwap Expert AI**, your virtual sticker trading assistant. Ask me how to negotiate with your buddies for those hard-to-find shinies, or request a pro soccer-style trading strategy. What can I help you find today, star?"
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
      promptLower.includes("clear chat") || 
      promptLower.includes("reset chat") || 
      promptLower.includes("delete chat") || 
      promptLower.includes("wipe chat") || 
      promptLower.includes("erase chat") ||
      promptLower.includes("empty chat")
    ) {
      const newUserMessage: Message = { role: "user", text: promptToSend };
      setMessages((prev) => [...prev, newUserMessage]);
      setIsLoading(true);
      setTimeout(() => {
        const reset: Message[] = [
          {
            role: "model",
            text: "All done! 🧹 I have cleared our entire chat history as requested. Tell me, is there anything else I can assist you with regarding your sticker collection?"
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
        throw new Error(errorData.error || "Error connecting to the soccer stands");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Could not connect to the server. Please check your network connection.");
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
        text: "Blank board! 📋 Tell me what you would like to know about your sticker collection."
      } as Message
    ];
    setMessages(reset);
    setErrorMsg(null);
  };

  const QUICK_PROMPTS = [
    {
      label: "📲 Funny WhatsApp Message ideas",
      prompt: "Write a fun, soccer-themed, engaging message to send to a friend via WhatsApp, jokingly demanding they give me a rare duplicate sticker they have in exchange for some of my common ones. Keep the tone friendly and humorous."
    },
    {
      label: "🏆 What are the absolute rarest stickers?",
      prompt: "What are historically the most difficult and rarest stickers to get in Panini World Cup albums? Are there special holographic shiny stickers, or legendary key players? Suggest a clever tactic to complete the album."
    },
    {
      label: "⚽ How to trade for a Shiny sticker?",
      prompt: "Give me 3 top-tier sticker trading tips to land shiny holographic stickers or rare player cards in exchange for common ones without losing out."
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
            <h4 className="text-sm font-black text-white uppercase tracking-wider leading-none">FiguSwap Expert AI</h4>
            <span className="text-[10px] text-brand-emerald font-semibold font-mono uppercase tracking-widest mt-0.5 block">🧠 Powered by Gemini</span>
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
              {msg.role === "user" ? `@${currentUser?.displayName || "Player"}` : "⚽ AI Expert"}
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
              ⚽ Analyzing strategy...
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
            <HelpCircle className="w-3 h-3 text-brand-gold" /> One-click template helper queries:
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
          placeholder="Ask the tactical soccer trading expert..."
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
