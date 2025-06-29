import React from 'react';
import { Message, User } from '../types';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  otherUser: User;
}

export default function MessageBubble({ message, isCurrentUser, otherUser }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className={`flex mb-4 animate-fade-in ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isCurrentUser && (
          <img
            src={otherUser.avatar_url}
            alt={otherUser.display_name}
            className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
          />
        )}
        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isCurrentUser
              ? 'bg-[#0088cc] text-white rounded-br-sm'
              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          <div className={`flex items-center space-x-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <span 
              className={`text-xs ${
                isCurrentUser ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {formatTime(message.created_at)}
            </span>
            {isCurrentUser && (
              <div className="flex items-center">
                {message.is_read ? (
                  <CheckCheck className="w-3 h-3 text-blue-100" />
                ) : (
                  <Check className="w-3 h-3 text-blue-200" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}