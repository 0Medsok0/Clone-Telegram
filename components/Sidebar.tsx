import React, { useState, useRef } from 'react';
import { Chat, User } from '../types';
import { 
    Search, Menu, PenSquare, Bookmark, Settings, Users, Phone, Moon, 
    CircleHelp, Bug, X, User as UserIcon, ArrowLeft, Camera, Share2, 
    MoreVertical, Info, MapPin
} from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  currentUser: User;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onUpdateUser: (user: Partial<User>) => void;
  onCreateGroup: (name: string) => void;
  className?: string;
}

type MenuView = 'MAIN' | 'NEW_GROUP' | 'CALLS' | 'NEARBY' | 'SAVED' | 'SETTINGS' | 'INVITE' | 'FEATURES';

export const Sidebar: React.FC<SidebarProps> = ({ 
    chats, currentUser, activeChatId, onSelectChat, onUpdateUser, onCreateGroup, className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>('MAIN');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  
  // Settings State
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  
  // New Group State
  const [groupName, setGroupName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search logic
  const filteredChats = chats
    .filter(chat => {
        const term = searchTerm.toLowerCase();
        const nameMatch = chat.name.toLowerCase().includes(term);
        const userMatch = chat.username?.toLowerCase().includes(term);
        return nameMatch || userMatch;
    })
    .sort((a, b) => {
        if (a.id === 'saved') return -1;
        if (b.id === 'saved') return 1;
        const timeA = a.lastMessage?.timestamp || 0;
        const timeB = b.lastMessage?.timestamp || 0;
        return timeB - timeA;
    });

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const diff = now.getTime() - date.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  onUpdateUser({ avatar: ev.target.result as string });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCreateGroupSubmit = () => {
      if (groupName.trim()) {
          onCreateGroup(groupName);
          setGroupName('');
          setIsMenuOpen(false);
          setCurrentView('MAIN');
      }
  };

  const closeMenu = () => {
      setIsMenuOpen(false);
      // slight delay to reset view after animation, or immediate reset? 
      // Resetting immediately feels snappier for next open
      setTimeout(() => setCurrentView('MAIN'), 300); 
  };

  const renderDrawerContent = () => {
      switch (currentView) {
          case 'SETTINGS':
              return (
                  <div className="flex flex-col h-full bg-tg-chat animate-slide-in-left">
                      <div className="flex items-center gap-4 p-4 bg-tg-panel shadow-md">
                          <button onClick={() => setCurrentView('MAIN')}><ArrowLeft size={22} /></button>
                          <span className="font-semibold text-lg">Settings</span>
                          <div className="flex-1" />
                          <button onClick={() => {
                              onUpdateUser({ name: editName, bio: editBio });
                              setCurrentView('MAIN');
                          }}><Settings size={20} className="text-tg-blue" /></button>
                      </div>
                      <div className="p-4 flex flex-col items-center border-b border-black/20 bg-tg-panel pb-6">
                           <div className="relative group cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
                                <img src={currentUser.avatar} className="w-24 h-24 rounded-full object-cover mb-3" />
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <Camera size={24} />
                                </div>
                           </div>
                           <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-tg-blue text-sm mb-4 hover:underline"
                           >
                               Set New Photo
                           </button>
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />

                           <div className="w-full space-y-4 px-2">
                               <div>
                                   <label className="text-xs text-tg-blue font-medium ml-1">Name</label>
                                   <input 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-transparent border-b border-tg-subtext/30 py-1 px-1 focus:border-tg-blue focus:outline-none text-lg"
                                   />
                               </div>
                               <div>
                                   <label className="text-xs text-tg-subtext font-medium ml-1">Bio</label>
                                   <input 
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        className="w-full bg-transparent border-b border-tg-subtext/30 py-1 px-1 focus:border-tg-blue focus:outline-none text-sm text-gray-300"
                                        placeholder="Add a few words about yourself..."
                                   />
                               </div>
                           </div>
                      </div>
                      <div className="p-4 space-y-6">
                          <div className="flex items-center gap-4">
                               <Phone className="text-tg-subtext" size={22} />
                               <div>
                                   <div className="text-[15px]">{currentUser.phone}</div>
                                   <div className="text-xs text-tg-subtext">Phone</div>
                               </div>
                          </div>
                          <div className="flex items-center gap-4">
                               <div className="w-[22px] text-center text-tg-subtext font-bold text-lg">@</div>
                               <div>
                                   <div className="text-[15px]">{currentUser.username}</div>
                                   <div className="text-xs text-tg-subtext">Username</div>
                               </div>
                          </div>
                      </div>
                  </div>
              );

          case 'NEW_GROUP':
              return (
                  <div className="flex flex-col h-full bg-tg-chat animate-slide-in-left">
                      <div className="flex items-center gap-4 p-4 bg-tg-panel shadow-md">
                          <button onClick={() => setCurrentView('MAIN')}><ArrowLeft size={22} /></button>
                          <span className="font-semibold text-lg">New Group</span>
                      </div>
                      <div className="p-6 flex flex-col items-center gap-6">
                           <div className="w-20 h-20 rounded-full bg-tg-blue/20 flex items-center justify-center">
                               <Camera size={32} className="text-tg-blue" />
                           </div>
                           <input 
                                autoFocus
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Group Name"
                                className="w-full bg-transparent border-b border-tg-blue py-2 text-xl text-center focus:outline-none"
                           />
                           <button 
                                onClick={handleCreateGroupSubmit}
                                className="bg-tg-blue text-white rounded-full p-4 shadow-lg hover:brightness-110 transition"
                           >
                               <ArrowLeft size={24} className="rotate-180" />
                           </button>
                      </div>
                      <div className="px-4 text-sm text-tg-subtext uppercase font-bold tracking-wider mb-2">Contacts</div>
                      <div className="flex-1 overflow-y-auto">
                          {chats.filter(c => !c.isAi && c.id !== 'saved').map(chat => (
                              <div key={chat.id} className="flex items-center gap-3 p-3 hover:bg-white/5">
                                  <img src={chat.avatar} className="w-10 h-10 rounded-full" />
                                  <div className="font-medium">{chat.name}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              );
            
          case 'CALLS':
              return (
                  <div className="flex flex-col h-full bg-tg-chat animate-slide-in-left">
                       <div className="flex items-center gap-4 p-4 bg-tg-panel shadow-md">
                          <button onClick={() => setCurrentView('MAIN')}><ArrowLeft size={22} /></button>
                          <span className="font-semibold text-lg">Calls</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center text-tg-subtext gap-4">
                          <Phone size={64} className="opacity-20" />
                          <p>No recent calls</p>
                      </div>
                  </div>
              );

          case 'NEARBY':
               return (
                  <div className="flex flex-col h-full bg-tg-chat animate-slide-in-left">
                       <div className="flex items-center gap-4 p-4 bg-tg-panel shadow-md">
                          <button onClick={() => setCurrentView('MAIN')}><ArrowLeft size={22} /></button>
                          <span className="font-semibold text-lg">People Nearby</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center text-tg-subtext gap-4 p-8 text-center">
                          <div className="w-32 h-32 rounded-full bg-tg-blue/10 flex items-center justify-center animate-pulse">
                              <MapPin size={48} className="text-tg-blue" />
                          </div>
                          <h3 className="text-white font-medium text-lg">Looking for people nearby...</h3>
                          <p className="text-sm">Exchange contact info with people nearby and find new friends.</p>
                      </div>
                  </div>
              );

           case 'FEATURES':
               return (
                  <div className="flex flex-col h-full bg-tg-chat animate-slide-in-left">
                       <div className="flex items-center gap-4 p-4 bg-tg-panel shadow-md">
                          <button onClick={() => setCurrentView('MAIN')}><ArrowLeft size={22} /></button>
                          <span className="font-semibold text-lg">Telegram Features</span>
                      </div>
                      <div className="p-4 space-y-4 overflow-y-auto">
                          <FeatureItem icon={<Settings size={20} />} title="Infinite Cloud Storage" desc="No space limits." />
                          <FeatureItem icon={<Users size={20} />} title="Groups" desc="Up to 200,000 members." />
                          <FeatureItem icon={<Info size={20} />} title="Open Source" desc="API and clients are open." />
                      </div>
                  </div>
              );

          default: // MAIN
              return (
                <>
                    {/* Drawer Header */}
                    <div className="bg-tg-chat p-6 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="cursor-pointer" onClick={() => setCurrentView('SETTINGS')}>
                                <img src={currentUser.avatar} alt="Me" className="w-16 h-16 rounded-full object-cover mb-2 hover:opacity-90 transition" />
                            </div>
                            <button onClick={closeMenu} className="text-gray-400 hover:text-white">
                                <Moon size={22} className="fill-current" />
                            </button>
                        </div>
                        <div className="cursor-pointer" onClick={() => setCurrentView('SETTINGS')}>
                            <div className="text-white font-medium text-sm flex justify-between">
                                {currentUser.name}
                                <span className="text-tg-blue text-xs font-normal border border-tg-blue rounded px-1">Edit</span>
                            </div>
                            <div className="text-tg-subtext text-xs">{currentUser.phone}</div>
                        </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="flex-1 overflow-y-auto py-2">
                        <MenuItem icon={<Users size={22} />} label="New Group" onClick={() => setCurrentView('NEW_GROUP')} />
                        <MenuItem icon={<Phone size={22} />} label="Calls" onClick={() => setCurrentView('CALLS')} />
                        <MenuItem icon={<Users size={22} />} label="People Nearby" onClick={() => setCurrentView('NEARBY')} />
                        <MenuItem 
                            icon={<Bookmark size={22} />} 
                            label="Saved Messages" 
                            onClick={() => {
                                onSelectChat('saved');
                                closeMenu();
                            }} 
                        />
                        <MenuItem icon={<Settings size={22} />} label="Settings" onClick={() => setCurrentView('SETTINGS')} />
                        <div className="h-px bg-black/20 my-2 mx-4" />
                        <MenuItem icon={<UserIcon size={22} />} label="Invite Friends" onClick={() => { alert("Invite link copied!"); closeMenu(); }} />
                        <MenuItem icon={<CircleHelp size={22} />} label="Telegram Features" onClick={() => setCurrentView('FEATURES')} />
                    </div>
                    
                    <div className="p-4 text-xs text-tg-subtext text-center">
                        TeleGramini Web v1.1.0
                    </div>
                </>
              );
      }
  };

  return (
    <div className={`flex flex-col bg-tg-panel border-r border-black/20 h-full ${className} select-none relative`}>
      
      {/* --- Full Screen Photo Modal --- */}
      {isPhotoModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-fade-in" onClick={() => setIsPhotoModalOpen(false)}>
              <img src={currentUser.avatar} className="max-w-full max-h-full rounded-full md:rounded-lg animate-scale-in" />
              <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setIsPhotoModalOpen(false)}>
                  <X size={32} />
              </button>
          </div>
      )}

      {/* --- Hamburger Drawer Menu --- */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 transition-opacity" 
                onClick={closeMenu}
            ></div>
            
            {/* Drawer Content */}
            <div className="relative w-[300px] bg-tg-panel h-full shadow-2xl flex flex-col overflow-hidden">
                {renderDrawerContent()}
            </div>
        </div>
      )}

      {/* --- Main Sidebar Content --- */}
      
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-4">
        <button 
            className="text-tg-subtext hover:text-white transition"
            onClick={() => setIsMenuOpen(true)}
        >
            <Menu size={26} />
        </button>
        <div className="relative flex-1 group">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111] border border-transparent focus:border-tg-blue/50 text-gray-200 placeholder-tg-subtext rounded-full py-2 pl-10 pr-4 text-[15px] focus:outline-none transition-all"
          />
          <Search className="absolute left-3 top-2.5 text-tg-subtext group-focus-within:text-tg-blue transition-colors" size={18} />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`
              flex items-center px-3 py-2.5 cursor-pointer transition-colors
              ${activeChatId === chat.id ? 'bg-tg-blue/20' : 'hover:bg-tg-hover'}
            `}
          >
            {/* Avatar */}
            <div className="relative shrink-0 mr-3">
                {chat.id === 'saved' ? (
                     <div className="w-[50px] h-[50px] rounded-full bg-tg-blue flex items-center justify-center">
                         <Bookmark size={24} fill="white" className="text-white" />
                     </div>
                ) : (
                    <img
                        src={chat.avatar}
                        alt={chat.name}
                        className="w-[50px] h-[50px] rounded-full object-cover"
                    />
                )}
                {chat.isAi && (
                    <div className="absolute -bottom-1 -right-1 bg-tg-blue text-[10px] text-white px-1.5 rounded-full font-bold shadow-[0_0_0_2px_#17212b]">
                        AI
                    </div>
                )}
                {chat.muted && (
                     <div className="absolute top-0 right-0 bg-gray-600 w-3 h-3 rounded-full border border-tg-panel"></div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 border-b border-black/10 pb-2.5 pt-0.5">
              <div className="flex justify-between items-baseline mb-0.5">
                <div className="flex items-center gap-1 overflow-hidden">
                    <h3 className={`font-medium truncate text-[16px] ${activeChatId === chat.id ? 'text-white' : 'text-gray-100'}`}>
                        {chat.name}
                    </h3>
                    {chat.muted && <span className="text-tg-subtext text-xs">🔕</span>}
                </div>
                <span className={`text-xs ${activeChatId === chat.id ? 'text-white' : 'text-tg-subtext'}`}>
                  {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-[15px] truncate pr-2 ${chat.isTyping ? 'text-tg-blue' : 'text-tg-subtext'} ${activeChatId === chat.id ? 'text-white/80' : ''}`}>
                  {chat.isTyping ? 'printing...' : (
                      <>
                        {chat.lastMessage?.attachment && (
                            <span className="text-tg-blue inline-flex items-center gap-1 mr-1">
                                {chat.lastMessage.attachment.type === 'photo' ? '📷 Photo' : '📎 File'}
                            </span>
                        )}
                        {chat.lastMessage?.senderId === 'me' && !chat.lastMessage?.attachment && <span className="text-tg-blue">You: </span>}
                        {chat.lastMessage?.text || (chat.lastMessage?.attachment ? '' : 'No messages')}
                      </>
                  )}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="bg-tg-subtext text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center shadow-sm">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

       {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6 md:hidden">
         <button className="bg-tg-blue p-4 rounded-full shadow-lg text-white hover:brightness-110 transition active:scale-95">
             <PenSquare size={24} />
         </button>
      </div>
    </div>
  );
};

// Simple Menu Item Helper
const MenuItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className="flex items-center gap-6 px-6 py-3 hover:bg-white/5 cursor-pointer text-white/90 transition-colors"
    >
        <span className="text-tg-subtext">{icon}</span>
        <span className="font-medium text-[15px]">{label}</span>
    </div>
);

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
        <div className="text-tg-blue">{icon}</div>
        <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-tg-subtext">{desc}</div>
        </div>
    </div>
);