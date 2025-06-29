import { User, Message, Chat } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Bob Smith',
    avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Carol Davis',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    isOnline: false,
    lastSeen: '2 hours ago',
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    receiverId: '2',
    content: 'Hey Bob! How are you doing?',
    timestamp: new Date(Date.now() - 300000),
    isRead: true,
  },
  {
    id: '2',
    senderId: '2',
    receiverId: '1',
    content: 'Hi Alice! I\'m doing great, thanks for asking. How about you?',
    timestamp: new Date(Date.now() - 240000),
    isRead: true,
  },
  {
    id: '3',
    senderId: '1',
    receiverId: '2',
    content: 'I\'m doing well too! Are you free for lunch this weekend?',
    timestamp: new Date(Date.now() - 180000),
    isRead: true,
  },
  {
    id: '4',
    senderId: '2',
    receiverId: '1',
    content: 'Absolutely! How about Saturday at noon? I know a great place downtown.',
    timestamp: new Date(Date.now() - 120000),
    isRead: false,
  },
];

export const mockChats: Chat[] = [
  {
    id: '1',
    participants: ['1', '2'],
    messages: mockMessages,
    lastMessage: mockMessages[mockMessages.length - 1],
  },
];