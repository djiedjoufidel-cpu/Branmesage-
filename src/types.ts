export interface ThemeSettings {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isCustom?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  lastSeen: any; // Timestamp
  isSubscribed: boolean;
  subscriptionExpiry?: any; // Timestamp
  points: number;
  isAdmin?: boolean;
  phoneNumber?: string;
  isBlocked?: boolean;
  blockedUntil?: any; // Timestamp
  notificationSettings?: {
    sound: string;
    vibration: 'none' | 'short' | 'long';
    mutedChats: string[]; // List of chatIds
    mutedContacts: string[]; // List of userIds
    blockedContacts: string[]; // List of userIds
  };
  saveMultimedia?: boolean;
  language?: string;
  fcmToken?: string;
  themeSettings?: ThemeSettings;
}

export interface Page {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  avatar: string;
  followersCount: number;
}

export interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  timestamp: any; // Timestamp
  caption?: string;
}

export interface UserStatus {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: Story[];
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: any; // Timestamp
  unreadCount?: { [uid: string]: number };
  isGroup?: boolean;
  name?: string;
  avatar?: string;
}

export interface Contact {
  uid: string;
  name: string;
  avatar: string;
  phoneNumber: string;
  isAppUser: boolean;
  isBlocked?: boolean;
  isReported?: boolean;
}

export interface CallRecord {
  id: string;
  userId?: string; // The other person (for 1-on-1)
  userName: string;
  userAvatar: string;
  participants?: string[]; // List of userIds for group calls
  isGroup?: boolean;
  type: 'audio' | 'video';
  status: 'missed' | 'received' | 'placed';
  timestamp: any; // Timestamp
  duration?: string; // e.g., "5:23"
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: any; // Timestamp
  type: 'text' | 'image' | 'voice' | 'audio' | 'video';
  status?: 'sent' | 'delivered' | 'read';
  reactions?: { [emoji: string]: string[] }; // emoji -> list of userIds
  isEncrypted?: boolean;
  forwardedFrom?: string; // userId of original sender
  replyTo?: string; // messageId
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}
