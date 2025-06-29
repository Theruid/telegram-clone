import React from 'react';
import { User, Chat } from '../types';
import { Circle, Search } from 'lucide-react';

interface UserListProps {
  users: User[];
  chats: Chat[];
  currentUserId: string;
  activeChat: Chat | null;
  onUserSelect: (userId: string) => void;
  onChatSelect: (chat: Chat) => void;
}

export default function UserList({ 
  users, 
  chats, 
  currentUserId, 
  activeChat, 
  onUserSelect, 
  onChatSelect 
}: UserListProps) {
  const currentUser = users.find(u => u.id === currentUserId);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const truncateMessage = (message: string, maxLength: number = 35) => {
    return message.length > maxLength ? message.slice(0, maxLength) + '...' : message;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-[#0088cc]">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-lg truncate">
              {currentUser?.name}
            </h2>
            <div className="flex items-center space-x-1">
              <Circle className="w-2 h-2 fill-green-400 text-green-400" />
              <span className="text-blue-100 text-sm">Online</span>
            </div>
          </div>
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

      {/* User Switcher */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Switch User</h3>
        <div className="grid grid-cols-3 gap-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onUserSelect(user.id)}
              className={`p-2 rounded-lg transition-colors ${
                currentUserId === user.id
                  ? 'bg-[#0088cc] text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="text-xs font-medium truncate">{user.name.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => {
          const otherUserId = chat.participants.find(id => id !== currentUserId);
          const otherUser = users.find(u => u.id === otherUserId);
          
          if (!otherUser) return null;

          return (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                activeChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-[#0088cc]' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    className="w-12 h-12 rounded-full"
                  />
                  {otherUser.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {otherUser.name}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {chat.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                      {truncateMessage(chat.lastMessage.content)}
                    </p>
                  )}
                  {!otherUser.isOnline && otherUser.lastSeen && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last seen {otherUser.lastSeen}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}