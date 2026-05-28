import React, { useState } from 'react';
import { Trophy, Calendar, MapPin, Users, Flame, X, Info, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WorldCupInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'venues' | 'format'>('general');

  // 2026 FIFA World Cup Facts
  const venues = [
    { city: "New York/New Jersey", stadium: "MetLife Stadium", country: "🇺🇸 USA", role: "Host of the Final Match" },
    { city: "Mexico City", stadium: "Estadio Azteca", country: "🇲🇽 Mexico", role: "Host of the Opening Match" },
    { city: "Dallas (Arlington)", stadium: "AT&T Stadium", country: "🇺🇸 USA", role: "Host of the Semifinal" },
    { city: "Atlanta", stadium: "Mercedes-Benz Stadium", country: "🇺🇸 USA", role: "Host of the Semifinal" },
    { city: "Miami", stadium: "Hard Rock Stadium", country: "🇺🇸 USA", role: "Host of the Bronze Match" },
    { city: "Los Angeles (Inglewood)", stadium: "SoFi Stadium", country: "🇺🇸 USA", role: "Opening USA Match" },
    { city: "Vancouver", stadium: "BC Place", country: "🇨🇦 Canada", role: "Opening Canada Match" },
    { city: "Toronto", stadium: "BMO Field", country: "🇨🇦 Canada", role: "Group Stage Venue" },
    { city: "Monterrey", stadium: "Estadio BBVA", country: "🇲🇽 Mexico", role: "Group Stage Venue" },
    { city: "Guadalajara", stadium: "Estadio Akron", country: "🇲🇽 Mexico", role: "Group Stage Venue" },
  ];

  return (
    <>
      {/* Sidebar Widget Box */}
      <div className="bg-gradient-to-br from-brand-panel/90 to-[#0c1811] backdrop-blur-md rounded-2xl border border-brand-emerald/20 p-5 shadow-2xl relative overflow-hidden" id="world-cup-info-widget">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 blur-2xl rounded-full pointer-events-none"></div>
        
        <div className="flex items-center gap-2.5 mb-3 border-b border-white/5 pb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-gold/15 flex items-center justify-center border border-brand-gold/30 shrink-0">
            <Trophy className="w-4 h-4 text-brand-gold" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              2026 World Cup Info
            </h3>
            <p className="text-[9px] text-brand-emerald font-bold uppercase tracking-widest font-mono">FIFA United 2026</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Get the ultimate quick guide to the historic joint tournament hosted across Canada, Mexico, and the United States.
        </p>

        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-brand-emerald to-emerald-500 hover:from-emerald-500 hover:to-emerald-450 text-brand-bg font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 text-center font-semibold"
          id="btn-open-wc-info"
        >
          <Info className="w-3.5 h-3.5" />
          Explore Tournament Info
        </button>
      </div>

      {/* Interactive Modal Backdrop + Dialog */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 cursor-pointer"
              id="wc-modal-backdrop"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="fixed inset-y-4 right-4 left-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-brand-bg border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 flex flex-col overflow-hidden max-h-[90vh]"
              id="wc-info-modal"
            >
              {/* Header */}
              <div className="bg-brand-panel p-5 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-gold/10 border-2 border-brand-gold/40 rounded-xl flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-brand-gold animate-bounce" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-base font-black uppercase text-brand-gold tracking-tighter italic">2026 FIFA World Cup</h2>
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest leading-none mt-1">United Host Platform (USA - CAN - MEX)</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Close Dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="bg-[#0c1811] px-4 py-2 flex gap-1 border-b border-white/5 shrink-0" id="wc-modal-tabs">
                <button
                  onClick={() => setActiveSubTab('general')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                    activeSubTab === 'general'
                      ? 'bg-brand-emerald text-brand-bg border-brand-emerald'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveSubTab('venues')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                    activeSubTab === 'venues'
                      ? 'bg-brand-emerald text-brand-bg border-brand-emerald'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Venues & Cities
                </button>
                <button
                  onClick={() => setActiveSubTab('format')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                    activeSubTab === 'format'
                      ? 'bg-brand-emerald text-brand-bg border-brand-emerald'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  New 48-Team Format
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin text-left">
                {activeSubTab === 'general' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="relative p-5 rounded-2xl bg-[#09150e]/60 border border-brand-emerald/20 overflow-hidden">
                      <div className="absolute right-0 bottom-0 pointer-events-none opacity-5 pr-4 pb-4">
                        <Flame className="w-24 h-24 text-brand-emerald" />
                      </div>
                      <h3 className="text-sm font-black text-brand-emerald uppercase tracking-wider mb-2">The Historic Joint Tournament</h3>
                      <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                        The 23rd FIFA World Cup will take place in the summer of 2026. This edition marks the first time that the supreme tournament is co-hosted by three sovereign North American nations together: Canada, Mexico, and the United States.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-brand-panel/60 border border-white/5">
                        <span className="text-[10px] text-brand-gold uppercase tracking-widest font-bold">Start & End Dates</span>
                        <p className="text-slate-100 font-extrabold text-xs mt-1">June 11 – July 19, 2026</p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">39 unforgettable days of football action.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-brand-panel/60 border border-white/5">
                        <span className="text-[10px] text-brand-gold uppercase tracking-widest font-bold">Inaugural Kickoff</span>
                        <p className="text-slate-100 font-extrabold text-xs mt-1">Estadio Azteca, CDMX</p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">Where giants meet to begin the journey on June 11.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-brand-panel/60 border border-white/5">
                        <span className="text-[10px] text-brand-gold uppercase tracking-widest font-bold">The Grand Final Location</span>
                        <p className="text-slate-100 font-extrabold text-xs mt-1">MetLife Stadium, New York / NJ</p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">The ultimate match will be crowned here on July 19.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-brand-panel/60 border border-white/5">
                        <span className="text-[10px] text-brand-gold uppercase tracking-widest font-bold">Total Matches Played</span>
                        <p className="text-slate-100 font-extrabold text-xs mt-1">104 Unique Games</p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">Up from the traditional 64 matches.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141203]/40 border border-brand-gold/20 flex gap-3 items-start">
                      <Shield className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-brand-gold tracking-wide">Swapping Fun Fact</h4>
                        <p className="text-[11px] text-slate-350 leading-relaxed mt-0.5">
                          With 48 teams competing, the official sticker album requires more trades than ever to fulfill! Connect with local swap-mates directly inside this FiguSwap APK to update checklists quickly.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSubTab === 'venues' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-slate-300 mb-2 leading-relaxed font-semibold">
                      Games are distributed across beautifully engineered stadiums strategically allocated in multiple regions:
                    </p>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {venues.map((v, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-brand-panel/50 border border-white/5 hover:border-brand-emerald/20 transition-all gap-4">
                          <div className="text-left">
                            <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider">{v.country}</span>
                            <h4 className="text-xs font-extrabold text-white mt-0.5">{v.city}</h4>
                            <p className="text-slate-400 text-[10px] mt-0.5">{v.stadium}</p>
                          </div>
                          <div className="bg-brand-bg px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center shrink-0">
                            <span className="text-brand-gold font-bold text-[9.5px] uppercase tracking-wider">{v.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeSubTab === 'format' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-brand-emerald/5 border border-brand-emerald/10">
                      <h4 className="text-xs font-black uppercase text-brand-emerald tracking-wide flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Expansion to 48 Participating Nations
                      </h4>
                      <p className="text-[11.5px] text-slate-300 leading-relaxed mt-1.5 font-medium">
                        For the first time in historical timeline, FIFA is transitioning from the classic 32-team format to include 48 teams! This yields additional opportunities for wildcard nations to qualify.
                      </p>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      <div className="flex gap-3 items-start">
                        <div className="h-6 w-6 bg-brand-panel/80 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-white/10 mt-0.5">1</div>
                        <div>
                          <p className="font-extrabold text-slate-100">12 Groups of 4 Teams Each</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Allows all teams to play at least three intense scheduled matches while maintaining group parity.</p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="h-6 w-6 bg-brand-panel/80 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-white/10 mt-0.5">2</div>
                        <div>
                          <p className="font-extrabold text-slate-100">Round of 32 Knockouts</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Top 2 teams from each of the 12 groups, plus the 8 best overall third-placed teams, will advance to an added Round of 32 knockout stage.</p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="h-6 w-6 bg-brand-panel/80 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-white/10 mt-0.5">3</div>
                        <div>
                          <p className="font-extrabold text-slate-100">More Matches for the Champions</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">The final four teams will play a total of 8 matches, instead of the historic 7 matches.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Secure swap action footer */}
              <div className="bg-brand-panel p-4 border-t border-white/10 flex justify-between items-center sm:gap-6 shrink-0 text-xs">
                <span className="text-slate-400 font-semibold hidden sm:inline">Ready to fulfill your 48-team collection?</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto px-5 py-2 bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 hover:border-slate-400 rounded-xl transition-all cursor-pointer font-bold text-center uppercase tracking-wider text-[10.5px]"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
