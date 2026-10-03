import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

type ChannelAuthData = { auth: string; channel_data?: string };
type ChannelAuthCallback = (error: Error | null, data: ChannelAuthData | null) => void;

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY as string | undefined;
const pusherCluster = (import.meta.env.VITE_PUSHER_APP_CLUSTER as string | undefined) || 'mt1';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

/**
 * Shared Laravel Echo instance for real-time chat.
 *
 * `null` when Pusher is not configured (no VITE_PUSHER_APP_KEY), which lets
 * callers fall back gracefully instead of crashing.
 */
let echo: Echo<'pusher'> | null = null;

if (pusherKey && apiBaseUrl) {
  const origin = new URL(apiBaseUrl, window.location.origin).origin;
  const authEndpoint = `${origin}/broadcasting/auth`;

  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  echo = new Echo<'pusher'>({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster: pusherCluster,
    forceTLS: true,
    authEndpoint,
    // The API authenticates with a Sanctum bearer token, not the session
    // cookie Echo's default authorizer would send.
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: ChannelAuthCallback) => {
        const token = localStorage.getItem('token');
        axios
          .post(
            authEndpoint,
            { socket_id: socketId, channel_name: channel.name },
            {
              headers: {
                Authorization: `Bearer ${token ?? ''}`,
                Accept: 'application/json',
              },
            },
          )
          .then((res) => callback(null, res.data as ChannelAuthData))
          .catch((error: unknown) => callback(error as Error, null));
      },
    }),
  });
}

export default echo;
