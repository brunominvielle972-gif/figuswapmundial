/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { isRealFirebase } from './firebase';
import { 
  Trophy, Handshake, BookOpen, ShieldCheck, HelpCircle, 
  User, RefreshCw, LogIn, LogOut, CheckCircle2, ChevronRight,
  Sparkles, X, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MyCatalog from './components/MyCatalog';
import MyTrades from './components/MyTrades';
import BackofficePanel from './components/BackofficePanel';
import AIAssistant from './components/AIAssistant';
import WorldCupInfo from './components/WorldCupInfo';

function AppContent() {
  const { 
    currentUser, 
    isFirebaseActive,
    trades,
    connectionNotification,
    clearConnectionNotification,
    logout,
    users,
    switchSimUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'album' | 'trades' | 'backoffice'>('album');
  const [showAIChat, setShowAIChat] = useState<boolean>(false);

  const isCreatorAdmin = currentUser?.email === 'brunominvielle972@gmail.com' || 
    (typeof window !== 'undefined' && localStorage.getItem('admin_master_access') === 'true');

  const isImpersonating = typeof window !== 'undefined' && 
    localStorage.getItem('admin_master_access') === 'true' && 
    currentUser && 
    currentUser.uid !== localStorage.getItem('admin_user_uid');

  // Count pending or accepted trades where the current user is active to show a badge
  const activeTradeCount = trades.filter(t => 
    (t.proposerId === currentUser?.uid || t.receiverId === currentUser?.uid) &&
    ['pending', 'accepted'].includes(t.status)
  ).length;

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col pb-20 md:pb-0 font-sans relative overflow-x-hidden" id="app-root-container">
      
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-xs py-2 px-4 shadow-lg text-center flex items-center justify-center gap-3 z-50 sticky top-0" id="impersonation-warning-bar">
          <span className="flex items-center gap-1.5">🎭 <strong>Modo Administrador Supuesto:</strong> Estás navegando como <strong>{currentUser?.displayName}</strong> ({currentUser?.email}).</span>
          <button 
            onClick={() => {
              const creatorUid = localStorage.getItem('admin_user_uid');
              if (creatorUid) {
                switchSimUser(creatorUid);
              }
            }}
            className="bg-white hover:bg-slate-100 text-slate-950 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm select-none"
          >
            Volver a Creador 👑
          </button>
        </div>
      )}
      
      {/* Atmosphere Background Glow Elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-emerald/10 blur-[130px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[700px] h-[350px] bg-emerald-900/10 blur-[140px] rounded-full pointer-events-none z-0"></div>



      {/* 2. CHIEF BRAND HEADER & NAVIGATION */}
      <header className="bg-brand-panel/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.4)]" id="main-brand-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* BRAND LOGO */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-gold to-amber-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)] shrink-0">
                <Trophy className="w-5 h-5 text-brand-bg" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter italic uppercase text-brand-gold leading-none">FiguSwap <span className="text-white">2026</span></h1>
                <p className="text-[10px] font-bold text-brand-emerald uppercase tracking-widest font-mono mt-1">Secure Swap Active</p>
              </div>
            </div>

            {/* TAB SYSTEM DESKTOP */}
            <nav className="hidden md:flex space-x-1.5 bg-brand-bg/50 p-1 rounded-xl border border-white/5" aria-label="Tabs" id="nav-tabs-desktop">
              <button
                type="button"
                onClick={() => setActiveTab('album')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border ${
                  activeTab === 'album' 
                    ? 'bg-gradient-to-b from-brand-card to-brand-panel border-brand-emerald/40 text-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent font-medium'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                My Collection
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trades')}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border ${
                  activeTab === 'trades' 
                    ? 'bg-gradient-to-b from-brand-card to-brand-panel border-brand-emerald/40 text-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent font-medium'
                }`}
              >
                <Handshake className="w-4 h-4" />
                Messages
                {activeTradeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-brand-panel">
                    {activeTradeCount}
                  </span>
                )}
              </button>

              {isCreatorAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('backoffice')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border ${
                    activeTab === 'backoffice' 
                      ? 'bg-gradient-to-b from-brand-card to-brand-panel border-brand-emerald/40 text-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)] font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent font-medium'
                  }`}
                >
                  <Terminal className="w-4 h-4 text-brand-emerald" />
                  Creador Panel (Backoffice)
                </button>
              )}


            </nav>

            {/* PROFILE DISPLAY AND SIGN IN/OUT */}
            <div className="flex items-center gap-3">
              {/* IA Assistant Activation Button */}
              <button
                type="button"
                onClick={() => setShowAIChat(true)}
                className="relative bg-gradient-to-r from-[#0d2a1b] to-brand-panel hover:from-brand-emerald hover:to-emerald-400 text-brand-emerald hover:text-brand-bg px-3.5 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border border-brand-emerald/30 shadow-[0_0_15px_rgba(16,185,129,0.12)] group shrink-0"
                title="Consult FiguSwap Expert AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-emerald group-hover:text-brand-bg shrink-0 animate-pulse" />
                <span>⚽ Expert AI</span>
              </button>

              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-slate-200 leading-none">{currentUser?.displayName || "No User"}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-1">{currentUser?.email}</span>
              </div>
              <div className="h-11 w-11 rounded-xl border-2 border-brand-gold p-0.5 overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <div className="w-full h-full rounded-lg bg-brand-panel flex items-center justify-center font-black text-brand-gold text-xs">
                  {currentUser?.displayName ? currentUser.displayName.substring(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              </div>

              {currentUser && (
                <button
                  type="button"
                  onClick={logout}
                  className="p-2.5 bg-white/5 hover:bg-rose-950/40 border border-white/5 hover:border-rose-900/30 text-slate-450 hover:text-rose-450 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Log out / Switch identity"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* 3. MAIN APP VIEW CONTEXT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10" id="view-renderer-container">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* MAIN COLUMN: RENDER SELECTED ACTIVE COMPONENT */}
          <div className="xl:col-span-3 space-y-6">
            
            {activeTab === 'album' && (
              <MyCatalog />
            )}

            {activeTab === 'trades' && (
              <MyTrades />
            )}

            {activeTab === 'backoffice' && (
              <BackofficePanel />
            )}



          </div>

          {/* SIDEBAR COLUMNS: SAFETY & INFO STATEMENTS */}
          <div className="xl:col-span-1 space-y-6 bg-transparent" id="dashboard-sidebar">
            
            {/* SAFETY INSTRUCTIONS CARD (Direct response to "la cambiaremos de forma segura") */}
            <div className="bg-brand-panel/85 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-2xl relative">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <ShieldCheck className="w-5 h-5 text-brand-emerald shrink-0" />
                Secure Swap Active
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Sticker swapping is a fun social activity, but it should always be done based on safety rules:
              </p>

              <ol className="space-y-4 text-xs">
                <li className="flex gap-2.5 items-start">
                  <span className="bg-emerald-950/60 text-brand-emerald font-black font-mono h-5.5 w-5.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] border border-brand-emerald/20">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-slate-100">Trade without sharing private details</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Do not reveal your home address or phone number. Use each trade's private built-in chat module.</p>
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <span className="bg-emerald-950/60 text-brand-emerald font-black font-mono h-5.5 w-5.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] border border-brand-emerald/20">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-slate-100">Meet in open public spaces</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Agree to complete your swaps in public squares, schools, clubs, or shopping malls.</p>
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <span className="bg-emerald-950/60 text-brand-emerald font-black font-mono h-5.5 w-5.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] border border-brand-emerald/20">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-slate-100">Check duplicate cards together</span>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-sans">Always inspect the details and physical state of stickers before confirming the swap as complete.</p>
                  </div>
                </li>
              </ol>

              <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-300 leading-normal">
                💡 <strong>How it works:</strong> State what stickers you have duplicate and what you are looking for. Once both users agree, private chat opens. Update inventories automatically when the physical trade completes!
              </div>
            </div>

            {/* 2026 World Cup Information Box */}
            <WorldCupInfo />

          </div>

        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#030704]/95 text-slate-500 text-center py-8 border-t border-white/10 text-xs mt-12 relative z-10">
        <p className="max-w-7xl mx-auto px-4 font-medium">
          © {new Date().getFullYear()} FiguSwap 2026. Made as a secure networking space to bring collectors together and help everyone fill their checklist album.
        </p>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR (for simulated Android app feel) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-brand-panel/95 backdrop-blur-lg border-t border-white/10 py-3.5 px-6 md:hidden z-50 flex justify-around items-center shadow-[0_-5px_25px_rgba(0,0,0,0.6)]" aria-label="Mobile Tabs">
        <button
          type="button"
          onClick={() => setActiveTab('album')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'album' ? 'text-brand-emerald scale-105 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">My Collection</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trades')}
          className={`relative flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'trades' ? 'text-brand-emerald scale-105 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Handshake className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">Messages</span>
          {activeTradeCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-600 text-white font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center animate-bounce">
              {activeTradeCount}
            </span>
          )}
        </button>

        {isCreatorAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('backoffice')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'backoffice' ? 'text-brand-emerald scale-105 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            <Terminal className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider">Backoffice</span>
          </button>
        )}

      </nav>

      {/* Connection notification toast for instant invite connections */}
      <AnimatePresence>
        {connectionNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 bg-[#0b1c11] border-2 border-brand-emerald/40 text-slate-100 p-4.5 rounded-2xl shadow-[0_10px_35px_rgba(16,185,129,0.35)] z-50 flex items-center justify-between gap-4 max-w-sm border-l-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse text-brand-emerald" />
              </div>
              <div className="text-left">
                <b className="text-[11px] font-black uppercase text-brand-emerald tracking-wider block">Connection Successful!</b>
                <p className="text-[11.5px] text-slate-300 font-semibold leading-relaxed mt-0.5">{connectionNotification}</p>
              </div>
            </div>
            <button
              onClick={clearConnectionNotification}
              className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all cursor-pointer shrink-0"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliding AI Assistant Drawer */}
      <AnimatePresence>
        {showAIChat && (
          <>
            {/* Dark Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIChat(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 cursor-pointer"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:max-w-md bg-brand-bg border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.85)] z-50 flex flex-col p-4"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-brand-gold animate-pulse" />
                  <span className="text-xs uppercase font-black font-mono tracking-widest text-slate-350 font-bold">FiguSwap Expert AI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAIChat(false)}
                  className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center border border-white/5"
                  title="Close Assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden" id="drawer-assistant-inner">
                <AIAssistant />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
