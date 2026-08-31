import { useEffect, useReducer, useRef, useState } from "react";
import { supabase, TABLE_NAME } from "../lib/supabaseClient";
import { classifyConstellation, CONSTELLATION_ORDER, satelliteLabel } from "../lib/satellites";
import { maskToLatLon, getBandPoints } from "../lib/igpGrid";

// How many points to keep for each time-series chart before dropping the
// oldest. Keeps memory/render cost bounded for a dashboard left open for hours.
const HISTORY_CAP = 300;

const BLOCKS = [
  "SatVisibility",
  "ChannelStatus",
  "GEOIGPMask",   // must load before GEOIonoDelay below -- initial backfill replays blocks
  "GEOIonoDelay", // in array order, and exact IGP placement needs the mask already in state
  "PVTGeodetic",
  "ReceiverStatus",
  "ReceiverTime",
  "DOP",
  "MeasEpoch",
  "GPSNav",
];

const initialState = {
  latest: {}, // { [block]: payload }
  lastSeen: {}, // { [block]: epoch ms }
  satCountHistory: [],
  dopHistory: [],
  cn0History: [],
  positionHistory: [],
  ionoHistory: [],
  ionoGrid: {}, // "prn_band_maskNo" -> { lat, lon, band, maskNo, prn, givei, delay, t } -- builds up over time from GEOIonoDelay messages, like RxControl's world map
  ionoIodiByGroup: {}, // "prn_band" -> last-seen IODI, used to invalidate stale mask entries when a PRN reissues its IGP mask
  ionoMasks: {}, // "prn_band" -> { iodi, activeIndices } from GEOIGPMask (MT18) -- lets us place IGPs exactly instead of approximating
  ephemerisBySvid: {}, // GPS SVID -> latest GPSNav payload
  gpsTimeAnchor: null, // { gpsSeconds, wallClockMs } -- lets us advance time smoothly between updates
};

function pushCapped(arr, item, cap = HISTORY_CAP) {
  const next = [...arr, item];
  if (next.length > cap) next.splice(0, next.length - cap);
  return next;
}

// ChannelStatus's raw "satellites" array interleaves two different record
// shapes per channel: a "SatInfo" record (has SVID/Azimuth/Elevation) and a
// "SigInfo" record (Antenna/PVTStatus/TrackingStatus, no SVID at all) --
// these land as separate array entries due to how the ingestion script's
// reshape regex groups nested sub-block indices. There are also placeholder
// entries for allocated-but-inactive channels, marked with sentinel values
// Azimuth=511 / Elevation=-128. This filter keeps only real, active
// satellite entries for counting/listing purposes.
function isRealSatelliteEntry(sat) {
  return (
    typeof sat.SVID === "number" &&
    sat.Elevation !== -128 &&
    sat.Azimuth !== 511
  );
}

function countByConstellation(satArray) {
  const counts = Object.fromEntries(CONSTELLATION_ORDER.map((c) => [c, 0]));
  let total = 0;
  for (const sat of satArray || []) {
    if (!isRealSatelliteEntry(sat)) continue;
    const c = classifyConstellation(sat.SVID);
    if (counts[c] !== undefined) counts[c]++;
    total++;
  }
  return { ...counts, Total: total };
}

const RAD_TO_DEG = 180 / Math.PI;

// SBF ICD scale/unit corrections, applied once here so every consumer
// (latest snapshot + history arrays) automatically gets correct values.
function correctPayload(block, payload) {
  if (block === "DOP") {
    // DOP block values are stored as uint16 in units of 0.01 per the SBF ICD.
    const corrected = { ...payload };
    for (const key of ["PDOP", "HDOP", "VDOP", "TDOP", "GDOP"]) {
      if (corrected[key] != null) corrected[key] = corrected[key] / 100;
    }
    // The SBF DOP block doesn't actually carry a GDOP field (same lesson we
    // learned with CN0 -- a plausible-sounding field that just isn't there).
    // GDOP is derivable from PDOP + TDOP via the standard, well-established
    // identity GDOP^2 = PDOP^2 + TDOP^2 (since PDOP^2 = HDOP^2 + VDOP^2
    // already), so compute it if the block didn't supply it directly.
    if (corrected.GDOP == null && corrected.PDOP != null && corrected.TDOP != null) {
      corrected.GDOP = Math.sqrt(corrected.PDOP ** 2 + corrected.TDOP ** 2);
    }
    return corrected;
  }
  if (block === "PVTGeodetic") {
    // Latitude/Longitude are stored in radians per the SBF ICD.
    const corrected = { ...payload };
    if (corrected.Latitude != null) corrected.Latitude *= RAD_TO_DEG;
    if (corrected.Longitude != null) corrected.Longitude *= RAD_TO_DEG;
    return corrected;
  }
  return payload;
}

function reducer(state, action) {
  if (action.type !== "ROW") return state;
  const row = action.row;
  const block = row.block;
  const t = row.logged_at || new Date().toISOString();
  const payload = correctPayload(block, row.payload || {});

  const next = {
    ...state,
    latest: { ...state.latest, [block]: payload },
    lastSeen: { ...state.lastSeen, [block]: Date.now() },
  };

  if (block === "SatVisibility" || block === "ChannelStatus") {
    // Prefer ChannelStatus for counts if both present since it reflects
    // satellites actually being tracked, not just geometrically visible.
    const satArray = payload.satellites || [];
    const counts = countByConstellation(satArray);
    next.satCountHistory = pushCapped(state.satCountHistory, {
      t,
      time: new Date(t).toLocaleTimeString(),
      ...counts,
    });
  }

  if (block === "ChannelStatus") {
    const satArray = payload.satellites || [];
    const snapshot = { t, time: new Date(t).toLocaleTimeString() };
    for (const sat of satArray) {
      const label = satelliteLabel(sat.SVID);
      // SBF ICD note: raw CN0 field is often scaled (commonly x4 dB-Hz).
      // Verify against RxControl's own SNR readout for the same satellite;
      // if this looks ~4x too high, divide by 4 here instead.
      const cn0 = sat.CN0 ?? sat.MeanCN0 ?? sat.CN0_L1 ?? null;
      snapshot[label] = cn0;
    }
    next.cn0History = pushCapped(state.cn0History, snapshot);
  }

  if (block === "DOP") {
    next.dopHistory = pushCapped(state.dopHistory, {
      t,
      time: new Date(t).toLocaleTimeString(),
      PDOP: payload.PDOP,
      HDOP: payload.HDOP,
      VDOP: payload.VDOP,
      TDOP: payload.TDOP,
    });
  }

  if (block === "GPSNav") {
    const svid = payload.SVID ?? payload.PRN;
    if (svid != null) {
      next.ephemerisBySvid = { ...state.ephemerisBySvid, [svid]: payload };
    }
  }

  // Any block carrying TOW (ms) lets us anchor GPS time-of-week for
  // continuous local propagation between updates.
  if (payload.TOW != null) {
    next.gpsTimeAnchor = { gpsSeconds: payload.TOW / 1000, wallClockMs: Date.now() };
  }

  if (block === "GEOIGPMask") {
    // MT18 -- the real IGP band mask. Each entry is one candidate grid
    // point in the band, in canonical order, with IGPMask=1 meaning that
    // satellite is actually reporting/monitoring that point. GEOIonoDelay's
    // IGPMaskNo is the ordinal position *within this active subset*, so we
    // record which full-list positions are active, in order, so the
    // GEOIonoDelay handler below can resolve exact coordinates instead of
    // approximating.
    const band = payload.BandNbr;
    const prn = payload.PRN;
    const iodi = payload.IODI;
    const entries = payload.satellites || [];
    if (band != null && prn != null && entries.length > 0) {
      const activeIndices = [];
      entries.forEach((entry, i) => {
        if (entry.IGPMask === 1) activeIndices.push(i);
      });
      next.ionoMasks = { ...state.ionoMasks, [`${prn}_${band}`]: { iodi, activeIndices } };
    }
  }

  if (block === "GEOIonoDelay") {
    next.ionoHistory = pushCapped(state.ionoHistory, {
      t,
      time: new Date(t).toLocaleTimeString(),
      payload,
    });

    // Each message only carries up to 15 IGPs (one "block" of one band from
    // one SBAS PRN). Merge into a running grid, keyed by PRN+band+mask index
    // (NOT just band+mask -- different SBAS satellites can broadcast IGPs
    // for overlapping regions with independently-numbered masks, so without
    // the PRN in the key, two different satellites' readings were silently
    // overwriting each other), so the world-map view can build up coverage
    // over time the way RxControl's does.
    const band = payload.BandNbr;
    const prn = payload.PRN;
    const iodi = payload.IODI;
    const entries = payload.satellites || [];

    if (band != null && prn != null && entries.length > 0) {
      const groupKey = `${prn}_${band}`;
      const prevIodi = state.ionoIodiByGroup[groupKey];
      let baseGrid = state.ionoGrid;

      // If this PRN/band just reissued its IGP mask (IODI changed), old
      // IGPMaskNo indices from the previous mask no longer point at the
      // same grid points -- drop that group's stale entries rather than
      // mixing two incompatible masks together.
      if (prevIodi != null && prevIodi !== iodi) {
        baseGrid = Object.fromEntries(
          Object.entries(baseGrid).filter(([key]) => !key.startsWith(`${groupKey}_`))
        );
      }

      const gridUpdates = {};
      for (const entry of entries) {
        const maskNo = entry.IGPMaskNo;
        if (maskNo == null) continue;

        // Prefer exact placement from a real MT18 mask (same PRN+band,
        // matching IODI) if we have one; otherwise fall back to the
        // standard-layout approximation.
        let coord = null;
        const mask = state.ionoMasks[groupKey];
        if (mask && mask.iodi === iodi) {
          const fullIdx = mask.activeIndices[maskNo - 1];
          if (fullIdx != null) coord = getBandPoints(band)[fullIdx] || null;
        }
        if (!coord) coord = maskToLatLon(band, maskNo);
        if (!coord) continue;

        const key = `${groupKey}_${maskNo}`;
        gridUpdates[key] = {
          lat: coord.lat,
          lon: coord.lon,
          band,
          maskNo,
          prn,
          givei: entry.GIVEI,
          delay: entry.VerticalDelay,
          t: Date.now(),
        };
      }

      // Drop anything we haven't heard about in a while, so the view
      // reflects roughly "current" state (like RxControl's live view)
      // instead of accumulating stale readings forever.
      const IONO_TTL_MS = 3 * 60 * 1000;
      const cutoff = Date.now() - IONO_TTL_MS;
      const merged = { ...baseGrid, ...gridUpdates };
      next.ionoGrid = Object.fromEntries(Object.entries(merged).filter(([, v]) => v.t >= cutoff));
      next.ionoIodiByGroup = { ...state.ionoIodiByGroup, [groupKey]: iodi };
    }
  }

  if (block === "PVTGeodetic") {
    next.positionHistory = pushCapped(state.positionHistory, {
      t,
      lat: payload.Latitude,
      lon: payload.Longitude,
      height: payload.Height,
    });
  }

  return next;
}

export function useGnssData() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [now, setNow] = useState(Date.now());
  const initialLoadDone = useRef(false);

  // Tick every second so "Xs ago" staleness labels update even when no
  // new data arrives -- this is what lets the UI honestly show "stale"
  // instead of silently freezing on old numbers.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Initial load: pull the most recent rows per block so the dashboard
  // isn't empty while waiting for the next live insert.
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      for (const block of BLOCKS) {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .eq("block", block)
          .order("logged_at", { ascending: false })
          .limit(block === "SatVisibility" || block === "ChannelStatus" ? 1 : 200);

        if (error) {
          console.error(`Initial load failed for ${block}:`, error.message);
          continue;
        }
        // rows come back newest-first; replay oldest-first so history charts
        // build up in correct chronological order
        for (const row of [...data].reverse()) {
          dispatch({ type: "ROW", row });
        }
      }
    })();
  }, []);

  // Live subscription
  useEffect(() => {
    const channel = supabase
      .channel("gnss-live-data-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: TABLE_NAME },
        (payload) => dispatch({ type: "ROW", row: payload.new })
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnectionStatus("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnectionStatus("error");
        if (status === "CLOSED") setConnectionStatus("stale");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Per-block staleness: "ok" if seen within 3s, "warn" within 15s, else "stale"
  const staleness = {};
  for (const block of BLOCKS) {
    const seen = state.lastSeen[block];
    if (!seen) {
      staleness[block] = "stale";
    } else {
      const age = now - seen;
      staleness[block] = age < 3000 ? "ok" : age < 15000 ? "warn" : "stale";
    }
  }

  return {
    ...state,
    now,
    connectionStatus,
    staleness,
  };
}