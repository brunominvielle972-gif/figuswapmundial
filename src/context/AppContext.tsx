/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Sticker, 
  TradeProposal, 
  TradeMessage,
  FriendRequest
} from '../types';
import { 
  isRealFirebase, 
  auth, 
  db, 
  simGetStickers, 
  simSaveSticker, 
  simDeleteSticker, 
  simGetTrades, 
  simSaveTrade, 
  simGetMessages, 
  simAddMessage, 
  simGetUsers, 
  simAddUser,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  doc, 
  addDoc, 
  query, 
  where,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

interface AppContextType {
  currentUser: UserProfile | null;
  selectedSimUserId: string;
  users: UserProfile[];
  stickers: Sticker[];
  trades: TradeProposal[];
  currentTradeMessages: TradeMessage[];
  activeTradeId: string | null;
  isFirebaseActive: boolean;
  friendRequests: FriendRequest[];
  connectionNotification: string | null;
  clearConnectionNotification: () => void;
  switchSimUser: (userId: string) => void;
  createNewProfile: (name: string, email: string) => void;
  addSticker: (sticker: Omit<Sticker, 'id' | 'ownerId' | 'ownerName' | 'updatedAt'>) => void;
  removeSticker: (stickerId: string) => void;
  proposeTrade: (receiverId: string, receiverName: string, offeredIds: string[], requestedIds: string[]) => string;
  respondToTrade: (tradeId: string, response: 'accepted' | 'rejected' | 'completed' | 'cancelled') => void;
  sendChatMessage: (tradeId: string, text: string) => void;
  setActiveTradeId: (id: string | null) => void;
  sendFriendRequest: (receiverId: string) => void;
  respondToFriendRequest: (requestId: string, status: 'accepted' | 'declined') => void;
  removeFriend: (friendId: string) => void;
  connectUserByCode: (code: string) => Promise<{ success: boolean; displayName?: string; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const isFakeUser = (name: string) => {
  const normalized = (name || '').toLowerCase();
  return (
    normalized.includes('messi') || 
    normalized.includes('pele') || 
    normalized.includes('pelé') || 
    normalized.includes('mbappe') || 
    normalized.includes('mbappé') || 
    normalized.includes('griezmann') || 
    normalized.includes('neymar') || 
    normalized.includes('scaloni')
  );
};

const isFakeUid = (uid: string) => {
  const normalized = (uid || '').toLowerCase();
  return (
    normalized.includes('messi') || 
    normalized.includes('pele') || 
    normalized.includes('mbappe') || 
    normalized.includes('griezmann') || 
    normalized.includes('scaloni')
  );
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Current logged in simulated user or real Firebase user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedSimUserId, setSelectedSimUserId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('my_saved_sim_user_id') || "";
    }
    return "";
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [trades, setTrades] = useState<TradeProposal[]>([]);
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
  const [currentTradeMessages, setCurrentTradeMessages] = useState<TradeMessage[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [connectionNotification, setConnectionNotification] = useState<string | null>(null);

  const clearConnectionNotification = () => setConnectionNotification(null);

  // Check for invite parameter in URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const inviteUid = urlParams.get('invite');
    if (inviteUid) {
      console.log("Detected invite query parameter from UID:", inviteUid);
      localStorage.setItem('pending_invite_by', inviteUid);
      
      // Clean query parameter from address bar
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, []);

  // Process any pending invites when currentUser and users are loaded, or query FireStore
  useEffect(() => {
    if (!currentUser) return;
    
    const pendingInviterUid = localStorage.getItem('pending_invite_by');
    if (!pendingInviterUid) return;

    // A user cannot invite themselves
    if (pendingInviterUid === currentUser.uid) {
      localStorage.removeItem('pending_invite_by');
      return;
    }

    // Check if the connection exists already
    const checkAndConnect = (inviterName: string) => {
      const connectionExists = friendRequests.some(r => 
        (r.senderId === currentUser.uid && r.receiverId === pendingInviterUid) ||
        (r.senderId === pendingInviterUid && r.receiverId === currentUser.uid)
      );

      if (!connectionExists) {
        const newRequest: FriendRequest = {
          id: "req_auto_" + Math.random().toString(36).substr(2, 9),
          senderId: pendingInviterUid,
          senderName: inviterName,
          receiverId: currentUser.uid,
          receiverName: currentUser.displayName,
          status: 'accepted', // Auto-accepted so they are connected!
          createdAt: new Date().toISOString()
        };

        if (isRealFirebase && db) {
          setDoc(doc(db, 'friendRequests', newRequest.id), newRequest)
            .then(() => {
              setConnectionNotification(`¡Te conectaste con @${inviterName}! Ya pueden proponer canjes.`);
              localStorage.removeItem('pending_invite_by');
            })
            .catch(err => {
              console.error("Error setting friend request:", err);
            });
        } else {
          const existing = JSON.parse(localStorage.getItem('sticker_friend_requests') || '[]');
          existing.push(newRequest);
          localStorage.setItem('sticker_friend_requests', JSON.stringify(existing));
          setFriendRequests(existing);
          setConnectionNotification(`¡Te conectaste con @${inviterName}! Ya pueden proponer canjes.`);
          localStorage.removeItem('pending_invite_by');
        }
      } else {
        localStorage.removeItem('pending_invite_by');
      }
    };

    // Find the inviter
    const localInviter = users.find(u => u.uid === pendingInviterUid);
    if (localInviter) {
      checkAndConnect(localInviter.displayName);
    } else if (isRealFirebase && db) {
      // Direct Firebase lookup for robust connection
      getDoc(doc(db, 'users', pendingInviterUid))
        .then(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            checkAndConnect(data.displayName);
          } else {
            console.warn("Inviter profile not found in DB");
            localStorage.removeItem('pending_invite_by');
          }
        })
        .catch(err => {
          console.error("Error fetching inviter profile:", err);
          localStorage.removeItem('pending_invite_by');
        });
    } else {
      // In simulation mode, if not found, we can just pre-seed the user name as "Amigo Invitador"
      checkAndConnect("Amigo Invitador");
    }
  }, [currentUser, users, friendRequests]);

  // Startup cleanup to ensure legacy storage has no old simulator accounts
  useEffect(() => {
    try {
      const mockUids = ["user_messi_fan", "user_pele_fan", "user_mbappe_fan", "user_griezmann", "user_scaloni"];
      const storedUsers = localStorage.getItem('sticker_users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(u => u && !mockUids.includes(u.uid) && !isFakeUser(u.displayName));
          localStorage.setItem('sticker_users', JSON.stringify(filtered));
        }
      }
      localStorage.setItem('sticker_friend_requests', JSON.stringify([]));
    } catch (e) {
      console.warn("Could not prune legacy mock users", e);
    }
  }, []);

  // 1. Establish User Auth Strategy
  useEffect(() => {
    if (isRealFirebase && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user: any) => {
        if (user) {
          const profile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || "Usuario",
            email: user.email || "",
            createdAt: new Date().toISOString()
          };
          setCurrentUser(profile);
          
          // Save real user profile to database
          const profileRef = doc(db, 'users', user.uid);
          setDoc(profileRef, profile, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          });
        } else {
          setCurrentUser(null);
        }
      });
      return () => unsubscribe();
    } else {
      // In simulator mode, automatically bind the selected simulation user
      const list = simGetUsers().filter(u => !isFakeUid(u.uid) && !isFakeUser(u.displayName));
      setUsers(list);
      const matched = list.find(u => u.uid === selectedSimUserId);
      if (matched) {
        setCurrentUser(matched);
      }
    }
  }, [selectedSimUserId]);

  // 2. Fetch Stickers, Trades, Users, and Friend Requests in Realtime
  useEffect(() => {
    if (isRealFirebase && db) {
      // Real Firebase data listeners
      const unsubStickers = onSnapshot(collection(db, 'stickers'), (snapshot) => {
        const list: Sticker[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as Sticker;
          if (!isFakeUid(d.ownerId) && !isFakeUser(d.ownerName)) {
            list.push({ id: doc.id, ...d } as Sticker);
          }
        });
        setStickers(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'stickers'));

      const unsubTrades = onSnapshot(collection(db, 'trades'), (snapshot) => {
        const list: TradeProposal[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as TradeProposal;
          if (!isFakeUid(d.proposerId) && !isFakeUid(d.receiverId)) {
            list.push({ id: doc.id, ...d } as TradeProposal);
          }
        });
        setTrades(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'trades'));

      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as UserProfile;
          if (!isFakeUid(d.uid) && !isFakeUser(d.displayName)) {
            list.push(d);
          }
        });
        setUsers(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

      const unsubFriendRequests = onSnapshot(collection(db, 'friendRequests'), (snapshot) => {
        const list: FriendRequest[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as FriendRequest;
          if (!isFakeUid(d.senderId) && !isFakeUid(d.receiverId)) {
            list.push({ id: doc.id, ...d } as FriendRequest);
          }
        });
        setFriendRequests(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'friendRequests'));

      return () => {
        unsubStickers();
        unsubTrades();
        unsubUsers();
        unsubFriendRequests();
      };
    } else {
      // Pull simulation data every second or when triggers change
      const syncSim = () => {
        setStickers(simGetStickers().filter(s => !isFakeUid(s.ownerId) && !isFakeUser(s.ownerName)));
        setTrades(simGetTrades().filter(t => !isFakeUid(t.proposerId) && !isFakeUid(t.receiverId)));
        setUsers(simGetUsers().filter(u => !isFakeUid(u.uid) && !isFakeUser(u.displayName)));

        const existingRequests = JSON.parse(localStorage.getItem('sticker_friend_requests') || '[]');
        setFriendRequests(existingRequests);
      };
      
      syncSim();
      const interval = setInterval(syncSim, 1500);
      return () => clearInterval(interval);
    }
  }, []);

  // 3. Realtime Messages Listener for Active Conversation
  useEffect(() => {
    if (!activeTradeId) {
      setCurrentTradeMessages([]);
      return;
    }

    if (isRealFirebase && db) {
      const q = query(
        collection(db, `trades/${activeTradeId}/messages`),
        where('createdAt', '!=', '')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: TradeMessage[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as TradeMessage);
        });
        // Sort message array stream securely by timestamp
        list.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setCurrentTradeMessages(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `trades/${activeTradeId}/messages`));
      
      return () => unsubscribe();
    } else {
      // Simulated message updates
      const syncMessages = () => {
        setCurrentTradeMessages(simGetMessages(activeTradeId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      };
      syncMessages();
      const interval = setInterval(syncMessages, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTradeId]);

  // --- ACTIONS ---

  // Switch between simulation users for testing
  const switchSimUser = (userId: string) => {
    setSelectedSimUserId(userId);
    localStorage.setItem('my_saved_sim_user_id', userId);
  };

  // Register a custom test user profile or fast profile
  const createNewProfile = (name: string, email: string) => {
    const newUser: UserProfile = {
      uid: "user_" + Math.random().toString(36).substr(2, 9),
      displayName: name,
      email: email,
      createdAt: new Date().toISOString()
    };
    if (isRealFirebase && db) {
      // Create user if live and save locally to state
      setDoc(doc(db, 'users', newUser.uid), newUser)
        .then(() => {
          localStorage.setItem('my_saved_sim_user_id', newUser.uid);
          setSelectedSimUserId(newUser.uid);
          setCurrentUser(newUser);
        })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${newUser.uid}`));
    } else {
      simAddUser(newUser);
      localStorage.setItem('my_saved_sim_user_id', newUser.uid);
      setSelectedSimUserId(newUser.uid);
    }
  };

  const loginWithGoogle = async () => {
    if (isRealFirebase && auth) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (err: any) {
        console.error("Google Authentication failed:", err);
        handleFirestoreError(err, OperationType.WRITE, "auth/google-login");
      }
    }
  };

  const logout = async () => {
    if (isRealFirebase && auth) {
      try {
        await signOut(auth);
      } catch (err: any) {
        console.error("Logout failed:", err);
      }
    } else {
      setSelectedSimUserId("");
      setCurrentUser(null);
      localStorage.removeItem('my_saved_sim_user_id');
    }
  };

  // Add a sticker to current user's inventory
  const addSticker = (stickerData: Omit<Sticker, 'id' | 'ownerId' | 'ownerName' | 'updatedAt'>) => {
    if (!currentUser) return;
    const stickerId = `${currentUser.uid}_${stickerData.code}_${stickerData.type}`;
    const newSticker: Sticker = {
      ...stickerData,
      id: stickerId,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName,
      updatedAt: new Date().toISOString()
    };

    if (isRealFirebase && db) {
      setDoc(doc(db, 'stickers', stickerId), newSticker)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `stickers/${stickerId}`));
    } else {
      simSaveSticker(newSticker);
    }
  };

  // Remove a sticker from the inventory
  const removeSticker = (stickerId: string) => {
    if (isRealFirebase && db) {
      deleteDoc(doc(db, 'stickers', stickerId))
        .catch(err => handleFirestoreError(err, OperationType.DELETE, `stickers/${stickerId}`));
    } else {
      simDeleteSticker(stickerId);
    }
  };

  // Formulate and submit a trade proposal
  const proposeTrade = (receiverId: string, receiverName: string, offeredIds: string[], requestedIds: string[]): string => {
    if (!currentUser) return "";
    const tradeId = "trade_" + Math.random().toString(36).substr(2, 9);
    const newTrade: TradeProposal = {
      id: tradeId,
      proposerId: currentUser.uid,
      proposerName: currentUser.displayName,
      receiverId: receiverId,
      receiverName: receiverName,
      offeredStickers: offeredIds,
      requestedStickers: requestedIds,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isRealFirebase && db) {
      setDoc(doc(db, 'trades', tradeId), newTrade)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `trades/${tradeId}`));
    } else {
      simSaveTrade(newTrade);
    }
    return tradeId;
  };

  // Accept, reject, complete or cancel a trade
  const respondToTrade = (tradeId: string, response: 'accepted' | 'rejected' | 'completed' | 'cancelled') => {
    if (!currentUser) return;

    if (isRealFirebase && db) {
      const tradeRef = doc(db, 'trades', tradeId);
      updateDoc(tradeRef, {
        status: response,
        updatedAt: new Date().toISOString()
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `trades/${tradeId}`));
    } else {
      const matched = trades.find(t => t.id === tradeId);
      if (matched) {
        const updated = {
          ...matched,
          status: response,
          updatedAt: new Date().toISOString()
        };
        simSaveTrade(updated);
      }
    }
  };

  // Send a custom safety message in a trade discussion room
  const sendChatMessage = (tradeId: string, text: string) => {
    if (!currentUser || !text.trim()) return;

    const msgId = "msg_" + Math.random().toString(36).substr(2, 9);
    const message: TradeMessage = {
      id: msgId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    if (isRealFirebase && db) {
      addDoc(collection(db, `trades/${tradeId}/messages`), message)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `trades/${tradeId}/messages/${msgId}`));
    } else {
      simAddMessage(tradeId, message);
    }
  };

  const sendFriendRequest = (receiverId: string) => {
    if (!currentUser) return;
    const receiver = users.find(u => u.uid === receiverId);
    if (!receiver) return;

    // Check if there is already a request
    const existing = JSON.parse(localStorage.getItem('sticker_friend_requests') || '[]');
    const hasRequest = existing.some((r: FriendRequest) => 
      (r.senderId === currentUser.uid && r.receiverId === receiverId) ||
      (r.senderId === receiverId && r.receiverId === currentUser.uid)
    );
    if (hasRequest) return;

    const newRequest: FriendRequest = {
      id: "req_" + Math.random().toString(36).substr(2, 9),
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      receiverId: receiverId,
      receiverName: receiver.displayName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (isRealFirebase && db) {
      setDoc(doc(db, 'friendRequests', newRequest.id), newRequest).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `friendRequests/${newRequest.id}`);
      });
    } else {
      existing.push(newRequest);
      localStorage.setItem('sticker_friend_requests', JSON.stringify(existing));
      setFriendRequests(existing);
    }
  };

  const respondToFriendRequest = (requestId: string, status: 'accepted' | 'declined') => {
    if (isRealFirebase && db) {
      updateDoc(doc(db, 'friendRequests', requestId), { status }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `friendRequests/${requestId}`);
      });
    } else {
      const existing = JSON.parse(localStorage.getItem('sticker_friend_requests') || '[]');
      const matched = existing.find((r: FriendRequest) => r.id === requestId);
      if (matched) {
        matched.status = status;
        localStorage.setItem('sticker_friend_requests', JSON.stringify(existing));
        setFriendRequests(existing);
      }
    }
  };

  const removeFriend = (friendId: string) => {
    if (!currentUser) return;
    if (isRealFirebase && db) {
      // In live mode, we would delete / update friendship documents
      // For this implementation, we can clean up both ways
    } else {
      const existing = JSON.parse(localStorage.getItem('sticker_friend_requests') || '[]');
      const filtered = existing.filter((r: FriendRequest) => 
        !((r.senderId === currentUser.uid && r.receiverId === friendId && r.status === 'accepted') ||
          (r.senderId === friendId && r.receiverId === currentUser.uid && r.status === 'accepted'))
      );
      localStorage.setItem('sticker_friend_requests', JSON.stringify(filtered));
      setFriendRequests(filtered);
    }
  };

  const connectUserByCode = async (code: string): Promise<{ success: boolean; displayName?: string; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: "Iniciá sesión para conectarte con amigos, crack." };
    }

    let targetUid = code.trim();
    if (targetUid.includes("invite=")) {
      try {
        const url = new URL(targetUid);
        const inviteParam = url.searchParams.get("invite");
        if (inviteParam) {
          targetUid = inviteParam;
        }
      } catch (e) {
        const match = targetUid.match(/[?&]invite=([^&]+)/);
        if (match) {
          targetUid = match[1];
        }
      }
    }

    targetUid = targetUid.trim();

    if (!targetUid) {
      return { success: false, error: "El código o link ingresado está vacío, ídolo." };
    }

    if (targetUid === currentUser.uid) {
      return { success: false, error: "¡No podés conectarte con vos mismo, crack! Pasale este código a un amigo." };
    }

    const connectionExists = friendRequests.some(r => 
      ((r.senderId === currentUser.uid && r.receiverId === targetUid) ||
       (r.senderId === targetUid && r.receiverId === currentUser.uid)) &&
       r.status === 'accepted'
    );

    if (connectionExists) {
      const fUser = users.find(u => u.uid === targetUid);
      return { 
        success: true, 
        displayName: fUser?.displayName || "Tu amigo", 
        error: "Ya están conectados. ¡Buscalos en Mensajes o en el Círculo de Canjes!" 
      };
    }

    let targetName = "Coleccionista";
    if (isRealFirebase && db) {
      try {
        const uSnap = await getDoc(doc(db, 'users', targetUid));
        if (uSnap.exists()) {
          const uData = uSnap.data() as UserProfile;
          targetName = uData.displayName;
        } else {
          return { success: false, error: "No se encontró ningún coleccionista para ese código en el servidor. Que tu amigo verifique si inició sesión." };
        }
      } catch (err) {
        console.error("Error retrieving user profile:", err);
        return { success: false, error: "Error de red al consultar el código. Comprobá tu conexión de internet." };
      }
    } else {
      const localUser = users.find(u => u.uid === targetUid);
      if (localUser) {
        targetName = localUser.displayName;
      } else {
        targetName = "Amigo_" + targetUid.substring(0, 4).toUpperCase();
        const mockProfile: UserProfile = {
          uid: targetUid,
          displayName: targetName,
          email: `${targetName.toLowerCase()}@figus.com`,
          createdAt: new Date().toISOString()
        };
        simAddUser(mockProfile);
      }
    }

    const newRequest: FriendRequest = {
      id: "req_manual_" + Math.random().toString(36).substr(2, 9),
      senderId: targetUid,
      senderName: targetName,
      receiverId: currentUser.uid,
      receiverName: currentUser.displayName,
      status: 'accepted',
      createdAt: new Date().toISOString()
    };

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'friendRequests', newRequest.id), newRequest);
        setConnectionNotification(`¡Te conectaste con @${targetName}! Ya pueden proponer canjes.`);
        return { success: true, displayName: targetName };
      } catch (err) {
        console.error("Error connecting users:", err);
        return { success: false, error: "Error al registrar la amistad en la nube." };
      }
    } else {
      const existing = JSON.parse(localStorage.getItem('sticker_friend_requests') || '[]');
      existing.push(newRequest);
      localStorage.setItem('sticker_friend_requests', JSON.stringify(existing));
      setFriendRequests(existing);
      setConnectionNotification(`¡Te conectaste con @${targetName}! Ya pueden proponer canjes.`);
      return { success: true, displayName: targetName };
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      selectedSimUserId,
      users,
      stickers,
      trades,
      currentTradeMessages,
      activeTradeId,
      isFirebaseActive: isRealFirebase,
      friendRequests,
      connectionNotification,
      clearConnectionNotification,
      switchSimUser,
      createNewProfile,
      addSticker,
      removeSticker,
      proposeTrade,
      respondToTrade,
      sendChatMessage,
      setActiveTradeId,
      sendFriendRequest,
      respondToFriendRequest,
      removeFriend,
      connectUserByCode,
      loginWithGoogle,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
}
