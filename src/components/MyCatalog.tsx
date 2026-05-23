/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COUNTRIES, COUNTRY_FLAG_MAP, COUNTRY_CODE_MAP, TEAMS_CONFIG, isDefaultShiny } from '../types';
import { Plus, Trash2, ClipboardCheck, Sparkles, Check, X, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MyCatalog() {
  const { stickers, currentUser, addSticker, removeSticker, loginWithGoogle, createNewProfile, isFirebaseActive } = useApp();
  const [localName, setLocalName] = useState("");
  
  // Form and interactive modal states
  const [country, setCountry] = useState<string>("Argentina");
  const [codeNum, setCodeNum] = useState<string>("10");
  const [stickerType, setStickerType] = useState<'repetida' | 'faltante'>("repetida");
  const [isShiny, setIsShiny] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Selected number in the control grid for quick popup edit
  const [activeQuickEdit, setActiveQuickEdit] = useState<{
    country: string;
    code: string;
    numStr: string;
  } | null>(null);

  if (!currentUser) {
    const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!localName.trim()) return;
      createNewProfile(localName.trim(), `${localName.trim().toLowerCase().replace(/\s+/g, '')}@figus.com`);
    };

    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-brand-panel rounded-3xl border border-white/10 shadow-2xl animate-fade-in" id="catalog-logged-out">
        <ShieldCheck className="w-12 h-12 text-brand-emerald mb-4 animate-[pulse_2s_infinite]" />
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Iniciá sesión para ver tus figus</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
          Ingresá con tu cuenta para cargar tu tablilla de control de figuritas repetidas e intercambiar en tiempo real con amigos.
        </p>

        <div className="w-full max-w-sm bg-[#0a180f] p-6 rounded-2xl border border-brand-emerald/20 shadow-inner">
          {isFirebaseActive ? (
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
            >
              ⚽ Ingresar con Google
            </button>
          ) : (
            <div className="text-[11px] text-amber-500 mb-3 font-semibold font-mono">Modo Simulador Desconectado</div>
          )}

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-white/5"></div>
            <span className="px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">O con tu Nickname</span>
            <div className="flex-1 border-t border-white/5"></div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input
              type="text"
              required
              maxLength={25}
              placeholder="Escribí tu nombre (Ej: Santi, Sofi)"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full bg-[#040c06] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-center text-white focus:outline-none focus:border-brand-emerald font-bold font-sans placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#112d1b] hover:bg-[#1a4427] text-brand-emerald font-black text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-brand-emerald/30 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            >
              Acceso Rápido Fútbol 🏆
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter stickers belonging to current authenticated/simulated user
  const myStickers = stickers.filter(s => s.ownerId === currentUser.uid);

  // Helper to find sticker in my catalog by normalized code
  const getMyStickerByCode = (code: string) => {
    return myStickers.find(s => s.code.replace(/\s+/g, '').toUpperCase() === code.replace(/\s+/g, '').toUpperCase());
  };

  const handleCodeNumChange = (val: string) => {
    const sanitized = val.replace(/\D/g, '').substring(0, 3);
    setCodeNum(sanitized);
    if (sanitized) {
      const num = parseInt(sanitized, 10);
      if (num < 1 || num > 20) {
        setValidationError(`Número inválido: ${sanitized}. Los números en la tablilla oficial van del 1 al 20.`);
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError("Por favor ingresá un número de figurita.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!codeNum.trim()) {
      setValidationError("Por favor ingresá un número de figurita.");
      return;
    }

    const numInt = parseInt(codeNum.trim(), 10);
    if (isNaN(numInt) || numInt < 1 || numInt > 20) {
      setValidationError(`Error: El número de la figurita (${codeNum}) es inválido. Debe estar estrictamente entre 1 y 20.`);
      return;
    }

    setValidationError(null);

    const codePrefix = COUNTRY_CODE_MAP[country] || country.substring(0, 3).toUpperCase();
    const formattedNum = codeNum.trim();
    const finalCode = `${codePrefix} ${formattedNum}`;

    // Add or merge
    addSticker({
      code: finalCode,
      playerName: finalCode, // Keeps code as description label
      country,
      type: stickerType,
      isShiny: false,
      quantity: stickerType === 'repetida' ? quantity : 1
    });

    // Increment number automatically for fast loading
    setCodeNum((prev) => {
      const nextNum = parseInt(prev, 10);
      if (isNaN(nextNum) || nextNum >= 20) {
        return "1";
      }
      return String(nextNum + 1);
    });
    setIsShiny(false);
    setQuantity(1);
  };

  // Perform quick-toggle actions from the Tablilla de Control grid
  const handleQuickAssign = (type: 'repetida' | 'faltante' | 'remove') => {
    if (!activeQuickEdit) return;

    const existing = getMyStickerByCode(activeQuickEdit.code);

    if (type === 'remove') {
      if (existing) {
        removeSticker(existing.id);
      }
    } else {
      addSticker({
        code: activeQuickEdit.code,
        playerName: activeQuickEdit.code,
        country: activeQuickEdit.country,
        type: type,
        isShiny: false,
        quantity: type === 'repetida' ? 1 : 1
      });
    }

    setActiveQuickEdit(null);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="my-catalog-view">
      
      {/* HEADER SECTION - Explaining Tablilla de Control */}
      <div className="p-6 bg-gradient-to-r from-[#0d1f13] to-[#040c06] rounded-2xl border border-brand-emerald/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="text-left">
          <span className="text-[10px] uppercase tracking-widest font-black text-brand-emerald flex items-center gap-1">
            <ClipboardCheck className="w-3.5 h-3.5" /> Tablilla Oficial Interactiva
          </span>
          <h2 className="text-lg font-black tracking-tight text-white uppercase mt-1">Mi Tablilla de Control de Figuritas</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Basado en la tablilla física oficial: marcá en verde las que **tenés repetidas** para ofrecer y en amarillo las que **necesitás conseguir**. 
            ¡Hacé clic sobre cualquier número en la grilla para cargarlo al instante sin escribir!
          </p>
        </div>
        <div className="bg-brand-emerald/15 border border-brand-emerald/30 rounded-xl px-5 py-3 text-center shrink-0 flex items-center gap-4">
          <div className="text-left border-r border-white/10 pr-4">
            <span className="text-[9px] uppercase font-bold text-brand-emerald block">Tengo Repetidas</span>
            <span className="text-xl font-mono font-black text-white">{myStickers.filter(s => s.type === 'repetida').length}</span>
          </div>
          <div className="text-left">
            <span className="text-[9px] uppercase font-bold text-brand-gold block">Me Faltan</span>
            <span className="text-xl font-mono font-black text-white">{myStickers.filter(s => s.type === 'faltante').length}</span>
          </div>
        </div>
      </div>

      {/* THE OFFICIAL TABLILLA CONTROL BOARD GRID */}
      <div className="bg-brand-panel/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl relative" id="tablilla-control-panel">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-5">
          <div className="text-left">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-emerald animate-pulse" /> Tablilla Oficial de Control de Selecciones
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Mapeo oficial de cromos correlativos del 1 al 20 por selección nacional.</p>
          </div>
          
          {/* Legend indicators */}
          <div className="flex flex-wrap items-center gap-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#0d1f13] border border-white/15 rounded text-center block" />
              <span>No cargada</span>
            </div>
            <div className="flex items-center gap-1 text-brand-emerald">
              <span className="w-3 h-3 bg-brand-emerald rounded block shadow" />
              <span>Ofrecida (Repetida)</span>
            </div>
            <div className="flex items-center gap-1 text-brand-gold">
              <span className="w-3 h-3 bg-brand-gold rounded block shadow" />
              <span>Buscada (Faltante)</span>
            </div>
          </div>
        </div>

        {/* List of Countries with official grids */}
        <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 customize-scrollbar">
          {TEAMS_CONFIG.map((team) => {
            const { name, code, flagCode, startNum, endNum, specificNumbers } = team;
            const numbers = specificNumbers || Array.from({ length: endNum - startNum + 1 }, (_, i) => startNum + i);
            
            return (
              <div key={`${name}-${code}`} className="flex flex-col lg:flex-row lg:items-center py-2.5 px-3 bg-[#030704]/40 hover:bg-[#030704]/85 border border-white/5 hover:border-white/10 rounded-xl transition-all gap-3">
                
                {/* Column: Flag & Name */}
                <div className="flex items-center gap-2.5 w-full lg:w-48 shrink-0 text-left">
                  <img 
                    src={`https://flagcdn.com/w40/${flagCode}.png`} 
                    alt={name} 
                    referrerPolicy="no-referrer"
                    className="w-7 h-5 object-cover rounded shadow border border-white/10 shrink-0" 
                  />
                  <div>
                    <span className="text-[11px] font-black text-white block uppercase tracking-wider leading-none">
                      {name}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-brand-emerald/80 mt-1 block">
                      Prefijo: {code}
                    </span>
                  </div>
                </div>

                {/* Grid Numbers box */}
                <div className="flex flex-wrap gap-1 w-full flex-1">
                  {numbers.map((numVal) => {
                    const numStr = String(numVal);
                    const stickerCode = `${code} ${numStr}`;
                    const mySticker = getMyStickerByCode(stickerCode);

                    // Determine formatting based on ownership
                    let bgStyle = "bg-[#0d1f13] border-white/5 text-slate-400 hover:border-brand-emerald hover:text-white hover:scale-105";
                    if (mySticker) {
                      if (mySticker.type === 'repetida') {
                        bgStyle = "bg-brand-emerald text-brand-bg font-extrabold border-brand-emerald/20 hover:scale-105 hover:brightness-110 shadow-lg shadow-brand-emerald/10";
                      } else {
                        bgStyle = "bg-brand-gold text-[#050a06] font-extrabold border-brand-gold/20 hover:scale-105 hover:brightness-110 shadow-lg shadow-brand-gold/10";
                      }
                    }

                    return (
                      <button
                        key={numVal}
                        type="button"
                        onClick={() => {
                          setIsShiny(false);
                          setActiveQuickEdit({
                            country: name,
                            code: stickerCode,
                            numStr
                          });
                        }}
                        className={`w-9 py-1 rounded text-[10px] font-mono border text-center transition-all cursor-pointer ${bgStyle}`}
                        title={`Editar ${stickerCode}`}
                      >
                        {numStr}
                      </button>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK WORKSPACE DIALOG (POPUP INTERACTIVE CARD ACTIONS) */}
      <AnimatePresence>
        {activeQuickEdit && (
          <div className="fixed inset-0 bg-[#000]/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-panel border border-brand-emerald/20 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-gradient-to-r from-[#0d1f13] to-[#040c06] border-b border-white/15 flex justify-between items-center">
                <div className="text-left">
                  <span className="text-[10px] text-brand-emerald uppercase font-black tracking-widest block">Asignar Cromo</span>
                  <h4 className="text-sm font-black text-white font-mono uppercase tracking-tight">{activeQuickEdit.code}</h4>
                </div>
                <button
                  onClick={() => setActiveQuickEdit(null)}
                  className="p-1 text-slate-450 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-left text-slate-200">
                {/* Miniature Visual representation of the Sticker with Flag only */}
                <div className="p-4 bg-[#050a06] border border-white/10 rounded-xl relative flex flex-col items-center justify-center min-h-[140px] text-center overflow-hidden">
                  
                  {/* Flag as main asset */}
                  <img
                    src={`https://flagcdn.com/w160/${COUNTRY_FLAG_MAP[activeQuickEdit.country] || 'un'}.png`}
                    alt={activeQuickEdit.country}
                    referrerPolicy="no-referrer"
                    className="w-20 h-13 object-cover rounded shadow-md border border-white/10 mb-3"
                  />
                  
                  <span className="text-lg font-mono font-black text-white tracking-widest">{activeQuickEdit.code}</span>
                  <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wider">{activeQuickEdit.country}</span>
                  
                  {getMyStickerByCode(activeQuickEdit.code) ? (
                    <span className="mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30">
                      Estado: {getMyStickerByCode(activeQuickEdit.code)?.type === 'repetida' ? 'Ofrecida' : 'Buscada'}
                    </span>
                  ) : (
                    <span className="mt-2 text-[9px] text-slate-500 font-medium">No cargada todavía</span>
                  )}
                </div>

                {/* Interactive Toggles */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickAssign('repetida')}
                    className="py-2.5 px-1 bg-brand-emerald text-brand-bg font-extrabold text-[10px] uppercase rounded-lg hover:scale-[1.03] transition-all cursor-pointer text-center"
                  >
                    Repetida (Tengo)
                  </button>
                  <button
                    onClick={() => handleQuickAssign('faltante')}
                    className="py-2.5 px-1 bg-brand-gold text-brand-bg font-extrabold text-[10px] uppercase rounded-lg hover:scale-[1.03] transition-all cursor-pointer text-center"
                  >
                    Faltante (Busco)
                  </button>
                  <button
                    onClick={() => handleQuickAssign('remove')}
                    disabled={!getMyStickerByCode(activeQuickEdit.code)}
                    className="py-2.5 px-1 bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300 font-extrabold text-[10px] uppercase rounded-lg hover:scale-[1.03] transition-all cursor-pointer text-center"
                  >
                    Quitar / Limpiar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL BATCH FORM & TRADITIONAL ADD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ADD STICKER MANUAL FORM */}
        <div className="lg:col-span-2 bg-brand-panel/85 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-2xl relative" id="sticker-form-container">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-white/5 pb-2 text-left">
            <Plus className="w-5 h-5 text-brand-emerald" />
            Cargar Figurita Manual
          </h2>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-left uppercase tracking-widest font-black text-slate-400 mb-1">Selección Nacional</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0d1f13] border border-white/15 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald text-white cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 text-left">
                <div className="col-span-1">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Número</label>
                  <input
                    type="text"
                    required
                    value={codeNum}
                    onChange={(e) => handleCodeNumChange(e.target.value)}
                    placeholder="10"
                    className={`w-full px-3 py-2 bg-[#0d1f13] border ${validationError ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500 text-red-105' : 'border-white/15 focus:border-brand-emerald focus:ring-brand-emerald text-white'} rounded-xl text-center text-xs focus:outline-none focus:ring-1 font-mono font-black`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Categoría</label>
                  <div className="grid grid-cols-2 bg-[#050a06] p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setStickerType('repetida')}
                      className={`py-1.5 text-[11px] font-black rounded-lg text-center transition-all border ${stickerType === 'repetida' ? 'bg-[#0d1f13] text-brand-emerald border-brand-emerald/35 shadow-xs font-black' : 'text-slate-400 hover:text-white border-transparent cursor-pointer'}`}
                    >
                      Repetida
                    </button>
                    <button
                      type="button"
                      onClick={() => setStickerType('faltante')}
                      className={`py-1.5 text-[11px] font-black rounded-lg text-center transition-all border ${stickerType === 'faltante' ? 'bg-[#241305] text-brand-gold border-brand-gold/35 shadow-xs font-black' : 'text-slate-400 hover:text-white border-transparent cursor-pointer'}`}
                    >
                      Faltante
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl text-xs font-bold text-left flex items-start gap-2 animate-fade-in shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mt-1.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-[#0d1f13] border border-white/10 p-3.5 rounded-xl">
              <span className="text-xs font-black text-slate-300">Tipo de figurita: {stickerType === 'repetida' ? 'Repetida (Ofrecida)' : 'Faltante (Buscada)'}</span>

              {stickerType === 'repetida' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cantidad:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 bg-white/5 rounded border border-white/10 flex items-center justify-center font-bold font-mono text-white text-xs hover:bg-white/10"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-black text-brand-emerald">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 bg-white/5 rounded border border-white/10 flex items-center justify-center font-bold font-mono text-white text-xs hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium italic">Se carga como búsqueda para trueque</span>
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-gradient-to-r from-brand-emerald to-emerald-600 text-[#050a06] rounded-xl text-xs font-black uppercase tracking-wider hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              Cargar y Registrar
            </button>
          </form>
        </div>

        {/* INFO BOX */}
        <div className="bg-[#0c130d] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-full min-h-[200px]" id="quick-action-info">
          <div className="text-left space-y-3">
            <h3 className="text-xs font-black text-brand-emerald uppercase tracking-wider">¿Por qué usar la Tablilla?</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
              Los coleccionistas organizan sus canjes basándose estrictamente en el número correlativo que les falta para completar el álbum.
            </p>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              En vez de escribir nombres de jugadores o textos largos, la tablilla oficial compacta la búsqueda en su denominación estricta y código de selección (Ej: **ARG 10** o **BRA 9** en vez de la descripción completa). ¡La forma más oficial, ordenada y rápida de coleccionar!
            </p>
          </div>
          <div className="text-[10px] text-left uppercase text-slate-500 font-bold border-t border-white/5 pt-3.5 mt-4">
            <span>🏆 Control de Figuritas del Mundial (1 al 20)</span>
          </div>
        </div>
      </div>

      {/* LOWER INTERACTIVE GRID: THE INDIVIDUAL CARDS FOR MY STICKERS (NO FOOTBALL PICTURES, ONLY FLAG ARTWORK + SHINY ACCENTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="catalog-lists">
        
        {/* REPETIDAS OUTFLOW */}
        <div className="bg-brand-panel/85 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-2xl" id="my-repeated-list">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
            <div className="text-left">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{currentUser.displayName} Ofrece ({myStickers.filter(s => s.type === 'repetida').length})</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Tus figuritas repetidas disponibles para trueque.</p>
            </div>
            <span className="text-[10px] font-mono bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 px-2.5 py-1 rounded font-black uppercase tracking-wider">Tengo</span>
          </div>

          <AnimatePresence mode="popLayout">
            {myStickers.filter(s => s.type === 'repetida').length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Sin figuritas repetidas cargadas.</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Seleccioná números en la Tablilla arriba para declararlas en oferta.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1 customize-scrollbar">
                {myStickers.filter(s => s.type === 'repetida').map(s => {
                  const flagCode = COUNTRY_FLAG_MAP[s.country] || "un";

                  return (
                    <motion.div
                      key={s.id}
                      layoutId={s.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative w-full h-36 rounded-xl overflow-hidden bg-brand-bg border border-white/10 hover:border-brand-emerald/45 group shadow-lg flex flex-col justify-between p-4"
                    >
                      {/* Flag as visual banner element in the top left */}
                      <div className="flex justify-between items-start">
                        <img 
                          src={`https://flagcdn.com/w80/${flagCode}.png`} 
                          alt={s.country} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-7 object-cover rounded shadow border border-white/10 shrink-0" 
                        />
                        
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-base font-black text-brand-emerald leading-none bg-[#030704]/90 border border-brand-emerald/35 px-2 py-0.5 rounded shadow">
                            {s.code}
                          </span>
                          {s.quantity > 1 && (
                            <span className="text-[9px] font-mono font-extrabold bg-brand-emerald/10 text-brand-emerald mt-1 px-1.5 rounded">
                              Disponibles: {s.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Details information */}
                      <div className="text-left mt-auto pt-2 flex justify-between items-end border-t border-white/5">
                        <div className="space-y-0.5">
                          <span className="text-[11px] uppercase font-black text-white block tracking-wider leading-none">
                            {s.country}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                            Cromo Oficial
                          </span>
                        </div>

                        {/* Actions */}
                        <button
                          type="button"
                          onClick={() => removeSticker(s.id)}
                          className="p-1 px-2.5 bg-rose-950/20 text-[#faa] border border-rose-900/40 hover:bg-rose-900/50 hover:text-white rounded-lg transition-all cursor-pointer shadow text-[9px] font-black uppercase"
                          title="Eliminar de inventario"
                        >
                          Quitar
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* FALTANTES INFLOW */}
        <div className="bg-brand-panel/85 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-2xl" id="my-needed-list">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
            <div className="text-left">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{currentUser.displayName} Busca ({myStickers.filter(s => s.type === 'faltante').length})</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Tus figuritas buscadas registradas para recolectar.</p>
            </div>
            <span className="text-[10px] font-mono bg-brand-gold/15 text-brand-gold border border-brand-gold/30 px-2.5 py-1 rounded font-black uppercase tracking-wider">Busco</span>
          </div>

          <AnimatePresence mode="popLayout">
            {myStickers.filter(s => s.type === 'faltante').length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Sin figuritas faltantes cargadas.</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Seleccioná números en la Tablilla arriba para declararlas como faltantes.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1 customize-scrollbar flex-1">
                {myStickers.filter(s => s.type === 'faltante').map(s => {
                  const flagCode = COUNTRY_FLAG_MAP[s.country] || "un";

                  return (
                    <motion.div
                      key={s.id}
                      layoutId={s.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative w-full h-36 rounded-xl overflow-hidden bg-brand-bg border border-white/10 hover:border-brand-gold/45 group shadow-lg flex flex-col justify-between p-4"
                    >
                      {/* Flag header element */}
                      <div className="flex justify-between items-start">
                        <img 
                          src={`https://flagcdn.com/w80/${flagCode}.png`} 
                          alt={s.country} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-7 object-cover rounded shadow border border-white/10 shrink-0" 
                        />
                        
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-base font-black text-brand-gold leading-none bg-[#030704]/90 border border-brand-gold/35 px-2 py-0.5 rounded shadow">
                            {s.code}
                          </span>
                        </div>
                      </div>

                      {/* Details information footer */}
                      <div className="text-left mt-auto pt-2 flex justify-between items-end border-t border-white/5">
                        <div className="space-y-0.5">
                          <span className="text-[11px] uppercase font-black text-white block tracking-wider leading-none">
                            {s.country}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                            Cromo Oficial
                          </span>
                        </div>

                        {/* Actions */}
                        <button
                          type="button"
                          onClick={() => removeSticker(s.id)}
                          className="p-1 px-2.5 bg-rose-950/20 text-[#faa] border border-rose-900/40 hover:bg-rose-900/50 hover:text-white rounded-lg transition-all cursor-pointer shadow text-[9px] font-black uppercase"
                          title="Eliminar de inventario"
                        >
                          Quitar
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
