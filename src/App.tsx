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
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS, SUBSCRIPTION_PRICE_CFA } from './constants';
import { Chat, Message, UserProfile, Page, UserStatus, Story, Contact } from './types';

// Mock Current User
const INITIAL_USER: UserProfile = {
  uid: 'user-1',
  displayName: 'Moi',
  photoURL: 'https://picsum.photos/seed/me/200',
  email: 'me@example.com',
  phoneNumber: '651715307',
  lastSeen: new Date(),
  isSubscribed: false,
  points: 150,
  isAdmin: true, // For demo purposes
  notificationSettings: {
    sound: 'default',
    vibration: 'short',
    mutedChats: [],
    mutedContacts: [],
  },
  saveMultimedia: true,
};

// Initial Mock Data
const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat-1',
    participants: ['user-1', 'contact-1'],
    lastMessage: 'Salut ! Comment ça va ?',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: { 'user-1': 2 },
  },
  {
    id: 'chat-2',
    participants: ['user-1', 'contact-2'],
    lastMessage: 'On se voit demain pour le projet branmesage ?',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unreadCount: { 'user-1': 0 },
  },
];

const CONTACTS: { [key: string]: { name: string, avatar: string } } = {
  'contact-1': { name: 'Alice', avatar: 'https://picsum.photos/seed/alice/200' },
  'contact-2': { name: 'Bob', avatar: 'https://picsum.photos/seed/bob/200' },
};

// Mock "Database" of all app users
const ALL_APP_USERS: Contact[] = [
  { uid: 'contact-1', name: 'Alice', avatar: 'https://picsum.photos/seed/alice/200', phoneNumber: '677000001', isAppUser: true },
  { uid: 'contact-2', name: 'Bob', avatar: 'https://picsum.photos/seed/bob/200', phoneNumber: '677000002', isAppUser: true },
  { uid: 'contact-3', name: 'Charlie', avatar: 'https://picsum.photos/seed/charlie/200', phoneNumber: '677000003', isAppUser: true },
  { uid: 'contact-4', name: 'David', avatar: 'https://picsum.photos/seed/david/200', phoneNumber: '677000004', isAppUser: true },
  { uid: 'contact-5', name: 'Emma', avatar: 'https://picsum.photos/seed/emma/200', phoneNumber: '677000005', isAppUser: true },
];

// Mock "Database" for Admin Panel (with more details)
const ADMIN_USER_LIST: UserProfile[] = [
  { uid: 'user-1', displayName: 'Moi', photoURL: 'https://picsum.photos/seed/me/200', email: 'me@example.com', phoneNumber: '651715307', lastSeen: new Date(), isSubscribed: false, points: 150, isAdmin: true },
  { uid: 'contact-1', displayName: 'Alice', photoURL: 'https://picsum.photos/seed/alice/200', email: 'alice@example.com', phoneNumber: '677000001', lastSeen: new Date(), isSubscribed: true, points: 50 },
  { uid: 'contact-2', displayName: 'Bob', photoURL: 'https://picsum.photos/seed/bob/200', email: 'bob@example.com', phoneNumber: '677000002', lastSeen: new Date(), isSubscribed: false, points: 20 },
  { uid: 'contact-3', displayName: 'Charlie', photoURL: 'https://picsum.photos/seed/charlie/200', email: 'charlie@example.com', phoneNumber: '677000003', lastSeen: new Date(), isSubscribed: false, points: 10 },
];

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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({
    'chat-1': [
      { id: 'm1', chatId: 'chat-1', senderId: 'contact-1', text: 'Salut !', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), type: 'text' },
      { id: 'm2', chatId: 'chat-1', senderId: 'contact-1', text: 'Comment ça va ?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'text' },
    ],
    'chat-2': [
      { id: 'm3', chatId: 'chat-2', senderId: 'contact-2', text: 'Hello!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), type: 'text' },
      { id: 'm4', chatId: 'chat-2', senderId: 'user-1', text: 'Salut Bob', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), type: 'text' },
      { id: 'm5', chatId: 'chat-2', senderId: 'contact-2', text: 'On se voit demain pour le projet branmesage ?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), type: 'text' },
    ]
  });
  const [inputText, setInputText] = useState('');
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPages, setShowPages] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video', contact: any } | null>(null);
  const [pages, setPages] = useState<Page[]>([
    { id: 'p1', name: 'Branmesage News', description: 'Toutes les nouveautés de votre application.', ownerId: 'system', avatar: 'https://picsum.photos/seed/news/200', followersCount: 1250 }
  ]);
  const [statuses, setStatuses] = useState<UserStatus[]>([
    {
      userId: 'contact-1',
      userName: 'Alice',
      userAvatar: 'https://picsum.photos/seed/alice/200',
      stories: [
        { id: 's1', userId: 'contact-1', imageUrl: 'https://picsum.photos/seed/s1/400/700', timestamp: new Date(), caption: 'Belle journée !' }
      ]
    },
    {
      userId: 'contact-2',
      userName: 'Bob',
      userAvatar: 'https://picsum.photos/seed/bob/200',
      stories: [
        { id: 's2', userId: 'contact-2', imageUrl: 'https://picsum.photos/seed/s2/400/700', timestamp: new Date(), caption: 'En plein travail sur branmesage' }
      ]
    }
  ]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
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
  const [pendingSubscriptions, setPendingSubscriptions] = useState<{userId: string, name: string, amount: number}[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatId]);

  // Auto-sync contacts on mount
  useEffect(() => {
    if (isLoggedIn) {
      const synced = ALL_APP_USERS.filter(user => 
        PHONE_ADDRESS_BOOK.some(contact => contact.phoneNumber === user.phoneNumber)
      ).sort((a, b) => a.name.localeCompare(b.name));
      setSyncedContacts(synced);
      
      // Request Notification Permission
      if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            console.log("Notification permission granted (Simulation FCM)");
          }
        });
      }
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setIsLoggedIn(false);
    setActiveChatId(null);
    setShowLogoutConfirm(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
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
      const synced = ALL_APP_USERS.filter(user => 
        PHONE_ADDRESS_BOOK.some(contact => contact.phoneNumber === user.phoneNumber)
      ).sort((a, b) => a.name.localeCompare(b.name));
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

  const handleCreatePage = () => {
    if (!newPageName.trim()) return;
    const newPage: Page = {
      id: Date.now().toString(),
      name: newPageName,
      description: newPageDesc,
      ownerId: userProfile.uid,
      avatar: `https://picsum.photos/seed/${newPageName}/200`,
      followersCount: 0
    };
    setPages([...pages, newPage]);
    setNewPageName('');
    setNewPageDesc('');
    setShowCreatePage(false);
    alert(`Page "${newPageName}" créée avec succès !`);
  };

  const handleUpdateAvatar = () => {
    if (!newAvatarUrl.trim()) return;
    setUserProfile({ ...userProfile, photoURL: newAvatarUrl });
    setNewAvatarUrl('');
    alert("Photo de profil mise à jour !");
  };

  const handleVoiceMessage = () => {
    if (!activeChatId) return;
    if (isRecording) {
      // Stop recording and send simulation
      const newMessage: Message = {
        id: Date.now().toString(),
        chatId: activeChatId,
        senderId: userProfile.uid,
        text: "🎤 Message vocal (Simulation)",
        timestamp: new Date().toISOString(),
        type: 'text',
      };
      setMessages(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), newMessage]
      }));
      setIsRecording(false);
      // Earn points for using features
      setUserProfile(prev => ({ ...prev, points: prev.points + 5 }));
    } else {
      setIsRecording(true);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChatId) return;

    // Check if user is blocked by admin
    if (userProfile.isBlocked) {
      alert(`Votre compte est bloqué jusqu'au ${new Date(userProfile.blockedUntil).toLocaleDateString()}. Contactez le support.`);
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

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: activeChatId,
      senderId: userProfile.uid,
      text: encryptMessage(inputText),
      timestamp: new Date().toISOString(),
      type: 'text',
      isEncrypted: true,
      status: 'sent',
      replyTo: replyToMessage?.id
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMessage]
    }));
    setInputText('');
    setReplyToMessage(null);

    // Simulate auto-reply if "online" or subscribed
    if (!isOffline || isSubscribed) {
      setTimeout(() => {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          chatId: activeChatId,
          senderId: activeChatId === 'chat-1' ? 'contact-1' : 'contact-2',
          text: isOffline ? "Reçu via le réseau branmesage (Hors-ligne) !" : "C'est noté ! (Réponse automatique branmesage)",
          timestamp: new Date().toISOString(),
          type: 'text',
          isEncrypted: true,
          status: 'read'
        };
        setMessages(prev => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), reply]
        }));
        
        // Simulate Push Notification
        if (document.visibilityState !== 'visible') {
          new Notification("Nouveau message branmesage", {
            body: decryptMessage(reply.text),
            icon: '/favicon.ico'
          });
        }
      }, 1500);
    }
  };

  const handleBlockContact = (contactId: string) => {
    if (blockedContactIds.includes(contactId)) {
      setBlockedContactIds(prev => prev.filter(id => id !== contactId));
      alert("Contact débloqué.");
    } else {
      setBlockedContactIds(prev => [...prev, contactId]);
      alert("Contact bloqué.");
    }
  };

  const handleReportContact = (contactId: string) => {
    alert("Contact signalé aux administrateurs de branmesage.");
  };

  const handleSubscribeRequest = (amount: number) => {
    alert(`Veuillez envoyer ${amount} CFA au numéro 651 715 307. Votre abonnement sera activé par un administrateur après réception.`);
    setPendingSubscriptions(prev => [...prev, { 
      userId: userProfile.uid, 
      name: userProfile.displayName, 
      amount 
    }]);
  };

  const activateSubscription = (userId: string) => {
    if (userId === userProfile.uid) {
      setIsSubscribed(true);
      setUserProfile(prev => ({ ...prev, isSubscribed: true }));
    }
    setPendingSubscriptions(prev => prev.filter(s => s.userId !== userId));
    alert("Abonnement activé avec succès !");
  };

  const handleAdminBlockUser = (userId: string) => {
    const days = prompt("Bloquer pour combien de jours ?", "7");
    if (days) {
      const duration = parseInt(days);
      if (isNaN(duration)) return;
      
      const blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + duration);
      
      alert(`Utilisateur bloqué pour ${days} jours.`);
      // In a real app, update DB. Here we just simulate for the current user if it's them
      if (userId === userProfile.uid) {
        setUserProfile(prev => ({ ...prev, isBlocked: true, blockedUntil: blockedUntil.toISOString() }));
      }
    }
  };

  const handleAdminUnblockUser = (userId: string) => {
    alert("Utilisateur débloqué.");
    if (userId === userProfile.uid) {
      setUserProfile(prev => ({ ...prev, isBlocked: false, blockedUntil: null }));
    }
  };

  const handleForwardMessage = (targetChatId: string) => {
    if (!messageToForward) return;

    const forwardedMessage: Message = {
      ...messageToForward,
      id: Date.now().toString(),
      chatId: targetChatId,
      senderId: userProfile.uid,
      timestamp: new Date().toISOString(),
      forwardedFrom: messageToForward.senderId,
      status: 'sent'
    };

    setMessages(prev => ({
      ...prev,
      [targetChatId]: [...(prev[targetChatId] || []), forwardedMessage]
    }));

    setShowForwardModal(false);
    setMessageToForward(null);
    setActiveChatId(targetChatId);
    alert("Message transféré !");
  };

  const EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🙏', '🔥'];

  if (!isLoggedIn) {
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
          <h1 className="text-3xl font-bold text-[#111b21] mb-2">branmesage</h1>
          <p className="text-[#667781] mb-8">Connectez-vous avec votre numéro de téléphone</p>
          
          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-[#00a884] uppercase mb-1">Numéro de téléphone</label>
            <div className="flex gap-2">
              <div className="bg-gray-100 px-3 py-3 rounded-xl text-sm font-bold text-gray-500 flex items-center">+237</div>
              <input 
                type="tel" 
                placeholder="6XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 bg-gray-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884] transition-all"
              />
            </div>
          </div>

          <button 
            onClick={() => {
              if (phoneNumber.length >= 8) {
                handleLogin();
              } else {
                alert("Veuillez entrer un numéro de téléphone valide.");
              }
            }}
            className="w-full bg-[#00a884] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#008f72] transition-all transform active:scale-95 shadow-lg"
          >
            Se connecter
          </button>
          <p className="mt-6 text-[10px] text-gray-400">
            En continuant, vous acceptez de recevoir un SMS de confirmation (Simulation).
          </p>
        </motion.div>
      </div>
    );
  }

  const activeChat = INITIAL_CHATS.find(c => c.id === activeChatId);
  const otherParticipantId = activeChat?.participants.find(p => p !== userProfile.uid);
  const otherParticipant = otherParticipantId ? CONTACTS[otherParticipantId] : null;

  const pointsBonus = Math.floor(userProfile.points / 10); // 10 points = 1 CFA bonus
  const finalPrice = Math.max(0, SUBSCRIPTION_PRICE_CFA - pointsBonus);

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-[#f0f2f5] text-[#111b21]'}`}>
      {/* Left Sidebar */}
      <div className={`w-full md:w-[400px] border-r border-[#d1d7db] flex flex-col ${isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white'} ${activeChatId || showPages || showSettings ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className={`h-[60px] px-4 flex items-center justify-between ${isDarkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-2 border-white shadow-sm hover:opacity-80 transition-opacity"
            >
              <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            {isSubscribed && (
              <span className="bg-[#00a884] text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Premium</span>
            )}
          </div>
          <div className={`flex gap-3 md:gap-4 items-center ${isDarkMode ? 'text-[#aebac1]' : 'text-[#54656f]'}`}>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
              title={isDarkMode ? "Mode Clair" : "Mode Sombre"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm ${isDarkMode ? 'bg-[#2a3942] border-[#3b4a54]' : 'bg-white border-gray-200'}`} title="Vos points branmesage">
              <Award size={14} className="text-yellow-500" />
              <span className="text-xs font-bold">{userProfile.points}</span>
            </div>
            <button 
              onClick={() => setIsOffline(!isOffline)} 
              className={`p-1.5 rounded-full transition-colors ${isOffline ? 'bg-red-100 text-red-600' : 'hover:bg-gray-200'}`}
              title={isOffline ? "Mode Hors-ligne" : "Mode En-ligne"}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`} />
            </button>
            <button onClick={() => setShowStatus(true)} className="hover:text-[#00a884] transition-colors cursor-pointer p-1" title="Statuts">
              <CircleDashed size={22} />
            </button>
            <button onClick={() => setShowContacts(true)} className="hover:text-[#00a884] transition-colors cursor-pointer p-1" title="Contacts">
              <Users size={22} />
            </button>
            <button onClick={syncContacts} className="hover:text-[#00a884] transition-colors cursor-pointer p-1" title="Synchroniser les contacts">
              <History size={22} />
            </button>
            <button onClick={() => setShowPages(true)} className="hover:text-[#00a884] transition-colors cursor-pointer p-1" title="Pages">
              <Flag size={22} />
            </button>
            <button onClick={() => setShowSubscription(true)} className="hover:text-[#00a884] transition-colors cursor-pointer p-1" title="Abonnement">
              <CreditCard size={22} />
            </button>
            {userProfile.uid === 'user-1' && (
              <button onClick={() => setShowAdminPanel(true)} className="hover:text-[#00a884] transition-colors cursor-pointer p-1" title="Admin Panel">
                <ShieldAlert size={22} />
              </button>
            )}
            <button onClick={handleLogout} className="hover:text-red-500 transition-colors cursor-pointer p-1" title="Déconnexion">
              <LogOut size={22} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={`p-2 ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
          <div className={`rounded-lg flex items-center px-3 py-1.5 ${isDarkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
            <Search size={18} className={`${isDarkMode ? 'text-[#aebac1]' : 'text-[#54656f]'} mr-4`} />
            <input 
              type="text" 
              placeholder="Rechercher ou démarrer une discussion" 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#54656f] text-inherit"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {INITIAL_CHATS.filter(chat => {
            const contactId = chat.participants.find(p => p !== userProfile.uid);
            const contact = contactId ? CONTACTS[contactId] : null;
            return contact?.name.toLowerCase().includes(searchQuery.toLowerCase());
          }).map(chat => {
            const contactId = chat.participants.find(p => p !== userProfile.uid);
            const contact = contactId ? CONTACTS[contactId] : null;
            const lastMsg = messages[chat.id]?.[messages[chat.id].length - 1];
            
            return (
              <div 
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  setShowPages(false);
                  setShowSettings(false);
                }}
                className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors border-b border-[#f0f2f5] ${activeChatId === chat.id ? 'bg-[#f0f2f5]' : ''}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
                  <img src={contact?.avatar} alt={contact?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium truncate">{contact?.name}</h3>
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
          }).length === 0 && (
            <div className="p-8 text-center text-[#667781] text-sm">
              Aucun contact trouvé
            </div>
          )}
        </div>

        {/* Floating Action Button for Contacts */}
        <button 
          onClick={() => setShowAddContact(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#00a884] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-20"
        >
          <UserPlus size={24} />
        </button>
      </div>

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
                <button onClick={() => setShowSettings(false)} className="cursor-pointer">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-medium">Paramètres</h2>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0b141a]' : 'bg-[#f0f2f5]'}`}>
              <div className={`p-8 flex flex-col items-center mb-3 ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
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
                    <label className="text-xs text-[#008069] font-medium mb-1 block">Votre nom</label>
                    <div className={`flex items-center justify-between border-b pb-1 ${isDarkMode ? 'border-[#3b4a54]' : 'border-gray-200'}`}>
                      <span className={`${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{userProfile.displayName}</span>
                      <Settings size={18} className="text-[#54656f] cursor-pointer" />
                    </div>
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
              <div className={`p-4 space-y-6 ${isDarkMode ? 'bg-[#111b21]' : 'bg-white'}`}>
                <div className={`flex items-center gap-6 text-[#54656f] cursor-pointer p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}>
                  <Award size={24} className="text-yellow-500" />
                  <div>
                    <p className={`${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Points branmesage</p>
                    <p className="text-xs">Vous avez {userProfile.points} points. Utilisez-les pour des bonus !</p>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-[#008069] uppercase">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Bell size={20} className="text-[#54656f]" />
                        <span className={`text-sm ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Son de notification</span>
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
                        <span className={`text-sm ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Vibration</span>
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

                {/* Multimedia Settings */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-[#008069] uppercase">Multimédia</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Paperclip size={20} className="text-[#54656f]" />
                      <span className={`text-sm ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Enregistrer automatiquement</span>
                    </div>
                    <button 
                      onClick={() => setUserProfile({ ...userProfile, saveMultimedia: !userProfile.saveMultimedia })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${userProfile.saveMultimedia ? 'bg-[#00a884]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userProfile.saveMultimedia ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className={`flex items-center gap-6 text-[#54656f] cursor-pointer p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}>
                  <MessageSquare size={24} />
                  <p className={`${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>Discussions</p>
                </div>
                <div className={`flex items-center gap-6 text-[#54656f] cursor-pointer p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-50'}`}>
                  <LogOut size={24} className="text-red-500" />
                  <p className={`${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`} onClick={handleLogout}>Déconnexion</p>
                </div>
              </div>
            </div>
          </motion.div>
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
                    onClick={() => {
                      // Start chat logic
                      setActiveChatId(contact.uid === 'contact-1' ? 'chat-1' : 'chat-2');
                      setShowContacts(false);
                    }}
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
        {activeChatId && otherParticipant ? (
          <>
            {/* Chat Header */}
            <div className={`h-[60px] px-4 flex items-center justify-between border-l z-10 ${isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#d1d7db]'}`}>
              <div className="flex items-center cursor-pointer">
                <button onClick={() => setActiveChatId(null)} className="md:hidden mr-2 text-[#54656f]">
                  <ArrowLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <img src={otherParticipant.avatar} alt={otherParticipant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className={`font-medium text-sm md:text-base ${isDarkMode ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{otherParticipant.name}</h3>
                  <p className="text-[11px] md:text-xs text-[#667781]">
                    {isOffline ? 'Mode Hors-ligne' : 'En ligne'}
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
                  title={userProfile.notificationSettings?.mutedChats.includes(activeChatId!) ? "Réactiver les notifications" : "Sourdine"}
                >
                  <Bell size={20} />
                </button>
                <button 
                  onClick={() => handleBlockContact(otherParticipantId!)}
                  className={`p-1 rounded-full transition-colors ${blockedContactIds.includes(otherParticipantId!) ? 'text-red-500 bg-red-100/10' : 'hover:text-red-500'}`}
                  title={blockedContactIds.includes(otherParticipantId!) ? "Débloquer" : "Bloquer"}
                >
                  <Ban size={20} />
                </button>
                <button 
                  onClick={() => handleReportContact(otherParticipantId!)}
                  className="hover:text-red-500 transition-colors p-1"
                  title="Signaler"
                >
                  <ShieldAlert size={20} />
                </button>
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
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] md:max-w-[65%] group relative">
                      <div 
                        className={`p-2 md:p-3 rounded-xl shadow-sm relative ${
                          isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'
                        }`}
                      >
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
                          <Lock size={10} /> Chiffré de bout en bout
                          {msg.forwardedFrom && <span className="ml-1 italic">(Transféré)</span>}
                        </div>
                      )}
                      {msg.replyTo && (
                        <div className={`text-[9px] text-gray-400 mt-0.5 italic ${isMe ? 'text-right' : 'text-left'}`}>
                          En réponse à un message
                        </div>
                      )}
                    </div>
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
                    <span className="text-[10px] font-bold text-[#00a884]">Réponse à</span>
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
                      <span className="text-sm font-bold">Enregistrement...</span>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      placeholder={isOffline && !isSubscribed ? "Hors-ligne (Abonnez-vous pour envoyer)" : "Taper un message"} 
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
              Envoyez et recevez des messages sans utiliser votre téléphone. 
              branmesage est gratuit et sécurisé.
            </p>
            {isSubscribed && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                Mode Hors-ligne activé : Envoyez des messages même sans internet !
              </div>
            )}
            <div className="mt-auto text-[#8696a0] text-xs flex items-center gap-1">
              <CheckCheck size={14} /> Chiffré de bout en bout
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
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-[#00a884] shadow-2xl">
                <img src={activeCall.contact.avatar} alt={activeCall.contact.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{activeCall.contact.name}</h2>
              <p className="text-[#8696a0] uppercase tracking-widest text-sm font-bold">
                Appel {activeCall.type === 'video' ? 'Vidéo' : 'Audio'}...
              </p>
              
              {activeCall.type === 'video' && (
                <div className="mt-12 w-full max-w-2xl aspect-video bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700 shadow-inner overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Video size={128} />
                  </div>
                  <p className="relative z-10 text-gray-400 font-medium italic">Simulation de flux vidéo branmesage</p>
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
                          onClick={() => activateSubscription(sub.userId)}
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
                    {ADMIN_USER_LIST.map(user => (
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
                {INITIAL_CHATS.map(chat => {
                  const otherId = chat.participants.find(p => p !== userProfile.uid);
                  const other = CONTACTS[otherId || ''];
                  return (
                    <div 
                      key={chat.id} 
                      onClick={() => handleForwardMessage(chat.id)}
                      className="flex items-center gap-4 p-3 hover:bg-gray-100 cursor-pointer rounded-xl transition-colors"
                    >
                      <img src={other?.avatar} alt={other?.name} className="w-12 h-12 rounded-full object-cover" />
                      <span className="font-bold">{other?.name}</span>
                    </div>
                  );
                })}
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
