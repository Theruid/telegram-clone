import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message..."
            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0088cc] focus:border-transparent max-h-32"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={disabled}
          />
          <button
            type="button"
            className="absolute right-3 bottom-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={`p-2 rounded-full transition-all ${
            message.trim() && !disabled
              ? 'bg-[#0088cc] text-white hover:bg-blue-600 transform hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}