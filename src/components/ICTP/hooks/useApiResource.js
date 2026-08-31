import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../ictp_lib/api';

const CACHE_PREFIX = 'gnss:cache:';

function readCache(cacheKey) {
  if (!cacheKey) return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { data: parsed.data, lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null };
  } catch {
    // Corrupt entry, private-browsing quota, or localStorage unavailable --
    // treat exactly like "no cache", never let this throw and break the app.
    return null;
  }
}

function writeCache(cacheKey, data, lastUpdated) {
  if (!cacheKey) return;
  try {
    localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify({ data, lastUpdated: lastUpdated.toISOString() }));
  } catch {
    // Storage full or unavailable (e.g. private browsing) -- caching is a
    // nice-to-have, so just skip it rather than fail the fetch.
  }
}

/**
 * Generic REST polling hook shared by every data hook in this app.
 * - Fetches immediately, then on a fixed interval (fallback for when the
 *   WebSocket is down), and again whenever `refetchToken` changes (the
 *   dashboard passes the live-socket's last-event id here so a real
 *   LIVE_UPDATE/NAV_UPDATE triggers an immediate refresh instead of waiting
 *   for the next poll tick).
 * - Never leaves stale `data` in place silently on error: a failed poll
 *   (network drop, server hiccup) only ever *adds* an `error`, it never
 *   clears `data`. Callers are expected to keep rendering the last-known
 *   `data` and treat `error` as "offline / stale", not "nothing to show" --
 *   see ChartCard, Skyplot, GroundTrackMap, IonosphericMap, GlobeSection.
 *   A 404 (e.g. "no skyplot data yet") is the one case that legitimately
 *   means there's nothing to show, so that's surfaced as `notFound` and
 *   does clear `data`.
 * - If `cacheKey` is given, the last successful payload is mirrored into
 *   localStorage and used as the *initial* value on mount. That way a full
 *   page reload while offline still shows the last-known dashboard state
 *   immediately, instead of a blank/loading screen, and it's replaced the
 *   moment a real fetch succeeds again.
 */
export function useApiResource(fetchFn, { intervalMs = 15000, refetchToken, cacheKey } = {}) {
  const cached = useRef(cacheKey ? readCache(cacheKey) : null);
  const [data, setData] = useState(cached.current?.data ?? null);
  const [loading, setLoading] = useState(!cached.current);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(cached.current?.lastUpdated ?? null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const load = useCallback(async (signal) => {
    try {
      const result = await fetchFnRef.current({ signal });
      if (signal?.aborted) return;
      const now = new Date();
      setData(result);
      setNotFound(false);
      setError(null);
      setLastUpdated(now);
      writeCache(cacheKey, result, now);
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        setData(null);
        setError(null);
      } else {
        // Network/server error: keep whatever `data` is already in state
        // (freshly fetched or hydrated from cache) and only surface `error`.
        setError(err);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const id = setInterval(() => load(controller.signal), intervalMs);
    return () => {
      controller.abort();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, intervalMs, refetchToken]);

  return { data, loading, error, notFound, lastUpdated, refetch: () => load() };
}
