import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AppState, Chat, Message, User, Attachment } from './types';
import { streamGeminiResponse } from './services/geminiService';

// Mock Data
const CURRENT_USER: User = { 
    id: 'me', 
    name: 'You', 
    avatar: 'https://picsum.photos/200',
    username: '@gemini_user',
    phone: '+1 (555) 012-3456',
    bio: 'Digital explorer.'
};

const INITIAL_CHATS: Chat[] = [
  {
      id: 'saved',
      name: 'Saved Messages',
      avatar: '', 
      isAi: false,
      onlineStatus: '',
      messages: [
          { id: '0', senderId: 'me', text: 'Important: Buy milk', timestamp: Date.now() - 86400000 * 2, status: 'read' },
          { id: '1', senderId: 'me', text: '# Todo\n- [ ] Finish project\n- [ ] Call Mom', timestamp: Date.now() - 3600000, status: 'read' }
      ],
      unreadCount: 0
  },
  {
    id: 'ai-assistant',
    name: 'Gemini Pro',
    avatar: 'https://picsum.photos/id/532/200',
    username: '@gemini_pro',
    isAi: true,
    onlineStatus: 'bot',
    systemInstruction: 'You are a helpful, intelligent assistant. You can format your responses using Markdown. You can analyze images if sent.',
    messages: [
      { id: '1', senderId: 'ai-assistant', text: 'Hello! I am Gemini. I can help you with coding, writing, and analysis. Send me text or a photo!', timestamp: Date.now() - 100000, status: 'read' }
    ],
    unreadCount: 0
  },
  {
    id: 'ai-tutor',
    name: 'English Tutor',
    avatar: 'https://picsum.photos/id/10/200',
    username: '@eng_tutor',
    isAi: true,
    onlineStatus: 'bot',
    systemInstruction: 'You are an English language tutor. Correct grammar mistakes and explain rules simply.',
    messages: [
      { id: '1', senderId: 'ai-tutor', text: 'Hello! Ready to practice English today?', timestamp: Date.now() - 50000, status: 'read' }
    ],
    unreadCount: 1
  },
  {
    id: 'user-alice',
    name: 'Alice Smith',
    avatar: 'https://picsum.photos/id/64/200',
    username: '@alicesmith',
    bio: 'Designer at TechCorp',
    isAi: false,
    onlineStatus: 'last seen recently',
    messages: [
      { id: '1', senderId: 'user-alice', text: 'Are we still on for the meeting?', timestamp: Date.now() - 1000000, status: 'read' },
      { id: '2', senderId: 'me', text: 'Yes, 3 PM.', timestamp: Date.now() - 900000, status: 'read' }
    ],
    unreadCount: 0
  }
];

export default function App() {
  const [state, setState] = useState<AppState>({
    chats: INITIAL_CHATS,
    activeChatId: null,
    user: CURRENT_USER
  });

  const activeChat = state.chats.find(c => c.id === state.activeChatId);

  const updateChat = useCallback((chatId: string, updater: (chat: Chat) => Chat) => {
    setState(prev => ({
      ...prev,
      chats: prev.chats.map(c => c.id === chatId ? updater(c) : c)
    }));
  }, []);

  const handleUpdateUser = (updates: Partial<User>) => {
      setState(prev => ({ ...prev, user: { ...prev.user, ...updates } }));
  };

  const handleCreateGroup = (name: string) => {
      const newChat: Chat = {
          id: `group-${Date.now()}`,
          name: name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          isAi: false,
          messages: [],
          unreadCount: 0,
          onlineStatus: '2 members'
      };
      setState(prev => ({
          ...prev,
          chats: [newChat, ...prev.chats],
          activeChatId: newChat.id
      }));
  };

  const handleDeleteChat = (chatId: string) => {
      if (confirm("Delete this chat?")) {
          setState(prev => ({
              ...prev,
              chats: prev.chats.filter(c => c.id !== chatId),
              activeChatId: prev.activeChatId === chatId ? null : prev.activeChatId
          }));
      }
  };

  const handleMuteChat = (chatId: string) => {
      updateChat(chatId, c => ({ ...c, muted: !c.muted }));
  };

  const handleClearHistory = (chatId: string) => {
    if (confirm("Are you sure you want to clear this chat history?")) {
        updateChat(chatId, chat => ({
            ...chat,
            messages: [],
            lastMessage: undefined
        }));
    }
  };

  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    if (!state.activeChatId) return;
    const chatId = state.activeChatId;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text,
      timestamp: Date.now(),
      status: 'sent',
      attachment
    };

    // 1. Add user message
    updateChat(chatId, (chat) => ({
      ...chat,
      messages: [...chat.messages, newMessage],
      lastMessage: newMessage,
      unreadCount: 0
    }));

    const chat = state.chats.find(c => c.id === chatId);
    
    // 2. Handle Saved Messages (Echo/Storage)
    if (chatId === 'saved' || !chat?.isAi) {
        return;
    }

    // 3. Handle AI Response
    if (chat && chat.isAi) {
      updateChat(chatId, c => ({ ...c, isTyping: true }));

      const historyWithNewMessage = [...chat.messages, newMessage];
      const systemInstruction = chat.systemInstruction || "You are a helpful assistant.";
      
      // Prepare attachment data if it's a photo for Gemini
      let geminiAttachment = null;
      if (attachment && attachment.type === 'photo') {
          // Extract base64 data
          const base64Data = attachment.url.split(',')[1];
          // simple mime detection
          const mimeMatch = attachment.url.match(/:(.*?);/);
          geminiAttachment = {
              mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg',
              data: base64Data
          };
      }

      try {
        const stream = streamGeminiResponse(
          process.env.API_KEY || '',
          chat.messages, // Pass OLD history, the service handles appending new msg + attachment
          systemInstruction,
          text,
          geminiAttachment
        );

        let aiResponseText = "";
        let responseId = (Date.now() + 1).toString();

        updateChat(chatId, c => ({
             ...c,
             messages: [...c.messages, {
                 id: responseId,
                 senderId: chatId,
                 text: '',
                 timestamp: Date.now(),
                 status: 'read'
             }]
        }));

        for await (const chunk of stream) {
          aiResponseText += chunk;
          
          updateChat(chatId, c => {
              const msgs = [...c.messages];
              const lastMsgIndex = msgs.findIndex(m => m.id === responseId);
              if (lastMsgIndex !== -1) {
                  msgs[lastMsgIndex] = { ...msgs[lastMsgIndex], text: aiResponseText };
              }
              return { ...c, messages: msgs, lastMessage: { ...msgs[msgs.length-1], text: aiResponseText } };
          });
        }
      } catch (e) {
         console.error(e);
         updateChat(chatId, c => ({
             ...c,
             messages: [...c.messages, {
                 id: Date.now().toString(),
                 senderId: chatId,
                 text: '⚠️ Error: Could not connect to AI service.',
                 timestamp: Date.now(),
                 status: 'read'
             }]
         }));
      } finally {
        updateChat(chatId, c => ({ ...c, isTyping: false }));
      }
    }
  };

  const handleSelectChat = (id: string) => {
    setState(prev => ({ ...prev, activeChatId: id }));
    updateChat(id, c => ({ ...c, unreadCount: 0 }));
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, activeChatId: null }));
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden relative font-sans">
      {/* Sidebar */}
      <div className={`
        w-full md:w-[400px] flex-shrink-0 z-20 transition-transform duration-300 absolute md:relative h-full
        ${state.activeChatId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        <Sidebar 
            chats={state.chats} 
            currentUser={state.user}
            activeChatId={state.activeChatId} 
            onSelectChat={handleSelectChat}
            onUpdateUser={handleUpdateUser}
            onCreateGroup={handleCreateGroup}
            className="w-full h-full"
        />
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col h-full z-10 bg-tg-chat transition-transform duration-300 absolute md:relative w-full md:w-auto
        ${state.activeChatId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {activeChat ? (
          <ChatWindow 
            chat={activeChat} 
            onBack={handleBack} 
            onSendMessage={handleSendMessage} 
            onClearHistory={handleClearHistory}
            onDeleteChat={handleDeleteChat}
            onMuteChat={handleMuteChat}
          />
        ) : (
          <div className="hidden md:flex items-center justify-center h-full text-tg-subtext bg-[#0f0f0f]">
             <div className="text-center p-2">
                 <div className="bg-[#1c1c1c] rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-gray-400">
                    TG
                 </div>
                 <h2 className="text-white font-medium mb-1">Select a chat to start messaging</h2>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}