import { useCallback, useEffect, useRef, useState } from 'react';

// Counts down from a number of seconds to 0, ticking once per second.
// `start(seconds)` (re)arms it; `seconds` is the remaining time, `active` is
// true while it's still running. Used to gate "resend code" buttons so users
// can't trip the SMTP per-user rate limit.
export function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(initial);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((from: number) => {
    clear();
    setSeconds(from);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clear();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { seconds, active: seconds > 0, start };
}
