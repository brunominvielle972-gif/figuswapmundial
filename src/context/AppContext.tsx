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
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, signInAnonymously } from 'firebase/auth';

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
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginAnonymously: (name: string) => Promise<{ success: boolean; error?: string; isSimulated?: boolean }>;
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
              setConnectionNotification(`You connected with @${inviterName}! You can now propose trades.`);
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
          setConnectionNotification(`You connected with @${inviterName}! You can now propose trades.`);
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
      // Handle Google Redirect login results on mount (robust for mobile phone browsers/webviews)
      getRedirectResult(auth)
        .then((result) => {
          if (result && result.user) {
            console.log("Logged in via Google redirect:", result.user);
          }
        })
        .catch((err) => {
          console.error("Google Auth Redirect Result error:", err);
        });

      const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
        if (user) {
          let name = user.displayName || user.email?.split('@')[0] || "Usuario";
          if (user.isAnonymous) {
            const savedName = localStorage.getItem('my_saved_anon_display_name');
            if (savedName) {
              name = savedName;
            } else {
              try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists()) {
                  name = (snap.data() as UserProfile).displayName;
                }
              } catch (e) {
                console.warn("Could not fetch anonymous username", e);
              }
            }
          }

          const profile: UserProfile = {
            uid: user.uid,
            displayName: name,
            email: user.email || `${name.toLowerCase().replace(/\s+/g, '')}_anon@figus.com`,
            createdAt: new Date().toISOString()
          };
          setCurrentUser(profile);
          
          // Save real user profile to database (non-blocking, warning only to prevent auth crashes)
          const profileRef = doc(db, 'users', user.uid);
          setDoc(profileRef, profile, { merge: true }).catch(err => {
            console.warn("Silent non-blocking user profile write warning:", err);
          });
        } else {
          // If no Auth user, check if we have a locally saved nickname user!
          if (selectedSimUserId && selectedSimUserId.startsWith('user_')) {
            const list = simGetUsers().filter(u => !isFakeUid(u.uid) && !isFakeUser(u.displayName));
            const matched = list.find(u => u.uid === selectedSimUserId);
            if (matched) {
              setCurrentUser(matched);
            } else {
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
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
    // Determine dynamically if we can safely listen to live Firebase
    const isUsingFirebase = !!(isRealFirebase && db && auth?.currentUser);

    if (isUsingFirebase) {
      console.log("Firebase is active & user is authenticated. Subscribing to database.");
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
      }, (err) => {
        console.warn("Firestore collection stickers silent check or failed: ", err.message);
      });

      const unsubTrades = onSnapshot(collection(db, 'trades'), (snapshot) => {
        const list: TradeProposal[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as TradeProposal;
          if (!isFakeUid(d.proposerId) && !isFakeUid(d.receiverId)) {
            list.push({ id: doc.id, ...d } as TradeProposal);
          }
        });
        setTrades(list);
      }, (err) => {
        console.warn("Firestore collection trades silent check or failed: ", err.message);
      });

      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as UserProfile;
          if (!isFakeUid(d.uid) && !isFakeUser(d.displayName)) {
            list.push(d);
          }
        });
        setUsers(list);
      }, (err) => {
        console.warn("Firestore collection users silent check or failed: ", err.message);
      });

      const unsubFriendRequests = onSnapshot(collection(db, 'friendRequests'), (snapshot) => {
        const list: FriendRequest[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as FriendRequest;
          if (!isFakeUid(d.senderId) && !isFakeUid(d.receiverId)) {
            list.push({ id: doc.id, ...d } as FriendRequest);
          }
        });
        setFriendRequests(list);
      }, (err) => {
        console.warn("Firestore collection friendRequests silent check or failed: ", err.message);
      });

      return () => {
        unsubStickers();
        unsubTrades();
        unsubUsers();
        unsubFriendRequests();
      };
    } else {
      console.log("No authenticated live user. Using local simulation backend.");
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
  }, [currentUser]); // Re-subscribe if login status/currentUser changes

  // 3. Realtime Messages Listener for Active Conversation
  useEffect(() => {
    if (!activeTradeId) {
      setCurrentTradeMessages([]);
      return;
    }

    const isUsingFirebase = !!(isRealFirebase && db && auth?.currentUser);

    if (isUsingFirebase) {
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
      }, (err) => {
        console.warn(`Firestore messages failed to load for trade ${activeTradeId}: `, err.message);
      });
      
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
  }, [activeTradeId, currentUser]);

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
    simAddUser(newUser);
    localStorage.setItem('my_saved_sim_user_id', newUser.uid);
    setSelectedSimUserId(newUser.uid);
    setCurrentUser(newUser);
  };

  const loginWithGoogle = async () => {
    if (isRealFirebase && auth) {
      const provider = new GoogleAuthProvider();
      
      // Check if user is on a mobile device or inside a webview to choose the best sign-in flow
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log("Mobile or webview detected. Using signInWithRedirect for Google Auth...");
        try {
          await signInWithRedirect(auth, provider);
          return { success: true };
        } catch (err: any) {
          console.error("signInWithRedirect failed:", err);
          return { success: false, error: err.message || String(err) };
        }
      } else {
        console.log("Desktop device detected. Attempting signInWithPopup...");
        try {
          await signInWithPopup(auth, provider);
          return { success: true };
        } catch (err: any) {
          console.warn("signInWithPopup failed (possibly blocked), trying redirect:", err);
          try {
            await signInWithRedirect(auth, provider);
            return { success: true };
          } catch (rErr: any) {
            console.error("signInWithRedirect fallback failed:", rErr);
            return { success: false, error: rErr.message || String(rErr) };
          }
        }
      }
    }
    return { success: false, error: "Firebase no está inicializado o configurado." };
  };

  const loginAnonymously = async (name: string) => {
    if (isRealFirebase && auth) {
      try {
        console.log("Logging in anonymously for Android WebView / rapid access...");
        localStorage.setItem('my_saved_anon_display_name', name);
        
        // Define an async task with timeout to prevent hangs on cellular networks/WebViews
        const runAnonAuth = async () => {
          const cred = await signInAnonymously(auth);
          if (cred.user) {
            const profile: UserProfile = {
              uid: cred.user.uid,
              displayName: name,
              email: `${name.toLowerCase().replace(/\s+/g, '')}_anon@figus.com`,
              createdAt: new Date().toISOString()
            };
            setCurrentUser(profile);
            
            // Set doc asynchronously, without blocking access
            const profileRef = doc(db, 'users', cred.user.uid);
            setDoc(profileRef, profile, { merge: true }).catch(err => {
              console.warn("Silent profile save warning:", err);
            });
            
            setSelectedSimUserId(cred.user.uid);
            localStorage.setItem('my_saved_sim_user_id', cred.user.uid);
            return { success: true };
          }
          throw new Error("No credential returned by Firebase.");
        };

        const timeoutPromise = new Promise<{ success: boolean; isSimulated?: boolean; error?: string }>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout de conexión con Firebase Auth")), 2500)
        );

        return await Promise.race([runAnonAuth(), timeoutPromise]);
      } catch (err: any) {
        console.error("signInAnonymously failed or timed out, falling back to local simulation:", err);
        // Fallback immediately to local profile for a 100% reliable login experience
        createNewProfile(name, `${name.toLowerCase().replace(/\s+/g, '')}_local@figus.com`);
        return { success: true, isSimulated: true, error: err.message || String(err) };
      }
    } else {
      createNewProfile(name, `${name.toLowerCase().replace(/\s+/g, '')}_local@figus.com`);
      return { success: true, isSimulated: true };
    }
  };

  const logout = async () => {
    if (isRealFirebase && auth) {
      try {
        await signOut(auth);
      } catch (err: any) {
        console.error("Logout failed:", err);
      }
    }
    // Fully clear active simulated/local sessions
    setSelectedSimUserId("");
    setCurrentUser(null);
    localStorage.removeItem('my_saved_sim_user_id');
    localStorage.removeItem('my_saved_anon_display_name');
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
      return { success: false, error: "Please sign in to connect with friends." };
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
      return { success: false, error: "The entered code or link is empty." };
    }

    if (targetUid === currentUser.uid) {
      return { success: false, error: "You cannot connect with yourself! Share this code with a friend." };
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
         displayName: fUser?.displayName || "Your Friend", 
         error: "You are already connected." 
      };
    }

    let targetName = "Collector";
    if (isRealFirebase && db) {
      try {
        const uSnap = await getDoc(doc(db, 'users', targetUid));
        if (uSnap.exists()) {
          const uData = uSnap.data() as UserProfile;
          targetName = uData.displayName;
        } else {
          return { success: false, error: "No collector snapshot was found for that code. Please verify they are logged in." };
        }
      } catch (err) {
        console.error("Error retrieving user profile:", err);
        return { success: false, error: "Network error querying code. Check your connection." };
      }
    } else {
      const localUser = users.find(u => u.uid === targetUid);
      if (localUser) {
        targetName = localUser.displayName;
      } else {
        targetName = "Friend_" + targetUid.substring(0, 4).toUpperCase();
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
        setConnectionNotification(`You connected with @${targetName}! You can now propose trades.`);
        return { success: true, displayName: targetName };
      } catch (err) {
        console.error("Error connecting users:", err);
        return { success: false, error: "Error registering connection." };
      }
    } else {
      const existing = JSON.parse(localStorage.getItem('sticker_friend_requests') || '[]');
      existing.push(newRequest);
      localStorage.setItem('sticker_friend_requests', JSON.stringify(existing));
      setFriendRequests(existing);
      setConnectionNotification(`You connected with @${targetName}! You can now propose trades.`);
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
      loginAnonymously,
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
