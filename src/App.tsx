import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Chat } from './types';
import AuthForm from './components/AuthForm';
import ContactList from './components/ContactList';
import ChatArea from './components/ChatArea';
import { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCurrentUser(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCurrentUser(session.user.id);
      } else {
        setCurrentUser(null);
        setActiveChat(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCurrentUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setCurrentUser(data);

      // Update online status
      await supabase
        .from('profiles')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChat || !user) return;

    try {
      console.log('Sending message:', {
        sender_id: user.id,
        receiver_id: activeChat.contact.contact_id,
        content
      });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeChat.contact.contact_id,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSignOut = async () => {
    if (user) {
      // Update offline status before signing out
      await supabase
        .from('profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', user.id);
    }
    
    await supabase.auth.signOut();
  };

  // Update online status on window focus/blur
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      supabase
        .from('profiles')
        .update({ is_online: true })
        .eq('id', user.id);
    };

    const handleBlur = () => {
      supabase
        .from('profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', user.id);
    };

    const handleBeforeUnload = () => {
      // Use sendBeacon for more reliable offline status update
      navigator.sendBeacon('/api/offline', JSON.stringify({ userId: user.id }));
      
      // Fallback to regular update
      supabase
        .from('profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', user.id);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0088cc] mx-auto mb-4"></div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      <ContactList
        currentUserId={user.id}
        activeChat={activeChat}
        onChatSelect={setActiveChat}
        currentUser={currentUser}
      />
      <ChatArea
        chat={activeChat}
        currentUserId={user.id}
        onSendMessage={handleSendMessage}
      />
      
      {/* Sign out button */}
      <button
        onClick={handleSignOut}
        className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm z-10"
      >
        Sign Out
      </button>
    </div>
  );
}

export default App;