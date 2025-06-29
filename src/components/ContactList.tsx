import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contact, Chat, Message } from '../types';
import { UserPlus, Search, Circle } from 'lucide-react';
import AddContactModal from './AddContactModal';

interface ContactListProps {
  currentUserId: string;
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  currentUser: any;
}

export default function ContactList({ currentUserId, activeChat, onChatSelect, currentUser }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          profile:profiles!contacts_contact_id_fkey(*)
        `)
        .eq('user_id', currentUserId)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error loading contacts:', error);
        setError('Failed to load contacts');
        return;
      }
      
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts');
    }
  };

  const loadChats = async () => {
    if (contacts.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const chatPromises = contacts.map(async (contact) => {
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${contact.contact_id}),and(sender_id.eq.${contact.contact_id},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages for contact:', contact.contact_id, error);
          return {
            contact,
            messages: [],
            lastMessage: undefined,
          };
        }

        const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : undefined;

        return {
          contact,
          messages: messages || [],
          lastMessage,
        };
      });

      const chatData = await Promise.all(chatPromises);
      const sortedChats = chatData.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });
      
      setChats(sortedChats);
      
      // Update active chat if it exists
      if (activeChat) {
        const updatedActiveChat = sortedChats.find(chat => chat.contact.id === activeChat.contact.id);
        if (updatedActiveChat) {
          onChatSelect(updatedActiveChat);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      loadContacts();
    }
  }, [currentUserId]);

  useEffect(() => {
    loadChats();
  }, [contacts]);

  // Subscribe to new messages and profile updates
  useEffect(() => {
    if (!currentUserId) return;

    const messagesChannel = supabase
      .channel('messages_channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          console.log('New message received:', payload);
          // Reload chats when any new message is inserted
          loadChats();
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          console.log('Message updated:', payload);
          // Reload chats when message is updated (e.g., read status)
          loadChats();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles_channel')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles'
        }, 
        (payload) => {
          console.log('Profile updated:', payload);
          // Reload contacts when profile is updated (e.g., online status)
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [currentUserId, contacts.length]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const truncateMessage = (message: string, maxLength: number = 35) => {
    return message.length > maxLength ? message.slice(0, maxLength) + '...' : message;
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0088cc] mx-auto mb-2"></div>
          <div className="text-gray-500">Loading contacts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">{error}</div>
          <button 
            onClick={() => {
              setLoading(true);
              loadContacts();
            }}
            className="px-4 py-2 bg-[#0088cc] text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-[#0088cc]">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={currentUser?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'}
              alt={currentUser?.display_name || 'User'}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-lg truncate">
                {currentUser?.display_name || 'User'}
              </h2>
              <div className="flex items-center space-x-1">
                <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                <span className="text-blue-100 text-sm">Online</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 text-white hover:bg-blue-600 rounded-lg transition-colors"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No contacts yet</p>
              <p className="text-sm">Add some contacts to start chatting</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.contact.id}
                onClick={() => onChatSelect(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                  activeChat?.contact.id === chat.contact.id ? 'bg-blue-50 border-l-4 border-l-[#0088cc]' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={chat.contact.profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'}
                      alt={chat.contact.profile?.display_name || 'User'}
                      className="w-12 h-12 rounded-full"
                    />
                    {chat.contact.profile?.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {chat.contact.profile?.display_name || 'User'}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {chat.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                        {truncateMessage(chat.lastMessage.content)}
                      </p>
                    )}
                    {!chat.contact.profile?.is_online && chat.contact.profile?.last_seen && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last seen {new Date(chat.contact.profile.last_seen).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        currentUserId={currentUserId}
        onContactAdded={loadContacts}
      />
    </>
  );
}