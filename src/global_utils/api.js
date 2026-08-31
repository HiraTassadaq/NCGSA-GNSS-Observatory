// /**
//  * API client helper to interact with the FastAPI backend.
//  * Integrates error handling and clean JSON serialization.
//  */

// export async function fetchStatus() {
//   const res = await fetch('/api/status');
//   if (!res.ok) throw new Error('Backend status check failed');
//   return res.json();
// }

// export async function fetchStations() {
//   const res = await fetch('/api/stations');
//   if (!res.ok) throw new Error('Failed to fetch stations list');
//   return res.json();
// }

// export async function fetchVisibleSatellites(lat, lng, alt = 0.0, mask = 10.0, timeStr = '') {
//   let url = `/api/visible-satellites?lat=${lat}&lng=${lng}&alt=${alt}&mask=${mask}`;
//   if (timeStr) {
//     url += `&time=${encodeURIComponent(timeStr)}`;
//   }
//   const res = await fetch(url);
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
//     throw new Error(err.detail || 'Failed to calculate visible satellites');
//   }
//   return res.json();
// }

// export async function parseReceiverFile(file) {
//   const formData = new FormData();
//   formData.append('file', file);
  
//   const res = await fetch('/api/parse-file', {
//     method: 'POST',
//     body: formData
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
//     throw new Error(err.detail || 'Failed to parse receiver file');
//   }
//   return res.json();
// }

// export async function queryN2yo(id, lat, lng, alt, days, apiKey = '') {
//   let url = `/api/n2yo-query?id=${id}&lat=${lat}&lng=${lng}&alt=${alt}&days=${days}`;
//   if (apiKey) {
//     url += `&api_key=${encodeURIComponent(apiKey)}`;
//   }
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('N2YO query failed');
//   return res.json();
// }

// export async function queryCddis(stationCode, year, doy, productType) {
//   const url = `/api/cddis-query?station_code=${stationCode}&year=${year}&doy=${doy}&product_type=${productType}`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('CDDIS query failed');
//   return res.json();
// }

// export async function forceUpdateTles() {
//   const res = await fetch('/api/update-tles', { method: 'POST' });
//   if (!res.ok) throw new Error('Failed to update TLE cache');
//   return res.json();
// }

// export async function fetchSpaceWeather() {
//   const res = await fetch('/api/space-weather');
//   if (!res.ok) throw new Error('Failed to fetch space weather indices');
//   return res.json();
// }

// export async function fetchTimeSeries(lat, lng, alt = 0.0, mask = 10.0) {
//   const res = await fetch(`/api/time-series?lat=${lat}&lng=${lng}&alt=${alt}&mask=${mask}`);
//   if (!res.ok) throw new Error('Failed to fetch time-series data');
//   return res.json();
// }

// export async function fetchWorldDop(stepDeg = 10.0, mask = 10.0) {
//   const res = await fetch(`/api/world-dop?step_deg=${stepDeg}&mask=${mask}`);
//   if (!res.ok) throw new Error('Failed to fetch world DOP grid');
//   return res.json();
// }

// export async function fetchWorldTec(stepDeg = 10.0) {
//   const res = await fetch(`/api/world-tec?step_deg=${stepDeg}`);
//   if (!res.ok) throw new Error('Failed to fetch world TEC grid');
//   return res.json();
// }

// export async function fetchPakistanGrid(mask = 10.0, system = 'ALL', timeStr = '') {
//   let url = `/api/pakistan-grid?mask=${mask}&system=${system}`;
//   if (timeStr) url += `&time=${encodeURIComponent(timeStr)}`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('Failed to fetch Pakistan grid');
//   return res.json();
// }

// export async function fetchIslamabadGrid(mask = 10.0, system = 'ALL', timeStr = '') {
//   let url = `/api/islamabad-grid?mask=${mask}&system=${system}`;
//   if (timeStr) url += `&time=${encodeURIComponent(timeStr)}`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('Failed to fetch Islamabad grid');
//   return res.json();
// }

// export async function fetchGroundTracks(system = 'ALL', timeStr = '') {
//   let url = `/api/ground-tracks?system=${system}`;
//   if (timeStr) url += `&time=${encodeURIComponent(timeStr)}`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('Failed to fetch ground tracks');
//   return res.json();
// }

// export async function fetchSatellitePasses(lat = 33.6560, lng = 73.1560, alt = 540.0, mask = 10.0, system = 'ALL', timeStr = '') {
//   let url = `/api/satellite-passes?lat=${lat}&lng=${lng}&alt=${alt}&mask=${mask}&system=${system}`;
//   if (timeStr) url += `&time=${encodeURIComponent(timeStr)}`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('Failed to fetch satellite passes');
//   return res.json();
// }

// export async function fetchAnalytics24h(lat = 33.6560, lng = 73.1560, alt = 540.0, mask = 10.0, timeStr = '') {
//   let url = `/api/analytics-24h?lat=${lat}&lng=${lng}&alt=${alt}&mask=${mask}`;
//   if (timeStr) url += `&time=${encodeURIComponent(timeStr)}`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('Failed to fetch 24h analytics');
//   return res.json();
// }


/**
 * API client helper to interact with the FastAPI backend.
 * Uses the Vite /api proxy and provides safe JSON/error handling.
 */

async function apiRequest(url, options = {}) {
  const res = await fetch(url, options);

  const contentType = res.headers.get('content-type') || '';

  // Read the response safely.
  const text = await res.text();

  let data = null;

  if (text) {
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid JSON response from API: ${text.slice(0, 150)}`
        );
      }
    } else {
      // This prevents:
      // Unexpected token '<', "<script..." is not valid JSON
      throw new Error(
        `API returned non-JSON response (${res.status}). ` +
        `Received: ${text.slice(0, 150)}`
      );
    }
  }

  if (!res.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `API request failed with status ${res.status}`
    );
  }

  return data;
}


/* =========================
   BACKEND STATUS
========================= */

export async function fetchStatus() {
  return apiRequest('/api/status');
}


/* =========================
   STATIONS
========================= */

export async function fetchStations() {
  return apiRequest('/api/stations');
}


/* =========================
   VISIBLE SATELLITES
========================= */

export async function fetchVisibleSatellites(
  lat,
  lng,
  alt = 0.0,
  mask = 10.0,
  timeStr = ''
) {
  let url =
    `/api/visible-satellites` +
    `?lat=${encodeURIComponent(lat)}` +
    `&lng=${encodeURIComponent(lng)}` +
    `&alt=${encodeURIComponent(alt)}` +
    `&mask=${encodeURIComponent(mask)}`;

  if (timeStr) {
    url += `&time=${encodeURIComponent(timeStr)}`;
  }

  return apiRequest(url);
}


/* =========================
   RECEIVER FILE PARSER
========================= */

export async function parseReceiverFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest('/api/parse-file', {
    method: 'POST',
    body: formData
  });
}


/* =========================
   N2YO
========================= */

export async function queryN2yo(
  id,
  lat,
  lng,
  alt,
  days,
  apiKey = ''
) {
  let url =
    `/api/n2yo-query` +
    `?id=${encodeURIComponent(id)}` +
    `&lat=${encodeURIComponent(lat)}` +
    `&lng=${encodeURIComponent(lng)}` +
    `&alt=${encodeURIComponent(alt)}` +
    `&days=${encodeURIComponent(days)}`;

  if (apiKey) {
    url += `&api_key=${encodeURIComponent(apiKey)}`;
  }

  return apiRequest(url);
}


/* =========================
   CDDIS
========================= */

export async function queryCddis(
  stationCode,
  year,
  doy,
  productType
) {
  const url =
    `/api/cddis-query` +
    `?station_code=${encodeURIComponent(stationCode)}` +
    `&year=${encodeURIComponent(year)}` +
    `&doy=${encodeURIComponent(doy)}` +
    `&product_type=${encodeURIComponent(productType)}`;

  return apiRequest(url);
}


/* =========================
   TLE UPDATE
========================= */

export async function forceUpdateTles() {
  return apiRequest('/api/update-tles', {
    method: 'POST'
  });
}


/* =========================
   SPACE WEATHER
========================= */

export async function fetchSpaceWeather() {
  return apiRequest('/api/space-weather');
}


/* =========================
   TIME SERIES
========================= */

export async function fetchTimeSeries(
  lat,
  lng,
  alt = 0.0,
  mask = 10.0
) {
  const url =
    `/api/time-series` +
    `?lat=${encodeURIComponent(lat)}` +
    `&lng=${encodeURIComponent(lng)}` +
    `&alt=${encodeURIComponent(alt)}` +
    `&mask=${encodeURIComponent(mask)}`;

  return apiRequest(url);
}


/* =========================
   WORLD DOP
========================= */

export async function fetchWorldDop(
  stepDeg = 10.0,
  mask = 10.0
) {
  const url =
    `/api/world-dop` +
    `?step_deg=${encodeURIComponent(stepDeg)}` +
    `&mask=${encodeURIComponent(mask)}`;

  return apiRequest(url);
}


/* =========================
   WORLD TEC
========================= */

export async function fetchWorldTec(
  stepDeg = 10.0
) {
  const url =
    `/api/world-tec` +
    `?step_deg=${encodeURIComponent(stepDeg)}`;

  return apiRequest(url);
}


/* =========================
   PAKISTAN GRID
========================= */

export async function fetchPakistanGrid(
  mask = 10.0,
  system = 'ALL',
  timeStr = ''
) {
  let url =
    `/api/pakistan-grid` +
    `?mask=${encodeURIComponent(mask)}` +
    `&system=${encodeURIComponent(system)}`;

  if (timeStr) {
    url += `&time=${encodeURIComponent(timeStr)}`;
  }

  return apiRequest(url);
}


/* =========================
   ISLAMABAD GRID
========================= */

export async function fetchIslamabadGrid(
  mask = 10.0,
  system = 'ALL',
  timeStr = ''
) {
  let url =
    `/api/islamabad-grid` +
    `?mask=${encodeURIComponent(mask)}` +
    `&system=${encodeURIComponent(system)}`;

  if (timeStr) {
    url += `&time=${encodeURIComponent(timeStr)}`;
  }

  return apiRequest(url);
}


/* =========================
   GROUND TRACKS
========================= */

export async function fetchGroundTracks(
  system = 'ALL',
  timeStr = ''
) {
  let url =
    `/api/ground-tracks` +
    `?system=${encodeURIComponent(system)}`;

  if (timeStr) {
    url += `&time=${encodeURIComponent(timeStr)}`;
  }

  return apiRequest(url);
}


/* =========================
   SATELLITE PASSES
========================= */

export async function fetchSatellitePasses(
  lat = 33.6560,
  lng = 73.1560,
  alt = 540.0,
  mask = 10.0,
  system = 'ALL',
  timeStr = ''
) {
  let url =
    `/api/satellite-passes` +
    `?lat=${encodeURIComponent(lat)}` +
    `&lng=${encodeURIComponent(lng)}` +
    `&alt=${encodeURIComponent(alt)}` +
    `&mask=${encodeURIComponent(mask)}` +
    `&system=${encodeURIComponent(system)}`;

  if (timeStr) {
    url += `&time=${encodeURIComponent(timeStr)}`;
  }

  return apiRequest(url);
}


/* =========================
   24-HOUR ANALYTICS
========================= */

export async function fetchAnalytics24h(
  lat = 33.6560,
  lng = 73.1560,
  alt = 540.0,
  mask = 10.0,
  timeStr = ''
) {
  let url =
    `/api/analytics-24h` +
    `?lat=${encodeURIComponent(lat)}` +
    `&lng=${encodeURIComponent(lng)}` +
    `&alt=${encodeURIComponent(alt)}` +
    `&mask=${encodeURIComponent(mask)}`;

  if (timeStr) {
    url += `&time=${encodeURIComponent(timeStr)}`;
  }

  return apiRequest(url);
}