import { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../auth/hooks/useAuth';
import { messageApi } from '../services/messageApi';
import { type Message } from '../types/message.types';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUrl';

export const InboxPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = async (isQuiet = false) => {
    if (!user) return;
    if (!isQuiet) setLoading(true);
    try {
      const res = await messageApi.getConversations();
      const newMessages = res.data;

      // Notification check
      if (messages.length > 0) {
        const latestNew = newMessages[0];
        const latestOld = messages[0];
        if (latestNew && latestNew.id !== latestOld?.id && latestNew.to_user_id === user.id) {
           showNotification(latestNew);
        }
      }

      setMessages(newMessages);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      if (!isQuiet) setLoading(false);
    }
  };

  const showNotification = (msg: Message) => {
    if (Notification.permission === 'granted') {
      new Notification(`New message from ${msg.from_user.name}`, {
        body: msg.message,
        icon: getImageUrl(msg.from_user.avatar, '/favicon.ico')
      });
    }
  };

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchMessages();
    const interval = setInterval(() => fetchMessages(true), 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (selectedPartnerId && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
      const timer = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedPartnerId, messages]);

  if (!user) return null;

  const conversations: Record<number, { partner: { id: number; name: string; avatar?: string }; messages: Message[] }> = {};

  messages.forEach((msg) => {
    const partnerId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
    const partner = msg.from_user_id === user.id ? msg.to_user : msg.from_user;
    if (!partner) return; // Skip if partner info is missing

    if (!conversations[partnerId]) {
      conversations[partnerId] = {
        partner: { id: partnerId, name: partner.name, avatar: (partner as any).avatar },
        messages: [],
      };
    }
    conversations[partnerId].messages.push(msg);
  });

  Object.values(conversations).forEach(conv => {
    conv.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  const sortedConversations = Object.entries(conversations)
    .filter(([_, data]) => data.partner.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aLatest = a[1].messages[a[1].messages.length - 1]?.created_at || '';
      const bLatest = b[1].messages[b[1].messages.length - 1]?.created_at || '';
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });

  const handleSend = async (type: 'text' | 'image' | 'audio' | 'file' = 'text', file?: File) => {
    if (!selectedPartnerId || (!newMessage.trim() && !file)) return;

    const formData = new FormData();
    formData.append('to_user_id', String(selectedPartnerId));
    formData.append('type', type);
    if (type === 'text') {
      formData.append('message', newMessage);
    } else if (file) {
      formData.append('file', file);
      formData.append('message', file.name);
    }

    try {
      await messageApi.sendMessage(formData);
      setNewMessage('');
      fetchMessages(true);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : 'file';
    handleSend(type, file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        handleSend(type, file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'voice_message.webm', { type: 'audio/webm' });
        handleSend('audio', file);
        setAudioChunks([]);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('Could not start recording. Check permissions.');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const handleReact = async (msgId: number, emoji: string) => {
    try {
        await messageApi.react(msgId, emoji);
        fetchMessages(true);
    } catch (error) {}
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!window.confirm('Delete this message?')) return;
    try {
        await messageApi.deleteMessage(msgId);
        fetchMessages(true);
    } catch (error) {
        alert('Failed to delete message');
    }
  };

  const selectedConversation = selectedPartnerId ? conversations[selectedPartnerId] : null;
  const filteredChatMessages = selectedConversation?.messages.filter(m =>
    (m.message || '').toLowerCase().includes(historySearch.toLowerCase())
  ) || [];

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'dd/MM/yy');
  };

  return (
    <div className="bg-[#f0f2f5] min-h-[calc(100vh-56px)] flex items-center justify-center p-0 md:p-6 antialiased">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`w-full max-w-7xl h-full md:h-[800px] bg-white md:rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200 relative ${isDragOver ? 'ring-4 ring-blue-500 ring-inset' : ''}`}
      >
        {isDragOver && (
            <div className="absolute inset-0 z-50 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-bounce">
                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    <p className="text-xl font-black text-blue-600 uppercase tracking-widest">Drop to upload</p>
                </div>
            </div>
        )}

        {/* Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-white ${selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Chats</h1>
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-xl px-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 font-medium"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && messages.length === 0 ? (
               <div className="p-4 space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-14 h-14 bg-gray-100 rounded-full shrink-0" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-2 bg-gray-100 rounded w-full" />
                      </div>
                    </div>
                  ))}
               </div>
            ) : sortedConversations.map(([partnerId, { partner, messages: convMsgs }]) => {
              const lastMsg = convMsgs[convMsgs.length - 1];
              const isActive = selectedPartnerId === Number(partnerId);
              const unreadCount = convMsgs.filter(m => !m.is_read && m.to_user_id === user.id).length;

              return (
                <button
                  key={partnerId}
                  onClick={() => setSelectedPartnerId(Number(partnerId))}
                  className={`w-full flex items-center gap-3 p-4 transition-all ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shadow-inner border-2 ${isActive ? 'bg-blue-500 border-blue-400 text-white' : 'bg-gray-100 border-white text-blue-600'}`}>
                       {partner.avatar ? (
                         <img src={getImageUrl(partner.avatar)} className="w-full h-full object-cover rounded-full" />
                       ) : partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 ${isActive ? 'border-blue-600' : ''}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-[15px] font-bold truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {partner.name}
                      </span>
                      <span className={`text-[11px] whitespace-nowrap ml-2 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                        {formatMessageTime(lastMsg.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                       <p className={`text-[13px] truncate flex-1 ${isActive ? 'text-blue-50' : 'text-gray-500'}`}>
                          {lastMsg.from_user_id === user.id && <span className={isActive ? 'text-blue-200' : 'text-blue-500'}>You: </span>}
                          {lastMsg.type === 'text' ? lastMsg.message : `[${lastMsg.type.toUpperCase()}]`}
                       </p>
                       {unreadCount > 0 && !isActive && (
                         <span className="bg-blue-600 text-white text-[10px] font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                            {unreadCount}
                         </span>
                       )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col bg-white relative ${!selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedPartnerId(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="relative cursor-pointer" onClick={() => navigate(`/u/${selectedConversation.partner.id}`)}>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm border-2 border-white shadow-sm overflow-hidden">
                       {selectedConversation.partner.avatar ? (
                         <img src={getImageUrl(selectedConversation.partner.avatar)} className="w-full h-full object-cover" />
                       ) : selectedConversation.partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  </div>
                  <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/u/${selectedConversation.partner.id}`)}>
                    <h2 className="text-[15px] font-bold text-gray-900 leading-none mb-1 truncate hover:text-blue-600 transition-colors">
                      {selectedConversation.partner.name}
                    </h2>
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Online</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isSearchingHistory ? (
                      <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <input
                            autoFocus
                            placeholder="Find in chat..."
                            className="bg-transparent border-none text-xs outline-none w-32 md:w-48 font-bold"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                        />
                        <button onClick={() => { setIsSearchingHistory(false); setHistorySearch(''); }} className="text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                      </div>
                  ) : (
                    <button onClick={() => setIsSearchingHistory(true)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </button>
                  )}
                  <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-[#f4f4f7] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] custom-scrollbar"
              >
                {(historySearch ? filteredChatMessages : selectedConversation.messages).map((msg, idx) => {
                  const isOwn = msg.from_user_id === user.id;
                  const prevMsg = selectedConversation.messages[idx - 1];
                  const showDate = !prevMsg || !isToday(new Date(msg.created_at)) && format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');

                  return (
                    <div key={msg.id} className="space-y-4">
                      {showDate && (
                         <div className="flex justify-center my-6">
                            <span className="bg-gray-400/20 backdrop-blur-sm text-gray-600 text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-sm">
                               {isToday(new Date(msg.created_at)) ? 'Today' : format(new Date(msg.created_at), 'MMMM dd, yyyy')}
                            </span>
                         </div>
                      )}

                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-[85%] md:max-w-[70%] group`}>
                          <div className={`px-4 py-2 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-transform active:scale-[0.99] ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                          }`}>
                            {msg.type === 'text' && msg.message}
                            {msg.type === 'image' && (
                                <img src={getImageUrl(msg.file_path)} className="max-w-full rounded-lg mb-1" />
                            )}
                            {msg.type === 'audio' && (
                                <audio controls src={getImageUrl(msg.file_path)} className="max-w-full mb-1 h-10" />
                            )}
                            {msg.type === 'file' && (
                                <a href={getImageUrl(msg.file_path)} target="_blank" className="flex items-center gap-2 bg-black/5 p-2 rounded-lg hover:bg-black/10 transition-colors">
                                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h7v11H6z"/></svg>
                                    <span className="truncate text-xs font-bold underline">{msg.message}</span>
                                </a>
                            )}

                            <div className={`flex items-center justify-end gap-1 mt-1 -mr-1 -mb-0.5`}>
                               <span className={`text-[10px] font-bold uppercase tracking-tighter ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                  {format(new Date(msg.created_at), 'HH:mm')}
                               </span>
                               {isOwn && (
                                 <svg className={`w-3 h-3 ${msg.is_read ? 'text-blue-200' : 'text-blue-300'}`} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 17.58l12-12-1.41-1.41z"/>
                                 </svg>
                               )}
                            </div>

                            {/* Reactions View */}
                            {msg.reactions && msg.reactions.length > 0 && (
                                <div className={`absolute -bottom-2 ${isOwn ? 'right-0' : 'left-0'} flex gap-1`}>
                                    {msg.reactions.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => r.user_id === user.id && handleReact(msg.id, r.emoji)}
                                            className={`bg-white rounded-full px-1.5 py-0.5 text-xs shadow-md border border-gray-100 animate-in zoom-in-50 ${r.user_id === user.id ? 'hover:bg-gray-50' : 'cursor-default'}`}
                                        >
                                            {r.emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Actions Shortcut */}
                            <div className={`absolute top-0 ${isOwn ? '-left-10 md:-left-12' : '-right-10 md:-right-12'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center`}>
                                {isOwn && (
                                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                )}
                                {['❤️', '👍', '🔥'].map(emoji => (
                                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="hover:scale-125 transition-transform text-sm">{emoji}</button>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 md:p-4 bg-white border-t border-gray-50 flex items-end gap-2 md:gap-3">
                 <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13"/></svg>
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                 <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                    <textarea
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend('text');
                        }
                      }}
                      placeholder="Message..."
                      className="w-full bg-transparent py-1 text-sm focus:outline-none placeholder:text-gray-400 font-medium resize-none max-h-32"
                    />
                 </div>

                 {newMessage.trim() ? (
                    <button
                        onClick={() => handleSend('text')}
                        className="p-3 rounded-full bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30 transition-all"
                    >
                        <svg className="w-5 h-5 fill-current rotate-45 -mt-0.5 -ml-0.5" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                 ) : (
                    <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:text-blue-600'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    </button>
                 )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#f4f4f7] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
               <div className="w-24 h-24 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-white flex items-center justify-center mb-8 transform rotate-3">
                  <svg className="w-10 h-10 text-blue-600 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
               </div>
               <h3 className="text-sm bg-black/5 text-gray-500 px-4 py-1 rounded-full font-black uppercase tracking-widest mb-2">Select a chat</h3>
               <p className="text-gray-400 text-xs font-medium max-w-[200px] leading-relaxed">Choose a conversation from the left to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};