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
  Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MyCatalog from './components/MyCatalog';
import MyTrades from './components/MyTrades';

function AppContent() {
  const { 
    currentUser, 
    createNewProfile,
    isFirebaseActive,
    trades,
    connectionNotification,
    clearConnectionNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'album' | 'trades'>('album');

  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !isFirebaseActive && !localStorage.getItem('my_saved_sim_user_id');
    }
    return false;
  });
  const [welcomeName, setWelcomeName] = useState<string>("");

  const handleWelcomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!welcomeName.trim()) return;
    const name = welcomeName.trim();
    createNewProfile(name, `${name.toLowerCase().replace(/\s+/g, '')}@figus.com`);
    setShowWelcomeModal(false);
  };

  // Count pending or accepted trades where the current user is active to show a badge
  const activeTradeCount = trades.filter(t => 
    (t.proposerId === currentUser?.uid || t.receiverId === currentUser?.uid) &&
    ['pending', 'accepted'].includes(t.status)
  ).length;

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col pb-20 md:pb-0 font-sans relative overflow-x-hidden" id="app-root-container">
      
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
                <h1 className="text-xl font-black tracking-tighter italic uppercase text-brand-gold leading-none">FiguSwap <span className="text-white">Mundial</span></h1>
                <p className="text-[10px] font-bold text-brand-emerald uppercase tracking-widest font-mono mt-1">Canje Seguro Activo</p>
              </div>
            </div>

            {/* TAB SYSTEM DESKTOP */}
            <nav className="hidden md:flex space-x-1.5 bg-brand-bg/50 p-1 rounded-xl border border-white/5" aria-label="Tabs" id="nav-tabs-desktop">
              <button
                type="button"
                onClick={() => setActiveTab('album')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border ${
                  activeTab === 'album' 
                    ? 'bg-gradient-to-b from-brand-card to-brand-panel border-brand-emerald/40 text-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Mis Figus
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trades')}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border ${
                  activeTab === 'trades' 
                    ? 'bg-gradient-to-b from-brand-card to-brand-panel border-brand-emerald/40 text-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <Handshake className="w-4 h-4" />
                Mensajes
                {activeTradeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-brand-panel">
                    {activeTradeCount}
                  </span>
                )}
              </button>
            </nav>

            {/* PROFILE DISPLAY AND SIGN IN/OUT */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-slate-200 leading-none">{currentUser?.displayName || "Sin Usuario"}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-1">{currentUser?.email}</span>
              </div>
              <div className="h-11 w-11 rounded-xl border-2 border-brand-gold p-0.5 overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <div className="w-full h-full rounded-lg bg-brand-panel flex items-center justify-center font-black text-brand-gold text-xs">
                  {currentUser?.displayName ? currentUser.displayName.substring(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              </div>
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

          </div>

          {/* SIDEBAR COLUMNS: SAFETY & INFO STATEMENTS */}
          <div className="xl:col-span-1 space-y-6 bg-transparent" id="dashboard-sidebar">
            
            {/* SAFETY INSTRUCTIONS CARD (Direct response to "la cambiaremos de forma segura") */}
            <div className="bg-brand-panel/85 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-2xl relative">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <ShieldCheck className="w-5 h-5 text-brand-emerald shrink-0" />
                Canje Seguro Activo
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                El intercambio de figuritas es una actividad social muy divertida, pero siempre debe hacerse bajo pautas seguras:
              </p>

              <ol className="space-y-4 text-xs">
                <li className="flex gap-2.5 items-start">
                  <span className="bg-emerald-950/60 text-brand-emerald font-black font-mono h-5.5 w-5.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] border border-brand-emerald/20">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-slate-100">Canje sin compartir datos</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">No des información de tu dirección ni teléfono. Usa el chat privado integrado de cada trueque.</p>
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <span className="bg-emerald-950/60 text-brand-emerald font-black font-mono h-5.5 w-5.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] border border-brand-emerald/20">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-slate-100">Punto de encuentro público</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Acuerden juntarse a canjear en plazas públicas, escuelas, polideportivos o shoppings.</p>
                  </div>
                </li>

                <li className="flex gap-2.5 items-start">
                  <span className="bg-emerald-950/60 text-brand-emerald font-black font-mono h-5.5 w-5.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] border border-brand-emerald/20">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-slate-100">Verificar juntos</span>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-sans">Revisen el estado físico y los códigos de las figuritas repetidas antes de marcar el canje como 'Completado'.</p>
                  </div>
                </li>
              </ol>

              <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-300 leading-normal">
                💡 <strong>¿Cómo funciona?</strong> Proponés un cambio indicando qué ofreces y qué deseas. Cuando ambos aceptan, el chat queda formalmente habilitado para coordinar. Una vez concretado el intercambio, marcalo como realizado para mantener tu stock actualizado.
              </div>
            </div>

            {/* QUICK LEGEND DICTIONARY */}
            <div className="bg-brand-panel/85 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <HelpCircle className="w-5 h-5 text-slate-300 shrink-0" />
                Filtros por Códigos
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Los códigos de tus figuritas se generan automáticamente con las tres primeras letras del país y el número ingresado:
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center bg-[#0d1f13] border border-white/5 p-2.5 rounded-lg text-[11px]">
                  <span className="font-mono font-bold text-brand-emerald">ARG-10</span>
                  <span className="text-slate-400 font-medium">Argentina cromo 10</span>
                </div>
                <div className="flex justify-between items-center bg-[#0d1f13] border border-white/5 p-2.5 rounded-lg text-[11px]">
                  <span className="font-mono font-bold text-brand-emerald">BRA-09</span>
                  <span className="text-slate-400 font-medium">Brasil cromo 09</span>
                </div>
                <div className="flex justify-between items-center bg-[#0d1f13] border border-white/5 p-2.5 rounded-lg text-[11px]">
                  <span className="font-mono font-bold text-brand-emerald">FRA-10</span>
                  <span className="text-slate-400 font-medium">Francia cromo 10</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#030704]/95 text-slate-500 text-center py-8 border-t border-white/10 text-xs mt-12 relative z-10">
        <p className="max-w-7xl mx-auto px-4 font-medium">
          © {new Date().getFullYear()} CanjeFigus Mundial. Desarrollado como una plataforma de red segura para facilitar el encuentro de coleccionistas y asegurar que todos llenen su álbum.
        </p>
      </footer>

      {/* 5. WELCOME POPUP FOR NEW FRIENDS JOINING THE LINK */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-[#000]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-brand-panel border-2 border-brand-emerald/35 rounded-3xl w-full max-w-md p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.25)] animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-gold via-brand-emerald to-brand-gold"></div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-brand-gold to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(251,191,36,0.25)]">
              <Trophy className="w-8 h-8 text-brand-bg" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-brand-gold tracking-tight italic uppercase mb-2">¡Tu Tablilla de Figus!</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto mb-6">
              Te compartieron este link para que registres tus figuritas repetidas y faltantes e intercambies de forma coordinada.
            </p>

            <form onSubmit={handleWelcomeSubmit} className="space-y-4">
              <div className="text-left">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Escribí tu Nombre o Nickname:</label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  placeholder="Ej: Bruno, Santi, Sofi..."
                  value={welcomeName}
                  onChange={(e) => setWelcomeName(e.target.value)}
                  className="w-full bg-[#0d1f13] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald font-bold placeholder:text-slate-500 placeholder:font-normal"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-brand-emerald hover:bg-emerald-400 active:scale-[0.98] text-brand-bg font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
              >
                Comenzar mi Álbum 🚀
              </button>
            </form>
          </div>
        </div>
      )}

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
          <span className="text-[10px] uppercase tracking-wider">Mis Figus</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trades')}
          className={`relative flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'trades' ? 'text-brand-emerald scale-105 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Handshake className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">Mensajes</span>
          {activeTradeCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-600 text-white font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center animate-bounce">
              {activeTradeCount}
            </span>
          )}
        </button>
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
                <b className="text-[11px] font-black uppercase text-brand-emerald tracking-wider block">¡Conexión Exitosa!</b>
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
