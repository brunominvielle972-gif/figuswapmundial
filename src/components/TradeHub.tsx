/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COUNTRY_FLAG_MAP } from '../types';
import { 
  Search, 
  Compass, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  ShieldEllipsis, 
  AlertCircle, 
  UserPlus, 
  Users, 
  Check, 
  X, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TradeHub({ onNavigateToTrades }: { onNavigateToTrades: () => void }) {
  const { 
    stickers, 
    currentUser, 
    proposeTrade, 
    users, 
    friendRequests, 
    sendFriendRequest, 
    respondToFriendRequest,
    trades
  } = useApp();

  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [showStats, setShowStats] = useState<boolean>(false);

  // State to manage trade proposal drawer/inputs
  const [proposingToUser, setProposingToUser] = useState<{ id: string; name: string } | null>(null);
  const [selectedOffered, setSelectedOffered] = useState<string[]>([]);
  const [selectedRequested, setSelectedRequested] = useState<string[]>([]);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-brand-panel rounded-2xl border border-white/10 shadow-2xl animate-fade-in" id="hub-logged-out">
        <AlertCircle className="w-12 h-12 text-brand-gold mb-3 animate-pulse" />
        <h3 className="text-lg font-black text-white uppercase tracking-wider">Log in to explore the community</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Sign in or switch users above to view stickers, send friend requests, and negotiate trades.
        </p>
      </div>
    );
  }

  // Get friendship status with any user
  const getFriendship = (userId: string) => {
    return friendRequests.find(r => 
      (r.senderId === currentUser.uid && r.receiverId === userId) ||
      (r.senderId === userId && r.receiverId === currentUser.uid)
    );
  };

  // Find other users' stickers checking they're "repetidas" (available to trade)
  const othersOffers = stickers.filter(s => s.ownerId !== currentUser.uid && s.type === 'repetida');
  
  // My stickers to use for trade matching
  const myStickers = stickers.filter(s => s.ownerId === currentUser.uid);
  const myNeeded = myStickers.filter(s => s.type === 'faltante');
  const myRepeated = myStickers.filter(s => s.type === 'repetida');

  // Filter listings by country (avoiding complex code search per user feedback)
  const filteredOffers = othersOffers.filter(s => {
    const matchesCountry = selectedCountry === "All" || s.country === selectedCountry;
    return matchesCountry;
  });

  // Get unique list of countries from other users' offers for filter
  const existingCountries = Array.from(new Set(othersOffers.map(s => s.country)));

  // Identify Intelligent Trade Matches (Coincidencias de Intercambio)
  // An offering user has what I NEED because I have those codes declared in myNeeded
  const smartMatches = othersOffers.filter(offer => 
    myNeeded.some(needed => needed.code.toUpperCase() === offer.code.toUpperCase())
  );

  const startProproposal = (ownerId: string, ownerName: string, initialRequestedCode: string) => {
    setProposingToUser({ id: ownerId, name: ownerName });
    setSelectedRequested([initialRequestedCode]);
    
    // Auto-select one of my repeated stickers if they need it, or leave empty
    const matchedRepeated = myRepeated.find(mySticker => {
      // Find if this other user needs what I have repeated
      return stickers.some(s => s.ownerId === ownerId && s.type === 'faltante' && s.code === mySticker.code);
    });

    if (matchedRepeated) {
      setSelectedOffered([matchedRepeated.code]);
    } else if (myRepeated.length > 0) {
      setSelectedOffered([myRepeated[0].code]);
    } else {
      setSelectedOffered([]);
    }
    setSuccessInfo(null);
  };

  const handleSendProposal = () => {
    if (!proposingToUser) return;
    if (selectedOffered.length === 0) {
      alert("Please select at least one of your stickers to offer in the transition.");
      return;
    }
    if (selectedRequested.length === 0) {
      alert("Please select at least one sticker of the other user.");
      return;
    }

    proposeTrade(
      proposingToUser.id,
      proposingToUser.name,
      selectedOffered,
      selectedRequested
    );

    setSuccessInfo(`Trade proposal sent successfully to @${proposingToUser.name}!`);
    setTimeout(() => {
      setProposingToUser(null);
      setSuccessInfo(null);
      onNavigateToTrades();
    }, 2000);
  };

  // Pending requests addressed specifically to me
  const incomingPendingRequests = friendRequests.filter(r => r.receiverId === currentUser.uid && r.status === 'pending');
  // Friends currently accepted
  const myFriends = users.filter(u => {
    if (u.uid === currentUser.uid) return false;
    const req = getFriendship(u.uid);
    return req && req.status === 'accepted';
  });

  const renderMiniFriendshipButton = (ownerId: string, ownerName: string) => {
    if (ownerId === currentUser.uid) return null;
    const fState = getFriendship(ownerId);
    if (!fState) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sendFriendRequest(ownerId);
          }}
          className="text-[9px] font-black uppercase text-brand-emerald bg-brand-emerald/15 hover:bg-brand-emerald hover:text-brand-bg px-2 py-0.5 rounded border border-brand-emerald/30 transition-all flex items-center gap-0.5 shrink-0"
          title={`Send friend request to @${ownerName}`}
        >
          <UserPlus className="w-2.5 h-2.5" /> + Friend
        </button>
      );
    }
    if (fState.status === 'accepted') {
      return (
        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/25 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
          🤝 Friend
        </span>
      );
    }
    if (fState.status === 'pending' && fState.senderId === currentUser.uid) {
      return (
        <span className="text-[9px] font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded shrink-0">
          📨 Sent
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          respondToFriendRequest(fState.id, 'accepted');
        }}
        className="text-[9px] font-black uppercase text-brand-gold bg-brand-gold/15 hover:bg-brand-gold hover:text-brand-bg px-2 py-0.5 rounded border border-brand-gold/30 transition-all flex items-center gap-0.5 shrink-0"
        title="Accept request"
      >
        Accept!
      </button>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in" id="trade-hub-view">



      {/* FRIEND REQUESTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* INCOMING FRIEND REQUESTS BUTTONS */}
        <div className="lg:col-span-2 bg-brand-panel/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl relative" id="friend-requests-box">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand-emerald" />
            Friends & Friend Requests
          </h3>

          {incomingPendingRequests.length > 0 ? (
            <div className="space-y-3 mb-5 p-4 bg-brand-emerald/5 border border-brand-emerald/15 rounded-xl">
              <span className="text-[10px] font-black uppercase text-brand-emerald tracking-wider block">¡You have pending friend requests!</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {incomingPendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-[#040c06] border border-white/5 p-2 px-3 rounded-lg text-xs">
                    <span className="text-white font-bold">@{req.senderName}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => respondToFriendRequest(req.id, 'accepted')}
                        className="p-1 px-2.5 bg-brand-emerald hover:bg-emerald-450 text-brand-bg font-black text-[10px] uppercase rounded flex items-center gap-1 hover:scale-105 transition-all cursor-pointer"
                        title="Accept"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>
                      <button
                        onClick={() => respondToFriendRequest(req.id, 'declined')}
                        className="p-1 px-1.5 bg-white/5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded transition-all cursor-pointer"
                        title="Decline"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* LIST OF COLLECTORS TO ADD */}
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Collectors in Community</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
            {users.filter(u => u.uid !== currentUser.uid).map(u => {
              const fState = getFriendship(u.uid);
              const isAccepted = fState && fState.status === 'accepted';
              const isPendingSent = fState && fState.status === 'pending' && fState.senderId === currentUser.uid;
              const isPendingReceived = fState && fState.status === 'pending' && fState.receiverId === currentUser.uid;

              return (
                <div key={u.uid} className="bg-[#0c130d] border border-white/5 rounded-xl p-3 flex justify-between items-center transition-all hover:border-white/10">
                  <div className="text-left">
                    <b className="text-sm font-black text-white block">@{u.displayName}</b>
                    <span className="text-[10px] text-slate-400">{u.email}</span>
                  </div>

                  <div>
                    {isAccepted ? (
                      <span className="text-[10px] font-bold text-brand-emerald bg-brand-emerald/15 border border-brand-emerald/30 rounded-lg px-2.5 py-1 flex items-center gap-1">
                        🤝 Friends
                      </span>
                    ) : isPendingSent ? (
                      <span className="text-[10px] font-medium text-slate-400 bg-white/5 border border-white/5 rounded-lg px-2 py-1">
                        📨 Sent
                      </span>
                    ) : isPendingReceived ? (
                      <span className="text-[10px] font-black text-brand-gold bg-brand-gold/10 border border-brand-gold/30 rounded-lg px-2.5 py-1">
                        Received!
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(u.uid)}
                        className="py-1 px-2.5 bg-brand-emerald hover:bg-emerald-450 text-[#050a06] font-black text-[10px] uppercase rounded-lg flex items-center gap-1 hover:scale-[1.03] transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" /> Add Friend
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDE MIS AMIGOS BOX */}
        <div className="bg-brand-panel/80 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between" id="my-friends-summary">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Users className="w-4 h-4 text-brand-gold" />
              My Trading Circle
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              Having friends allows you to propose direct trade transactions securely and prioritize private messaging.
            </p>

            <div className="space-y-2 mt-4 max-h-36 overflow-y-auto">
              {myFriends.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-[11px] border border-dashed border-white/5 rounded-xl">
                  No friends added yet.
                </div>
              ) : (
                myFriends.map(f => (
                  <div key={f.uid} className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-lg text-xs">
                    <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                    <span className="text-white font-extrabold">@{f.displayName}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 border-t border-white/5 pt-3 mt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
            <span>100% Secure System</span>
          </div>
        </div>
      </div>

      {/* MATCHING MECHANISM - INTELLIGENT HIGHLIGHTS */}
      {smartMatches.length > 0 && (
        <div className="bg-[#0b1a0e]/90 border border-brand-emerald/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-fade-in" id="smart-matches-container">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-brand-gold fill-brand-gold" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Intelligent Trade Matches!</h3>
          </div>
          <p className="text-xs text-slate-350 mb-5 font-semibold">
            These collectors have duplicate stickers that you have registered on your wanted checklist! Secure Match Detected!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {smartMatches.slice(0, 3).map(offer => {
              const flagCode = COUNTRY_FLAG_MAP[offer.country] || "un";

              return (
                <div 
                  key={offer.id} 
                  className="relative w-full h-44 rounded-xl bg-brand-bg border border-white/10 flex flex-col justify-between p-4 text-left transition-all hover:border-brand-emerald/45 hover:shadow-2xl shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <img 
                      src={`https://flagcdn.com/w80/${flagCode}.png`} 
                      alt={offer.country} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-7 object-cover rounded shadow border border-white/10" 
                    />
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] font-black uppercase text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/30 px-2.5 py-1 rounded shadow">
                        @{offer.ownerName}
                      </span>
                      {renderMiniFriendshipButton(offer.ownerId, offer.ownerName)}
                    </div>
                  </div>

                  {/* Card Details & Action bottom */}
                  <div className="w-full">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="font-mono text-sm font-black text-brand-gold bg-[#030704]/90 border border-brand-gold/35 px-2 py-0.5 rounded shadow">
                        {offer.code}
                      </span>
                    </div>
                    
                    <h4 className="font-extrabold text-white text-[11px] mt-2 uppercase tracking-wide leading-none">{offer.country}</h4>
                    <p className="text-[9px] text-slate-400 mt-1">Missing from your list</p>

                    <button
                      type="button"
                      onClick={() => startProproposal(offer.ownerId, offer.ownerName, offer.code)}
                      className="mt-2.5 w-full py-1.5 bg-brand-emerald hover:bg-[#10b981] text-[#050a06] font-black uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Propose Swap
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXPLORE COMMUNITY DUPLICATES */}
      <div className="bg-brand-panel/85 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-2xl relative" id="marketplace-search-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-emerald" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Explore Sticker Marketplace</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-bold">Duplicate stickers listed by general community</span>
        </div>

        {/* Filters and search info */}
        <div className="max-w-xs mb-4">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0d1f13] border border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald text-white cursor-pointer"
          >
            <option value="All">All Teams / Countries</option>
            {existingCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* Collapsible Stats Section (Slightly Hidden Apartado) */}
        <div className="mb-6 bg-white/3 p-3 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setShowStats(!showStats)}
            className="text-[11px] uppercase font-black text-slate-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer pb-1"
          >
            {showStats ? "Hide App Statistics ▲" : "View Statistics and Registered Collectors ▼"}
          </button>
          
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3 pt-2.5 border-t border-white/5 space-y-3.5 text-left"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-[#0d1f13] border border-white/5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase leading-tight">Active Collectors</span>
                    <strong className="text-lg text-brand-emerald font-mono">{users.length}</strong>
                  </div>
                  <div className="p-3 bg-[#0d1f13] border border-white/5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase leading-tight">Offers Listed</span>
                    <strong className="text-lg text-slate-200 font-mono">{stickers.filter(s => s.type === 'repetida').length}</strong>
                  </div>
                  <div className="p-3 bg-[#0d1f13] border border-white/5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase leading-tight">Wanted Stickers</span>
                    <strong className="text-lg text-brand-gold font-mono">{stickers.filter(s => s.type === 'faltante').length}</strong>
                  </div>
                  <div className="p-3 bg-[#0d1f13] border border-white/5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase leading-tight">Total Trades</span>
                    <strong className="text-lg text-slate-350 font-mono">{trades.length}</strong>
                  </div>
                </div>
                
                <div className="pt-2 text-[11px] text-slate-300 leading-relaxed font-semibold">
                  👤 <span className="text-slate-400 font-bold">Collectors trading online:</span>{' '}
                  {users.map((u, i) => (
                    <span key={u.uid} className="inline-block bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px] mr-1.5 text-white font-mono font-black">
                      @{u.displayName}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Listings Grid */}
        {filteredOffers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No duplicate stickers listed right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="community-offers-grid">
            {filteredOffers.map(offer => {
              const flagCode = COUNTRY_FLAG_MAP[offer.country] || "un";

              return (
                <div 
                  key={offer.id} 
                  className="relative w-full h-44 rounded-xl bg-brand-bg border border-white/10 flex flex-col justify-between p-4 text-left transition-all hover:border-brand-emerald/45 hover:shadow-2xl shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <img 
                      src={`https://flagcdn.com/w80/${flagCode}.png`} 
                      alt={offer.country} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-7 object-cover rounded shadow border border-white/10" 
                    />
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] font-black uppercase text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/30 px-2.5 py-1 rounded shadow">
                        @{offer.ownerName}
                      </span>
                      {renderMiniFriendshipButton(offer.ownerId, offer.ownerName)}
                    </div>
                  </div>
                  
                  {/* Info & CTA */}
                  <div className="w-full">
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black text-white bg-[#030704]/90 border border-white/15 px-1.5 py-0.5 rounded shadow-sm">
                          {offer.code}
                        </span>
                        {offer.quantity > 1 && (
                          <span className="text-[8px] font-mono bg-white/5 text-slate-300 border border-white/5 px-1.5 py-0.5 rounded font-black uppercase">
                            x{offer.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-extrabold text-white text-[11px] mt-2 uppercase tracking-wide leading-none">{offer.country}</h4>
                    <p className="text-[9px] text-slate-400 mt-1">Sticker {offer.code}</p>

                    <button
                      type="button"
                      onClick={() => startProproposal(offer.ownerId, offer.ownerName, offer.code)}
                      className="mt-2.5 w-full py-1.5 bg-[#0d1f13] hover:bg-brand-emerald text-brand-emerald hover:text-[#050a06] border border-brand-emerald/30 hover:border-transparent font-black uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Propose Swap
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PROPOSAL DRAWER / FORM (MODAL EFFECT) */}
      <AnimatePresence>
        {proposingToUser && (
          <div className="fixed inset-0 bg-[#050a06]/85 backdrop-blur-md flex items-center justify-center p-4 z-55 animate-fade-in" id="trade-proposal-drawer">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-panel border border-white/15 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#030704] text-white">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">Propose Sticker Trade</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-semibold">Trading with @{proposingToUser.name}</p>
                </div>
                <button 
                  onClick={() => setProposingToUser(null)}
                  className="text-xs font-bold uppercase tracking-widest text-[#050a06] hover:text-white px-3 py-1.5 bg-brand-emerald rounded-lg transition-all cursor-pointer"
                  disabled={!!successInfo}
                >
                  Close
                </button>
              </div>

              {successInfo ? (
                <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                  <CheckCircle2 className="w-16 h-16 text-brand-emerald animate-bounce" />
                  <p className="text-white font-black text-base uppercase tracking-tight">{successInfo}</p>
                  <p className="text-xs text-slate-400">Redirecting to your trade chatrooms...</p>
                </div>
              ) : (
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
                  
                  {/* STEP 1: CHOOSE MY CARDS TO OFFER */}
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald mb-2">1. Which of your duplicate stickers do you offer to @{proposingToUser.name}?</h4>
                    {myRepeated.length === 0 ? (
                      <div className="p-3 bg-amber-950/40 border border-brand-gold/30 text-brand-gold rounded-xl text-xs flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>You do not have any registered duplicates. You cannot propose a trade until you specify what available stickers you are giving to others first.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                        {myRepeated.map(s => {
                          const isSelected = selectedOffered.includes(s.code);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedOffered(selectedOffered.filter(code => code !== s.code));
                                } else {
                                  setSelectedOffered([...selectedOffered, s.code]);
                                }
                              }}
                              className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                                isSelected 
                                  ? 'border-brand-emerald bg-brand-emerald/15 text-brand-emerald shadow-[0_0_10px_rgba(16,185,129,0.15)] font-black' 
                                  : 'border-white/10 bg-[#0d1f13] text-slate-355 hover:bg-white/5 cursor-pointer'
                              }`}
                            >
                              <div className="font-mono font-black text-white">{s.code}</div>
                              <div className="text-[9px] text-slate-400 uppercase mt-0.5 font-bold tracking-wider">{s.country}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* STEP 2: CHOOSE THEIR CARDS TO ASK FOR */}
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-brand-gold mb-2">2. Which stickers of @{proposingToUser.name} do you want to receive?</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                      {stickers
                        .filter(s => s.ownerId === proposingToUser.id && s.type === 'repetida')
                        .map(s => {
                          const isSelected = selectedRequested.includes(s.code);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedRequested(selectedRequested.filter(code => code !== s.code));
                                } else {
                                  setSelectedRequested([...selectedRequested, s.code]);
                                }
                              }}
                              className={`p-2.5 rounded-lg text-left border text-xs transition-all opacity-85 hover:opacity-100 ${
                                isSelected 
                                  ? 'border-brand-gold bg-brand-gold/15 text-brand-gold shadow-[0_0_10px_rgba(251,191,36,0.15)] font-black' 
                                  : 'border-white/10 bg-[#0d1f13] text-slate-355 hover:bg-white/5 cursor-pointer'
                              }`}
                            >
                              <div className="font-mono font-black text-white">{s.code}</div>
                              <div className="text-[9px] text-slate-400 uppercase mt-0.5 font-bold tracking-wider">{s.country}</div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* SAFETY ASSURANCE BLOCK */}
                  <div className="p-3.5 bg-brand-bg border border-white/5 rounded-xl flex items-start gap-2.5">
                    <ShieldEllipsis className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">Secure Exchange Arrangement</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                        By submitting this proposal, a private negotiation room is enabled where both collectors can safely arrange to swap in public safe-zones.
                      </p>
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <button
                    type="button"
                    onClick={handleSendProposal}
                    disabled={selectedOffered.length === 0 || selectedRequested.length === 0}
                    className="w-full py-3 bg-gradient-to-r from-brand-emerald to-emerald-600 text-[#050a06] rounded-xl text-xs font-black uppercase tracking-wider hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4 cursor-pointer" />
                    Send Trade Proposal
                  </button>

                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
