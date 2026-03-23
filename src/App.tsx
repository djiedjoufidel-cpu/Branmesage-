import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MoreVertical, 
  MessageSquare, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  Mic, 
  Send, 
  Check, 
  CheckCheck,
  ArrowLeft,
  User,
  Settings,
  LogOut,
  CreditCard,
  X,
  Plus,
  Flag,
  Award,
  Camera,
  Volume2,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  VideoOff,
  CircleDashed,
  History,
  UserPlus,
  SmilePlus,
  Forward,
  Users,
  Moon,
  Sun,
  ShieldAlert,
  Ban,
  Reply,
  Bell,
  Globe,
  Loader2,
  Lock,
  Key,
  Shield,
  Database,
  HelpCircle,
  Palette,
  Bot,
  Image as ImageIcon,
  QrCode,
  Scan,
  RefreshCcw,
  Filter,
  Clock,
  MessageCircle,
  Type as TypeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { COLORS, SUBSCRIPTION_PRICE_CFA, PREDEFINED_THEMES, CHANGELOG } from './constants';
import { Chat, Message, UserProfile, Page, UserStatus, Story, Contact, CallRecord, ThemeSettings, ChangelogEntry } from './types';
import { BASE_TRANSLATIONS, LANGUAGES, TranslationKey } from './translations';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  getDocFromServer,
  getDocs,
  limit
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { db, auth, messaging } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mock "Phone Address Book"
const PHONE_ADDRESS_BOOK = [
  { name: 'Alice', phoneNumber: '677000001' },
  { name: 'Bob', phoneNumber: '677000002' },
  { name: 'Charlie', phoneNumber: '677000003' },
  { name: 'David', phoneNumber: '677000004' },
  { name: 'Emma', phoneNumber: '677000005' },
  { name: 'Frank', phoneNumber: '677000006' }, // Not an app user
  { name: 'Grace', phoneNumber: '677000007' }, // Not an app user
];

const EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🙏', '🔥'];

const ChatListItem = ({ chat, activeChatId, onClick, userProfile, messages }: any) => {
  const [other, setOther] = useState<UserProfile | null>(null);
  const otherId = chat.participants.find(p => p !== userProfile.uid);

  useEffect(() => {
    if (!chat.isGroup && otherId) {
      const fetchOther = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'users', otherId));
          if (docSnap.exists()) {
            setOther(docSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching other participant:", error);
        }
      };
      fetchOther();
    }
  }, [chat.id, otherId]);

  const chatName = chat.isGroup ? chat.name : other?.displayName || "Chargement...";
  const chatAvatar = chat.isGroup ? chat.avatar : other?.photoURL || `https://picsum.photos/seed/${otherId}/200`;
  const lastMsg = messages[chat.id]?.[messages[chat.id].length - 1];

  return (
    <div 
      onClick={onClick}
      className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors border-b border-[#f0f2f5] ${activeChatId === chat.id ? 'bg-[#f0f2f5]' : ''}`}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
        <img src={chatAvatar} alt={chatName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-medium truncate">{chatName}</h3>
          <span className="text-xs text-[#667781]">
            {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#667781] truncate pr-2">
            {lastMsg?.text || 'Aucun message'}
          </p>
          {chat.unreadCount?.[userProfile.uid] ? (
            <span className="bg-[#25d366] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {chat.unreadCount[userProfile.uid]}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'calls'>('chats');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [translations, setTranslations] = useState(BASE_TRANSLATIONS);
  const [isTranslating, setIsTranslating] = useState(false);
  const [customTheme, setCustomTheme] = useState<ThemeSettings>({
    id: 'custom',
    name: 'Mon Thème',
    primaryColor: '#25D366',
    secondaryColor: '#075E54',
    accentColor: '#DCF8C6',
    backgroundColor: '#ECE5DD',
    textColor: '#111b21',
    isCustom: true
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const otherParticipantId = activeChat?.participants.find(p => p !== userProfile?.uid);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [inputText, setInputText] = useState('');
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'main' | 'account' | 'privacy' | 'chats' | 'notifications' | 'storage' | 'help' | 'theme' | 'points'>('main');
  const [showPages, setShowPages] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeCall, setActiveCall] = useState<{ 
    type: 'audio' | 'video', 
    contact?: any, 
    isGroup?: boolean, 
    groupName?: string, 
    participants?: any[] 
  } | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPWAInstructions, setShowPWAInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showMyQRCode, setShowMyQRCode] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'orange' | 'mtn'>('card');
  const [isOffline, setIsOffline] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newPageName, setNewPageName] = useState('');
  const [newPageDesc, setNewPageDesc] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [syncedContacts, setSyncedContacts] = useState<Contact[]>([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [blockedContactIds, setBlockedContactIds] = useState<string[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewBroadcast, setShowNewBroadcast] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [pendingSubscriptions, setPendingSubscriptions] = useState<{id: string, userId: string, name: string, amount: number}[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showBranIA, setShowBranIA] = useState(false);
  const [branIAMessages, setBranIAMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    {role: 'model', text: 'Bonjour ! Je suis branIA, votre assistant intelligent. Comment puis-je vous aider aujourd\'hui ?'}
  ]);
  const [branIAInput, setBranIAInput] = useState('');
  const [isBranIATyping, setIsBranIATyping] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showChangelog, setShowChangelog] = useState(false);
  const [chatSortOrder, setChatSortOrder] = useState<'date' | 'unread' | 'name'>('date');
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [newStatusCaption, setNewStatusCaption] = useState('');
  const [newStatusImage, setNewStatusImage] = useState('');
  const branIAMessagesEndRef = useRef<HTMLDivElement>(null);

  const sortedChats = [...chats].sort((a, b) => {
    if (chatSortOrder === 'unread') {
      const unreadA = a.unreadCount?.[userProfile?.uid!] || 0;
      const unreadB = b.unreadCount?.[userProfile?.uid!] || 0;
      return unreadB - unreadA;
    }
    if (chatSortOrder === 'name') {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    }
    // Default: date
    const timeA = a.lastMessageTimestamp?.toMillis?.() || 0;
    const timeB = b.lastMessageTimestamp?.toMillis?.() || 0;
    return timeB - timeA;
  });

  const handleAddStatus = async () => {
    if (!userProfile || !newStatusImage) return;

    try {
      await addDoc(collection(db, 'status'), {
        userId: userProfile.uid,
        userName: userProfile.displayName,
        userAvatar: userProfile.photoURL,
        imageUrl: newStatusImage,
        caption: newStatusCaption,
        timestamp: serverTimestamp(),
        viewers: []
      });
      setShowAddStatus(false);
      setNewStatusCaption('');
      setNewStatusImage('');
      alert("Statut ajouté !");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'status');
    }
  };

  const scrollToBranIABottom = () => {
    branIAMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBranIABottom();
  }, [branIAMessages]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [chatParticipants, setChatParticipants] = useState<{ [uid: string]: UserProfile }>({});
  
  const otherParticipant = otherParticipantId ? chatParticipants[otherParticipantId] : null;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatId]);

  useEffect(() => {
    if (userProfile?.themeSettings) {
      const { primaryColor, secondaryColor, accentColor, backgroundColor, textColor } = userProfile.themeSettings;
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
      document.documentElement.style.setProperty('--accent-color', accentColor);
      document.documentElement.style.setProperty('--background-color', backgroundColor);
      document.documentElement.style.setProperty('--text-color', textColor);
    } else {
      // Default WhatsApp colors
      document.documentElement.style.setProperty('--primary-color', '#25D366');
      document.documentElement.style.setProperty('--secondary-color', '#075E54');
      document.documentElement.style.setProperty('--accent-color', '#DCF8C6');
      document.documentElement.style.setProperty('--background-color', isDarkMode ? '#111b21' : '#ECE5DD');
      document.documentElement.style.setProperty('--text-color', isDarkMode ? '#e9edef' : '#111b21');
    }
  }, [userProfile?.themeSettings, isDarkMode]);

  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        // In a real app, we'd use a toast component
        if (payload.notification) {
          const { title, body } = payload.notification;
          // Only show if not in the active chat
          alert(`branmesage: ${title}\n${body}`);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!isStandaloneMode);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowPWAInstructions(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPWAInstructions(false);
      setShowInstallBanner(false);
    }
  };

  useEffect(() => {
    if (showQRScanner) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(async (decodedText) => {
        // Assume the QR code contains the user's UID
        try {
          const targetUid = decodedText;
          if (targetUid === userProfile?.uid) {
            alert("C'est votre propre code QR !");
            scanner.clear();
            setShowQRScanner(false);
            return;
          }

          // Check if user exists
          const userDoc = await getDoc(doc(db, 'users', targetUid));
          if (userDoc.exists()) {
            const targetUser = userDoc.data() as UserProfile;
            
            // Check if chat already exists
            const existingChat = chats.find(c => 
              c.type === 'direct' && c.participants.includes(targetUid)
            );

            if (existingChat) {
              setActiveChatId(existingChat.id);
            } else {
              // Create new chat
              const newChatRef = await addDoc(collection(db, 'chats'), {
                type: 'direct',
                participants: [userProfile?.uid, targetUid],
                lastMessage: '',
                lastMessageTime: serverTimestamp(),
                unreadCount: { [userProfile?.uid!]: 0, [targetUid]: 0 }
              });
              setActiveChatId(newChatRef.id);
            }
            
            scanner.clear();
            setShowQRScanner(false);
          } else {
            alert("Utilisateur non trouvé.");
          }
        } catch (err) {
          console.error("QR Scan Error:", err);
          alert("Erreur lors du scan du code QR.");
        }
      }, (error) => {
        // console.warn(error);
      });

      return () => {
        scanner.clear().catch(err => console.error("Scanner clear error", err));
      };
    }
  }, [showQRScanner, userProfile, chats]);

  const handleRefreshData = () => {
    setLastUpdated(new Date());
    // In a real app, this might re-fetch some static data or trigger a sync
    // For now, we'll just show a small toast-like alert
    alert("Données de l'application mises à jour !");
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);
            setIsLoggedIn(true);

            // FCM Setup
            if (messaging) {
              try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                  // Note: In a real production app, you'd get this from the Firebase Console
                  // For now, we'll use a placeholder or the user can set it in .env
                  const vapidKey = (import.meta as any).env.VITE_FCM_VAPID_KEY || '';
                  if (vapidKey) {
                    const token = await getToken(messaging, { vapidKey });
                    if (token) {
                      await updateDoc(doc(db, 'users', user.uid), {
                        fcmToken: token
                      });
                    }
                  }
                }
              } catch (err) {
                console.error("FCM Error:", err);
              }
            }
          } else {
            // If user exists in Auth but not in Firestore, we might be in the middle of handleLogin
            // or it's a first-time login from a different device.
            // We'll let handleLogin handle it or wait for it.
            setIsLoggedIn(false);
            setUserProfile(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Chats Listener
  useEffect(() => {
    if (!isLoggedIn || !userProfile) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userProfile.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsList: Chat[] = [];
      snapshot.forEach((doc) => {
        chatsList.push({ id: doc.id, ...doc.data() } as Chat);
      });
      setChats(chatsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [isLoggedIn, userProfile?.uid]);

  // Admin Panel Data Listener
  useEffect(() => {
    if (!showAdminPanel || !userProfile?.isAdmin) return;

    // Fetch pending subscriptions
    const subQuery = query(collection(db, 'subscriptions'), where('status', '==', 'pending'));
    const unsubscribeSubs = onSnapshot(subQuery, (snapshot) => {
      const subs: any[] = [];
      snapshot.forEach(doc => subs.push({ id: doc.id, ...doc.data() }));
      setPendingSubscriptions(subs);
    });

    // Fetch all users for management
    const usersQuery = query(collection(db, 'users'), limit(50));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach(doc => users.push(doc.data() as UserProfile));
      setAdminUsers(users);
    });

    return () => {
      unsubscribeSubs();
      unsubscribeUsers();
    };
  }, [showAdminPanel, userProfile?.isAdmin]);

  // Messages Listener
  useEffect(() => {
    if (!activeChatId || !isLoggedIn) return;

    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: Message[] = [];
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(prev => ({
        ...prev,
        [activeChatId]: messagesList
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${activeChatId}/messages`);
    });

    return () => unsubscribe();
  }, [activeChatId, isLoggedIn]);

  // Pages, Statuses, and Calls Listeners
  useEffect(() => {
    if (!isLoggedIn || !userProfile) return;

    // Pages
    const pagesQuery = query(collection(db, 'pages'), limit(20));
    const unsubscribePages = onSnapshot(pagesQuery, (snapshot) => {
      const pagesList: Page[] = [];
      snapshot.forEach(doc => pagesList.push(doc.data() as Page));
      setPages(pagesList);
    });

    // Call History
    const callsQuery = query(
      collection(db, 'users', userProfile.uid, 'calls'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubscribeCalls = onSnapshot(callsQuery, (snapshot) => {
      const callsList: CallRecord[] = [];
      snapshot.forEach(doc => callsList.push({ id: doc.id, ...doc.data() } as CallRecord));
      setCallHistory(callsList);
    });

    // Statuses (Ephemeral: 24h)
    const statusesQuery = query(collection(db, 'status'), orderBy('timestamp', 'desc'));
    const unsubscribeStatuses = onSnapshot(statusesQuery, (snapshot) => {
      const allStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Filter stories older than 24 hours
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const recentStories = allStories.filter(s => {
        const ts = s.timestamp?.toMillis?.() || 0;
        return (now - ts) < twentyFourHours;
      });

      // Group by user
      const grouped: { [userId: string]: UserStatus } = {};
      recentStories.forEach(story => {
        if (!grouped[story.userId]) {
          grouped[story.userId] = {
            userId: story.userId,
            userName: story.userName,
            userAvatar: story.userAvatar,
            stories: []
          };
        }
        grouped[story.userId].stories.push(story);
      });
      setStatuses(Object.values(grouped));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'status');
    });

    return () => {
      unsubscribePages();
      unsubscribeCalls();
      unsubscribeStatuses();
    };
  }, [isLoggedIn, userProfile?.uid]);

  // Auto-sync contacts on mount (Simplified)
  useEffect(() => {
    if (isLoggedIn && userProfile) {
      const mockSynced = PHONE_ADDRESS_BOOK.map(c => ({
        uid: `user_${c.phoneNumber}`,
        name: c.name,
        avatar: `https://picsum.photos/seed/${c.phoneNumber}/200`,
        phoneNumber: c.phoneNumber,
        isAppUser: true
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setSyncedContacts(mockSynced);
      
      // Request Notification Permission
      if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            console.log("Notification permission granted (Simulation FCM)");
          }
        });
      }
    }
  }, [isLoggedIn, userProfile?.uid]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setActiveChatId(null);
      setShowLogoutConfirm(false);
      setRegName('');
      setRegEmail('');
      setPhoneNumber('');
      setActiveSettingsTab('main');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Participant Profiles Listener
  useEffect(() => {
    if (activeChat) {
      const fetchParticipants = async () => {
        const profiles: { [uid: string]: UserProfile } = {};
        for (const uid of activeChat.participants) {
          try {
            const docSnap = await getDoc(doc(db, 'users', uid));
            if (docSnap.exists()) {
              profiles[uid] = docSnap.data() as UserProfile;
            }
          } catch (error) {
            console.error("Error fetching participant profile:", uid, error);
          }
        }
        setChatParticipants(profiles);
      };
      fetchParticipants();
    } else {
      setChatParticipants({});
    }
  }, [activeChatId, activeChat?.participants]);

  const handleLogin = async () => {
    if (!regName.trim() || !phoneNumber.trim() || !regEmail.trim()) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        return;
      }
      
      if (userDoc.exists()) {
        // User exists, just update lastSeen and use existing profile
        const existingUser = userDoc.data() as UserProfile;
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            lastSeen: new Date()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
        setUserProfile(existingUser);
      } else {
        // New user, create profile with provided info or Google info
        const newUser: UserProfile = {
          uid: user.uid,
          displayName: regName || user.displayName || 'Utilisateur',
          phoneNumber: phoneNumber,
          email: user.email || regEmail,
          photoURL: user.photoURL || `https://picsum.photos/seed/${user.uid}/200`,
          lastSeen: new Date(),
          isSubscribed: false,
          points: 150,
          isAdmin: user.email === 'njiehoubrandon@gmail.com',
          notificationSettings: {
            sound: 'default',
            vibration: 'short',
            mutedChats: [],
            mutedContacts: [],
            blockedContacts: [],
          },
          saveMultimedia: true,
        };

        try {
          await setDoc(doc(db, 'users', user.uid), newUser);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
        }
        setUserProfile(newUser);
      }
      
      setIsLoggedIn(true);
      
      // Simulate E2EE key generation
      console.log("Génération des clés E2EE pour:", phoneNumber);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Login popup closed by user");
        return;
      }
      console.error("Login error:", error);
      alert("Erreur lors de la connexion. Veuillez réessayer.");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContacts.length === 0 || !userProfile) {
      alert("Veuillez entrer un nom de groupe et sélectionner au moins un contact.");
      return;
    }
    
    const chatId = `group-${Date.now()}`;
    const newChat: Chat = {
      id: chatId,
      participants: [userProfile.uid, ...selectedContacts],
      lastMessage: "Groupe créé",
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: {},
      isGroup: true,
      name: groupName,
      avatar: `https://picsum.photos/seed/${groupName}/200`
    };

    try {
      await setDoc(doc(db, 'chats', chatId), newChat);
      
      // Earn points for creating a group
      const newPoints = userProfile.points + 10;
      await updateDoc(doc(db, 'users', userProfile.uid), {
        points: newPoints
      });
      setUserProfile(prev => prev ? ({ ...prev, points: newPoints }) : null);

      setActiveChatId(chatId);
      alert(`Groupe "${groupName}" créé avec ${selectedContacts.length} participants.`);
      setShowNewGroup(false);
      setGroupName('');
      setSelectedContacts([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}`);
    }
  };

  const handleCreateBroadcast = async () => {
    if (selectedContacts.length === 0 || !userProfile) {
      alert("Veuillez sélectionner au moins un contact.");
      return;
    }
    
    const chatId = `broadcast-${Date.now()}`;
    const newChat: Chat = {
      id: chatId,
      participants: [userProfile.uid, ...selectedContacts],
      lastMessage: "Diffusion créée",
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: {},
      isGroup: true,
      name: `Diffusion (${selectedContacts.length})`,
      avatar: `https://picsum.photos/seed/broadcast/200`
    };

    try {
      await setDoc(doc(db, 'chats', chatId), newChat);
      
      // Earn points for creating a broadcast
      const newPoints = userProfile.points + 10;
      await updateDoc(doc(db, 'users', userProfile.uid), {
        points: newPoints
      });
      setUserProfile(prev => prev ? ({ ...prev, points: newPoints }) : null);

      setActiveChatId(chatId);
      alert(`Diffusion créée avec ${selectedContacts.length} participants.`);
      setShowNewBroadcast(false);
      setSelectedContacts([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}`);
    }
  };

  const t = (key: TranslationKey) => {
    return (translations as any)[key] || (BASE_TRANSLATIONS as any)[key] || key;
  };

  const translateUI = async (targetLanguage: string) => {
    if (targetLanguage === 'fr') {
      setTranslations(BASE_TRANSLATIONS);
      return;
    }

    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following JSON object of UI strings from French to ${targetLanguage}. 
        Maintain the exact same keys. Return ONLY the JSON object.
        JSON: ${JSON.stringify(BASE_TRANSLATIONS)}`,
        config: {
          responseMimeType: "application/json",
        }
      });

      if (response.text) {
        const translated = JSON.parse(response.text);
        setTranslations(translated);
      }
    } catch (error) {
      console.error("Translation error:", error);
      alert("Erreur lors de la traduction. Veuillez réessayer.");
    } finally {
      setIsTranslating(false);
    }
  };

  // E2EE Simulation (Signal-like)
  const encryptMessage = (text: string) => {
    // In a real app, this would use Web Crypto API with public keys
    // Here we simulate it with a simple base64 + "enc_" prefix
    return `enc_${btoa(unescape(encodeURIComponent(text)))}`;
  };

  const decryptMessage = (encryptedText: string) => {
    if (!encryptedText.startsWith('enc_')) return encryptedText;
    try {
      const base64 = encryptedText.replace('enc_', '');
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      return "[Message chiffré]";
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!activeChatId) return;
    setMessages(prev => {
      const chatMessages = [...(prev[activeChatId] || [])];
      const msgIdx = chatMessages.findIndex(m => m.id === messageId);
      if (msgIdx === -1) return prev;

      const msg = { ...chatMessages[msgIdx] };
      const reactions = { ...(msg.reactions || {}) };
      const users = [...(reactions[emoji] || [])];

      if (users.includes(userProfile.uid)) {
        reactions[emoji] = users.filter(u => u !== userProfile.uid);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, userProfile.uid];
      }

      msg.reactions = reactions;
      chatMessages[msgIdx] = msg;
      return { ...prev, [activeChatId]: chatMessages };
    });
  };

  const syncContacts = () => {
    alert("Détection des contacts branmesage dans votre répertoire... (Simulation)");
    setTimeout(() => {
      const synced = PHONE_ADDRESS_BOOK.map(c => ({
        uid: `user_${c.phoneNumber}`,
        name: c.name,
        avatar: `https://picsum.photos/seed/${c.phoneNumber}/200`,
        phoneNumber: c.phoneNumber,
        isAppUser: true
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setSyncedContacts(synced);
      alert(`${synced.length} contacts branmesage détectés et triés par ordre alphabétique !`);
      setShowContacts(true);
    }, 1500);
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    alert(`Contact ${newContactName} ajouté !`);
    setShowAddContact(false);
    setNewContactName('');
    setNewContactPhone('');
  };

  const handleCreatePage = async () => {
    if (!newPageName.trim() || !userProfile) return;
    const pageId = Date.now().toString();
    const newPage: Page = {
      id: pageId,
      name: newPageName,
      description: newPageDesc,
      ownerId: userProfile.uid,
      avatar: `https://picsum.photos/seed/${newPageName}/200`,
      followersCount: 0
    };
    
    try {
      await setDoc(doc(db, 'pages', pageId), newPage);
      setPages([...pages, newPage]);
      setNewPageName('');
      setNewPageDesc('');
      setShowCreatePage(false);
      alert(`Page "${newPageName}" créée avec succès !`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pages');
    }
  };

  const handleUpdateAvatar = async () => {
    if (!newAvatarUrl.trim() || !userProfile) return;
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        photoURL: newAvatarUrl
      });
      setUserProfile({ ...userProfile, photoURL: newAvatarUrl });
      setNewAvatarUrl('');
      alert("Photo de profil mise à jour !");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userProfile.uid}`);
    }
  };

  const handleVoiceMessage = async () => {
    if (!activeChatId || !userProfile) return;
    if (isRecording) {
      // Stop recording and send simulation
      const messageId = Date.now().toString();
      const newMessage: Message = {
        id: messageId,
        chatId: activeChatId,
        senderId: userProfile.uid,
        text: "🎤 Message vocal (Simulation)",
        timestamp: serverTimestamp(),
        type: 'text',
      };
      
      try {
        await setDoc(doc(db, 'chats', activeChatId, 'messages', messageId), newMessage);
        await updateDoc(doc(db, 'chats', activeChatId), {
          lastMessage: "🎤 Message vocal",
          lastMessageTimestamp: serverTimestamp()
        });
        setIsRecording(false);
        // Earn points for using features
        const newPoints = userProfile.points + 5;
        await updateDoc(doc(db, 'users', userProfile.uid), {
          points: newPoints
        });
        setUserProfile(prev => ({ ...prev, points: newPoints }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `chats/${activeChatId}/messages`);
      }
    } else {
      setIsRecording(true);
    }
  };

  const handleUpdateTheme = async (theme: ThemeSettings) => {
    if (!userProfile) return;
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        themeSettings: theme
      });
      setUserProfile(prev => prev ? ({ ...prev, themeSettings: theme }) : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userProfile.uid}`);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChatId || !userProfile) return;

    // Check if user is blocked by admin
    if (userProfile.isBlocked) {
      alert(`Votre compte est bloqué jusqu'au ${new Date(userProfile.blockedUntil).toLocaleDateString()}. Contactez le support.`);
      return;
    }

    const isBroadcast = activeChat?.id.startsWith('broadcast-');

    if (isBroadcast && activeChat) {
      const participants = activeChat.participants.filter(p => p !== userProfile.uid);
      
      for (const participantId of participants) {
        // Find or create private chat
        const privateChatId = [userProfile.uid, participantId].sort().join('_');
        const privateChatDoc = await getDoc(doc(db, 'chats', privateChatId));
        
        if (!privateChatDoc.exists()) {
          await setDoc(doc(db, 'chats', privateChatId), {
            id: privateChatId,
            participants: [userProfile.uid, participantId],
            lastMessage: inputText,
            lastMessageTimestamp: serverTimestamp(),
            unreadCount: { [participantId]: 1 }
          });
        } else {
          await updateDoc(doc(db, 'chats', privateChatId), {
            lastMessage: inputText,
            lastMessageTimestamp: serverTimestamp(),
            [`unreadCount.${participantId}`]: (privateChatDoc.data().unreadCount?.[participantId] || 0) + 1
          });
        }

        const messageId = Date.now().toString() + participantId;
        const newMessage: Message = {
          id: messageId,
          chatId: privateChatId,
          senderId: userProfile.uid,
          text: encryptMessage(inputText),
          timestamp: serverTimestamp(),
          type: 'text',
          isEncrypted: true,
          status: 'sent'
        };
        await setDoc(doc(db, 'chats', privateChatId, 'messages', messageId), newMessage);
      }

      // Update the broadcast chat itself for history
      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: inputText,
        lastMessageTimestamp: serverTimestamp()
      });

      setInputText('');
      return;
    }

    // Check if blocked
    const otherId = activeChat?.participants.find(p => p !== userProfile.uid);
    if (otherId && blockedContactIds.includes(otherId)) {
      alert("Vous avez bloqué ce contact. Débloquez-le pour envoyer un message.");
      return;
    }

    // If offline and not subscribed, we can't send messages
    if (isOffline && !isSubscribed) {
      alert("Vous êtes hors ligne. Abonnez-vous pour envoyer des messages sans connexion internet !");
      return;
    }

    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      chatId: activeChatId,
      senderId: userProfile.uid,
      text: encryptMessage(inputText),
      timestamp: serverTimestamp(),
      type: 'text',
      isEncrypted: true,
      status: 'sent',
      replyTo: replyToMessage?.id
    };

    try {
      await setDoc(doc(db, 'chats', activeChatId, 'messages', messageId), newMessage);
      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: inputText,
        lastMessageTimestamp: serverTimestamp()
      });
      
      // Earn points for sending messages
      const newPoints = userProfile.points + 1;
      await updateDoc(doc(db, 'users', userProfile.uid), {
        points: newPoints
      });
      setUserProfile(prev => prev ? ({ ...prev, points: newPoints }) : null);

      setInputText('');
      setReplyToMessage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChatId}/messages/${messageId}`);
    }

  };

  const handleBlockContact = async (contactId: string) => {
    if (!userProfile) return;
    
    const currentBlocked = userProfile.notificationSettings?.blockedContacts || [];
    let newBlocked: string[];
    
    if (currentBlocked.includes(contactId)) {
      newBlocked = currentBlocked.filter(id => id !== contactId);
      alert("Contact débloqué.");
    } else {
      newBlocked = [...currentBlocked, contactId];
      alert("Contact bloqué.");
    }

    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        'notificationSettings.blockedContacts': newBlocked
      });
      setUserProfile({
        ...userProfile,
        notificationSettings: {
          ...userProfile.notificationSettings!,
          blockedContacts: newBlocked
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userProfile.uid}`);
    }
  };

  const handleReportContact = async (contactId: string) => {
    if (!userProfile) return;
    const reportId = `report-${Date.now()}`;
    try {
      await setDoc(doc(db, 'reports', reportId), {
        id: reportId,
        reportedUserId: contactId,
        reporterId: userProfile.uid,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      alert("Contact signalé aux administrateurs de branmesage.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  };

  const handleSubscribeRequest = async (amount: number) => {
    if (!userProfile) return;
    alert(`Veuillez envoyer ${amount} CFA au numéro 651 715 307. Votre abonnement sera activé par un administrateur après réception.`);
    
    const subId = `sub-${Date.now()}`;
    try {
      await setDoc(doc(db, 'subscriptions', subId), {
        id: subId,
        userId: userProfile.uid,
        userName: userProfile.displayName,
        amount,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'subscriptions');
    }
  };

  const activateSubscription = async (userId: string, subId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isSubscribed: true,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      await updateDoc(doc(db, 'subscriptions', subId), {
        status: 'completed'
      });
      if (userId === userProfile?.uid) {
        setIsSubscribed(true);
        setUserProfile(prev => prev ? ({ ...prev, isSubscribed: true }) : null);
      }
      alert("Abonnement activé avec succès !");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleAdminBlockUser = async (userId: string) => {
    const days = prompt("Bloquer pour combien de jours ?", "7");
    if (days) {
      const duration = parseInt(days);
      if (isNaN(duration)) return;
      
      const blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + duration);
      
      try {
        await updateDoc(doc(db, 'users', userId), {
          isBlocked: true,
          blockedUntil: blockedUntil
        });
        if (userId === userProfile?.uid) {
          setUserProfile(prev => prev ? ({ ...prev, isBlocked: true, blockedUntil: blockedUntil }) : null);
        }
        alert(`Utilisateur bloqué pour ${days} jours.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
      }
    }
  };

  const handleAdminUnblockUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked: false,
        blockedUntil: null
      });
      if (userId === userProfile?.uid) {
        setUserProfile(prev => prev ? ({ ...prev, isBlocked: false, blockedUntil: null }) : null);
      }
      alert("Utilisateur débloqué.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleBranIASend = async () => {
    if (!branIAInput.trim()) return;
    
    const userMsg = branIAInput.trim();
    setBranIAMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setBranIAInput('');
    setIsBranIATyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: "Tu es branIA, un assistant intelligent intégré à l'application branmesage. Tu es capable de répondre à toutes les questions et de résoudre tous les problèmes avec un haut niveau d'intelligence. Tu es poli, serviable et précis.",
        },
      });

      // Send the whole history for context
      const history = branIAMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: "Tu es branIA, un assistant intelligent intégré à l'application branmesage. Tu es capable de répondre à toutes les questions et de résoudre tous les problèmes avec un haut niveau d'intelligence. Tu es poli, serviable et précis.",
        }
      });

      if (response.text) {
        setBranIAMessages(prev => [...prev, { role: 'model', text: response.text }]);
        
        // Earn points for using branIA
        if (userProfile) {
          const newPoints = userProfile.points + 2;
          await updateDoc(doc(db, 'users', userProfile.uid), {
            points: newPoints
          });
          setUserProfile(prev => prev ? ({ ...prev, points: newPoints }) : null);
        }
      }
    } catch (error) {
      console.error("branIA error:", error);
      setBranIAMessages(prev => [...prev, { role: 'model', text: "Désolé, j'ai rencontré une erreur. Veuillez réessayer." }]);
    } finally {
      setIsBranIATyping(false);
    }
  };

  const handleForwardMessage = async (targetChatId: string) => {
    if (!messageToForward || !userProfile) return;

    const messageId = Date.now().toString();
    const forwardedMessage: Message = {
      ...messageToForward,
      id: messageId,
      chatId: targetChatId,
      senderId: userProfile.uid,
      timestamp: serverTimestamp(),
      forwardedFrom: messageToForward.senderId,
      status: 'sent'
    };

    try {
      await setDoc(doc(db, 'chats', targetChatId, 'messages', messageId), forwardedMessage);
      await updateDoc(doc(db, 'chats', targetChatId), {
        lastMessage: forwardedMessage.text,
        lastMessageTimestamp: serverTimestamp()
      });
      setShowForwardModal(false);
      setMessageToForward(null);
      setActiveChatId(targetChatId);
      alert("Message transféré !");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${targetChatId}/messages`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f0f2f5]">
        <Loader2 className="animate-spin text-[#00a884]" size={48} />
      </div>
    );
  }

  if (!isLoggedIn || !userProfile) {
    return (
      <div className="h-screen bg-[#00a884] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center mx-auto mb-6 text-white">
            <MessageSquare size={40} />
          </div>
          <h1 className="text-3xl font-bold text-[#111b21] mb-2">{t('login_title')}</h1>
          <p className="text-[#667781] mb-8">
            {t('login_subtitle')}
          </p>
          
          <div className="space-y-4 mb-8 text-left">
            <div>
              <label className="block text-xs font-bold text-[#00a884] uppercase mb-1">{t('reg_name_label')}</label>
              <input 
                type="text" 
                placeholder={t('reg_name_placeholder')}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-gray-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#00a884] uppercase mb-1">{t('login_phone_label')}</label>
              <div className="flex gap-2">
                <div className="bg-gray-100 px-3 py-3 rounded-xl text-sm font-bold text-gray-500 flex items-center">+237</div>
                <input 
                  type="tel" 
                  placeholder={t('login_phone_placeholder')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-gray-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#00a884] uppercase mb-1">{t('reg_email_label')}</label>
              <input 
                type="email" 
                placeholder={t('reg_email_placeholder')}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-gray-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884] transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleLogin}
            className="w-full bg-[#00a884] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#008f72] transition-all transform active:scale-95 shadow-lg flex items-center justify-center"
          >
            {t('login_button')}
          </button>
          <p className="mt-6 text-[10px] text-gray-400">
            {t('login_sms_disclaimer')}
          </p>
        </motion.div>
      </div>
    );
  }

  const pointsBonus = userProfile ? Math.floor(userProfile.points / 10) : 0; // 10 points = 1 CFA bonus
  const finalPrice = Math.max(0, SUBSCRIPTION_PRICE_CFA - pointsBonus);

  const handleStartChat = async (contact: Contact | UserProfile) => {
    if (!userProfile) return;
    
    // Check if chat already exists
    const contactUid = (contact as UserProfile).uid || (contact as Contact).phoneNumber; // Fallback for mock contacts
    
    // In a real app, we'd query Firestore for a chat with these two participants
    // For now, we'll just create a deterministic ID for 1-on-1 chats
    const participants = [userProfile.uid, contactUid].sort();
    const chatId = `chat_${participants.join('_')}`;
    
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      let chatExists = false;
      try {
        const chatDoc = await getDoc(chatDocRef);
        chatExists = chatDoc.exists();
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `chats/${chatId}`);
      }

      if (!chatExists) {
        const newChat: Chat = {
          id: chatId,
          participants: participants,
          lastMessage: "Démarrer la conversation",
          lastMessageTimestamp: serverTimestamp(),
          unreadCount: {},
          isGroup: false,
          name: (contact as UserProfile).displayName || (contact as Contact).name,
          avatar: (contact as UserProfile).photoURL || `https://picsum.photos/seed/${contactUid}/200`
        };
        try {
          await setDoc(doc(db, 'chats', chatId), newChat);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}`);
        }
      }
      setActiveChatId(chatId);
      setShowContacts(false);
    } catch (error) {
      // General error handling if needed, but inner try-catches handle specific ops
      console.error("handleStartChat error:", error);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-[#f0f2f5] text-[#111b21]'}`}>
      {/* Camera View */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 bg-black z-[200] flex flex-col"
          >
            <div className="p-4 flex justify-between items-center text-white">
              <button onClick={() => setShowCamera(false)}><X size={28} /></button>
              <div className="flex gap-6">
                <button><Sun size={24} /></button>
                <button><CircleDashed size={24} /></button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <Camera size={100} className="text-white/20" />
              <p className="absolute text-white/50 text-sm">Aperçu de la caméra (Simulation)</p>
            </div>
            <div className="p-8 flex justify-around items-center bg-black/50">
              <div className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden">
                <img src="https://picsum.photos/seed/gallery/100" className="w-full h-full object-cover" />
              </div>
              <button className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white" />
              </button>
              <button className="text-white"><History size={28} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <div className={`w-full md:w-[400px] border-r border-[#d1d7db] flex flex-col relative ${isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white'} ${activeChatId || showPages || showSettings ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className={`h-[60px] px-4 flex items-center justify-between ${isDarkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-2 border-white shadow-sm hover:opacity-80 transition-opacity"
            >
              <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-xl font-bold text-[#00a884]">Branmesage</h1>
          </div>
          <div className={`flex gap-3 items-center ${isDarkMode ? 'text-[#aebac1]' : 'text-[#54656f]'}`}>
            <button onClick={handleRefreshData} className="p-1.5 hover:bg-black/10 rounded-full transition-colors" title="Mettre à jour les données">
              <RefreshCcw size={20} className={isOffline ? 'text-red-500' : ''} />
            </button>
            <button onClick={() => setShowCamera(true)} className="p-1.5 hover:bg-black/10 rounded-full transition-colors">
              <Camera size={22} />
            </button>
            <button onClick={() => setShowContacts(true)} className="p-1.5 hover:bg-black/10 rounded-full transition-colors">
              <Search size={22} />
            </button>
            <div className="relative group">
              <button className="p-1.5 hover:bg-black/10 rounded-full transition-colors">
                <MoreVertical size={22} />
              </button>
              <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl py-2 z-50 hidden group-hover:block ${isDarkMode ? 'bg-[#233138] text-[#e9edef]' : 'bg-white text-[#111b21]'}`}>
                <button onClick={() => setShowNewGroup(true)} className={`w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>Nouveau groupe</button>
                <button onClick={() => setShowNewBroadcast(true)} className={`w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>Nouvelle diffusion</button>
                <button onClick={() => setShowMyQRCode(true)} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>
                  <QrCode size={16} /> Mon code QR
                </button>
                <button onClick={() => setShowQRScanner(true)} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>
                  <Scan size={16} /> Scanner un code
                </button>
                <button onClick={() => setShowSettings(true)} className={`w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>Paramètres</button>
                <button onClick={handleLogout} className={`w-full text-left px-4 py-2 text-sm text-red-500 ${isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>Déconnexion</button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {activeTab === 'chats' && (
            <>
              {/* PWA Installation Banner */}
              {showInstallBanner && !isStandalone && deferredPrompt && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`px-4 py-3 flex items-center justify-between border-b ${isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00a884] rounded-lg flex items-center justify-center text-white shadow-sm">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Installer branmesage</p>
                      <p className="text-[10px] text-[#667781]">Accès rapide depuis l'accueil</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleInstallClick}
                      className="bg-[#00a884] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-[#008069] transition-colors"
                    >
                      Installer
                    </button>
                    <button 
                      onClick={() => setShowInstallBanner(false)}
                      className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                    >
                      <X size={14} className="text-[#667781]" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Search & Filter */}
              <div className={`p-2 ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'} flex gap-2`}>
                <div className={`flex-1 rounded-lg flex items-center px-3 py-1.5 ${isDarkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
                  <Search size={18} className={`${isDarkMode ? 'text-[#aebac1]' : 'text-[#54656f]'} mr-4`} />
                  <input 
                    type="text" 
                    placeholder={t('sidebar_search_placeholder')} 
                    className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#54656f] text-inherit"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative group">
                  <button className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10 text-[#aebac1]' : 'hover:bg-black/5 text-[#54656f]'}`}>
                    <Filter size={20} />
                  </button>
                  <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl py-2 z-50 hidden group-hover:block ${isDarkMode ? 'bg-[#233138] text-[#e9edef]' : 'bg-white text-[#111b21]'}`}>
                    <button onClick={() => setChatSortOrder('date')} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${chatSortOrder === 'date' ? 'bg-[#00a884] text-white' : isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>
                      <Clock size={16} /> Par date
                    </button>
                    <button onClick={() => setChatSortOrder('unread')} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${chatSortOrder === 'unread' ? 'bg-[#00a884] text-white' : isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>
                      <MessageCircle size={16} /> Non lus
                    </button>
                    <button onClick={() => setChatSortOrder('name')} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${chatSortOrder === 'name' ? 'bg-[#00a884] text-white' : isDarkMode ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}>
                      <TypeIcon size={16} /> Par nom
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {sortedChats.filter(chat => {
                  return chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) || chat.isGroup;
                }).map(chat => (
                  <ChatListItem 
                    key={chat.id}
                    chat={chat}
                    activeChatId={activeChatId}
                    userProfile={userProfile}
                    messages={messages}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setShowPages(false);
                      setShowSettings(false);
                    }}
                  />
                ))}
                {chats.length === 0 && (
                  <div className="p-8 text-center text-[#667781] text-sm">
                    Aucune discussion trouvée
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'status' && (
            <div className="flex-1 flex flex-col">
              <div 
                onClick={() => setShowAddStatus(true)}
                className={`p-4 flex items-center gap-4 cursor-pointer ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img src={userProfile.photoURL} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-[#00a884] text-white rounded-full p-0.5 border-2 border-white">
                    <Plus size={12} />
                  </div>
                </div>
                <div>
                  <p className="font-medium">Mon statut</p>
                  <p className="text-xs text-[#667781]">Appuyez pour ajouter un statut</p>
                </div>
              </div>
              <div className={`px-4 py-2 text-sm font-medium text-[#008069] ${isDarkMode ? 'bg-[#111b21]' : 'bg-[#f0f2f5]'}`}>
                RÉCENTES
              </div>
              {statuses.map(status => (
                <div 
                  key={status.userId}
                  className={`p-4 flex items-center gap-4 cursor-pointer ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-[#00a884] p-0.5">
                    <img src={status.userAvatar} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium">{status.userName}</p>
                    <p className="text-xs text-[#667781]">Aujourd'hui à {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="flex-1 flex flex-col">
              {callHistory.map(call => (
                <div 
                  key={call.id}
                  className={`p-4 flex items-center justify-between cursor-pointer ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img src={call.userAvatar} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className={`font-medium ${call.status === 'missed' ? 'text-red-500' : ''}`}>{call.userName}</p>
                      <div className="flex items-center gap-1 text-xs text-[#667781]">
                        {call.status === 'placed' && <PhoneOutgoing size={12} className="text-green-500" />}
                        {call.status === 'received' && <PhoneIncoming size={12} className="text-green-500" />}
                        {call.status === 'missed' && <PhoneMissed size={12} className="text-red-500" />}
                        <span>{new Date(call.timestamp).toLocaleDateString()} {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-[#00a884]">
                    {call.type === 'audio' ? <Phone size={20} /> : <Video size={20} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className={`h-[60px] border-t flex items-center justify-around ${isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'}`}>
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'chats' ? 'text-[#00a884]' : 'text-[#54656f]'}`}
          >
            <MessageSquare size={24} />
            <span className="text-[10px] font-medium">Discussions</span>
          </button>
          <button 
            onClick={() => setActiveTab('status')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'status' ? 'text-[#00a884]' : 'text-[#54656f]'}`}
          >
            <CircleDashed size={24} />
            <span className="text-[10px] font-medium">Statut</span>
          </button>
          <button 
            onClick={() => setActiveTab('calls')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'calls' ? 'text-[#00a884]' : 'text-[#54656f]'}`}
          >
            <Phone size={24} />
            <span className="text-[10px] font-medium">Appels</span>
          </button>
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => setShowAddContact(true)}
          className="absolute bottom-20 right-6 w-14 h-14 bg-[#00a884] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-20"
        >
          {activeTab === 'chats' ? <MessageSquare size={24} /> : activeTab === 'status' ? <Camera size={24} /> : <PhoneCall size={24} />}
        </button>
      </div>

      {/* New Group Modal */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-2xl p-6 w-full max-w-sm shadow-2xl ${isDarkMode ? 'bg-[#233138] text-[#e9edef]' : 'bg-white text-[#111b21]'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nouveau groupe</h2>
                <button onClick={() => setShowNewGroup(false)} className="text-gray-500 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Nom du groupe"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={`w-full p-3 rounded-xl outline-none border ${isDarkMode ? 'bg-[#2a3942] border-[#3b4a54]' : 'bg-gray-100 border-transparent'}`}
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Sélectionner des contacts</p>
                  {syncedContacts.map(contact => (
                    <div 
                      key={contact.uid}
                      onClick={() => {
                        if (selectedContacts.includes(contact.uid)) {
                          setSelectedContacts(selectedContacts.filter(id => id !== contact.uid));
                        } else {
                          setSelectedContacts([...selectedContacts, contact.uid]);
                        }
                      }}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedContacts.includes(contact.uid) ? 'bg-[#00a884]/20' : 'hover:bg-black/5'}`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img src={contact.avatar} className="w-full h-full object-cover" />
                      </div>
                      <span className="flex-1">{contact.name}</span>
                      {selectedContacts.includes(contact.uid) && <Check size={18} className="text-[#00a884]" />}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleCreateGroup}
                  className="w-full bg-[#00a884] text-white py-3 rounded-xl font-bold hover:bg-[#008f72] transition-colors"
                >
                  Créer le groupe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Broadcast Modal */}
      <AnimatePresence>
        {showNewBroadcast && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-2xl p-6 w-full max-w-sm shadow-2xl ${isDarkMode ? 'bg-[#233138] text-[#e9edef]' : 'bg-white text-[#111b21]'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nouvelle diffusion</h2>
                <button onClick={() => setShowNewBroadcast(false)} className="text-gray-500 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Seuls les contacts ayant votre numéro dans leur carnet d'adresses recevront vos messages de diffusion.</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Sélectionner des destinataires</p>
                  {syncedContacts.map(contact => (
                    <div 
                      key={contact.uid}
                      onClick={() => {
                        if (selectedContacts.includes(contact.uid)) {
                          setSelectedContacts(selectedContacts.filter(id => id !== contact.uid));
                        } else {
                          setSelectedContacts([...selectedContacts, contact.uid]);
                        }
                      }}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedContacts.includes(contact.uid) ? 'bg-[#00a884]/20' : 'hover:bg-black/5'}`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img src={contact.avatar} className="w-full h-full object-cover" />
                      </div>
                      <span className="flex-1">{contact.name}</span>
                      {selectedContacts.includes(contact.uid) && <Check size={18} className="text-[#00a884]" />}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleCreateBroadcast}
                  className="w-full bg-[#00a884] text-white py-3 rounded-xl font-bold hover:bg-[#008f72] transition-colors"
                >
                  Créer la liste
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nouveau contact</h2>
                <button onClick={() => setShowAddContact(false)} className="text-gray-500 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom</label>
                  <input 
                    type="text" 
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full bg-gray-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884]"
                    placeholder="Nom du contact"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Numéro</label>
                  <input 
                    type="tel" 
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-gray-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884]"
                    placeholder="6XX XXX XXX"
                  />
                </div>
                <button 
                  onClick={handleAddContact}
                  className="w-full bg-[#00a884] text-white py-3 rounded-xl font-bold hover:bg-[#008f72] transition-colors"
                >
                  Ajouter le contact
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings View */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="absolute inset-0 md:relative md:w-[400px] bg-white z-40 flex flex-col border-r border-[#d1d7db]"
          >
            <div className="h-[108px] bg-[#008069] text-white flex items-end p-5">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => {
                    if (activeSettingsTab === 'main') {
                      setShowSettings(false);
                    } else {
                      setActiveSettingsTab('main');
                    }
                  }} 
                  className="cursor-pointer"
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-medium">
                  {activeSettingsTab === 'main' ? t('settings_title') : 
                   activeSettingsTab === 'account' ? t('settings_account') :
                   activeSettingsTab === 'privacy' ? t('settings_privacy') :
                   activeSettingsTab === 'chats' ? t('settings_chats') :
                   activeSettingsTab === 'notifications' ? t('settings_notifications') :
                   activeSettingsTab === 'storage' ? t('settings_storage') :
                   activeSettingsTab === 'theme' ? 'Thèmes' :
                   activeSettingsTab === 'points' ? 'Points & Récompenses' :
                   t('settings_help')}
                </h2>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
              {activeSettingsTab === 'main' ? (
                <div className="space-y-3">
                  {/* Profile Header */}
                  <div 
                    onClick={() => setActiveSettingsTab('account')}
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${isDarkMode ? 'bg-[#111b21] hover:bg-[#202c33]' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-lg truncate ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{userProfile.displayName}</h3>
                      <p className="text-sm text-[#667781] truncate">Disponible</p>
                    </div>
                  </div>

                  {/* Settings List */}
                  <div className={`${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div 
                      onClick={() => setActiveSettingsTab('points')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <Award size={24} className="text-[#00a884]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Points & Récompenses</p>
                        <p className="text-xs text-[#667781]">{userProfile.points} points accumulés</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveSettingsTab('account')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <Key size={24} className="text-[#54656f]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_account')}</p>
                        <p className="text-xs text-[#667781]">{t('settings_security')}</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveSettingsTab('privacy')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <Lock size={24} className="text-[#54656f]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_privacy')}</p>
                        <p className="text-xs text-[#667781]">Bloqués, messages éphémères</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveSettingsTab('chats')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <MessageSquare size={24} className="text-[#54656f]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_chats')}</p>
                        <p className="text-xs text-[#667781]">{t('settings_theme')}, {t('settings_wallpaper')}</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveSettingsTab('theme')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <Palette size={24} className="text-[#54656f]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Thèmes personnalisés</p>
                        <p className="text-xs text-[#667781]">Changez les couleurs de l'application</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveSettingsTab('notifications')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <Bell size={24} className="text-[#54656f]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_notifications')}</p>
                        <p className="text-xs text-[#667781]">{t('settings_notif_sound')}</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveSettingsTab('notifications')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <Bell size={24} className="text-[#54656f]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_notifications')}</p>
                        <p className="text-xs text-[#667781]">
                          {Notification.permission === 'granted' ? 'Activées' : 'Désactivées'}
                        </p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveSettingsTab('storage')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <Database size={24} className="text-[#54656f]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_storage')}</p>
                        <p className="text-xs text-[#667781]">{t('settings_network_usage')}</p>
                      </div>
                    </div>
                    {!isStandalone && (
                      <div 
                        onClick={handleInstallClick}
                        className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                      >
                        <Plus size={24} className="text-[#00a884]" />
                        <div className="flex-1 border-b border-gray-100 pb-4">
                          <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Installer branmesage</p>
                          <p className="text-xs text-[#667781]">Ajouter à l'écran d'accueil</p>
                        </div>
                      </div>
                    )}
                    <div 
                      onClick={() => setActiveSettingsTab('help')}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <HelpCircle size={24} className="text-[#54656f]" />
                      <div className="flex-1 border-b border-gray-100 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_help')}</p>
                        <p className="text-xs text-[#667781]">{t('settings_help_center')}, {t('settings_contact_us')}</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => {}}
                      className={`flex items-center gap-6 p-4 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                    >
                      <UserPlus size={24} className="text-[#54656f]" />
                      <div className="flex-1 pb-4">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_invite')}</p>
                      </div>
                    </div>
                    <div className="p-4 text-center border-t border-gray-100">
                      <p className="text-[10px] text-[#667781] uppercase font-bold tracking-widest">branmesage v2.4.0</p>
                      <p className="text-[9px] text-[#8696a0] mt-1">Dernière mise à jour : {lastUpdated.toLocaleString()}</p>
                      <button 
                        onClick={() => setShowChangelog(true)}
                        className="mt-2 text-[10px] text-[#00a884] font-bold hover:underline"
                      >
                        Voir les nouveautés
                      </button>
                    </div>
                  </div>

                  <div 
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`flex items-center gap-6 p-4 mt-4 cursor-pointer transition-colors ${isDarkMode ? 'bg-[#111b21] hover:bg-[#202c33]' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <LogOut size={24} className="text-red-500" />
                    <p className="font-medium text-red-500">{t('settings_logout')}</p>
                  </div>
                </div>
              ) : activeSettingsTab === 'points' ? (
                <div className="space-y-6 p-6">
                  <div className={`p-8 rounded-2xl text-center flex flex-col items-center ${isDarkMode ? 'bg-[#202c33]' : 'bg-green-50'}`}>
                    <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center text-white mb-4 shadow-lg">
                      <Award size={40} />
                    </div>
                    <h2 className={`text-3xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-[#111b21]'}`}>{userProfile.points}</h2>
                    <p className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#00a884]' : 'text-[#008069]'}`}>Points Branmesage</p>
                    <div className="mt-6 p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                      <p className="text-xs text-[#667781]">
                        10 points = 1 CFA de réduction sur votre abonnement mensuel.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className={`text-sm font-bold uppercase ${isDarkMode ? 'text-[#8696a0]' : 'text-[#54656f]'}`}>Comment gagner des points ?</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { icon: <MessageSquare size={18} />, label: "Envoyer un message", pts: "+1 pt" },
                        { icon: <Mic size={18} />, label: "Message vocal", pts: "+5 pts" },
                        { icon: <Users size={18} />, label: "Créer un groupe", pts: "+10 pts" },
                        { icon: <Bot size={18} />, label: "Utiliser branIA", pts: "+2 pts" },
                        { icon: <UserPlus size={18} />, label: "Inviter un ami", pts: "+20 pts" }
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-[#111b21]' : 'bg-white shadow-sm'}`}>
                          <div className="flex items-center gap-3">
                            <div className="text-[#00a884]">{item.icon}</div>
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{item.label}</span>
                          </div>
                          <span className="text-[#00a884] font-bold text-sm">{item.pts}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeSettingsTab === 'account' ? (
                <div className="space-y-6">
                  <div className={`p-8 flex flex-col items-center ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div className="relative group cursor-pointer mb-6">
                      <div className="w-48 h-48 rounded-full overflow-hidden">
                        <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                        <Camera size={24} className="mb-1" />
                        <span className="text-[10px] uppercase font-bold">Changer la photo</span>
                      </div>
                    </div>
                    <div className="w-full space-y-4">
                      <div>
                        <label className="text-xs text-[#008069] font-medium mb-1 block">{t('settings_profile_name')}</label>
                        <div className={`flex items-center justify-between border-b pb-1 ${isDarkMode ? 'border-[#3b4a54]' : 'border-gray-200'}`}>
                          <span className={`${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{userProfile.displayName}</span>
                          <Settings size={18} className="text-[#54656f] cursor-pointer" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">{t('settings_profile_desc')}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#008069] font-medium mb-1 block">URL de la photo de profil</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newAvatarUrl}
                            onChange={(e) => setNewAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className={`flex-1 border-b outline-none text-sm py-1 bg-transparent ${isDarkMode ? 'border-[#3b4a54] text-[#e9edef]' : 'border-gray-200 text-[#111b21]'}`}
                          />
                          <button 
                            onClick={handleUpdateAvatar}
                            className="bg-[#00a884] text-white px-3 py-1 rounded text-xs font-bold"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <Lock size={24} className="text-[#54656f]" />
                      <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_security')}</p>
                    </div>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <Shield size={24} className="text-[#54656f]" />
                      <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Vérification en deux étapes</p>
                    </div>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <Phone size={24} className="text-[#54656f]" />
                      <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Changer de numéro</p>
                    </div>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <LogOut size={24} className="text-red-500" />
                      <p className="font-medium text-red-500">Supprimer mon compte</p>
                    </div>
                  </div>
                </div>
              ) : activeSettingsTab === 'privacy' ? (
                <div className="space-y-6">
                  <div className={`${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Vu à et en ligne</p>
                        <p className="text-xs text-[#667781]">Tout le monde</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Photo de profil</p>
                        <p className="text-xs text-[#667781]">Mes contacts</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Actu</p>
                        <p className="text-xs text-[#667781]">Tout le monde</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Statut</p>
                        <p className="text-xs text-[#667781]">Mes contacts</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Confirmations de lecture</p>
                        <p className="text-xs text-[#667781]">Si vous désactivez les confirmations de lecture, vous ne pourrez pas voir celles des autres.</p>
                      </div>
                      <button className="w-10 h-5 bg-[#00a884] rounded-full relative">
                        <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full" />
                      </button>
                    </div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                      <div className="flex items-center gap-6">
                        <Ban size={24} className="text-[#54656f]" />
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Contacts bloqués</p>
                          <p className="text-xs text-[#667781]">{blockedContactIds.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeSettingsTab === 'theme' ? (
                <div className="space-y-6 p-6">
                  <div className="space-y-4">
                    <h3 className={`text-xs font-bold uppercase ${isDarkMode ? 'text-[#8696a0]' : 'text-[#54656f]'}`}>Thèmes Prédéfinis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {PREDEFINED_THEMES.map((theme) => (
                        <div 
                          key={theme.id}
                          onClick={() => handleUpdateTheme(theme)}
                          className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${
                            userProfile.themeSettings?.id === theme.id 
                              ? 'border-[#00a884] bg-[#00a884]/10' 
                              : isDarkMode ? 'border-[#2a3942] bg-[#111b21]' : 'border-gray-100 bg-white'
                          }`}
                        >
                          <div className="flex gap-1 mb-2">
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: theme.primaryColor }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: theme.secondaryColor }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: theme.backgroundColor }} />
                          </div>
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{theme.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className={`text-xs font-bold uppercase ${isDarkMode ? 'text-[#8696a0]' : 'text-[#54656f]'}`}>Thème Personnalisé</h3>
                    <div className={`p-4 rounded-xl space-y-4 ${isDarkMode ? 'bg-[#111b21]' : 'bg-white shadow-sm'}`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-[#667781] uppercase font-bold mb-1 block">Primaire</label>
                          <input 
                            type="color" 
                            value={customTheme.primaryColor}
                            onChange={(e) => setCustomTheme({...customTheme, primaryColor: e.target.value})}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#667781] uppercase font-bold mb-1 block">Secondaire</label>
                          <input 
                            type="color" 
                            value={customTheme.secondaryColor}
                            onChange={(e) => setCustomTheme({...customTheme, secondaryColor: e.target.value})}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#667781] uppercase font-bold mb-1 block">Accent</label>
                          <input 
                            type="color" 
                            value={customTheme.accentColor}
                            onChange={(e) => setCustomTheme({...customTheme, accentColor: e.target.value})}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#667781] uppercase font-bold mb-1 block">Fond</label>
                          <input 
                            type="color" 
                            value={customTheme.backgroundColor}
                            onChange={(e) => setCustomTheme({...customTheme, backgroundColor: e.target.value})}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUpdateTheme(customTheme)}
                        className="w-full py-2 bg-[#00a884] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#008069] transition-colors"
                      >
                        Appliquer le thème personnalisé
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeSettingsTab === 'chats' ? (
                <div className="space-y-6">
                  <div className={`${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <Palette size={24} className="text-[#54656f]" />
                      <div className="flex-1 flex items-center justify-between">
                        <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_theme')}</p>
                        <button 
                          onClick={() => setIsDarkMode(!isDarkMode)}
                          className="text-xs text-[#00a884] font-bold"
                        >
                          {isDarkMode ? 'Clair' : 'Sombre'}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <ImageIcon size={24} className="text-[#54656f]" />
                      <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_wallpaper')}</p>
                    </div>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <History size={24} className="text-[#54656f]" />
                      <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Sauvegarde des discussions</p>
                    </div>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <History size={24} className="text-[#54656f]" />
                      <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Historique des discussions</p>
                    </div>
                  </div>
                  
                  {/* Language Settings moved here as it's often in Chats or App settings */}
                  <div className={`p-4 space-y-4 ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <h3 className="text-xs font-bold text-[#008069] uppercase">{t('settings_language')}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Globe size={20} className="text-[#54656f]" />
                        <span className={`text-sm ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_language')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTranslating && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={14} className="text-[#00a884]" /></motion.div>}
                        <select 
                          value={userProfile.language || 'fr'}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            setUserProfile({ ...userProfile, language: newLang });
                            const langName = LANGUAGES.find(l => l.code === newLang)?.name || newLang;
                            translateUI(langName);
                          }}
                          className={`text-xs p-1 rounded border outline-none ${isDarkMode ? 'bg-[#2a3942] border-[#3b4a54] text-[#e9edef]' : 'bg-white border-gray-200'}`}
                          disabled={isTranslating}
                        >
                          {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeSettingsTab === 'notifications' ? (
                <div className="space-y-6">
                  <div className={`p-4 space-y-6 ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Bell size={20} className="text-[#54656f]" />
                          <span className={`text-sm ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_notif_sound')}</span>
                        </div>
                        <select 
                          value={userProfile.notificationSettings?.sound || 'default'}
                          onChange={(e) => setUserProfile({
                            ...userProfile, 
                            notificationSettings: { ...userProfile.notificationSettings!, sound: e.target.value }
                          })}
                          className={`text-xs p-1 rounded border outline-none ${isDarkMode ? 'bg-[#2a3942] border-[#3b4a54] text-[#e9edef]' : 'bg-white border-gray-200'}`}
                        >
                          <option value="default">Défaut</option>
                          <option value="chime">Carillon</option>
                          <option value="alert">Alerte</option>
                          <option value="none">Aucun</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Volume2 size={20} className="text-[#54656f]" />
                          <span className={`text-sm ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_notif_vibration')}</span>
                        </div>
                        <select 
                          value={userProfile.notificationSettings?.vibration || 'short'}
                          onChange={(e) => setUserProfile({
                            ...userProfile, 
                            notificationSettings: { ...userProfile.notificationSettings!, vibration: e.target.value as any }
                          })}
                          className={`text-xs p-1 rounded border outline-none ${isDarkMode ? 'bg-[#2a3942] border-[#3b4a54] text-[#e9edef]' : 'bg-white border-gray-200'}`}
                        >
                          <option value="none">Aucune</option>
                          <option value="short">Courte</option>
                          <option value="long">Longue</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeSettingsTab === 'storage' ? (
                <div className="space-y-6">
                  <div className={`p-4 space-y-6 ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Paperclip size={20} className="text-[#54656f]" />
                        <span className={`text-sm ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_auto_save')}</span>
                      </div>
                      <button 
                        onClick={() => setUserProfile({ ...userProfile, saveMultimedia: !userProfile.saveMultimedia })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${userProfile.saveMultimedia ? 'bg-[#00a884]' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userProfile.saveMultimedia ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500">{t('settings_auto_save_desc')}</p>
                    
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Database size={20} className="text-[#54656f]" />
                        <span className={`text-sm ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_network_usage')}</span>
                      </div>
                      <span className="text-xs text-[#667781]">1.2 GB</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <HelpCircle size={24} className="text-[#54656f]" />
                      <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_help_center')}</p>
                    </div>
                    <div className="p-4 flex items-center gap-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <MessageSquare size={24} className="text-[#54656f]" />
                      <p className={`font-medium ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{t('settings_contact_us')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirm Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-6 rounded-2xl shadow-xl max-w-sm w-full ${isDarkMode ? 'bg-[#2a3942]' : 'bg-white'}`}
            >
              <h3 className="text-lg font-bold mb-4">{t('settings_logout_confirm')}</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`flex-1 py-2 rounded-xl font-bold ${isDarkMode ? 'bg-[#3b4a54] text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {t('settings_cancel')}
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold"
                >
                  {t('settings_logout')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pages View */}
      <AnimatePresence>
        {showPages && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className={`absolute inset-0 md:relative md:w-[400px] z-40 flex flex-col border-r ${isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white border-[#d1d7db]'}`}
          >
            <div className="h-[108px] bg-[#008069] text-white flex items-end p-5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-6">
                  <button onClick={() => setShowPages(false)} className="cursor-pointer">
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-lg font-medium">Pages</h2>
                </div>
                <button 
                  onClick={() => setShowCreatePage(true)}
                  className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
              <div className="p-4 space-y-3">
                {pages.map(page => (
                  <div key={page.id} className={`p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer transition-colors ${isDarkMode ? 'bg-[#111b21] hover:bg-[#202c33]' : 'bg-white hover:bg-gray-50'}`}>
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                      <img src={page.avatar} alt={page.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{page.name}</h3>
                      <p className="text-xs text-[#667781] truncate">{page.description}</p>
                      <p className="text-[10px] text-[#00a884] font-bold mt-1">{page.followersCount} abonnés</p>
                    </div>
                    <button className="bg-[#00a884] text-white px-4 py-1.5 rounded-full text-xs font-bold">Suivre</button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status View */}
      <AnimatePresence>
        {showStatus && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className={`absolute inset-0 md:relative md:w-[400px] z-40 flex flex-col border-r ${isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white border-[#d1d7db]'}`}
          >
            <div className="h-[108px] bg-[#008069] text-white flex items-end p-5">
              <div className="flex items-center gap-6">
                <button onClick={() => setShowStatus(false)} className="cursor-pointer">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-medium">Statut</h2>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
              <div className={`p-4 flex items-center gap-4 mb-3 cursor-pointer ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img src={userProfile.photoURL} alt="My Status" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-[#00a884] text-white rounded-full p-0.5 border-2 border-white">
                    <Plus size={12} />
                  </div>
                </div>
                <div>
                  <h3 className={`font-bold ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Mon statut</h3>
                  <p className="text-xs text-[#667781]">Appuyez pour ajouter un statut</p>
                </div>
              </div>
              
              <div className="px-4 py-3">
                <p className="text-xs font-bold text-[#008069] uppercase mb-4">Mises à jour récentes</p>
                <div className="space-y-4">
                  {statuses.map(status => (
                    <div key={status.userId} className="flex items-center gap-4 cursor-pointer">
                      <div className="w-12 h-12 rounded-full p-0.5 border-2 border-[#00a884]">
                        <div className="w-full h-full rounded-full overflow-hidden">
                          <img src={status.userAvatar} alt={status.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                      <div>
                        <h3 className={`font-bold ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{status.userName}</h3>
                        <p className="text-xs text-[#667781]">Aujourd'hui à {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call History View */}
      <AnimatePresence>
        {showCallHistory && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className={`absolute inset-0 md:relative md:w-[400px] z-40 flex flex-col border-r ${isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white border-[#d1d7db]'}`}
          >
            <div className="h-[108px] bg-[#008069] text-white flex items-end p-5">
              <div className="flex items-center gap-6">
                <button onClick={() => setShowCallHistory(false)} className="cursor-pointer">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-medium">{t('calls_title')}</h2>
              </div>
              <button 
                onClick={() => setCallHistory([])}
                className="text-xs font-bold hover:bg-white/10 px-2 py-1 rounded transition-colors"
              >
                {t('calls_clear')}
              </button>
            </div>
            <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
              <div className="p-4 space-y-4">
                {callHistory.map(call => (
                  <div key={call.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img src={call.userAvatar} alt={call.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{call.userName}</h3>
                      <div className="flex items-center gap-1">
                        {call.status === 'missed' && <PhoneMissed size={14} className="text-red-500" />}
                        {call.status === 'received' && <PhoneIncoming size={14} className="text-[#00a884]" />}
                        {call.status === 'placed' && <PhoneOutgoing size={14} className="text-[#00a884]" />}
                        <p className="text-xs text-[#667781]">
                          {call.status === 'missed' ? t('calls_missed') : call.status === 'received' ? t('calls_received') : t('calls_placed')} • {new Date(call.timestamp).toLocaleDateString()} {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {call.duration && <span className="text-[10px] text-gray-400">{call.duration}</span>}
                      {call.type === 'audio' ? <Phone size={20} className="text-[#00a884]" /> : <Video size={20} className="text-[#00a884]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contacts View */}
      <AnimatePresence>
        {showContacts && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="absolute inset-0 md:relative md:w-[400px] bg-white z-40 flex flex-col border-r border-[#d1d7db]"
          >
            <div className="h-[108px] bg-[#008069] text-white flex items-end p-5">
              <div className="flex items-center gap-6">
                <button onClick={() => setShowContacts(false)} className="cursor-pointer">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-medium">Contacts</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#f0f2f5]">
              <div className="p-4 space-y-3">
                <p className="text-xs font-bold text-[#008069] uppercase mb-2">Contacts sur branmesage ({syncedContacts.length})</p>
                {syncedContacts.map(contact => (
                  <div 
                    key={contact.uid} 
                    className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleStartChat(contact)}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{contact.name}</h3>
                      <p className="text-xs text-[#667781] truncate">{contact.phoneNumber}</p>
                    </div>
                    <MessageSquare size={20} className="text-[#00a884]" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Chat View */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] relative ${(!activeChatId && !showSettings && !showPages && !showStatus) ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className={`h-[60px] px-4 flex items-center justify-between border-l z-10 ${isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#d1d7db]'}`}>
              <div className="flex items-center cursor-pointer">
                <button onClick={() => setActiveChatId(null)} className="md:hidden mr-2 text-[#54656f]">
                  <ArrowLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <img src={activeChat.isGroup ? activeChat.avatar : otherParticipant?.photoURL} alt={activeChat.isGroup ? activeChat.name : otherParticipant?.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className={`font-medium text-sm md:text-base ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{activeChat.isGroup ? activeChat.name : otherParticipant?.displayName}</h3>
                  <p className="text-[11px] md:text-xs text-[#667781]">
                    {activeChat.isGroup ? `${activeChat.participants.length} participants` : (isOffline ? t('chat_offline') : t('chat_online'))}
                  </p>
                </div>
              </div>
              <div className={`flex gap-4 md:gap-6 items-center ${isDarkMode ? 'text-[#aebac1]' : 'text-[#54656f]'}`}>
                <button 
                  onClick={() => {
                    if (!activeChatId) return;
                    const isMuted = userProfile.notificationSettings?.mutedChats.includes(activeChatId);
                    const newMuted = isMuted 
                      ? userProfile.notificationSettings?.mutedChats.filter(id => id !== activeChatId)
                      : [...(userProfile.notificationSettings?.mutedChats || []), activeChatId];
                    setUserProfile({
                      ...userProfile,
                      notificationSettings: {
                        ...userProfile.notificationSettings!,
                        mutedChats: newMuted as string[]
                      }
                    });
                  }}
                  className={`p-1 rounded-full transition-colors ${userProfile.notificationSettings?.mutedChats.includes(activeChatId!) ? 'text-orange-500 bg-orange-100/10' : 'hover:text-orange-500'}`}
                  title={userProfile.notificationSettings?.mutedChats.includes(activeChatId!) ? t('chat_unmute') : t('chat_mute')}
                >
                  <Bell size={20} />
                </button>
                <button 
                  onClick={() => handleBlockContact(otherParticipantId!)}
                  className={`p-1 rounded-full transition-colors ${blockedContactIds.includes(otherParticipantId!) ? 'text-red-500 bg-red-100/10' : 'hover:text-red-500'}`}
                  title={blockedContactIds.includes(otherParticipantId!) ? t('chat_unblock') : t('chat_block')}
                >
                  <Ban size={20} />
                </button>
                <button 
                  onClick={() => handleReportContact(otherParticipantId!)}
                  className="hover:text-red-500 transition-colors p-1"
                  title={t('chat_report')}
                >
                  <ShieldAlert size={20} />
                </button>
                {activeChat.isGroup ? (
                  <>
                    <Video 
                      size={20} 
                      className="cursor-pointer hover:text-[#00a884]" 
                      onClick={() => setActiveCall({ 
                        type: 'video', 
                        isGroup: true, 
                        groupName: activeChat.name, 
                        participants: activeChat.participants.map(id => chatParticipants[id]).filter(Boolean) 
                      })}
                    />
                    <Phone 
                      size={20} 
                      className="cursor-pointer hover:text-[#00a884]" 
                      onClick={() => setActiveCall({ 
                        type: 'audio', 
                        isGroup: true, 
                        groupName: activeChat.name, 
                        participants: activeChat.participants.map(id => chatParticipants[id]).filter(Boolean) 
                      })}
                    />
                  </>
                ) : (
                  <>
                    <Video 
                      size={20} 
                      className="cursor-pointer hover:text-[#00a884]" 
                      onClick={() => setActiveCall({ type: 'video', contact: otherParticipant })}
                    />
                    <Phone 
                      size={20} 
                      className="cursor-pointer hover:text-[#00a884]" 
                      onClick={() => setActiveCall({ type: 'audio', contact: otherParticipant })}
                    />
                  </>
                )}
                <div className={`w-[1px] h-6 mx-1 hidden md:block ${isDarkMode ? 'bg-[#3b4a54]' : 'bg-[#d1d7db]'}`}></div>
                <Search 
                  size={20} 
                  className={`cursor-pointer transition-colors ${showChatSearch ? 'text-[#00a884]' : ''}`} 
                  onClick={() => setShowChatSearch(!showChatSearch)}
                />
                <MoreVertical size={20} className="cursor-pointer" />
              </div>
            </div>

            {/* In-Chat Search Bar */}
            <AnimatePresence>
              {showChatSearch && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white border-b border-[#d1d7db] px-4 py-2 z-10 overflow-hidden"
                >
                  <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5">
                    <Search size={16} className="text-[#54656f] mr-3" />
                    <input 
                      type="text" 
                      placeholder="Rechercher dans la discussion" 
                      className="bg-transparent border-none outline-none text-sm w-full"
                      autoFocus
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                    />
                    {chatSearchQuery && (
                      <button onClick={() => setChatSearchQuery('')} className="text-[#54656f]">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"
            >
              {messages[activeChatId]?.filter(msg => 
                msg.text.toLowerCase().includes(chatSearchQuery.toLowerCase())
              ).map((msg, idx) => {
                const isMe = msg.senderId === userProfile.uid;
                const sender = chatParticipants[msg.senderId];
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <motion.div 
                      drag="x"
                      dragConstraints={{ left: isMe ? -100 : 0, right: isMe ? 0 : 100 }}
                      dragElastic={0.2}
                      onDragEnd={(_, info) => {
                        if (!isMe && info.offset.x > 50) {
                          setReplyToMessage(msg);
                        } else if (isMe && info.offset.x < -50) {
                          setReplyToMessage(msg);
                        }
                      }}
                      className="max-w-[85%] md:max-w-[65%] group relative cursor-grab active:cursor-grabbing"
                    >
                      {/* Swipe Indicator */}
                      <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-right-10' : '-left-10'} opacity-0 group-active:opacity-100 transition-opacity`}>
                        <Reply size={20} className="text-[#00a884]" />
                      </div>
                      <div 
                        className={`p-2 md:p-3 rounded-xl shadow-sm relative ${
                          isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'
                        }`}
                      >
                        {activeChat?.isGroup && !isMe && (
                          <p className="text-[10px] font-bold text-[#00a884] mb-1">{sender?.displayName || msg.senderId}</p>
                        )}
                        <p className="text-sm md:text-base whitespace-pre-wrap break-words pr-8">
                          {decryptMessage(msg.text)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[9px] md:text-[10px] text-[#667781]">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <span className="text-[#53bdeb]">
                              <CheckCheck size={14} />
                            </span>
                          )}
                        </div>

                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={`absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'} flex gap-1 bg-white rounded-full px-1.5 py-0.5 shadow-md border border-gray-100 z-10`}>
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <span key={emoji} className="text-xs flex items-center gap-0.5">
                                {emoji} <span className="text-[10px] text-gray-500">{(users as string[]).length}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Reaction Picker Trigger */}
                        <div className={`absolute top-0 ${isMe ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                          <button 
                            onClick={() => handleReaction(msg.id, '❤️')}
                            className={`${isDarkMode ? 'bg-[#2a3942]' : 'bg-white'} p-1 rounded-full shadow-md hover:scale-110 transition-transform text-xs`}
                          >
                            ❤️
                          </button>
                          <button 
                            onClick={() => handleReaction(msg.id, '👍')}
                            className={`${isDarkMode ? 'bg-[#2a3942]' : 'bg-white'} p-1 rounded-full shadow-md hover:scale-110 transition-transform text-xs`}
                          >
                            👍
                          </button>
                          <button 
                            onClick={() => {
                              setMessageToForward(msg);
                              setShowForwardModal(true);
                            }}
                            className={`${isDarkMode ? 'bg-[#2a3942] text-[#aebac1]' : 'bg-white text-[#54656f]'} p-1 rounded-full shadow-md hover:scale-110 transition-transform text-xs`}
                          >
                            <Forward size={14} />
                          </button>
                          <button 
                            onClick={() => setReplyToMessage(msg)}
                            className={`${isDarkMode ? 'bg-[#2a3942] text-[#aebac1]' : 'bg-white text-[#54656f]'} p-1 rounded-full shadow-md hover:scale-110 transition-transform text-xs`}
                            title="Répondre"
                          >
                            <Reply size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {/* E2EE Indicator */}
                      {msg.isEncrypted && (
                        <div className={`text-[9px] text-gray-400 mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <Lock size={10} /> {t('chat_encrypted')}
                          {msg.forwardedFrom && <span className="ml-1 italic">{t('chat_forwarded')}</span>}
                        </div>
                      )}
                      {msg.replyTo && (
                        <div className={`text-[9px] text-gray-400 mt-0.5 italic ${isMe ? 'text-right' : 'text-left'}`}>
                          {t('chat_reply_indicator')}
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`min-h-[62px] px-4 py-2 flex flex-col gap-2 ${isDarkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
              {replyToMessage && (
                <div className={`flex items-center justify-between p-2 rounded-lg border-l-4 border-[#00a884] ${isDarkMode ? 'bg-[#2a3942]' : 'bg-white'}`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#00a884]">{t('chat_reply_to')}</span>
                    <p className="text-xs truncate max-w-[200px]">{decryptMessage(replyToMessage.text)}</p>
                  </div>
                  <button onClick={() => setReplyToMessage(null)} className="text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex gap-2 md:gap-4 text-[#54656f]">
                  <div className="relative">
                    <Smile 
                      size={24} 
                      className={`cursor-pointer hover:text-[#00a884] transition-colors ${showEmojiPicker ? 'text-[#00a884]' : ''}`} 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    />
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className={`absolute bottom-12 left-0 p-3 rounded-2xl shadow-2xl border flex gap-2 z-50 min-w-[200px] ${isDarkMode ? 'bg-[#2a3942] border-[#3b4a54]' : 'bg-white border-gray-100'}`}
                        >
                          {EMOJIS.map(emoji => (
                            <button 
                              key={emoji} 
                              onClick={() => {
                                setInputText(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="text-xl hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Paperclip size={24} className="cursor-pointer hover:text-[#00a884]" />
                </div>
                <div className={`flex-1 flex items-center rounded-lg px-3 py-1 ${isDarkMode ? 'bg-[#2a3942]' : 'bg-white'}`}>
                  {isRecording ? (
                    <div className="flex-1 flex items-center gap-3 text-red-500 animate-pulse">
                      <Mic size={20} />
                      <span className="text-sm font-bold">{t('chat_recording')}</span>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      placeholder={isOffline && !isSubscribed ? t('chat_offline') : t('chat_input_placeholder')} 
                      className={`w-full py-1 outline-none text-sm md:text-base bg-transparent ${isOffline && !isSubscribed ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'text-[#e9edef] placeholder:text-[#8696a0]' : 'text-[#111b21]'}`}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={isOffline && !isSubscribed}
                    />
                  )}
                </div>
                <div className="text-[#54656f]">
                  {inputText.trim() ? (
                    <button onClick={handleSendMessage} className="bg-[#00a884] text-white p-2 rounded-full hover:bg-[#008f72] transition-colors">
                      <Send size={20} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleVoiceMessage}
                      className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white shadow-lg' : 'hover:bg-gray-200'}`}
                    >
                      <Mic size={24} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f8f9fa] border-l border-[#d1d7db]">
            <div className="w-64 h-64 mb-8 opacity-20">
              <MessageSquare size={256} className="text-[#00a884]" />
            </div>
            <h1 className="text-3xl font-light text-[#41525d] mb-4">branmesage Web</h1>
            <p className="text-[#667781] max-w-md leading-relaxed">
              {t('welcome_desc')}
            </p>
            {isSubscribed && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                {t('chat_offline')}
              </div>
            )}
            <div className="mt-auto text-[#8696a0] text-xs flex items-center gap-1">
              <CheckCheck size={14} /> {t('chat_encrypted')}
            </div>
          </div>
        )}
      </div>

      {/* Call Simulation Overlay */}
      <AnimatePresence>
        {activeCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#111b21] z-[100] flex flex-col items-center justify-center text-white p-8"
          >
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              {activeCall.isGroup ? (
                <div className="flex flex-col items-center">
                  <div className="flex -space-x-4 mb-6">
                    {activeCall.participants?.slice(0, 4).map((p, i) => (
                      <div key={i} className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#00a884] shadow-2xl bg-gray-700">
                        <img src={p.photoURL || p.avatar} alt={p.displayName || p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    {activeCall.participants && activeCall.participants.length > 4 && (
                      <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-[#00a884] shadow-2xl flex items-center justify-center font-bold text-xl">
                        +{activeCall.participants.length - 4}
                      </div>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">{activeCall.groupName}</h2>
                  <p className="text-[#8696a0] uppercase tracking-widest text-sm font-bold">
                    Appel de groupe {activeCall.type === 'video' ? 'vidéo' : 'audio'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-[#00a884] shadow-2xl">
                    <img src={activeCall.contact.avatar || activeCall.contact.photoURL} alt={activeCall.contact.name || activeCall.contact.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">{activeCall.contact.name || activeCall.contact.displayName}</h2>
                  <p className="text-[#8696a0] uppercase tracking-widest text-sm font-bold">
                    {activeCall.type === 'video' ? t('call_video_desc') : t('call_audio_desc')}
                  </p>
                </div>
              )}
              
              {activeCall.type === 'video' && (
                <div className="mt-12 w-full max-w-4xl grid grid-cols-2 gap-4">
                  {activeCall.isGroup ? (
                    activeCall.participants?.slice(0, 4).map((p, i) => (
                      <div key={i} className="aspect-video bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700 shadow-inner overflow-hidden relative">
                        <img src={p.photoURL || p.avatar} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#00a884] mb-2">
                             <img src={p.photoURL || p.avatar} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-bold">{p.displayName || p.name}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 aspect-video bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700 shadow-inner overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Video size={128} />
                      </div>
                      <p className="relative z-10 text-gray-400 font-medium italic">Simulation de flux vidéo branmesage</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-8 mb-12">
              <button className="bg-gray-700/50 p-6 rounded-full hover:bg-gray-700 transition-colors">
                <Mic size={32} />
              </button>
              <button 
                onClick={() => setActiveCall(null)}
                className="bg-red-500 p-6 rounded-full hover:bg-red-600 transition-colors shadow-xl transform active:scale-95"
              >
                <PhoneCall size={32} className="rotate-[135deg]" />
              </button>
              {activeCall.type === 'video' ? (
                <button className="bg-gray-700/50 p-6 rounded-full hover:bg-gray-700 transition-colors">
                  <VideoOff size={32} />
                </button>
              ) : (
                <button className="bg-gray-700/50 p-6 rounded-full hover:bg-gray-700 transition-colors">
                  <Volume2 size={32} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Instructions Modal */}
      {/* Changelog Modal */}
      <AnimatePresence>
        {showChangelog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-[#111b21] text-white' : 'bg-white text-[#111b21]'}`}
            >
              <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-[#222d34]' : 'border-gray-100'}`}>
                <h2 className="text-xl font-bold">Journal des modifications</h2>
                <button onClick={() => setShowChangelog(false)} className="text-[#667781] hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {CHANGELOG.map((entry: ChangelogEntry) => (
                  <div key={entry.version} className="relative pl-6 border-l-2 border-[#00a884]/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#00a884] border-4 border-white shadow-sm" />
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold bg-[#00a884] text-white px-2 py-0.5 rounded-full">v{entry.version}</span>
                      <span className="text-xs text-[#667781]">{entry.date}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-3">{entry.title}</h3>
                    <ul className="space-y-2">
                      {entry.changes.map((change, idx) => (
                        <li key={idx} className="text-sm text-[#667781] flex gap-2">
                          <span className="text-[#00a884] mt-1">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              <div className={`p-4 border-t text-center ${isDarkMode ? 'border-[#222d34]' : 'border-gray-100'}`}>
                <button 
                  onClick={() => setShowChangelog(false)}
                  className="bg-[#00a884] text-white px-8 py-2 rounded-xl font-bold hover:bg-[#008069] transition-colors"
                >
                  Génial !
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Group Modal */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-[#111b21] text-white' : 'bg-white text-[#111b21]'}`}
            >
              <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-[#222d34]' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowNewGroup(false)} className="text-[#667781]"><ArrowLeft size={24} /></button>
                  <h2 className="text-lg font-bold">Nouveau groupe</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <Camera size={24} />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Nom du groupe"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className={`w-full bg-transparent border-b-2 border-[#00a884] py-2 outline-none focus:border-[#00a884] transition-colors`}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#00a884] mb-4 uppercase">Sélectionner des participants</p>
                  <div className="space-y-2">
                    {syncedContacts.map(contact => (
                      <div 
                        key={contact.uid}
                        onClick={() => {
                          if (selectedContacts.includes(contact.uid)) {
                            setSelectedContacts(prev => prev.filter(id => id !== contact.uid));
                          } else {
                            setSelectedContacts(prev => [...prev, contact.uid]);
                          }
                        }}
                        className={`p-3 flex items-center gap-4 rounded-xl cursor-pointer transition-colors ${selectedContacts.includes(contact.uid) ? 'bg-[#00a884]/10' : isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img src={contact.avatar} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-xs text-[#667781]">{contact.phoneNumber}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedContacts.includes(contact.uid) ? 'bg-[#00a884] border-[#00a884]' : 'border-gray-300'}`}>
                          {selectedContacts.includes(contact.uid) && <Check size={14} className="text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className={`p-4 border-t text-center ${isDarkMode ? 'border-[#222d34]' : 'border-gray-100'}`}>
                <button 
                  onClick={handleCreateGroup}
                  disabled={!groupName || selectedContacts.length === 0}
                  className={`w-full py-3 rounded-xl font-bold transition-colors ${(!groupName || selectedContacts.length === 0) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#00a884] text-white hover:bg-[#008069]'}`}
                >
                  Créer le groupe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Status Modal */}
      <AnimatePresence>
        {showAddStatus && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#111b21] text-white' : 'bg-white text-[#111b21]'}`}
            >
              <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-[#222d34]' : 'border-gray-100'}`}>
                <h2 className="text-lg font-bold">Ajouter un statut</h2>
                <button onClick={() => setShowAddStatus(false)} className="text-[#667781]"><X size={24} /></button>
              </div>
              
              <div className="p-6 space-y-6">
                <div 
                  onClick={() => setNewStatusImage(`https://picsum.photos/seed/${Date.now()}/800/1200`)}
                  className="w-full aspect-[9/16] bg-gray-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
                >
                  {newStatusImage ? (
                    <>
                      <img src={newStatusImage} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={48} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={48} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Appuyez pour choisir une image</p>
                    </>
                  )}
                </div>

                <input 
                  type="text" 
                  placeholder="Ajouter une légende..."
                  value={newStatusCaption}
                  onChange={(e) => setNewStatusCaption(e.target.value)}
                  className={`w-full bg-transparent border-b-2 border-[#00a884] py-2 outline-none focus:border-[#00a884] transition-colors`}
                />
              </div>
              
              <div className={`p-4 border-t text-center ${isDarkMode ? 'border-[#222d34]' : 'border-gray-100'}`}>
                <button 
                  onClick={handleAddStatus}
                  disabled={!newStatusImage}
                  className={`w-full py-3 rounded-xl font-bold transition-colors ${!newStatusImage ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#00a884] text-white hover:bg-[#008069]'}`}
                >
                  Publier le statut
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showQRScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}
            >
              <div className="p-4 flex justify-between items-center border-b border-gray-100">
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#111b21]'}`}>Scanner un code QR</h2>
                <button onClick={() => setShowQRScanner(false)} className="text-[#667781]"><X size={24} /></button>
              </div>
              <div className="p-6">
                <div id="qr-reader" className="w-full rounded-xl overflow-hidden bg-black aspect-square"></div>
                <p className="text-center text-sm text-[#667781] mt-4">
                  Scannez le code QR d'un ami pour commencer à discuter instantanément.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My QR Code Modal */}
      <AnimatePresence>
        {showMyQRCode && userProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center ${isDarkMode ? 'bg-[#111b21] text-white' : 'bg-white text-[#111b21]'}`}
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setShowMyQRCode(false)} className="text-[#667781]"><X size={24} /></button>
              </div>
              
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#00a884]">
                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              </div>
              
              <h2 className="text-xl font-bold mb-1">{userProfile.displayName}</h2>
              <p className="text-sm text-[#667781] mb-8">Code QR Branmesage</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-8">
                <QRCodeSVG 
                  value={userProfile.uid} 
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: userProfile.photoURL,
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              
              <p className="text-xs text-[#667781] leading-relaxed">
                Votre code QR est privé. Si vous le partagez avec quelqu'un, il pourra vous envoyer des messages sur Branmesage.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPWAInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 ${isDarkMode ? 'bg-[#111b21] text-white' : 'bg-white text-[#111b21]'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Installer branmesage</h2>
                <button onClick={() => setShowPWAInstructions(false)}><X size={24} /></button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-[#00a884]/10 p-4 rounded-xl border border-[#00a884]/20">
                  <p className="text-sm leading-relaxed">
                    Pour une expérience optimale, installez branmesage sur votre écran d'accueil. Cela vous permettra d'utiliser l'application en plein écran, même sans connexion.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                    <div>
                      <p className="font-bold text-sm">Ouvrir dans un nouveau onglet</p>
                      <p className="text-xs text-gray-500">Assurez-vous de ne pas être dans l'interface de prévisualisation de Google AI Studio.</p>
                      <a 
                        href="https://ais-pre-r2fk3nmfw5nba3uheuldqh-181855842151.europe-west2.run.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#00a884] text-xs font-bold underline mt-1 block"
                      >
                        Ouvrir le lien direct
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                    <div>
                      <p className="font-bold text-sm">Ajouter à l'écran d'accueil</p>
                      <p className="text-xs text-gray-500">Sur iPhone : Partager {'>'} Sur l'écran d'accueil.</p>
                      <p className="text-xs text-gray-500">Sur Android : Menu (3 points) {'>'} Installer l'application.</p>
                      
                      {deferredPrompt && (
                        <button 
                          onClick={handleInstallClick}
                          className="mt-3 bg-[#00a884] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-[#008069] transition-colors flex items-center gap-2"
                        >
                          <Plus size={14} />
                          Installer maintenant
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowPWAInstructions(false)}
                  className="w-full bg-[#00a884] text-white py-3 rounded-xl font-bold mt-4"
                >
                  J'ai compris
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}
            >
              <div className="bg-[#00a884] p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={24} />
                  <h2 className="text-xl font-bold">Admin Panel</h2>
                </div>
                <button onClick={() => setShowAdminPanel(false)}><X size={24} /></button>
              </div>
              <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Subscription Requests */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-gray-500">Demandes d'abonnement</h3>
                  {pendingSubscriptions.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-xs">Aucune demande en attente</p>
                  ) : (
                    pendingSubscriptions.map(sub => (
                      <div key={sub.userId} className={`p-3 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-[#202c33] border-[#3b4a54]' : 'bg-gray-50 border-gray-200'}`}>
                        <div>
                          <p className="font-bold text-sm">{sub.name}</p>
                          <p className="text-[10px] text-gray-500">{sub.amount} CFA</p>
                        </div>
                        <button 
                          onClick={() => activateSubscription(sub.userId, sub.id)}
                          className="bg-[#00a884] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#008f72]"
                        >
                          Activer
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* User Management */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-gray-500">Gestion des utilisateurs</h3>
                  <div className="space-y-3">
                    {adminUsers.map(user => (
                      <div key={user.uid} className={`p-3 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-[#202c33] border-[#3b4a54]' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-sm">{user.displayName}</p>
                            <p className="text-[10px] text-gray-500">{user.phoneNumber}</p>
                            {user.isBlocked && (
                              <p className="text-[10px] text-red-500 font-bold">Bloqué jusqu'au {new Date(user.blockedUntil).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.isBlocked ? (
                            <button 
                              onClick={() => handleAdminUnblockUser(user.uid)}
                              className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold"
                            >
                              Débloquer
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleAdminBlockUser(user.uid)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold"
                            >
                              Bloquer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showForwardModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-[#00a884] p-6 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold">Transférer à...</h2>
                <button onClick={() => setShowForwardModal(false)}><X size={24} /></button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                {chats.map(chat => (
                  <ChatListItem 
                    key={chat.id}
                    chat={chat}
                    activeChatId={null}
                    userProfile={userProfile}
                    messages={messages}
                    onClick={() => handleForwardMessage(chat.id)}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCreatePage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-[#00a884] p-6 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold">Créer une Page</h2>
                <button onClick={() => setShowCreatePage(false)}><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-[#54656f] block mb-1">Nom de la page</label>
                  <input 
                    type="text" 
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="Ex: Passion Cuisine"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#00a884]"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-[#54656f] block mb-1">Description</label>
                  <textarea 
                    value={newPageDesc}
                    onChange={(e) => setNewPageDesc(e.target.value)}
                    placeholder="Décrivez votre page..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#00a884] h-24 resize-none"
                  />
                </div>
                <button 
                  onClick={handleCreatePage}
                  className="w-full bg-[#00a884] text-white py-3 rounded-xl font-bold hover:bg-[#008f72] transition-colors shadow-md"
                >
                  Créer la page
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscription && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-[#00a884] p-6 text-white relative">
                <button 
                  onClick={() => setShowSubscription(false)}
                  className="absolute top-4 right-4 hover:bg-white/20 p-1 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2">Abonnement branmesage</h2>
                <p className="opacity-90">Soutenez l'application et profitez de fonctionnalités premium.</p>
              </div>
              <div className="p-6">
                <div className={`flex items-center justify-between mb-4 p-4 rounded-xl border ${isDarkMode ? 'bg-[#2a3942] border-[#3b4a54]' : 'bg-[#f0f2f5] border-[#d1d7db]'}`}>
                  <div>
                    <p className="text-sm text-[#667781] uppercase tracking-wider font-semibold">Prix Mensuel</p>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{SUBSCRIPTION_PRICE_CFA} CFA</p>
                  </div>
                  <div className="bg-[#25d366] text-white p-3 rounded-full">
                    <CreditCard size={32} />
                  </div>
                </div>

                {userProfile.points > 0 && (
                  <div className={`mb-6 p-3 rounded-lg flex items-center justify-between border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700/50' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-2">
                      <Award size={20} className="text-yellow-600" />
                      <div>
                        <p className={`text-xs font-bold ${isDarkMode ? 'text-yellow-500' : 'text-yellow-800'}`}>Bonus Points ({userProfile.points} pts)</p>
                        <p className={`text-[10px] ${isDarkMode ? 'text-yellow-600' : 'text-yellow-700'}`}>Réduction de {pointsBonus} CFA appliquée !</p>
                      </div>
                    </div>
                    <p className={`text-lg font-black ${isDarkMode ? 'text-yellow-500' : 'text-yellow-800'}`}>-{pointsBonus} CFA</p>
                  </div>
                )}

                <div className={`mb-6 p-4 rounded-xl flex justify-between items-center shadow-inner ${isDarkMode ? 'bg-[#202c33] text-white' : 'bg-[#111b21] text-white'}`}>
                  <span className="font-medium">Total à payer :</span>
                  <span className="text-2xl font-black text-[#25d366]">{finalPrice} CFA</span>
                </div>

                <div className="mb-6">
                  <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-[#8696a0]' : 'text-[#54656f]'}`}>Paiement par transfert au numéro :</p>
                  <div className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 mb-4 ${isDarkMode ? 'border-[#3b4a54] bg-[#2a3942]' : 'border-[#00a884] bg-green-50'}`}>
                    <Phone size={24} className="text-[#00a884]" />
                    <span className="text-2xl font-black text-[#00a884] tracking-widest">651 715 307</span>
                  </div>
                  <button 
                    onClick={() => handleSubscribeRequest(finalPrice)}
                    className="w-full bg-[#00a884] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#008f72] transition-all transform active:scale-95 shadow-lg"
                  >
                    J'ai envoyé le paiement
                  </button>
                  <p className="text-[10px] text-center text-gray-500 mt-3 italic">
                    Un administrateur activera votre compte après confirmation du paiement.
                  </p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {[
                    "Messages illimités (Même hors-ligne !)",
                    "Appels vidéo HD",
                    "Pas de publicités",
                    "Support prioritaire",
                    "Thèmes exclusifs"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#54656f] text-sm">
                      <div className="bg-[#e7fce3] text-[#00a884] p-1 rounded-full">
                        <Check size={12} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => {
                    setIsSubscribed(true);
                    setShowSubscription(false);
                    // Reset points after use
                    setUserProfile(prev => ({ ...prev, points: 0 }));
                    alert(`Merci pour votre abonnement à branmesage via ${paymentMethod === 'card' ? 'Carte Bancaire' : paymentMethod === 'orange' ? 'Orange Money' : 'MTN Mobile Money'} ! Vos points ont été utilisés.`);
                  }}
                  className="w-full bg-[#00a884] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#008f72] transition-all transform active:scale-95 shadow-lg"
                >
                  Payer {finalPrice} CFA
                </button>
                <p className="text-center text-[10px] text-[#8696a0] mt-4">
                  En payant, vous acceptez les conditions de branmesage.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* branIA Floating Button */}
      <div className="fixed bottom-6 left-6 z-[100]">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowBranIA(!showBranIA)}
          className="w-14 h-14 bg-[#00a884] text-white rounded-full shadow-2xl flex items-center justify-center relative group"
        >
          <Bot size={32} />
          <span className="absolute left-16 bg-white text-[#111b21] px-3 py-1 rounded-lg text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Parler à branIA
          </span>
        </motion.button>
      </div>

      {/* branIA Chat Window */}
      <AnimatePresence>
        {showBranIA && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20, y: 20 }}
            className={`fixed bottom-24 left-6 w-[350px] h-[500px] rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden border ${isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white border-gray-200'}`}
          >
            {/* Header */}
            <div className="bg-[#00a884] p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">branIA</h3>
                  <p className="text-[10px] opacity-80">Assistant Intelligent</p>
                </div>
              </div>
              <button onClick={() => setShowBranIA(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
              {branIAMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#00a884] text-white rounded-tr-none' 
                      : (isDarkMode ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none' : 'bg-white text-[#111b21] rounded-tl-none shadow-sm')
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isBranIATyping && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-2xl rounded-tl-none flex gap-1 ${isDarkMode ? 'bg-[#202c33]' : 'bg-white shadow-sm'}`}>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={branIAMessagesEndRef} />
            </div>

            {/* Input */}
            <div className={`p-3 border-t ${isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-white border-gray-100'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Posez votre question..."
                  value={branIAInput}
                  onChange={(e) => setBranIAInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBranIASend()}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm outline-none ${isDarkMode ? 'bg-[#2a3942] text-white' : 'bg-gray-100 text-gray-700'}`}
                />
                <button
                  onClick={handleBranIASend}
                  disabled={!branIAInput.trim() || isBranIATyping}
                  className="bg-[#00a884] text-white p-2 rounded-xl disabled:opacity-50 transition-opacity"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6"
            >
              <h2 className="text-xl font-bold text-[#111b21] mb-4">Déconnexion ?</h2>
              <p className="text-[#667781] mb-8">Êtes-vous sûr de vouloir vous déconnecter de branmesage ?</p>
              <div className="flex gap-4 justify-end">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-2 rounded-lg font-medium text-[#54656f] hover:bg-[#f0f2f5] transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmLogout}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-md"
                >
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
