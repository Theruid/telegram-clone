import React, { useRef, useEffect } from 'react';
import { Chat, Message } from '../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { Circle, Phone, Video, MoreVertical } from 'lucide-react';

interface ChatAreaProps {
  chat: Chat | null;
  currentUserId: string;
  onSendMessage: (content: string) => void;
}

export default function ChatArea({ chat, currentUserId, onSendMessage }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (chat && chat.messages.length > 0) {
      const unreadMessages = chat.messages.filter(
        msg => msg.receiver_id === currentUserId && !msg.is_read
      );
      
      if (unreadMessages.length > 0) {
        // Mark messages as read
        import('../lib/supabase').then(({ supabase }) => {
          supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(msg => msg.id))
            .eq('receiver_id', currentUserId);
        });
      }
    }
  }, [chat, currentUserId]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Circle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to Telegram Clone</h3>
          <p className="text-gray-500">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  const otherUser = chat.contact.profile;

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={otherUser?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'}
                alt={otherUser?.display_name || 'User'}
                className="w-10 h-10 rounded-full"
              />
              {otherUser?.is_online && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{otherUser?.display_name || 'User'}</h2>
              <p className="text-sm text-gray-500">
                {otherUser?.is_online ? 'Online' : otherUser?.last_seen ? `Last seen ${new Date(otherUser.last_seen).toLocaleString()}` : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {chat.messages && chat.messages.length > 0 ? (
          chat.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender_id === currentUserId}
              otherUser={otherUser}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}