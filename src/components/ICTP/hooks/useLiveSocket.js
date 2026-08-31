import { useEffect, useRef, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/live';
const RECONNECT_DELAY_MS = 3000;

/**
 * Backend /ws/live only pushes event notifications (LIVE_UPDATE / NAV_UPDATE),
 * never the actual payload -- see gnss_backend/app/pipeline.py:_broadcast().
 * Consumers use `lastEvent` as a "something changed, go refetch REST" signal,
 * not as a data source itself.
 */
export function useLiveSocket() {
  const [status, setStatus] = useState('connecting'); // connecting | connected | reconnecting | offline
  const [lastEvent, setLastEvent] = useState(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const attemptsRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const connect = () => {
      if (stoppedRef.current) return;
      let ws;
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        setStatus('offline');
        return;
      }
      socketRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;
        setStatus('connected');
      };
      ws.onmessage = (event) => {
        try {
          setLastEvent(JSON.parse(event.data));
        } catch {
          /* ignore malformed frame */
        }
      };
      ws.onclose = () => {
        if (stoppedRef.current) return;
        attemptsRef.current += 1;
        setStatus(attemptsRef.current > 3 ? 'offline' : 'reconnecting');
        timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      stoppedRef.current = true;
      clearTimeout(timerRef.current);
      socketRef.current?.close();
    };
  }, []);

  return { status, lastEvent };
}
