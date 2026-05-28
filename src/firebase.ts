/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { Sticker, TradeProposal, TradeMessage, UserProfile, getOfficialPlayerName } from './types';

// Detect if real Firebase config is provided
const isRealFirebase = 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes('placeholder') && 
  firebaseConfig.projectId && 
  !firebaseConfig.projectId.includes('placeholder');

let db: any = null;
let auth: any = null;

if (isRealFirebase) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth();
  } catch (error) {
    console.error("Failed to initialize Live Firebase SDK: ", error);
  }
}

export { db, auth, isRealFirebase };

// --- FIRESTORE SECURE ERROR HANDLER (From Firebase Integration Skill) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'anonymous',
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on startup as strictly mandated by Skill
export async function testConnection() {
  if (isRealFirebase && db) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration or network status.");
      }
    }
  }
}

// --- LOCAL STORAGE MULTI-USER SIMULATOR FOR DEV PLAYGROUND ---
// Initialize simulated database in LocalStorage with User 2 and User 3 preloaded with "figus originales"
export function initializeSimulator() {
  const user2: UserProfile = {
    uid: "user_sim_2",
    displayName: "Usuario 2 (Nacho)",
    email: "nacho_figus2@swap2026.com",
    createdAt: new Date().toISOString()
  };

  const user3: UserProfile = {
    uid: "user_sim_3",
    displayName: "Usuario 3 (Santi)",
    email: "santi_figus3@swap2026.com",
    createdAt: new Date().toISOString()
  };

  // 1. Setup users
  let currentUsers: UserProfile[] = JSON.parse(localStorage.getItem('sticker_users') || '[]');
  if (!Array.isArray(currentUsers)) currentUsers = [];
  
  if (!currentUsers.some(u => u.uid === user2.uid)) {
    currentUsers.push(user2);
  }
  if (!currentUsers.some(u => u.uid === user3.uid)) {
    currentUsers.push(user3);
  }
  localStorage.setItem('sticker_users', JSON.stringify(currentUsers));

  // 2. Setup stickers for User 2 (Nacho) & User 3 (Santi)
  let currentStickers: Sticker[] = JSON.parse(localStorage.getItem('sticker_items') || '[]');
  if (!Array.isArray(currentStickers)) currentStickers = [];

  // Nacho duplicates: ARG 10 (Messi), BRA 10 (Neymar), FRA 10 (Mbappé), URU 9 (Suarez)
  // Nacho missing: POR 7 (CR7), COL 10 (James Rodríguez), ESP 20 (Pedri)
  const nachoStickers = [
    { code: "ARG 10", country: "Argentina", type: "repetida" as const, isShiny: true, quantity: 2, playerName: getOfficialPlayerName("ARG 10") },
    { code: "BRA 10", country: "Brasil", type: "repetida" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("BRA 10") },
    { code: "FRA 10", country: "Francia", type: "repetida" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("FRA 10") },
    { code: "URU 9", country: "Uruguay", type: "repetida" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("URU 9") },
    { code: "POR 7", country: "Portugal", type: "faltante" as const, isShiny: true, quantity: 1, playerName: getOfficialPlayerName("POR 7") },
    { code: "COL 10", country: "Colombia", type: "faltante" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("COL 10") },
    { code: "ESP 20", country: "España", type: "faltante" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("ESP 20") }
  ];

  // Santi duplicates: POR 7 (CR7), GER 14 (Musiala), ENG 9 (Kane), ESP 20 (Pedri)
  // Santi missing: ARG 10 (Messi), BRA 10 (Neymar), FRA 10 (Mbappé)
  const santiStickers = [
    { code: "POR 7", country: "Portugal", type: "repetida" as const, isShiny: true, quantity: 1, playerName: getOfficialPlayerName("POR 7") },
    { code: "GER 14", country: "Alemania", type: "repetida" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("GER 14") },
    { code: "ENG 9", country: "Inglaterra", type: "repetida" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("ENG 9") },
    { code: "ESP 20", country: "España", type: "repetida" as const, isShiny: false, quantity: 2, playerName: getOfficialPlayerName("ESP 20") },
    { code: "ARG 10", country: "Argentina", type: "faltante" as const, isShiny: true, quantity: 1, playerName: getOfficialPlayerName("ARG 10") },
    { code: "BRA 10", country: "Brasil", type: "faltante" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("BRA 10") },
    { code: "FRA 10", country: "Francia", type: "faltante" as const, isShiny: false, quantity: 1, playerName: getOfficialPlayerName("FRA 10") }
  ];

  const seedStickersForUser = (userId: string, userName: string, list: typeof nachoStickers) => {
    list.forEach(sticker => {
      const id = `${userId}_${sticker.code}_${sticker.type}`;
      if (!currentStickers.some(s => s.id === id)) {
        currentStickers.push({
          id,
          ownerId: userId,
          ownerName: userName,
          code: sticker.code,
          playerName: sticker.playerName,
          country: sticker.country,
          type: sticker.type,
          isShiny: sticker.isShiny,
          quantity: sticker.quantity,
          updatedAt: new Date().toISOString()
        });
      }
    });
  };

  seedStickersForUser(user2.uid, user2.displayName, nachoStickers);
  seedStickersForUser(user3.uid, user3.displayName, santiStickers);
  localStorage.setItem('sticker_items', JSON.stringify(currentStickers));

  if (!localStorage.getItem('sticker_trades')) {
    localStorage.setItem('sticker_trades', JSON.stringify([]));
  }
  if (!localStorage.getItem('sticker_messages')) {
    localStorage.setItem('sticker_messages', JSON.stringify({}));
  }
}

// SIMULATOR ACTIONS
export function simGetStickers(): Sticker[] {
  initializeSimulator();
  return JSON.parse(localStorage.getItem('sticker_items') || '[]');
}

export function simSaveSticker(sticker: Sticker) {
  initializeSimulator();
  const stickers = simGetStickers();
  const index = stickers.findIndex(s => s.id === sticker.id);
  if (index >= 0) {
    stickers[index] = sticker;
  } else {
    stickers.push(sticker);
  }
  localStorage.setItem('sticker_items', JSON.stringify(stickers));
}

export function simDeleteSticker(id: string) {
  initializeSimulator();
  const stickers = simGetStickers();
  const filtered = stickers.filter(s => s.id !== id);
  localStorage.setItem('sticker_items', JSON.stringify(filtered));
}

export function simGetTrades(): TradeProposal[] {
  initializeSimulator();
  return JSON.parse(localStorage.getItem('sticker_trades') || '[]');
}

export function simSaveTrade(trade: TradeProposal) {
  initializeSimulator();
  const trades = simGetTrades();
  const index = trades.findIndex(t => t.id === trade.id);
  if (index >= 0) {
    trades[index] = trade;
  } else {
    trades.push(trade);
  }
  localStorage.setItem('sticker_trades', JSON.stringify(trades));
}

export function simGetMessages(tradeId: string): TradeMessage[] {
  initializeSimulator();
  const allMessages = JSON.parse(localStorage.getItem('sticker_messages') || '{}');
  return allMessages[tradeId] || [];
}

export function simAddMessage(tradeId: string, message: TradeMessage) {
  initializeSimulator();
  const allMessages = JSON.parse(localStorage.getItem('sticker_messages') || '{}');
  if (!allMessages[tradeId]) {
    allMessages[tradeId] = [];
  }
  allMessages[tradeId].push(message);
  localStorage.setItem('sticker_messages', JSON.stringify(allMessages));
}

export function simGetUsers(): UserProfile[] {
  initializeSimulator();
  return JSON.parse(localStorage.getItem('sticker_users') || '[]');
}

export function simAddUser(user: UserProfile) {
  initializeSimulator();
  const users = simGetUsers();
  if (!users.some(u => u.uid === user.uid)) {
    users.push(user);
    localStorage.setItem('sticker_users', JSON.stringify(users));
  }
}
