import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Search } from 'lucide-react';
import { User } from '../types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onContactAdded: () => void;
}

export default function AddContactModal({ isOpen, onClose, currentUserId, onContactAdded }: AddContactModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .neq('id', currentUserId)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contactId: string) => {
    setAdding(contactId);
    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: currentUserId,
          contact_id: contactId,
          status: 'accepted'
        });

      if (error) throw error;

      // Also add the reverse relationship
      await supabase
        .from('contacts')
        .insert({
          user_id: contactId,
          contact_id: currentUserId,
          status: 'accepted'
        });

      onContactAdded();
      onClose();
    } catch (error) {
      console.error('Error adding contact:', error);
    } finally {
      setAdding(null);
    }
  };

  React.useEffect(() => {
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Contact</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username or name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] focus:border-transparent"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading && (
              <div className="text-center py-4 text-gray-500">Searching...</div>
            )}

            {!loading && searchTerm && searchResults.length === 0 && (
              <div className="text-center py-4 text-gray-500">No users found</div>
            )}

            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{user.display_name}</h3>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => addContact(user.id)}
                  disabled={adding === user.id}
                  className="flex items-center space-x-1 px-3 py-1 bg-[#0088cc] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm">
                    {adding === user.id ? 'Adding...' : 'Add'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}