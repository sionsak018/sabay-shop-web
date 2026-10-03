import { useState, useEffect, useRef, type TouchEvent, type ChangeEvent, type DragEvent } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../../auth/hooks/useAuth';
import { messageApi } from '../services/messageApi';
import { type Message } from '../types/message.types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUrl';
import SmartImage from '../../../components/common/SmartImage';
import { useMessageNotifications } from '../../../context/MessageNotificationContext';

const AVATAR_COLORS = ['#e17076', '#7bc862', '#e5ca77', '#6ec9cb', '#65aadd', '#a695e7', '#ee7aae', '#faa774'];
const avatarColor = (id: number) => AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];

const mediaLabel = (msg: Message) => {
  if (msg.type === 'image') return 'Photo';
  if (msg.type === 'audio') return 'Voice message';
  if (msg.type === 'file') return 'Document';
  return '';
};

const Avatar = ({ name, avatar, id, size }: { name: string; avatar?: string; id: number; size: number }) => (
  <div
    className="shrink-0 overflow-hidden rounded-full"
    style={{ width: size, height: size, backgroundColor: avatar ? undefined : avatarColor(id) }}
  >
    {avatar ? (
      <SmartImage
        src={avatar}
        alt=""
        width={size * 2}
        height={size * 2}
        widths={[size, size * 2, size * 4]}
        sizes={`${size}px`}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center font-bold text-white" style={{ fontSize: size * 0.4 }}>
        {name.charAt(0).toUpperCase()}
      </div>
    )}
  </div>
);

const Ticks = ({ read }: { read: boolean }) => (
  <svg
    width="17"
    height="11"
    viewBox="0 0 17 11"
    fill="none"
    className={`shrink-0 ${read ? 'text-[#4fae4e]' : 'text-[#a0acb6] dark:text-[#6c7883]'}`}
  >
    {read ? (
      <>
        <path d="M1 5.6 4.4 9 10.2 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.2 5.6 10.6 9 16.4 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <path d="M1 5.6 4.4 9 10.2 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

const BubbleTail = ({ own }: { own: boolean }) => (
  <svg
    className={`tg-tail ${own ? 'right-[-7px] text-[#effdde] dark:text-[#2b5278]' : 'left-[-7px] text-white dark:text-[#182533]'}`}
    width="9"
    height="18"
    viewBox="0 0 9 18"
    fill="currentColor"
    aria-hidden="true"
  >
    {own ? (
      <path d="M0 0c0 9 4 16 9 18-4-1-9-6-9-9V0Z" />
    ) : (
      <path d="M9 0c0 9-4 16-9 18 4-1 9-6 9-9V0Z" />
    )}
  </svg>
);

const MenuItem = ({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[14px] font-medium transition-colors ${
      danger
        ? 'text-[#e53935] hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5'
    }`}
  >
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">{children}</span>
    {label}
  </button>
);

export const InboxPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { latestMessage, updatesVersion, clearUnread, realtimeEnabled } = useMessageNotifications();

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [swipe, setSwipe] = useState<{ id: number; dx: number } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const atBottomRef = useRef(true);
  const longPressTimer = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; msg: Message } | null>(null);

  const fetchMessages = async (isQuiet = false) => {
    if (!user) return;
    if (!isQuiet) setLoading(true);
    try {
      const res = await messageApi.getConversations();
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      if (!isQuiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (realtimeEnabled) return;

    const interval = setInterval(() => fetchMessages(true), 10000);
    return () => clearInterval(interval);
  }, [user, realtimeEnabled]);

  useEffect(() => {
    if (!latestMessage) return;
    setMessages((prev) => (prev.some((m) => m.id === latestMessage.id) ? prev : [latestMessage, ...prev]));
    clearUnread();
  }, [latestMessage, clearUnread]);

  useEffect(() => {
    if (updatesVersion > 0) fetchMessages(true);
  }, [updatesVersion]);

  useEffect(() => {
    clearUnread();
  }, [clearUnread, selectedPartnerId]);

  useEffect(() => {
    atBottomRef.current = true;
    setShowScrollDown(false);
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selectedPartnerId]);

  useEffect(() => {
    if (atBottomRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark incoming messages as read while the conversation is open.
  useEffect(() => {
    if (!selectedPartnerId || !user) return;
    messages
      .filter((m) => m.to_user_id === user.id && m.from_user_id === selectedPartnerId && !m.is_read)
      .forEach((m) => {
        messageApi.markAsRead(m.id).catch(() => undefined);
      });
  }, [selectedPartnerId, messages, user]);

  if (!user) return null;

  const conversations: Record<number, { partner: { id: number; name: string; avatar?: string }; messages: Message[] }> = {};

  messages.forEach((msg) => {
    const partnerId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
    const partner = (msg.from_user_id === user.id ? msg.to_user : msg.from_user) as { id: number; name: string; avatar?: string };
    if (!partner) return;

    if (!conversations[partnerId]) {
      conversations[partnerId] = {
        partner: { id: partnerId, name: partner.name, avatar: partner.avatar },
        messages: [],
      };
    }
    conversations[partnerId].messages.push(msg);
  });

  Object.values(conversations).forEach((conv) => {
    conv.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  const sortedConversations = Object.entries(conversations)
    .filter(([, data]) => data.partner.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
    if (replyTo) formData.append('reply_to_id', String(replyTo.id));

    try {
      await messageApi.sendMessage(formData);
      setNewMessage('');
      setReplyTo(null);
      fetchMessages(true);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : 'file';
    handleSend(type, file);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
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
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
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
    } catch {
      // ignore
    }
  };

  const handleDeleteMessage = (msg: Message) => setMsgToDelete(msg);

  const confirmDelete = async () => {
    if (!msgToDelete) return;
    try {
      await messageApi.deleteMessage(msgToDelete.id);
      setMsgToDelete(null);
      fetchMessages(true);
    } catch {
      alert('Failed to delete message');
    }
  };

  const openContextMenu = (msg: Message, x: number, y: number) => {
    const menuW = 224;
    const menuH = msg.from_user_id === user.id ? 232 : 280;
    setContextMenu({
      msg,
      x: Math.max(8, Math.min(x, window.innerWidth - menuW - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - menuH - 8)),
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleCopy = (msg: Message) => {
    const text = msg.type === 'text' ? msg.message : mediaLabel(msg);
    navigator.clipboard?.writeText(text).catch(() => undefined);
    closeContextMenu();
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    closeContextMenu();
  };

  const handleForward = (msg: Message) => {
    setForwardMsg(msg);
    closeContextMenu();
  };

  const forwardTo = async (partnerId: number) => {
    const source = forwardMsg;
    setForwardMsg(null);
    if (!source) return;
    const formData = new FormData();
    formData.append('to_user_id', String(partnerId));
    formData.append('type', 'text');
    formData.append('message', source.type === 'text' ? source.message : `[${mediaLabel(source)}]`);
    try {
      await messageApi.sendMessage(formData);
      fetchMessages(true);
    } catch (error) {
      console.error('Failed to forward message', error);
    }
  };

  const handleTouchStart = (msg: Message, e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, msg };
    longPressTimer.current = window.setTimeout(() => {
      openContextMenu(msg, touch.clientX, touch.clientY);
      longPressTimer.current = null;
    }, 450);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = e.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    if (dx > 8 && Math.abs(dx) > Math.abs(dy)) {
      setSwipe({ id: start.msg.id, dx: Math.min(dx, 72) });
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (swipe && swipe.dx > 48 && touchStartRef.current) {
      setReplyTo(touchStartRef.current.msg);
    }
    setSwipe(null);
    touchStartRef.current = null;
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    atBottomRef.current = atBottom;
    setShowScrollDown(!atBottom);
  };

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const selectedConversation = selectedPartnerId ? conversations[selectedPartnerId] : null;
  const filteredChatMessages = selectedConversation?.messages.filter((m) =>
    (m.message || '').toLowerCase().includes(historySearch.toLowerCase())
  ) || [];
  const displayMessages = historySearch ? filteredChatMessages : selectedConversation?.messages || [];

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'dd/MM/yy');
  };

  const replyName = (msg: Message) => (msg.from_user_id === user.id ? 'You' : msg.from_user?.name || 'Unknown');

  return (
    <div className={`${selectedPartnerId ? 'h-[100dvh]' : 'h-[calc(100dvh-64px)]'} md:h-[calc(100vh-64px)] flex items-start justify-center p-0 md:p-4 antialiased`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`w-full max-w-6xl h-full md:h-[calc(100vh-100px)] bg-white dark:bg-[#17212b] md:rounded-lg shadow-xl flex overflow-hidden border border-gray-200 dark:border-black/30 relative ${isDragOver ? 'ring-4 ring-blue-500 ring-inset' : ''}`}
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
        <div className={`w-full md:w-80 lg:w-[330px] border-r border-gray-100 dark:border-black/20 flex flex-col bg-white dark:bg-[#17212b] ${selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f1f1f1] dark:bg-[#242f3d] border-none rounded-full pl-10 pr-3 py-2 text-[14px] focus:ring-2 focus:ring-[#3390ec]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-2">
            {loading && messages.length === 0 ? (
              <div className="p-3 space-y-2">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse px-1 py-1">
                    <div className="w-[54px] h-[54px] bg-gray-100 dark:bg-[#242f3d] rounded-full shrink-0" />
                    <div className="flex-1 space-y-2 py-2">
                      <div className="h-3.5 bg-gray-100 dark:bg-[#242f3d] rounded w-1/2" />
                      <div className="h-2.5 bg-gray-100 dark:bg-[#242f3d] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                No chats yet
              </div>
            ) : sortedConversations.map(([partnerId, { partner, messages: convMsgs }]) => {
              const lastMsg = convMsgs[convMsgs.length - 1];
              const isActive = selectedPartnerId === Number(partnerId);
              const unreadCount = convMsgs.filter((m) => !m.is_read && m.to_user_id === user.id).length;

              return (
                <button
                  key={partnerId}
                  onClick={() => setSelectedPartnerId(Number(partnerId))}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 transition-colors ${
                    isActive ? 'bg-[#3390ec] dark:bg-[#2b5278]' : 'hover:bg-[#f4f4f5] dark:hover:bg-[#202b36]'
                  }`}
                >
                  <Avatar name={partner.name} avatar={partner.avatar} id={partner.id} size={54} />

                  <div className="flex-1 min-w-0 pr-0.5">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-[15px] font-semibold truncate ${isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        {partner.name}
                      </span>
                      <span className={`text-[12px] whitespace-nowrap ml-2 ${isActive ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatMessageTime(lastMsg.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-[14px] truncate flex-1 leading-tight ${isActive ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                        {lastMsg.from_user_id === user.id && (
                          <Ticks read={lastMsg.is_read} />
                        )}
                        <span className="ml-0.5">
                          {lastMsg.type === 'text' ? lastMsg.message : (
                            <span className="italic">
                              {lastMsg.type === 'image' && <svg className="inline-block w-3.5 h-3.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
                              {mediaLabel(lastMsg)}
                            </span>
                          )}
                        </span>
                      </p>
                      {unreadCount > 0 && !isActive && (
                        <span className="bg-[#3390ec] text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-sm">
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
        <div className={`flex-1 flex flex-col relative ${!selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="h-14 px-2.5 md:px-4 flex items-center justify-between bg-white dark:bg-[#17212b] border-b border-gray-100 dark:border-black/20 z-20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button onClick={() => setSelectedPartnerId(null)} className="md:hidden p-2 -ml-2 text-gray-400 dark:text-gray-400 hover:text-[#3390ec]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button className="shrink-0" onClick={() => navigate(`/u/${selectedConversation.partner.id}`)}>
                    <Avatar name={selectedConversation.partner.name} avatar={selectedConversation.partner.avatar} id={selectedConversation.partner.id} size={42} />
                  </button>
                  <div className="min-w-0 flex flex-col">
                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate hover:text-[#3390ec] transition-colors cursor-pointer" onClick={() => navigate(`/u/${selectedConversation.partner.id}`)}>
                      {selectedConversation.partner.name}
                    </h2>
                    <span className="text-[12px] text-[#3390ec] dark:text-[#6ab2f2] font-medium">last seen recently</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isSearchingHistory ? (
                    <div className="flex items-center bg-[#f1f1f1] dark:bg-[#242f3d] rounded-full px-3 py-1 border border-gray-200 dark:border-white/5 absolute right-3 left-3 md:static md:w-auto z-30">
                      <input
                        autoFocus
                        placeholder="Search"
                        className="bg-transparent border-none text-sm outline-none w-full md:w-44 font-medium text-gray-800 dark:text-gray-100"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                      />
                      <button onClick={() => { setIsSearchingHistory(false); setHistorySearch(''); }} className="text-gray-400 dark:text-gray-500 shrink-0"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                  ) : (
                    <button onClick={() => setIsSearchingHistory(true)} className="p-2 text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all">
                      <svg className="w-5.5 h-5.5" width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </button>
                  )}
                  {!isSearchingHistory && (
                    <button className="p-2 text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all">
                      <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v.01M12 12v.01M12 19v.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="chat-doodle flex-1 overflow-y-auto px-2 md:px-4 py-2 custom-scrollbar"
              >
                {displayMessages.map((msg, idx) => {
                  const isOwn = msg.from_user_id === user.id;
                  const prevMsg = displayMessages[idx - 1];
                  const nextMsg = displayMessages[idx + 1];

                  const isFirstInGroup = !prevMsg || prevMsg.from_user_id !== msg.from_user_id;
                  const isLastInGroup = !nextMsg || nextMsg.from_user_id !== msg.from_user_id;
                  const showDate = !prevMsg || format(new Date(msg.created_at), 'yyyy-MM-dd') !== format(new Date(prevMsg.created_at), 'yyyy-MM-dd');

                  const bg = isOwn ? 'bg-[#effdde] dark:bg-[#2b5278]' : 'bg-white dark:bg-[#182533]';
                  const metaColor = isOwn ? 'text-[#5a9a63] dark:text-[#8fb8d8]' : 'text-[#a0acb6] dark:text-[#6c7883]';
                  const bottomLeft = isOwn ? 13 : isLastInGroup ? 4 : 13;
                  const bottomRight = isOwn ? (isLastInGroup ? 4 : 13) : 13;
                  const isSwiping = swipe?.id === msg.id;

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="bg-black/20 dark:bg-black/30 backdrop-blur text-white text-[12.5px] font-medium px-3 py-1 rounded-full">
                            {isToday(new Date(msg.created_at)) ? 'Today' : isYesterday(new Date(msg.created_at)) ? 'Yesterday' : format(new Date(msg.created_at), 'MMMM dd')}
                          </span>
                        </div>
                      )}

                      <div className={`relative group flex ${isOwn ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2.5' : 'mt-[3px]'} ${msg.reactions && msg.reactions.length > 0 ? 'mb-3' : ''}`}>
                        {isSwiping && (
                          <span className="absolute top-1/2 -translate-y-1/2 text-[#3390ec]/70" style={{ [isOwn ? 'right' : 'left']: -26 }}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a4 4 0 010 8h-3m3-14L7 10l6 6"/></svg>
                          </span>
                        )}

                        <div
                          className="relative flex max-w-[88%] items-end md:max-w-[75%]"
                          style={{ transform: isSwiping ? `translateX(${swipe.dx}px)` : undefined, transition: 'transform 0.12s ease-out' }}
                          onContextMenu={(e) => { e.preventDefault(); openContextMenu(msg, e.clientX, e.clientY); }}
                          onTouchStart={(e) => handleTouchStart(msg, e)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          <div
                            className={`relative rounded-[13px] shadow-[0_1px_2px_rgba(16,24,40,0.13)] ${bg} ${msg.type === 'image' ? 'p-1' : 'px-2.5 py-1.5'}`}
                            style={{ borderBottomLeftRadius: bottomLeft, borderBottomRightRadius: bottomRight }}
                          >
                            {isLastInGroup && <BubbleTail own={isOwn} />}

                            {msg.reply_to && (
                              <div className={`mb-1 flex flex-col overflow-hidden rounded-md border-l-[3px] px-2 py-1 ${isOwn ? 'border-[#6fcf7c] bg-[#c9eab4]/60 dark:bg-black/20' : 'border-[#3390ec] bg-[#dceaff]/70 dark:bg-black/20'}`}>
                                <span className={`text-[12.5px] font-bold leading-tight ${isOwn ? 'text-[#3f8f4a] dark:text-[#8fd59a]' : 'text-[#3390ec] dark:text-[#6ab2f2]'}`}>
                                  {replyName(msg.reply_to)}
                                </span>
                                <span className="truncate text-[13px] leading-tight text-gray-600 dark:text-gray-300">
                                  {msg.reply_to.type === 'text' ? msg.reply_to.message : mediaLabel(msg.reply_to)}
                                </span>
                              </div>
                            )}

                            {msg.type === 'text' && (
                              <p className="whitespace-pre-wrap break-words px-0.5 text-[15px] leading-[1.35] text-[#0f1418] dark:text-[#f5f7f9]">
                                <span className={`float-right ml-2 mt-1 inline-flex translate-y-[2px] select-none items-center gap-1 ${metaColor}`}>
                                  <span className="text-[11px] font-medium">{format(new Date(msg.created_at), 'HH:mm')}</span>
                                  {isOwn && <Ticks read={msg.is_read} />}
                                </span>
                                {msg.message}
                              </p>
                            )}

                            {msg.type === 'image' && (
                              <div className="overflow-hidden rounded-[10px]">
                                <SmartImage src={msg.file_path} alt="Attachment" widths={[320, 640, 960]} sizes="(max-width: 768px) 100vw, 400px" width={640} height={480} className="max-w-full max-h-[400px] object-contain" />
                              </div>
                            )}
                            {msg.type === 'audio' && (
                              <audio controls src={getImageUrl(msg.file_path)} className="max-w-full h-10 accent-[#3390ec]" />
                            )}
                            {msg.type === 'file' && (
                              <a href={getImageUrl(msg.file_path)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-1">
                                <div className="w-10 h-10 bg-[#3390ec] rounded-full flex items-center justify-center text-white shrink-0">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h7v11H6z"/></svg>
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#0f1418] dark:text-[#f5f7f9]">{msg.message}</p>
                                  <p className="text-[10px] uppercase tracking-widest opacity-60">Document</p>
                                </div>
                              </a>
                            )}

                            {msg.type !== 'text' && (
                              <span className="absolute bottom-1 right-1.5 inline-flex items-center gap-1 rounded-full bg-black/40 px-1.5 py-[1px] text-[11px] font-medium text-white backdrop-blur-sm">
                                {format(new Date(msg.created_at), 'HH:mm')}
                                {isOwn && <Ticks read={msg.is_read} />}
                              </span>
                            )}

                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className={`absolute -bottom-3 ${isOwn ? 'right-2' : 'left-2'} flex gap-1 z-10`}>
                                {msg.reactions.map((r) => (
                                  <button
                                    key={r.id}
                                    onClick={() => r.user_id === user.id && handleReact(msg.id, r.emoji)}
                                    className={`rounded-full border px-1.5 py-0.5 text-xs shadow-sm transition-transform ${
                                      r.user_id === user.id
                                        ? 'border-[#3390ec]/40 bg-white hover:scale-110 dark:border-[#2b5278] dark:bg-[#0e1621]'
                                        : 'cursor-default border-black/5 bg-white dark:border-white/5 dark:bg-[#0e1621]'
                                    }`}
                                  >
                                    {r.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Hover reply affordance */}
                          <button
                            onClick={() => handleReply(msg)}
                            className={`mb-1 rounded-full p-1 text-gray-400 opacity-0 transition-opacity hover:text-[#3390ec] group-hover:opacity-100 ${isOwn ? 'mr-1 order-first' : 'ml-1'}`}
                            aria-label="Reply"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l-4-4 4-4M5 10h9a5 5 0 015 5v3"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showScrollDown && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-500 shadow-lg transition-transform hover:scale-105 dark:bg-[#17212b] dark:text-gray-300"
                  aria-label="Scroll to bottom"
                >
                  <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 14l-7 7-7-7M12 21V3"/></svg>
                </button>
              )}

              {/* Composer */}
              <div className="px-2 md:px-4 pb-2.5 pt-1.5 bg-transparent">
                {replyTo && (
                  <div className="mx-auto mb-1.5 flex w-full max-w-3xl items-center gap-2 rounded-xl bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur dark:bg-[#17212b]/95">
                    <div className="min-w-0 flex-1 border-l-[3px] border-[#3390ec] pl-2">
                      <p className="text-[13px] font-bold text-[#3390ec] dark:text-[#6ab2f2]">{replyName(replyTo)}</p>
                      <p className="truncate text-[13px] text-gray-500 dark:text-gray-400">
                        {replyTo.type === 'text' ? replyTo.message : mediaLabel(replyTo)}
                      </p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/5">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}

                <div className="mx-auto flex w-full max-w-3xl items-end gap-1 rounded-2xl bg-white px-1.5 py-1 shadow-[0_1px_3px_rgba(16,24,40,0.16)] dark:bg-[#17212b]">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 dark:text-gray-400 hover:text-[#3390ec] transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Attach">
                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13"/></svg>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                  <div className="flex-1 min-h-[42px] flex items-center">
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
                      className="w-full bg-transparent py-2.5 px-1 text-[15px] focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100 resize-none max-h-40 overflow-y-auto custom-scrollbar"
                    />
                  </div>

                  {newMessage.trim() ? (
                    <button
                      onClick={() => handleSend('text')}
                      className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#3390ec] text-white transition-transform hover:scale-105 active:scale-95"
                      aria-label="Send"
                    >
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                  ) : (
                    <button
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      className={`mb-0.5 flex h-10 w-10 items-center justify-center rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 dark:text-gray-400 hover:text-[#3390ec]'}`}
                      aria-label="Record voice message"
                    >
                      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="chat-doodle flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-black/20 px-4 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm dark:bg-black/30">
                Select a chat to start messaging
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[900]"
            onClick={closeContextMenu}
            onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
          />
          <div
            className="fixed z-[901] w-56 overflow-hidden rounded-2xl bg-white py-1 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 dark:bg-[#1c242f] dark:ring-white/10"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {contextMenu.msg.from_user_id !== user.id && (
              <div className="flex items-center justify-between px-2.5 py-2 border-b border-gray-100 dark:border-white/5">
                {['❤️', '👍', '🔥', '😂', '😮'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { handleReact(contextMenu.msg.id, emoji); closeContextMenu(); }}
                    className="rounded-full p-1 text-[20px] leading-none transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <MenuItem label="Reply" onClick={() => handleReply(contextMenu.msg)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l-4-4 4-4M5 10h9a5 5 0 015 5v3"/></svg>
            </MenuItem>
            {contextMenu.msg.type === 'text' && (
              <MenuItem label="Copy" onClick={() => handleCopy(contextMenu.msg)}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </MenuItem>
            )}
            <MenuItem label="Forward" onClick={() => handleForward(contextMenu.msg)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 14l5-5-5-5M20 9H9a5 5 0 00-5 5v3"/></svg>
            </MenuItem>
            {contextMenu.msg.from_user_id === user.id && (
              <MenuItem label="Delete" danger onClick={() => { const m = contextMenu.msg; closeContextMenu(); handleDeleteMessage(m); }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </MenuItem>
            )}
          </div>
        </>
      )}

      {/* Forward picker */}
      {forwardMsg && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150 sm:items-center sm:p-4"
          onClick={() => setForwardMsg(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 sm:rounded-2xl sm:zoom-in-95 dark:bg-[#1c242f]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-[16px] font-bold text-gray-900 dark:text-white">Forward to…</h3>
            <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
              {sortedConversations.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">No chats yet</p>
              )}
              {sortedConversations.map(([pid, { partner }]) => (
                <button
                  key={pid}
                  onClick={() => forwardTo(Number(pid))}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <Avatar name={partner.name} avatar={partner.avatar} id={partner.id} size={44} />
                  <span className="truncate text-[15px] font-medium text-gray-800 dark:text-gray-100">{partner.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setForwardMsg(null)}
              className="mt-3 w-full rounded-xl bg-gray-100 py-2.5 text-[15px] font-bold text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {msgToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-[320px] overflow-hidden rounded-[22px] bg-white shadow-2xl animate-in zoom-in-95 duration-150 dark:bg-[#1c242f]">
            <div className="px-5 pt-5 pb-1.5 text-center text-[16px] font-bold text-gray-900 dark:text-white">Delete message?</div>
            <div className="px-5 pb-4 text-center text-[13px] text-gray-500 dark:text-gray-400">This will remove it for everyone in the chat.</div>
            <div className="flex border-t border-gray-100 dark:border-white/5">
              <button onClick={() => setMsgToDelete(null)} className="flex-1 py-3 text-[15px] font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 border-l border-gray-100 py-3 text-[15px] font-bold text-[#e53935] hover:bg-red-50 dark:border-white/5 dark:hover:bg-red-500/10">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
