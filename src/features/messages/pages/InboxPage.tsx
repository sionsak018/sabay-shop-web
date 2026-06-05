import React, { useState, useEffect, useRef, Fragment } from 'react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../auth/hooks/useAuth';
import { messageApi } from '../services/messageApi';
import { type Message } from '../types/message.types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUrl';

export const InboxPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const selectedPartnerId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const setSelectedPartnerId = (id: number | null) => {
    if (id) {
        setSearchParams({ id: String(id) });
    } else {
        setSearchParams({});
    }
  };

  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState<Message | null>(null);
  const [deleteForBoth, setDeleteForBoth] = useState(true);

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

  const handleDeleteMessage = (msg: Message) => {
    setMsgToDelete(msg);
  };

  const confirmDelete = async () => {
    if (!msgToDelete) return;
    try {
        await messageApi.deleteMessage(msgToDelete.id);
        setMsgToDelete(null);
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
    <div className={`bg-[#e7ebf0] dark:bg-[#08060d] ${selectedPartnerId ? 'h-[100dvh]' : 'h-[calc(100dvh-64px)]'} md:h-[calc(100vh-64px)] flex items-start justify-center p-0 md:p-4 antialiased transition-colors duration-300`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`w-full max-w-6xl h-full md:h-[calc(100vh-100px)] bg-white dark:bg-[#16171d] md:rounded-lg shadow-xl flex overflow-hidden border border-gray-200 dark:border-gray-800 relative transition-colors ${isDragOver ? 'ring-4 ring-blue-500 ring-inset' : ''}`}
      >
        {isDragOver && (
            <div className="absolute inset-0 z-50 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-bounce">
                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    <p className="text-xl font-black text-blue-600 uppercase tracking-widest">Drop to upload</p>
                </div>
            </div>
        )}

        {/* Sidebar */}
        <div className={`w-full md:w-80 lg:w-[320px] border-r border-gray-100 dark:border-gray-800 flex flex-col bg-white dark:bg-[#16171d] ${selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3.5">
            <div className="flex items-center gap-3 w-full">
              <button className="p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors md:hidden">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f1f1f1] dark:bg-[#08060d] border-none rounded-full px-10 py-2 text-[14px] focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500/30 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-800 dark:text-gray-200"
                />
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && messages.length === 0 ? (
               <div className="p-4 space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all ${
                    isActive ? 'bg-[#3390ec] dark:bg-blue-600' : 'hover:bg-[#f4f4f5] dark:hover:bg-[#1f2028]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden ${isActive ? 'ring-0' : ''}`}>
                       {partner.avatar ? (
                         <img src={getImageUrl(partner.avatar)} className="w-full h-full object-cover" />
                       ) : (
                         <div className={`w-full h-full flex items-center justify-center text-white ${isActive ? 'bg-blue-400' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                            {partner.name.charAt(0).toUpperCase()}
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-[15px] font-bold truncate ${isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        {partner.name}
                      </span>
                      <span className={`text-[12px] whitespace-nowrap ml-2 ${isActive ? 'text-blue-50' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatMessageTime(lastMsg.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                       <p className={`text-[14px] truncate flex-1 leading-tight ${isActive ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                          {lastMsg.from_user_id === user.id && (
                            <svg className={`inline-block w-4 h-4 mr-0.5 -mt-0.5 ${isActive ? 'text-blue-100' : 'text-blue-500 dark:text-blue-400'}`} viewBox="0 0 24 24" fill="currentColor">
                                <path d={lastMsg.is_read ? "M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" : "M9 16.17L4.83 12l-1.42 1.41L9 17.58l12-12-1.41-1.41z"}/>
                            </svg>
                          )}
                          {lastMsg.type === 'text' ? lastMsg.message : (
                            <span className="italic flex items-center gap-1">
                                {lastMsg.type === 'image' && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
                                {lastMsg.type.charAt(0).toUpperCase() + lastMsg.type.slice(1)}
                            </span>
                          )}
                       </p>
                       {unreadCount > 0 && !isActive && (
                         <span className="bg-[#4caf50] text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-sm">
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
        <div className={`flex-1 flex flex-col bg-[#e7ebf0] dark:bg-[#08060d] relative ${!selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="h-[56px] px-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#16171d] sticky top-0 z-20 transition-colors">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedPartnerId(null)} className="md:hidden p-2 -ml-2 text-gray-400 dark:text-gray-500 hover:text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden cursor-pointer" onClick={() => navigate(`/u/${selectedConversation.partner.id}`)}>
                     {selectedConversation.partner.avatar ? (
                       <img src={getImageUrl(selectedConversation.partner.avatar)} className="w-full h-full object-cover" />
                     ) : selectedConversation.partner.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-tight truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer" onClick={() => navigate(`/u/${selectedConversation.partner.id}`)}>
                      {selectedConversation.partner.name}
                    </h2>
                    <span className="text-[12px] text-[#3390ec] dark:text-blue-400 font-medium">last seen recently</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isSearchingHistory ? (
                      <div className="flex items-center bg-[#f1f1f1] dark:bg-[#16171d] rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700 absolute right-4 left-4 md:static md:w-auto z-30">
                        <input
                            autoFocus
                            placeholder="Search"
                            className="bg-transparent border-none text-sm outline-none w-full md:w-48 font-medium text-gray-800 dark:text-gray-100"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                        />
                        <button onClick={() => { setIsSearchingHistory(false); setHistorySearch(''); }} className="text-gray-400 dark:text-gray-500 shrink-0"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                      </div>
                  ) : (
                    <button onClick={() => setIsSearchingHistory(true)} className="p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </button>
                  )}
                  {!isSearchingHistory && (
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-2 md:p-6 space-y-1 bg-[#e7ebf0] dark:bg-[#08060d] bg-repeat bg-center custom-scrollbar"
                style={{
                  backgroundImage: "url('https://i.pinimg.com/originals/85/ec/da/85ecda1af25fa0a9bc29853909148db3.jpg')",
                  backgroundSize: '400px'
                }}
              >
                <div className="flex flex-col gap-1">
                  {(historySearch ? filteredChatMessages : selectedConversation.messages).map((msg, idx) => {
                    const isOwn = msg.from_user_id === user.id;
                    const prevMsg = selectedConversation.messages[idx - 1];
                    const nextMsg = selectedConversation.messages[idx + 1];

                    const isFirstInGroup = !prevMsg || prevMsg.from_user_id !== msg.from_user_id;
                    const isLastInGroup = !nextMsg || nextMsg.from_user_id !== msg.from_user_id;

                    const showDate = !prevMsg || format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');

                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                           <div className="flex justify-center my-4">
                              <span className="bg-black/10 dark:bg-[#16171d]/60 backdrop-blur text-white dark:text-gray-300 text-[13px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                                 {isToday(new Date(msg.created_at)) ? 'Today' : format(new Date(msg.created_at), 'MMMM dd')}
                              </span>
                           </div>
                        )}

                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}>
                          <div className={`relative max-w-[90%] md:max-w-[80%] group flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

                            <div className={`relative px-3 py-1.5 shadow-sm min-w-[60px] animate-in fade-in slide-in-from-bottom-1 duration-200 ${
                              isOwn
                                ? 'bg-[#effdde] dark:bg-[#2b5278] text-gray-900 dark:text-gray-100 rounded-[15px] rounded-br-[4px]'
                                : 'bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 rounded-[15px] rounded-bl-[4px]'
                            } ${!isLastInGroup && (isOwn ? 'rounded-br-[15px]' : 'rounded-bl-[15px]')}`}>

                              {msg.type === 'text' && (
                                <p className="text-[15px] leading-[1.4] whitespace-pre-wrap break-words">{msg.message}</p>
                              )}
                              {msg.type === 'image' && (
                                  <div className="rounded-lg overflow-hidden mb-1 border border-black/5">
                                    <img src={getImageUrl(msg.file_path)} className="max-w-full max-h-[400px] object-contain" />
                                  </div>
                              )}
                              {msg.type === 'audio' && (
                                  <audio controls src={getImageUrl(msg.file_path)} className="max-w-full mb-1 h-10 accent-blue-500" />
                              )}
                              {msg.type === 'file' && (
                                  <a href={getImageUrl(msg.file_path)} target="_blank" className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0">
                                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h7v11H6z"/></svg>
                                      </div>
                                      <div className="min-w-0">
                                          <p className="truncate text-sm font-bold">{msg.message}</p>
                                          <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Document</p>
                                      </div>
                                  </a>
                              )}

                              <div className={`flex items-center justify-end gap-1 mt-0.5 -mr-1 text-right select-none float-right ml-4 relative top-1`}>
                                 <span className={`text-[11px] font-medium leading-none ${isOwn ? 'text-[#619a64] dark:text-blue-300' : 'text-[#a0acb6] dark:text-gray-500'}`}>
                                    {format(new Date(msg.created_at), 'HH:mm')}
                                 </span>
                                 {isOwn && (
                                   <svg className={`w-4 h-4 -mr-0.5 ${msg.is_read ? 'text-[#619a64] dark:text-blue-300' : 'text-[#619a64] dark:text-blue-300'}`} viewBox="0 0 24 24" fill="currentColor">
                                      <path d={msg.is_read ? "M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" : "M9 16.17L4.83 12l-1.42 1.41L9 17.58l12-12-1.41-1.41z"}/>
                                   </svg>
                                 )}
                              </div>

                              {/* Reactions View */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                  <div className={`absolute -bottom-3 ${isOwn ? 'right-2' : 'left-2'} flex gap-1 z-10`}>
                                      {msg.reactions.map(r => (
                                          <button
                                              key={r.id}
                                              onClick={() => r.user_id === user.id && handleReact(msg.id, r.emoji)}
                                              className={`bg-white dark:bg-[#16171d] rounded-full px-1.5 py-0.5 text-xs shadow-md border border-gray-100 dark:border-gray-800 animate-in zoom-in-50 transition-transform active:scale-125 ${r.user_id === user.id ? 'hover:scale-110' : 'cursor-default'}`}
                                          >
                                              {r.emoji}
                                          </button>
                                      ))}
                                  </div>
                              )}
                            </div>

                            {/* Context Menu / Actions Shortcut */}
                            <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-black/10 dark:bg-white/5 rounded-full px-1 py-0.5 backdrop-blur-sm`}>
                                {isOwn && (
                                    <button onClick={() => handleDeleteMessage(msg)} className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                )}
                                {['❤️', '👍', '🔥'].map(emoji => (
                                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="p-1 hover:scale-150 transition-transform text-[15px] leading-none">{emoji}</button>
                                ))}
                            </div>

                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-[#16171d] flex items-end gap-2 max-w-4xl mx-auto w-full mb-2 md:mb-4 md:rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
                 <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-[#3390ec] transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13"/></svg>
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                 <div className="flex-1 min-h-[44px] flex items-center">
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
                      placeholder="Message"
                      className="w-full bg-transparent py-2.5 text-[15px] focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-800 dark:text-gray-200 resize-none max-h-48 overflow-y-auto"
                    />
                 </div>

                 {newMessage.trim() ? (
                    <button
                        onClick={() => handleSend('text')}
                        className="p-2.5 text-[#3390ec] dark:text-blue-400 hover:scale-110 transition-transform active:scale-95"
                    >
                        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                 ) : (
                    <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        className={`p-2.5 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 dark:text-gray-500 hover:text-blue-500'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    </button>
                 )}
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#e7ebf0] dark:bg-[#08060d]"
              style={{
                backgroundImage: "url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')",
                backgroundSize: '100px'
              }}
            >
               <div className="bg-black/10 dark:bg-[#16171d]/60 backdrop-blur-md rounded-2xl px-6 py-2 shadow-sm border border-white/10">
                    <p className="text-white dark:text-gray-300 text-sm font-bold">Select a chat to start messaging</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Telegram Style Delete Modal */}
      {msgToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1c1c1d] w-full max-w-[320px] rounded-[28px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-gray-900 dark:text-white text-[17px] font-bold text-center mb-6">
              Delete selected message?
            </h3>

            <button
              onClick={() => setDeleteForBoth(!deleteForBoth)}
              className="w-full flex items-center gap-3 px-1 mb-8 group"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${deleteForBoth ? 'bg-[#619a64]' : 'border-2 border-gray-300 dark:border-gray-600'}`}>
                {deleteForBoth && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                Delete for Me and {selectedConversation?.partner.name}
              </span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setMsgToDelete(null)}
                className="flex-1 py-3 bg-[#f1f1f2] dark:bg-[#2c2c2e] text-gray-900 dark:text-white rounded-[18px] text-[15px] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-[#619a64] text-white rounded-[18px] text-[15px] font-bold hover:bg-[#528a55] transition-colors shadow-lg shadow-[#619a64]/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};