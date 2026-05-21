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
    proposeTrade
  } = useApp();

  const [messageText, setMessageText] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // New trade proposal state
  const [showProposalForm, setShowProposalForm] = useState<boolean>(false);
  const [partnerUserId, setPartnerUserId] = useState<string>("");
  const [offeredStickers, setOfferedStickers] = useState<string[]>([]);
  const [requestedStickers, setRequestedStickers] = useState<string[]>([]);
  const [newRequestCode, setNewRequestCode] = useState<string>("");
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState<string | null>(null);

  const handleCopyLink = () => {
    if (!currentUser) return;
    const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : "https://ais-pre-fknnxpd4yizdxu4wifamxw-327281564553.us-west1.run.app";
    const url = `${origin}?invite=${currentUser.uid}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Auto-scroll chat to bottom locally when loaded (keeps page scroll quiet)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentTradeMessages, activeTradeId]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-brand-panel rounded-2xl border border-white/10 shadow-2xl animate-fade-in" id="trades-logged-out">
        <Handshake className="w-12 h-12 text-brand-emerald mb-3 animate-pulse" />
        <h3 className="text-lg font-black text-white uppercase tracking-wider">Iniciá sesión para ver tus intercambios</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Registrate o seleccioná un usuario de prueba arriba para ver tus propuestas de canje.
        </p>
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
      setProposalError("Por favor seleccioná un amigo.");
      return;
    }
    const partner = users.find(u => u.uid === partnerUserId);
    if (!partner) {
      setProposalError("No se encontró el perfil de ese amigo.");
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
      setProposalError("Por favor seleccioná al menos una de tus repetidas para ofrecer.");
      return;
    }
    if (finalRequested.length === 0) {
      setProposalError("Por favor seleccioná o escribí al menos una figurita para pedirle.");
      return;
    }

    setProposalError(null);
    try {
      const newId = proposeTrade(partner.uid, partner.displayName, offeredStickers, finalRequested);
      setProposalSuccess("✔ ¡Canje propuesto correctamente!");
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
      setProposalError(err.message || "Error al iniciar la propuesta.");
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
      pending: "Pendiente",
      accepted: "Chat Abierto",
      rejected: "Rechazado",
      completed: "Canje Exitoso ✔",
      cancelled: "Cancelado"
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
            <h3 className="font-black text-white text-sm uppercase tracking-wider">Tus Negociaciones ({sortedTrades.length})</h3>
            <p className="text-[11px] text-slate-400 font-medium">Canjes propuestos y recibidos</p>
          </div>
          <button
            type="button"
            onClick={() => setShowProposalForm(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-brand-bg text-[10px] sm:text-[11.5px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-[0_2px_10px_rgba(16,185,129,0.3)] transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            Nuevo Canje
          </button>
        </div>

        {/* Banner para invitar/compartir link de amigos */}
        <div className="p-3 bg-brand-emerald/10 border-b border-white/5 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-emerald shrink-0 animate-pulse" />
            <div>
              <span className="text-[10px] font-black text-[#86efac] uppercase tracking-wider block">¡Enlace para tus Amigos!</span>
              <span className="text-[9px] text-slate-400 block max-w-[130px] sm:max-w-none">Compartí este enlace para que se unan a coleccionar.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3 py-1.5 font-mono font-black text-[9px] uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 border ${
              copiedLink
                ? "bg-emerald-400 text-brand-bg border-emerald-400 font-black"
                : "bg-brand-emerald/15 text-brand-emerald border-brand-emerald/30 hover:bg-brand-emerald hover:text-brand-bg"
            }`}
          >
            <Copy className="w-3 h-3" /> {copiedLink ? "¡Copiado!" : "Copiar Link"}
          </button>
        </div>

        {sortedTrades.length === 0 ? (
          <div className="p-12 text-center text-slate-550 text-sm flex-1 flex flex-col justify-center items-center gap-2">
            <MessageSquare className="w-8 h-8 text-brand-emerald/40" />
            <p className="font-bold text-slate-400">Aún no iniciaste propuestas de canje.</p>
            <p className="text-xs text-slate-500">Hacé clic en "Nuevo Canje" arriba para proponerle un intercambio seguro a alguno de tus amigos registrados.</p>
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
                      <span className="text-xs font-black text-white">Canje con {otherPartyName}</span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold uppercase tracking-wide">
                        {isOutgoing ? 'Propuesta enviada' : 'Propuesta recibida'}
                      </p>
                    </div>
                    {renderStatusBadge(t.status)}
                  </div>

                  {/* Summary of exchange cards */}
                  <div className="grid grid-cols-2 gap-2 bg-[#050a06] p-2.5 rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-brand-emerald font-black block mb-1">Oficidas</span>
                      <div className="flex flex-wrap gap-1">
                        {t.offeredStickers.map(c => (
                          <span key={c} className="bg-brand-panel/90 border border-brand-emerald/30 text-brand-emerald px-1.5 py-0.5 rounded text-[9px] font-mono leading-none font-black block">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-l border-white/5 pl-2">
                      <span className="text-[9px] uppercase tracking-wider text-brand-gold font-black block mb-1">Pedidas</span>
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
                    Actualizado: {new Date(t.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                  Intercambio con {activeTrade.proposerId === currentUser.uid ? activeTrade.receiverName : activeTrade.proposerName}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-400">ID del trueque:</span>
                  <span className="text-[10px] font-mono text-brand-emerald bg-white/5 border border-white/5 px-1.5 py-0.2 rounded">{activeTrade.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToFriends && (
                  <button
                    type="button"
                    onClick={onNavigateToFriends}
                    className="text-[10px] font-black uppercase text-brand-emerald bg-brand-emerald/10 hover:bg-brand-emerald hover:text-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-emerald/30 transition-all flex items-center gap-1 cursor-pointer"
                    title="Ver mi lista de amigos para sumar más canjes"
                  >
                    🤝 Mis Amigos
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
                      <p className="font-black text-white uppercase tracking-wider text-[11px]">Propuesta en espera de confirmación</p>
                      <p className="text-slate-400 text-[10px]">Escriban en el chat de abajo para pactar detalles.</p>
                    </div>
                  </div>
                  
                  {activeTrade.receiverId === currentUser.uid ? (
                    <div className="flex gap-2 self-end shrink-0">
                      <button
                        type="button"
                        onClick={() => respondToTrade(activeTrade.id, 'accepted')}
                        className="px-3 py-1.5 bg-brand-emerald hover:bg-emerald-400 text-brand-bg font-black rounded-lg text-xs transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={() => respondToTrade(activeTrade.id, 'rejected')}
                        className="px-3 py-1.5 bg-rose-950/45 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-bold rounded-lg text-xs transition-all flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => respondToTrade(activeTrade.id, 'cancelled')}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold rounded-lg text-xs transition-all flex items-center gap-1 self-end"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancelar Propuesta
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
                      <p className="font-black text-white uppercase tracking-wider text-[11px]">¡Propuesta de figuritas confirmada!</p>
                      <p className="text-slate-400 text-[10px]">Coordinen el lugar para realizar el canje pactado.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end shrink-0">
                    <button
                      type="button"
                      onClick={() => respondToTrade(activeTrade.id, 'completed')}
                      className="px-3 py-1.5 bg-brand-emerald hover:bg-emerald-450 text-brand-bg font-black rounded-lg text-xs transition-all flex items-center gap-1 shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
                      title="Marcar como concretado exitosamente"
                    >
                      <Check className="w-3.5 h-3.5" /> ¡Completar Canje!
                    </button>
                    <button
                      type="button"
                      onClick={() => respondToTrade(activeTrade.id, 'cancelled')}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs transition-all border border-white/5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* IF COMPLETED */}
              {activeTrade.status === 'completed' && (
                <div className="p-2 bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/20 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-emerald stroke-[3]" />
                  <span className="font-black uppercase tracking-wider text-[10px]">Este intercambio se completó con éxito.</span>
                </div>
              )}

              {/* IF REJECTED */}
              {activeTrade.status === 'rejected' && (
                <div className="p-2 bg-rose-950/45 border border-rose-500/25 text-rose-300 rounded-lg flex items-center gap-2">
                  <X className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Esta propuesta fue rechazada.</span>
                </div>
              )}

              {/* IF CANCELLED */}
              {activeTrade.status === 'cancelled' && (
                <div className="p-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Este intercambio fue cancelado.</span>
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
                    Sin mensajes en este trueque aún. Escribí un mensaje para iniciar la conversación.
                  </div>
                ) : (
                  currentTradeMessages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.uid;
                    return (
                      <div 
                        key={msg.id || msg.createdAt || idx} 
                        className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <span className="text-[9px] text-[#86efac] font-bold px-1 mb-0.5">{isMe ? "Tú" : msg.senderName}</span>
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
                    placeholder="Escribí tu mensaje acá..."
                    className="flex-1 px-4 py-2.5 bg-[#0d1f13] border border-white/10 rounded-xl text-xs focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald text-white placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-brand-emerald text-brand-bg rounded-xl hover:bg-emerald-450 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
                    title="Enviar mensaje"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="text-center text-xs text-slate-500 font-bold uppercase tracking-wider py-3 border-t border-white/5">
                  Chat deshabilitado: Este intercambio ya se encuentra cerrado.
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-500 text-sm gap-2 p-8 text-center bg-brand-bg/20">
            <Handshake className="w-12 h-12 text-slate-600 animate-pulse" />
            <span className="font-black uppercase tracking-wider text-white">Ningún intercambio cargado</span>
            <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
              Las ofertas que recibas o las propuestas de trueque que inicies aparecerán tabuladas en esta sección.
            </p>

            <div className="mt-6 p-4 bg-brand-emerald/5 border border-brand-emerald/10 rounded-2xl max-w-sm flex flex-col items-center gap-2">
              <span className="text-[10px] font-black text-[#86efac] uppercase tracking-widest block">¿Buscás más compañeros de canje?</span>
              <p className="text-[10px] text-slate-400">Enviá este enlace a tus amigos para que puedan registrar sus figuritas e intercambiar de inmediato.</p>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`mt-2 px-3.5 py-2 font-mono font-black text-[10px] uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                  copiedLink
                    ? "bg-emerald-400 text-brand-bg border-emerald-400"
                    : "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20 hover:bg-brand-emerald hover:text-brand-bg"
                }`}
              >
                <Copy className="w-3.5 h-3.5" /> {copiedLink ? "¡Enlace Copiado!" : "Compartir Enlace"}
              </button>
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
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Proponer Nuevo Canje Seguro</h3>
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
                <label className="text-[11px] font-black uppercase text-brand-gold tracking-wider block">1. ¿Con qué amigo querés intercambiar?</label>
                {users.filter(u => u.uid !== currentUser.uid).length === 0 ? (
                  <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-xl text-xs text-brand-gold leading-relaxed">
                    Aún no tenés amigos registrados en la base de datos de esta sesión. Copiá tu enlace de arriba y envíaselo por WhatsApp o chat, así se registran y podés seleccionarlos acá para canjear seguros.
                  </div>
                ) : (
                  <select
                    value={partnerUserId}
                    onChange={(e) => setPartnerUserId(e.target.value)}
                    className="w-full bg-[#0a110b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-emerald"
                  >
                    <option value="">-- Seleccionar amigo --</option>
                    {users.filter(u => u.uid !== currentUser.uid).map(u => (
                      <option key={u.uid} value={u.uid}>{u.displayName} ({u.email})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Duplicate List to Offer */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-brand-emerald tracking-wider block">2. ¿Qué figurita le ofreces? (Tus Repetidas)</label>
                {stickers.filter(s => s.ownerId === currentUser.uid && s.type === 'repetida').length === 0 ? (
                  <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-400">
                    No tenés figuritas marcadas como "Repetida" todavía. Agregalas antes desde la solapa "Mis Figus".
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-450">Marcá las figuritas que le das en este trueque:</p>
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
                <label className="text-[11px] font-black uppercase text-[#cbd5e1] tracking-wider block">3. ¿Qué figurita le pides? (Tus Faltantes)</label>
                <div className="space-y-3">
                  {stickers.filter(s => s.ownerId === currentUser.uid && s.type === 'faltante').length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-450">Elegí de tus faltantes:</p>
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
                    <p className="text-[10px] text-slate-450">O escribí un código personalizado directamente:</p>
                    <input
                      type="text"
                      value={newRequestCode}
                      onChange={(e) => setNewRequestCode(e.target.value)}
                      placeholder="Ej: ARG 10, BRA 9, FRA 10..."
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={users.filter(u => u.uid !== currentUser.uid).length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-brand-bg text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-center"
                >
                  Confirmar Propuesta
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
