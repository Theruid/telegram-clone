export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
  last_seen: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  profile: User;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Chat {
  contact: Contact;
  messages: Message[];
  lastMessage?: Message;
}