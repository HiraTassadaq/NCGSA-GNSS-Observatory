export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, { signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(`Network error contacting ${path}`, 0, err.message);
  }
  if (!res.ok) {
    let detail = null;
    try {
      detail = (await res.json())?.detail;
    } catch {
      /* body wasn't JSON */
    }
    throw new ApiError(detail || `Request to ${path} failed (${res.status})`, res.status, detail);
  }
  return res.json();
}

export const api = {
  root: (opts) => request('/', opts),
  station: (opts) => request('/api/station', opts),
  satellites: (opts) => request('/api/satellites', opts),
  skyplot: (opts) => request('/api/skyplot', opts),
  satellitesInView: (opts) => request('/api/satellites-in-view', opts),
  dopHistory: (opts) => request('/api/dop-history', opts),
  orbits: (minElevationDeg = 0, opts) =>
    request(`/api/satellites/orbits?min_elevation=${encodeURIComponent(minElevationDeg)}`, opts),
  status: (opts) => request('/api/status', opts),
};

export { ApiError };
