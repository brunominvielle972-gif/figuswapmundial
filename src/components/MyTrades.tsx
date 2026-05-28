/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TradeProposal, TradeMessage } from '../types';
import { 
  Send, MessageSquare, Handshake, Check, X, ShieldAlert, Clock, RefreshCw, AlertCircle, Ban, Share2, Copy, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MyTradesProps {
  onNavigateToFriends?: () => void;
}

export default function MyTrades({ onNavigateToFriends }: MyTradesProps) {
  const { 
    trades, 
    currentUser, 
    currentTradeMessages, 
    activeTradeId, 
    respondToTrade, 
    sendChatMessage, 
    setActiveTradeId,
    users,
    stickers,
    proposeTrade,
    connectUserByCode,
    loginWithGoogle,
    loginAnonymously,
    isFirebaseActive,
    isCapacitor
  } = useApp();

  const [messageText, setMessageText] = useState<string>("");
  const [localName, setLocalName] = useState("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // New trade proposal state
  const [showProposalForm, setShowProposalForm] = useState<boolean>(false);
  const [partnerUserId, setPartnerUserId] = useState<string>("");
  const [offeredStickers, setOfferedStickers] = useState<string[]>([]);
  const [requestedStickers, setRequestedStickers] = useState<string[]>([]);
  const [newRequestCode, setNewRequestCode] = useState<string>("");
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState<string | null>(null);

  // Friend code connection state
  const [friendCodeInput, setFriendCodeInput] = useState<string>("");
  const [connectingByCode, setConnectingByCode] = useState<boolean>(false);
  const [connectStatus, setConnectStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnectByCode = async (customCode?: string) => {
    const codeToConnect = customCode || friendCodeInput;
    if (!codeToConnect.trim() || connectingByCode) return;

    setConnectingByCode(true);
    setConnectStatus(null);

    try {
      const result = await connectUserByCode(codeToConnect);
      if (result.success) {
        setConnectStatus({
          success: true,
          message: result.error || `Success! You successfully connected with @${result.displayName || "your friend"}.`
        });
        setFriendCodeInput("");
      } else {
        setConnectStatus({
          success: false,
          message: result.error || "An error occurred while trying to connect."
        });
      }
    } catch (e: any) {
      setConnectStatus({
        success: false,
        message: "Connection error. Please try again."
      });
    } finally {
      setConnectingByCode(false);
    }
  };

  const getInviteUrl = () => {
    if (!currentUser) return "";
    // If we are running in the browser on a real domain, use that. Otherwise (such as inside the Capacitor native app on localhost/file), default to the shared web app URL.
    let baseUrl = "https://ais-pre-fknnxpd4yizdxu4wifamxw-327281564553.us-west1.run.app";
    
    if (typeof window !== 'undefined' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' && 
        !window.location.hostname.startsWith('192.168.') &&
        window.location.protocol.startsWith('http')) {
      baseUrl = window.location.origin + window.location.pathname;
    }
    
    if (baseUrl.endsWith('/index.html')) {
      baseUrl = baseUrl.slice(0, -11);
    }
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    return `${baseUrl}?invite=${currentUser.uid}`;
  };
  const inviteUrl = getInviteUrl();

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getWhatsAppShareUrl = () => {
    if (!inviteUrl) return "#";
    const text = `👋 Hi! Join my friends list so we can swap stickers safely and directly. Tap this link to connect with me:\n\n${inviteUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Auto-scroll chat to bottom locally when loaded (keeps page scroll quiet)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentTradeMessages, activeTradeId]);

  if (!currentUser) {
    const handleGoogleLogin = async () => {
      try {
        setIsLoggingIn(true);
        setAuthError(null);
        const res = await loginWithGoogle();
        if (!res.success) {
          setAuthError(res.error || "Ocurrió un error al iniciar sesión con Google.");
        }
      } catch (err: any) {
        console.error("Google Auth error:", err);
        setAuthError(err.message || String(err));
      } finally {
        setIsLoggingIn(false);
      }
    };

    const handleAnonymousSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!localName.trim() || isLoggingIn) return;
      try {
        setIsLoggingIn(true);
        setAuthError(null);
        const res = await loginAnonymously(localName.trim());
        if (res.isSimulated) {
          setAuthError("Aviso: Iniciaste en Modo Local/Simulado. Para usar el modo online real en tu APK/Celu, recuerda habilitar 'Anonymous sign-in' (Inicio Anónimo) en tu consola de Firebase Auth.");
        } else if (!res.success) {
          setAuthError(res.error || "Ocurrió un error al iniciar sesión.");
        }
      } catch (err: any) {
        console.error("Anonymous access error:", err);
        setAuthError(err.message || String(err));
      } finally {
        setIsLoggingIn(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-brand-panel rounded-3xl border border-white/10 shadow-2xl animate-fade-in" id="trades-logged-out">
        <Handshake className="w-12 h-12 text-brand-emerald mb-4 animate-pulse" />
        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Realizar Intercambios</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
          Registrate o inicia sesión para proponer intercambios seguros y chatear con otros coleccionistas en tiempo real.
        </p>

        <div className="w-full max-w-md bg-[#0a180f] p-6 rounded-2xl border border-brand-emerald/20 shadow-inner space-y-6">
          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-left text-xs text-red-300 leading-relaxed font-semibold">
              <span className="block text-[10px] font-black uppercase text-red-400 mb-1">Aviso sobre Conexión Auth:</span>
              {authError}
            </div>
          )}

          {/* Opción A: Google Auth */}
          {isFirebaseActive && (
            <div className="space-y-2">
              <span className="block text-[10px] font-black uppercase text-slate-500 tracking-widest text-left mb-1">
                Opción A: Sesión con Google {isCapacitor ? "⚠️ (No disponible en el APK)" : "(Web)"}
              </span>
              {isCapacitor ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-200 leading-relaxed font-semibold">
                  <p className="mb-1 text-amber-400">⚠️ Limitación de Seguridad de Google:</p>
                  Google bloquea el inicio de sesión web tradicional dentro de aplicaciones APK independientes (WebViews). 
                  <span className="block mt-1.5 text-[10px] text-slate-400 font-normal">
                    💡 Por favor, utiliza la <strong>Opción B (Ingresar con Apodo)</strong> de abajo. ¡Funciona al 100% online en el celular para intercambiar figuritas!
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#fff] hover:bg-slate-100 text-[#1f2937] font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 border border-slate-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.75 21.56,11.4 21.35,11.1z" fill="#4285F4" />
                      <path d="M12,20.82c2.4,0 4.41,-0.8 5.88,-2.16l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.3,0.98c-2.31,0 -4.26,-1.56 -4.96,-3.66H2.9V16.1C4.38,19.04 7.42,20.82 12,20.82z" fill="#34A853" />
                      <path d="M7.04,13.4a5.3,5.3,0,0,1,0,-3.38V7.44H2.9a10,10,0,0,0,0,8.54l4.14,-2.58z" fill="#FBBC05" />
                      <path d="M12,6.94c1.3,0 2.48,0.45 3.4,1.33l2.55,-2.55C16.4,4.35 14.41,3.54 12,3.54c-4.58,0 -7.62,1.78 -9.1,4.72l4.14,2.58c0.7,-2.1 2.65,-3.66 4.96,-3.66z" fill="#EA4335" />
                    </g>
                  </svg>
                  {isLoggingIn ? "Conectando..." : "Iniciar Sesión con Google"}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center">
            <div className="flex-1 border-t border-white/5"></div>
            <span className="px-3 text-[9px] text-slate-500 font-bold uppercase tracking-wider">O TAMBIÉN</span>
            <div className="flex-1 border-t border-white/5"></div>
          </div>

          {/* Opción B: Anonymous Online Access */}
          <div className="space-y-3">
            <span className="block text-[10px] font-black uppercase text-brand-emerald tracking-widest text-left">
              {isCapacitor ? "⚽ Acceso Directo con Apodo (Recomendado)" : "Opción B: Acceso Rápido (Recomendado APK / Celular)"}
            </span>
            <p className="text-[11px] text-slate-400 text-left leading-relaxed">
              {isCapacitor 
                ? "Escribe un apodo de usuario para conectarte de inmediato en tiempo real con otros coleccionistas y empezar a canjear." 
                : "¿Usas la app en el celular? Ingresa un apodo y conéctate online al instante con amigos sin errores de redirección."}
            </p>
            <form onSubmit={handleAnonymousSubmit} className="space-y-3 pt-1">
              <input
                type="text"
                required
                maxLength={25}
                placeholder="Escribe tu Nombre o Apodo..."
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full bg-[#040c06] border border-brand-emerald/20 hover:border-brand-emerald/40 rounded-xl px-4 py-3 text-xs text-center text-white focus:outline-none focus:border-brand-emerald font-bold placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-brand-emerald hover:bg-emerald-400 text-brand-bg font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-transparent disabled:opacity-50"
              >
                {isLoggingIn ? "Conectando..." : "⚽ Entrar Online al Instante 🚀"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Filter trades where current user is proposer or receiver
  const myTrades = trades.filter(t => t.proposerId === currentUser.uid || t.receiverId === currentUser.uid);

  // Sort trades with newest first
  const sortedTrades = [...myTrades].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Currently selected trade
  const activeTrade = sortedTrades.find(t => t.id === activeTradeId) || sortedTrades[0] || null;

  // Set the first trade as active on start if not set
  useEffect(() => {
    if (activeTrade && !activeTradeId) {
      setActiveTradeId(activeTrade.id);
    }
  }, [activeTrade, activeTradeId, setActiveTradeId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeTrade) return;
    sendChatMessage(activeTrade.id, messageText.trim());
    setMessageText("");
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerUserId) {
      setProposalError("Please select a friend.");
      return;
    }
    const partner = users.find(u => u.uid === partnerUserId);
    if (!partner) {
      setProposalError("We couldn't find your friend's profile.");
      return;
    }

    const finalRequested = [...requestedStickers];
    if (newRequestCode.trim()) {
      const formatted = newRequestCode.trim().toUpperCase();
      if (!finalRequested.includes(formatted)) {
        finalRequested.push(formatted);
      }
    }

    if (offeredStickers.length === 0) {
      setProposalError("Please select at least one of your duplicates to offer.");
      return;
    }
    if (finalRequested.length === 0) {
      setProposalError("Please select or write at least one sticker to ask for.");
      return;
    }

    setProposalError(null);
    try {
      const newId = proposeTrade(partner.uid, partner.displayName, offeredStickers, finalRequested);
      setProposalSuccess("✔ Trade proposed successfully!");
      setTimeout(() => {
        setShowProposalForm(false);
        setPartnerUserId("");
        setOfferedStickers([]);
        setRequestedStickers([]);
        setNewRequestCode("");
        setProposalSuccess(null);
        if (newId) setActiveTradeId(newId);
      }, 1500);
    } catch (err: any) {
      setProposalError(err.message || "Error initiating the proposal.");
    }
  };

  // Helper for rendering status badges
  const renderStatusBadge = (status: TradeProposal['status']) => {
    const badgeStyle: Record<TradeProposal['status'], string> = {
      pending: "bg-[#241305] text-brand-gold border-brand-gold/30",
      accepted: "bg-[#0d1f13] text-brand-emerald border-brand-emerald/30",
      rejected: "bg-rose-950/45 text-rose-300 border shadow shadow-rose-900 border-rose-500/20",
      completed: "bg-brand-emerald text-brand-bg border-brand-emerald/40",
      cancelled: "bg-white/5 text-slate-400 border border-white/10"
    };

    const statusLabels: Record<TradeProposal['status'], string> = {
      pending: "Pending",
      accepted: "Chat Open",
      rejected: "Rejected",
      completed: "Successful Trade ✔",
      cancelled: "Cancelled"
    };

    return (
      <span className={`px-2.5 py-0.5 text-[9px] font-mono font-black tracking-widest border rounded uppercase ${badgeStyle[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-200 animate-fade-in" id="trades-layout-container">
      
      {/* LEFT COLUMN: LIST OF DISCUSSIONS & PROPOSALS */}
      <div className="lg:col-span-5 bg-brand-panel/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[700px]">
        <div className="p-4 border-b border-white/5 bg-[#030704] flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-black text-white text-sm uppercase tracking-wider">Your Trade Swaps ({sortedTrades.length})</h3>
            <p className="text-[11px] text-slate-400 font-medium">Proposed and received trades</p>
          </div>
          <button
            type="button"
            onClick={() => setShowProposalForm(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-brand-bg text-[10px] sm:text-[11.5px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-[0_2px_10px_rgba(16,185,129,0.3)] transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            New Swap
          </button>
        </div>

        {/* Banner para invitar/compartir link de amigos */}
        <div className="p-4 bg-blue-950/20 border-b border-blue-500/20 flex flex-col gap-3 text-left" id="blue-invite-banner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block">Direct Connection Link!</span>
                <span className="text-[9px] text-slate-350 block">Share via WhatsApp so it appears blue and clickable immediately:</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#25D366]"
                title="Share via WhatsApp instantly"
              >
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-2.5 py-1.5 font-mono font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 border ${
                  copiedLink
                    ? "bg-blue-400 text-brand-bg border-blue-400 font-bold"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500 hover:text-white"
                }`}
              >
                <Copy className="w-3.5 h-3.5" /> {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
          
          {/* Blue clickable link box */}
          <div className="bg-[#030a16] px-3 py-2 rounded-xl border border-blue-500/20 flex items-center justify-between gap-2 overflow-hidden shadow-inner w-full">
            <a 
              href={inviteUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-[10.5px] font-semibold truncate block select-all w-full text-left"
              id="clickable-invite-link-banner"
              title="Open secret invitation link instantly"
            >
              🔗 {inviteUrl}
            </a>
          </div>

          {/* Pegar Código/Enlace del Amigo */}
          <div className="mt-2.5 border-t border-blue-500/10 pt-3 flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1">
              🔌 Did your friend send you their code or connection link? Paste below:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value)}
                placeholder="Paste your friend's connection link or code here..."
                className="flex-1 bg-[#030a16] border border-blue-500/25 hover:border-blue-500/50 focus:border-brand-emerald focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleConnectByCode()}
                disabled={connectingByCode || !friendCodeInput.trim()}
                className="py-2 px-4 bg-brand-emerald hover:bg-emerald-450 disabled:bg-slate-800 disabled:text-slate-600 text-brand-bg font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
              >
                {connectingByCode ? "Connecting..." : "Connect Friend"}
              </button>
            </div>
            {connectStatus && (
              <p className={`text-[10px] uppercase font-black tracking-wide mt-1 ${connectStatus.success ? "text-brand-emerald animate-pulse" : "text-rose-400"}`}>
                {connectStatus.message}
              </p>
            )}
          </div>
        </div>

        {sortedTrades.length === 0 ? (
          <div className="p-12 text-center text-slate-550 text-sm flex-1 flex flex-col justify-center items-center gap-2">
            <MessageSquare className="w-8 h-8 text-brand-emerald/40" />
            <p className="font-bold text-slate-400">You haven't started any trade swaps yet.</p>
            <p className="text-xs text-slate-500">Click on "New Swap" above to propose a secure trade with one of your registered friends.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-y-auto flex-1">
            {sortedTrades.map(t => {
              const isActive = t.id === activeTradeId;
              const isOutgoing = t.proposerId === currentUser.uid;
              const otherPartyName = isOutgoing ? t.receiverName : t.proposerName;
              
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setActiveTradeId(t.id)}
                  className={`w-full p-4 text-left hover:bg-white/5 transition-all flex flex-col gap-3 border-r-4 border-transparent ${
                    isActive ? 'bg-[#0d1f13]/40 border-r-brand-emerald' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs font-black text-white">Swap with {otherPartyName}</span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold uppercase tracking-wide">
                        {isOutgoing ? 'Proposal sent' : 'Proposal received'}
                      </p>
                    </div>
                    {renderStatusBadge(t.status)}
                  </div>

                  {/* Summary of exchange cards */}
                  <div className="grid grid-cols-2 gap-2 bg-[#050a06] p-2.5 rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-brand-emerald font-black block mb-1">Offered</span>
                      <div className="flex flex-wrap gap-1">
                        {t.offeredStickers.map(c => (
                          <span key={c} className="bg-brand-panel/90 border border-brand-emerald/30 text-brand-emerald px-1.5 py-0.5 rounded text-[9px] font-mono leading-none font-black block">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-l border-white/5 pl-2">
                      <span className="text-[9px] uppercase tracking-wider text-brand-gold font-black block mb-1">Requested</span>
                      <div className="flex flex-wrap gap-1">
                        {t.requestedStickers.map(c => (
                          <span key={c} className="bg-brand-panel/90 border border-brand-gold/30 text-brand-gold px-1.5 py-0.5 rounded text-[9px] font-mono leading-none font-black block">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] uppercase tracking-wider text-slate-500 self-end font-mono font-bold">
                    Updated: {new Date(t.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: NEGOTIATION / INTERACTION TERMINAL */}
      <div className="lg:col-span-7 bg-brand-panel/85 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px] lg:h-[700px]">
        {activeTrade ? (
          <div className="flex flex-col h-full">
            
            {/* HEAD INFO */}
            <div className="p-4 border-b border-white/5 bg-[#030704] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-extrabold text-white text-sm">
                  Swap with {activeTrade.proposerId === currentUser.uid ? activeTrade.receiverName : activeTrade.proposerName}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-400 font-medium">Swap ID:</span>
                  <span className="text-[10px] font-mono text-brand-emerald bg-white/5 border border-white/5 px-1.5 py-0.2 rounded">{activeTrade.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToFriends && (
                  <button
                    type="button"
                    onClick={onNavigateToFriends}
                    className="text-[10px] font-black uppercase text-brand-emerald bg-brand-emerald/10 hover:bg-brand-emerald hover:text-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-emerald/30 transition-all flex items-center gap-1 cursor-pointer"
                    title="View friends list to initiate more swaps"
                  >
                    🤝 My Friends
                  </button>
                )}
                {renderStatusBadge(activeTrade.status)}
              </div>
            </div>

            {/* INTERACTION ACTIONS HEADER (Based on Roles and Status) */}
            <div className="p-4 bg-[#0d1f13]/40 border-b border-white/15 text-xs">
              
              {/* IF PENDING */}
              {activeTrade.status === 'pending' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-white uppercase tracking-wider text-[11px]">Proposal pending confirmation</p>
                      <p className="text-slate-400 text-[10px]">Discuss details in the chat below to schedule the trade.</p>
                    </div>
                  </div>
                  
                  {activeTrade.receiverId === currentUser.uid ? (
                    <div className="flex gap-2 self-end shrink-0">
                      <button
                        type="button"
                        onClick={() => respondToTrade(activeTrade.id, 'accepted')}
                        className="px-3 py-1.5 bg-brand-emerald hover:bg-emerald-400 text-brand-bg font-black rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => respondToTrade(activeTrade.id, 'rejected')}
                        className="px-3 py-1.5 bg-rose-950/45 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => respondToTrade(activeTrade.id, 'cancelled')}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold rounded-lg text-xs transition-all flex items-center gap-1 self-end cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel Proposal
                    </button>
                  )}
                </div>
              )}

              {/* IF ACCEPTED (SWAP READY / CHALKING OUT DETAILS) */}
              {activeTrade.status === 'accepted' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Handshake className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-white uppercase tracking-wider text-[11px]">Stickers proposal confirmed!</p>
                      <p className="text-slate-400 text-[10px]">Coordinate a time and place to complete the trade swap.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end shrink-0">
                    <button
                      type="button"
                      onClick={() => respondToTrade(activeTrade.id, 'completed')}
                      className="px-3 py-1.5 bg-brand-emerald hover:bg-emerald-450 text-brand-bg font-black rounded-lg text-xs transition-all flex items-center gap-1 shadow-[0_4px_12px_rgba(16,185,129,0.25)] cursor-pointer"
                      title="Mark as completed successfully"
                    >
                      <Check className="w-3.5 h-3.5" /> Complete Trade!
                    </button>
                    <button
                      type="button"
                      onClick={() => respondToTrade(activeTrade.id, 'cancelled')}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs transition-all border border-white/5 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* IF COMPLETED */}
              {activeTrade.status === 'completed' && (
                <div className="p-2 bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/20 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-emerald stroke-[3]" />
                  <span className="font-black uppercase tracking-wider text-[10px]">This trade swap was successfully completed.</span>
                </div>
              )}

              {/* IF REJECTED */}
              {activeTrade.status === 'rejected' && (
                <div className="p-2 bg-rose-950/45 border border-rose-500/25 text-rose-300 rounded-lg flex items-center gap-2">
                  <X className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">This proposal was rejected.</span>
                </div>
              )}

              {/* IF CANCELLED */}
              {activeTrade.status === 'cancelled' && (
                <div className="p-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">This trade swap was cancelled.</span>
                </div>
              )}

            </div>

            {/* DEDICATED CHAT WINDOW */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050a06]/40 flex flex-col justify-between">
              
              {/* CHAT BUBBLES LIST */}
              <div 
                ref={chatContainerRef}
                className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[380px] customize-scrollbar"
              >
                {currentTradeMessages.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-8 italic mt-4">
                    No messages in this chat yet. Type a message to start trading safely!
                  </div>
                ) : (
                  currentTradeMessages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.uid;
                    return (
                      <div 
                        key={msg.id || msg.createdAt || idx} 
                        className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <span className="text-[9px] text-[#86efac] font-bold px-1 mb-0.5">{isMe ? "You" : msg.senderName}</span>
                        <div className={`p-3 rounded-2xl text-xs break-words shadow-lg ${
                          isMe 
                            ? 'bg-brand-emerald text-brand-bg rounded-tr-none font-bold' 
                            : 'bg-white/5 border border-white/10 text-slate-100 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-slate-500 px-1 mt-0.5 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* INPUT MESSAGE */}
              {['pending', 'accepted'].includes(activeTrade.status) ? (
                <form onSubmit={handleSendMessage} className="border-t border-white/5 pt-3 flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 px-4 py-2.5 bg-[#0d1f13] border border-white/10 rounded-xl text-xs focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald text-white placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-brand-emerald text-brand-bg rounded-xl hover:bg-emerald-450 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="text-center text-xs text-slate-500 font-bold uppercase tracking-wider py-3 border-t border-white/5">
                  Chat disabled: This exchange has been archived.
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-500 text-sm gap-2 p-8 text-center bg-brand-bg/20">
            <Handshake className="w-12 h-12 text-slate-600 animate-pulse" />
            <span className="font-black uppercase tracking-wider text-white">No trade swaps active</span>
            <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
              Any swaps you receive or propose will appear in this control board interface.
            </p>

            <div className="mt-6 p-4.5 bg-blue-950/20 border border-blue-500/25 rounded-2xl max-w-sm flex flex-col items-center gap-2.5">
              <span className="text-[10.5px] font-black text-blue-300 uppercase tracking-widest block text-center animate-pulse">Looking for trade partners?</span>
              <p className="text-[10px] text-slate-355 text-center leading-relaxed">
                Send this link on WhatsApp! They can tap it to connect instantly with you to securely propose trades:
              </p>
              
              <div className="w-full bg-[#030a16] px-3 py-2.5 rounded-xl border border-blue-500/20 flex flex-col gap-2.5 items-center overflow-hidden">
                <a 
                  href={inviteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-[10px] font-bold text-center break-all select-all block cursor-pointer w-full"
                  id="clickable-invite-link-empty"
                  title="Open secret invitation link instantly"
                >
                  🔗 {inviteUrl}
                </a>
                
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full justify-center">
                  <a
                    href={getWhatsAppShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 text-center py-2 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#25D366]"
                    title="Share via WhatsApp instantly"
                  >
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`w-full sm:w-auto px-3 py-2 font-mono font-black text-[9px] uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border shrink-0 ${
                      copiedLink
                        ? "bg-blue-400 text-brand-bg border-blue-400"
                        : "bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    <Copy className="w-3 h-3" /> {copiedLink ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Pegar Código/Enlace del Amigo en empty state */}
                <div className="w-full mt-2.5 border-t border-blue-500/10 pt-2.5 flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-left text-blue-300 uppercase tracking-wide">🔌 Already got your friend's code?</span>
                  <div className="flex gap-1.5 w-full">
                    <input
                      type="text"
                      value={friendCodeInput}
                      onChange={(e) => setFriendCodeInput(e.target.value)}
                      placeholder="Paste friend's code or link..."
                      className="flex-1 bg-[#02050c] border border-blue-500/20 hover:border-blue-500/40 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder:text-slate-500 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleConnectByCode()}
                      disabled={connectingByCode || !friendCodeInput.trim()}
                      className="py-1.5 px-3 bg-brand-emerald hover:bg-emerald-450 disabled:bg-slate-800 disabled:text-slate-600 text-brand-bg font-black text-[9px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      {connectingByCode ? "..." : "Connect"}
                    </button>
                  </div>
                  {connectStatus && (
                    <p className={`text-[9px] uppercase font-bold text-center mt-0.5 ${connectStatus.success ? "text-brand-emerald" : "text-rose-400"}`}>
                      {connectStatus.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>

    {/* NEW TRADE PROPOSAL MODAL */}
    <AnimatePresence>
      {showProposalForm && (
        <div className="fixed inset-0 bg-brand-bg/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-brand-panel border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#070e0a]">
              <div className="flex items-center gap-2">
                <Handshake className="text-brand-emerald w-5 h-5" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Propose New Secure Swap</h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowProposalForm(false);
                  setProposalError(null);
                }}
                className="text-slate-450 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="overflow-y-auto p-6 space-y-5 flex-1">
              {/* Choose Friend */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-brand-gold tracking-wider block">1. Which friend do you want to swap with?</label>
                {users.filter(u => u.uid !== currentUser.uid).length === 0 ? (
                  <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-xl text-xs text-brand-gold leading-relaxed">
                    You don't have any registered friends in this session yet. Copy your secret connection link from the panel, share it via WhatsApp or chat, and once they login, they will appear here as trade buddies.
                  </div>
                ) : (
                  <select
                    value={partnerUserId}
                    onChange={(e) => setPartnerUserId(e.target.value)}
                    className="w-full bg-[#0a110b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-emerald"
                  >
                    <option value="">-- Select friend --</option>
                    {users.filter(u => u.uid !== currentUser.uid).map(u => (
                      <option key={u.uid} value={u.uid}>{u.displayName} ({u.email})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Duplicate List to Offer */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-brand-emerald tracking-wider block">2. What sticker are you offering? (Your Duplicates)</label>
                {stickers.filter(s => s.ownerId === currentUser.uid && s.type === 'repetida').length === 0 ? (
                  <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-400">
                    You don't have any stickers marked as "Duplicate". Add them first from the "My Collection" tab checklist.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-455">Select the stickers you want to offer in this trade:</p>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-brand-bg/50 rounded-xl border border-white/5">
                      {stickers.filter(s => s.ownerId === currentUser.uid && s.type === 'repetida').map(s => {
                        const isSelected = offeredStickers.includes(s.code);
                        return (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => {
                              if (isSelected) {
                                setOfferedStickers(offeredStickers.filter(c => c !== s.code));
                              } else {
                                setOfferedStickers([...offeredStickers, s.code]);
                              }
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-brand-emerald text-brand-bg border-brand-emerald shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                                : 'bg-brand-panel hover:bg-white/5 text-slate-200 border-white/10'
                            }`}
                          >
                            {s.code} ({s.quantity}x)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Needed List to Ask */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-[#cbd5e1] tracking-wider block">3. Which sticker do you want? (Your Missing Stickers)</label>
                <div className="space-y-3">
                  {stickers.filter(s => s.ownerId === currentUser.uid && s.type === 'faltante').length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-450 font-medium">Choose from your missing list:</p>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-brand-bg/50 rounded-xl border border-white/5">
                        {stickers.filter(s => s.ownerId === currentUser.uid && s.type === 'faltante').map(s => {
                          const isSelected = requestedStickers.includes(s.code);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => {
                                if (isSelected) {
                                  setRequestedStickers(requestedStickers.filter(c => c !== s.code));
                                } else {
                                  setRequestedStickers([...requestedStickers, s.code]);
                                }
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-amber-500 text-brand-bg border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                                  : 'bg-brand-panel hover:bg-white/5 text-slate-200 border-white/10'
                              }`}
                            >
                              {s.code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-455 font-medium">Or type a custom code directly:</p>
                    <input
                      type="text"
                      value={newRequestCode}
                      onChange={(e) => setNewRequestCode(e.target.value)}
                      placeholder="E.g., ARG 10, BRA 9, FRA 10..."
                      className="w-full bg-[#0a110b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-brand-emerald"
                    />
                  </div>
                </div>
              </div>

              {proposalError && (
                <div className="bg-rose-950/45 text-rose-300 px-4 py-3 rounded-xl border border-rose-500/20 text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  {proposalError}
                </div>
              )}

              {proposalSuccess && (
                <div className="bg-[#0c1d11] text-brand-emerald px-4 py-3 rounded-xl border border-brand-emerald/30 text-xs font-bold">
                  {proposalSuccess}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProposalForm(false);
                    setProposalError(null);
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase text-slate-300 hover:text-white cursor-pointer transition-all text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={users.filter(u => u.uid !== currentUser.uid).length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-brand-bg text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-center"
                >
                  Confirm Proposal
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
