import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { type Message } from '../features/messages/types/message.types';
import echo from '../services/echo';
import { playMessageSound } from '../utils/notificationSound';
import { getImageUrl } from '../utils/imageUrl';
import { MessageToast } from '../components/common/MessageToast';

interface MessageNotificationContextType {
  unreadCount: number;
  clearUnread: () => void;
  latestMessage: Message | null;
  updatesVersion: number;
  realtimeEnabled: boolean;
}

const MessageNotificationContext = createContext<MessageNotificationContextType | undefined>(
  undefined,
);

const messagePreview = (msg: Message) => {
  if (msg.type === 'image') return 'Photo';
  if (msg.type === 'audio') return 'Voice message';
  if (msg.type === 'file') return 'Document';
  return msg.message;
};

export const MessageNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const [updatesVersion, setUpdatesVersion] = useState(0);
  const [toast, setToast] = useState<Message | null>(null);

  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);
  const baseTitleRef = useRef('');

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  useEffect(() => {
    baseTitleRef.current = document.title;
  }, []);

  useEffect(() => {
    if (!user) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;
    try {
      const request = Notification.requestPermission();
      if (request && typeof request.catch === 'function') request.catch(() => undefined);
    } catch {
      return;
    }
  }, [user]);

  useEffect(() => {
    if (!echo || !user) return;

    const showBrowserNotification = (msg: Message) => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      try {
        const notification = new Notification(`New message from ${msg.from_user.name}`, {
          body: messagePreview(msg),
          icon: getImageUrl(msg.from_user.avatar, '/favicon.ico'),
          tag: `message-${msg.from_user_id}`,
        });
        notification.onclick = () => {
          window.focus();
          navigateRef.current(`/inbox?id=${msg.from_user_id}`);
          notification.close();
        };
      } catch {
        return;
      }
    };

    const channelName = `App.Models.User.${user.id}`;
    const channel = echo.private(channelName);

    channel.listen('.message.sent', (payload: { message: Message }) => {
      const incoming = payload.message;
      setLatestMessage(incoming);
      if (incoming.to_user_id !== user.id) return;

      const hidden = document.visibilityState !== 'visible';
      const onInbox = locationRef.current.pathname === '/inbox';

      setUnreadCount((count) => count + 1);
      playMessageSound();
      if (hidden) showBrowserNotification(incoming);
      if (!onInbox || hidden) setToast(incoming);
    });

    channel.listen('.message.updated', () => setUpdatesVersion((version) => version + 1));

    return () => {
      echo?.leave(channelName);
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setToast(null);
      setLatestMessage(null);
      return;
    }
  }, [user]);

  useEffect(() => {
    const base = baseTitleRef.current || document.title;
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  const openToast = () => {
    if (!toast) return;
    navigate(`/inbox?id=${toast.from_user_id}`);
    setToast(null);
  };

  return (
    <MessageNotificationContext.Provider
      value={{ unreadCount, clearUnread, latestMessage, updatesVersion, realtimeEnabled: !!echo }}
    >
      {children}
      {toast && <MessageToast message={toast} onOpen={openToast} onClose={() => setToast(null)} />}
    </MessageNotificationContext.Provider>
  );
};

export const useMessageNotifications = () => {
  const context = useContext(MessageNotificationContext);
  if (context === undefined) {
    throw new Error('useMessageNotifications must be used within a MessageNotificationProvider');
  }
  return context;
};
