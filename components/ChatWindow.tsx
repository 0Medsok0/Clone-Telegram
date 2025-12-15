import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Chat, Message, Attachment } from '../types';
import { 
    ArrowLeft, Send, Paperclip, Smile, Check, CheckCheck, MoreVertical, 
    Phone, Search, Trash2, Bell, BellOff, Info, Image, Video, File, Mic, X, User
} from 'lucide-react';

interface ChatWindowProps {
  chat: Chat;
  onBack: () => void;
  onSendMessage: (text: string, attachment?: Attachment) => void;
  onClearHistory: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onMuteChat: (chatId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    chat, onBack, onSendMessage, onClearHistory, onDeleteChat, onMuteChat 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, chat.isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
      setShowEmojiPicker(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Attachments Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const base64 = event.target?.result as string;
          let type: Attachment['type'] = 'file';
          
          if (file.type.startsWith('image/')) type = 'photo';
          else if (file.type.startsWith('video/')) type = 'video';
          else if (file.type.startsWith('audio/')) type = 'audio';

          const attachment: Attachment = {
              type,
              url: base64,
              name: file.name,
              mimeType: file.type
          };

          onSendMessage('', attachment);
          setShowAttachMenu(false);
      };
      reader.readAsDataURL(file);
      // Reset input
      e.target.value = '';
  };

  const triggerFileUpload = (accept: string) => {
      if (fileInputRef.current) {
          fileInputRef.current.accept = accept;
          fileInputRef.current.click();
      }
  };

  // --- Helpers ---

  const formatMessageTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  // Group messages
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  chat.messages.forEach((msg) => {
    const dateKey = formatDateHeader(msg.timestamp);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    }
  });

  // --- Emojis (Simple List for Demo) ---
  const EMOJIS = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾"];

  return (
    <div className="flex flex-col h-full bg-tg-chat relative" onClick={() => { setShowMenu(false); setShowAttachMenu(false); }}>
       
       {/* Hidden File Input */}
       <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

       {/* --- User Profile Modal --- */}
       {showProfile && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={() => setShowProfile(false)}>
               <div className="bg-tg-panel w-[90%] max-w-md rounded-xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                   <div className="h-24 bg-tg-blue relative">
                        <button onClick={() => setShowProfile(false)} className="absolute top-2 right-2 p-1 bg-black/20 rounded-full text-white hover:bg-black/40">
                            <X size={20} />
                        </button>
                   </div>
                   <div className="px-6 pb-6 -mt-12">
                        <img src={chat.avatar} className="w-24 h-24 rounded-full border-4 border-tg-panel object-cover mb-3" />
                        <h2 className="text-xl font-bold text-white">{chat.name}</h2>
                        <p className="text-tg-subtext text-sm mb-4">{chat.onlineStatus}</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-white">
                                <Info className="text-tg-subtext" />
                                <div>
                                    <div className="text-sm">{chat.username || 'No username'}</div>
                                    <div className="text-xs text-tg-subtext">Username</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 text-white">
                                <User className="text-tg-subtext mt-1" />
                                <div>
                                    <div className="text-sm">{chat.bio || (chat.isAi ? chat.systemInstruction : 'No bio available.')}</div>
                                    <div className="text-xs text-tg-subtext">Bio</div>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 text-white">
                                <Bell className="text-tg-subtext" />
                                <div>
                                    <div className="text-sm">{chat.muted ? 'Off' : 'On'}</div>
                                    <div className="text-xs text-tg-subtext">Notifications</div>
                                </div>
                            </div>
                        </div>
                   </div>
               </div>
           </div>
       )}

       {/* Background Pattern */}
       <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-0" 
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`
       }}></div>

      {/* Header */}
      <div className="bg-tg-panel border-b border-black/20 p-2 flex items-center justify-between z-20 shadow-md h-[56px]">
        <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition" onClick={onBack}>
          <button className="md:hidden text-gray-300 hover:text-white p-1">
            <ArrowLeft size={22} />
          </button>
          {chat.id === 'saved' ? (
             <div className="w-10 h-10 rounded-full bg-tg-blue flex items-center justify-center">
                 <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
             </div>
          ) : (
             <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
          )}
          <div className="flex flex-col justify-center">
            <h3 className="font-semibold text-white text-[15px] leading-tight flex gap-2">
                {chat.name}
                {chat.muted && <BellOff size={14} className="text-tg-subtext mt-0.5" />}
            </h3>
            <span className="text-[13px] text-tg-subtext leading-tight">
               {chat.isTyping ? <span className="text-tg-blue font-medium">printing...</span> : (chat.onlineStatus || 'last seen recently')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center text-tg-subtext gap-5 pr-4 relative">
            <Search size={22} className="cursor-pointer hover:text-white transition hidden sm:block" />
            <Phone size={22} className="cursor-pointer hover:text-white transition hidden sm:block" />
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <MoreVertical 
                    size={22} 
                    className="cursor-pointer hover:text-white transition" 
                    onClick={() => setShowMenu(!showMenu)}
                />
                {showMenu && (
                    <div className="absolute right-0 top-10 bg-tg-panel border border-black/20 shadow-xl rounded-lg w-52 py-2 z-50 overflow-hidden">
                        <button className="w-full text-left px-4 py-2.5 hover:bg-black/20 flex items-center gap-3 text-white text-[15px]" onClick={() => { setShowProfile(true); setShowMenu(false); }}>
                            <Info size={18} /> View Profile
                        </button>
                         <button className="w-full text-left px-4 py-2.5 hover:bg-black/20 flex items-center gap-3 text-white text-[15px]" onClick={() => { onMuteChat(chat.id); setShowMenu(false); }}>
                            {chat.muted ? <Bell size={18} /> : <BellOff size={18} />}
                            {chat.muted ? 'Unmute' : 'Mute'}
                        </button>
                        <button className="w-full text-left px-4 py-2.5 hover:bg-black/20 flex items-center gap-3 text-white text-[15px]" onClick={() => setShowMenu(false)}>
                            <Search size={18} /> Search
                        </button>
                        <div className="h-px bg-black/20 my-1" />
                        <button className="w-full text-left px-4 py-2.5 hover:bg-black/20 flex items-center gap-3 text-white text-[15px]" onClick={() => { onClearHistory(chat.id); setShowMenu(false); }}>
                            <Trash2 size={18} /> Clear History
                        </button>
                         <button className="w-full text-left px-4 py-2.5 hover:bg-black/20 flex items-center gap-3 text-red-400 text-[15px]" onClick={() => { onDeleteChat(chat.id); setShowMenu(false); }}>
                            <Trash2 size={18} /> Delete Chat
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto z-10 custom-scrollbar flex flex-col gap-2 p-2 sm:p-4">
        {groupedMessages.map((group, gIndex) => (
            <div key={gIndex} className="flex flex-col">
                <div className="sticky top-2 self-center z-10 mb-4">
                     <span className="bg-[#00000060] text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
                        {group.date}
                     </span>
                </div>
                {group.messages.map((msg) => {
                    const isMe = msg.senderId === 'me';
                    
                    return (
                        <div key={msg.id} className={`flex w-full mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[85%] md:max-w-[65%] rounded-2xl shadow-sm relative text-[15px] leading-snug break-words
                            ${isMe ? 'bg-tg-outgoing text-white rounded-tr-sm' : 'bg-tg-incoming text-white rounded-tl-sm'}
                        `}>
                            {/* Attachment Rendering */}
                            {msg.attachment && (
                                <div className="p-1 pb-0">
                                    {msg.attachment.type === 'photo' && (
                                        <img src={msg.attachment.url} alt="Attachment" className="rounded-lg max-w-full h-auto object-cover max-h-[300px]" />
                                    )}
                                    {msg.attachment.type === 'video' && (
                                        <video src={msg.attachment.url} controls className="rounded-lg max-w-full" />
                                    )}
                                    {msg.attachment.type === 'audio' && (
                                        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg min-w-[200px]">
                                            <div className="p-2 bg-tg-blue rounded-full"><Mic size={16} /></div>
                                            <div className="text-sm">Audio Message</div>
                                        </div>
                                    )}
                                    {msg.attachment.type === 'file' && (
                                        <div className="flex items-center gap-3 p-2 bg-black/10 rounded-lg">
                                            <div className="p-2 bg-tg-blue/50 rounded-lg"><File size={24} /></div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-medium truncate">{msg.attachment.name || 'File'}</span>
                                                <span className="text-xs text-white/60">Attachment</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Text Content */}
                            {msg.text && (
                                <div className={`px-3 py-1.5 ${msg.attachment ? 'pt-1' : ''}`}>
                                    <div className="prose prose-invert prose-sm max-w-none break-words">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                            
                            {/* Metadata */}
                            <div className={`px-3 pb-1.5 text-[11px] flex justify-end items-center gap-1 select-none ${isMe ? 'text-[#7ea4cf]' : 'text-[#6d7f8f]'}`}>
                                <span>{formatMessageTime(msg.timestamp)}</span>
                                {isMe && (
                                    msg.status === 'read' ? <CheckCheck size={14} className="text-[#64d2ff]" /> : <Check size={14} />
                                )}
                            </div>
                        </div>
                        </div>
                    );
                })}
            </div>
        ))}
        
        {chat.isTyping && (
             <div className="flex justify-start animate-fade-in pl-2">
                 <div className="bg-tg-incoming text-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5 items-center h-full">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="bg-tg-panel p-2 flex items-end gap-2 z-20 max-w-full shadow-[0_-1px_3px_rgba(0,0,0,0.2)] relative">
        
        {/* Emoji Picker Panel */}
        {showEmojiPicker && (
            <div className="absolute bottom-[60px] left-2 bg-tg-panel border border-black/20 shadow-2xl rounded-xl w-[300px] h-[300px] overflow-y-auto p-2 grid grid-cols-8 gap-1 z-50 custom-scrollbar">
                {EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => setInputValue(prev => prev + emoji)} className="text-xl hover:bg-white/10 rounded p-1">
                        {emoji}
                    </button>
                ))}
            </div>
        )}

         {/* Attachment Dropup */}
         {showAttachMenu && (
             <div className="absolute bottom-[60px] left-12 bg-tg-panel border border-black/20 shadow-2xl rounded-xl py-2 w-48 z-50 animate-scale-in origin-bottom-left">
                 <button onClick={() => triggerFileUpload('image/*')} className="w-full text-left px-4 py-3 hover:bg-black/20 flex items-center gap-3 text-white text-sm">
                     <Image size={20} className="text-blue-400" /> Photo
                 </button>
                 <button onClick={() => triggerFileUpload('video/*')} className="w-full text-left px-4 py-3 hover:bg-black/20 flex items-center gap-3 text-white text-sm">
                     <Video size={20} className="text-green-400" /> Video
                 </button>
                 <button onClick={() => triggerFileUpload('*/*')} className="w-full text-left px-4 py-3 hover:bg-black/20 flex items-center gap-3 text-white text-sm">
                     <File size={20} className="text-orange-400" /> File
                 </button>
                 <button onClick={() => triggerFileUpload('audio/*')} className="w-full text-left px-4 py-3 hover:bg-black/20 flex items-center gap-3 text-white text-sm">
                     <Mic size={20} className="text-red-400" /> Audio
                 </button>
             </div>
         )}

         {/* Attach Button */}
         <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`p-3 transition rounded-full hover:bg-white/5 mb-[2px] ${showAttachMenu ? 'text-tg-blue' : 'text-tg-subtext'}`}
            >
                <Paperclip size={22} className="transform rotate-45" />
            </button>
         </div>
        
        {/* Text Input */}
        <div className="flex-1 bg-tg-input rounded-2xl flex items-end min-h-[44px] border border-transparent focus-within:border-tg-blue/30 transition-colors">
             <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              className="w-full bg-transparent text-white placeholder-[#7f91a4] px-4 py-[11px] focus:outline-none resize-none overflow-hidden max-h-[120px]"
              style={{ minHeight: '44px' }}
            />
            <button 
                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                className={`p-3 hover:text-white transition mr-1 mb-[2px] ${showEmojiPicker ? 'text-tg-blue' : 'text-tg-subtext'}`}
            >
                <Smile size={22} />
            </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          className={`
            p-3 rounded-full transition-all duration-200 flex items-center justify-center mb-[2px]
            ${inputValue.trim() 
                ? 'bg-tg-blue text-white hover:bg-tg-blue/90 shadow-md transform scale-100' 
                : 'bg-transparent text-tg-blue hover:bg-white/5'}
          `}
        >
          {inputValue.trim() ? <Send size={20} fill="white" className="ml-0.5" /> : <Mic size={24} />}
        </button>
      </div>
    </div>
  );
};