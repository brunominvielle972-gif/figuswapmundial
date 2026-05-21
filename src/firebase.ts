/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { Sticker, TradeProposal, TradeMessage, UserProfile } from './types';

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
// Pre-seeded users for trading simulations
const PRE_SEEDED_USERS: UserProfile[] = [];

const PRE_SEEDED_STICKERS: Sticker[] = [];

const PRE_SEEDED_TRADES: TradeProposal[] = [];

const PRE_SEEDED_MESSAGES: Record<string, TradeMessage[]> = {};

// Initialize simulated database in LocalStorage
export function initializeSimulator() {
  if (!localStorage.getItem('sticker_users')) {
    localStorage.setItem('sticker_users', JSON.stringify(PRE_SEEDED_USERS));
  }
  if (!localStorage.getItem('sticker_items')) {
    localStorage.setItem('sticker_items', JSON.stringify(PRE_SEEDED_STICKERS));
  }
  if (!localStorage.getItem('sticker_trades')) {
    localStorage.setItem('sticker_trades', JSON.stringify(PRE_SEEDED_TRADES));
  }
  if (!localStorage.getItem('sticker_messages')) {
    localStorage.setItem('sticker_messages', JSON.stringify(PRE_SEEDED_MESSAGES));
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
