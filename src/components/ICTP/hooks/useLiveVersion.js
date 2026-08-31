import { useEffect, useRef, useState } from 'react';
import { useSystemStatus } from './useGnssData';

/**
 * Polls only the cheap /api/status endpoint and turns it into a token that
 * only changes when the server's `version` (processed_files.id, see
 * gnss_backend/app/main.py's system_status()) actually advances -- so the
 * heavier station/satellites/skyplot/orbits endpoints only refetch when
 * something really changed, instead of on every fixed timer tick.
 */
export function useLiveVersion(refetchToken) {
  const systemStatus = useSystemStatus(refetchToken);
  const [versionToken, setVersionToken] = useState(null);
  const lastVersionRef = useRef(undefined);

  useEffect(() => {
    const v = systemStatus.data?.version;
    if (v !== undefined && v !== null && v !== lastVersionRef.current) {
      lastVersionRef.current = v;
      setVersionToken(`status-${v}`);
    }
  }, [systemStatus.data]);

  return { systemStatus, versionToken };
}
