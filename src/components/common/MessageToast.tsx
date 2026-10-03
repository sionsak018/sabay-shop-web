import { getImageUrl } from '../../utils/imageUrl';
import { type Message } from '../../features/messages/types/message.types';

const preview = (msg: Message) => {
  if (msg.type === 'image') return 'Photo';
  if (msg.type === 'audio') return 'Voice message';
  if (msg.type === 'file') return 'Document';
  return msg.message;
};

export const MessageToast = ({
  message,
  onOpen,
  onClose,
}: {
  message: Message;
  onOpen: () => void;
  onClose: () => void;
}) => {
  const sender = message.from_user;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[1100] flex justify-center px-3 sm:inset-x-auto sm:right-4 sm:justify-end">
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-1 rounded-2xl bg-white p-2.5 shadow-2xl ring-1 ring-black/10 animate-in slide-in-from-top-2 fade-in duration-200 dark:bg-[#17212b] dark:ring-white/10">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#3390ec]">
            {sender?.avatar ? (
              <img src={getImageUrl(sender.avatar)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-white">
                {sender?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-gray-900 dark:text-gray-100">
              {sender?.name ?? 'New message'}
            </p>
            <p className="truncate text-[13px] text-gray-500 dark:text-gray-400">{preview(message)}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
