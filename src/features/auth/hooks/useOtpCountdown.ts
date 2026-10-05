import { useEffect, useState } from 'react';

/**
 * Count down the seconds left on a 6-digit Telegram code.
 *
 * `seconds` is what the API reported (expires_in), or null when the server did not
 * say, in which case the timer stays hidden and the flow behaves as before.
 */
export const useOtpCountdown = (seconds: number | null | undefined) => {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!seconds || seconds <= 0) {
      setRemaining(null);

      return;
    }

    setRemaining(seconds);

    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current === null) return null;

        return Math.max(0, current - 1);
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [seconds]);

  return {
    /** Seconds left, or null when no countdown applies. */
    remaining,
    expired: remaining === 0,
    /** "1:59" style label, or null when no countdown applies. */
    label: remaining === null ? null : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`,
  };
};