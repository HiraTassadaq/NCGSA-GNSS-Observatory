"""
Core RINEX parsing logic, refactored from the standalone scripts into
reusable functions that return plain Python data structures (dicts/lists)
instead of writing Excel files. This is what both the ingestion job and
(optionally) an "export to Excel" endpoint import.

IMPORTANT: observation-type layout (which column is pseudorange, phase,
SNR, etc.) is read dynamically from EACH FILE'S OWN "SYS / # / OBS TYPES"
header, not assumed to be fixed. Different sessions/receiver configs can
report a different set/order of codes per system -- assuming a fixed
layout silently misaligns fields when a file differs, producing garbage
(this was the root cause of a real bug: GPS multipath values in the
hundreds of thousands of metres, and null SNR, on a session whose GPS
observation-type layout didn't match an earlier hardcoded assumption).
"""
import re, math, gzip
from datetime import datetime
from collections import defaultdict

SYS_NAME = {
    "G": "GPS",
    "R": "GLONASS",
    "E": "Galileo",
    "C": "BeiDou",
    "J": "QZSS",
    "I": "IRNSS",
    "S": "SBAS"
}
CLIGHT = 299792458.0

# Frequency (Hz) by (system, RINEX band digit). Used to dynamically pick
# whichever two bands a file actually reports for a satellite system,
# rather than assuming specific attribute codes like "C2L" vs "C2S" vs "C2X".
BAND_FREQ = {
    ("G", "1"): 1575.42e6, ("G", "2"): 1227.60e6, ("G", "5"): 1176.45e6,
    ("E", "1"): 1575.42e6, ("E", "5"): 1176.45e6, ("E", "7"): 1207.140e6,
    ("E", "8"): 1191.795e6, ("E", "6"): 1278.75e6,
    ("C", "1"): 1575.42e6, ("C", "2"): 1561.098e6, ("C", "5"): 1176.45e6,
    ("C", "6"): 1268.52e6, ("C", "7"): 1207.140e6, ("C", "8"): 1191.795e6,
    ("S", "1"): 1575.42e6, ("S", "5"): 1176.45e6,
}
# GLONASS (FDMA) bands 1/2 are handled via glonass_freqs() per-satellite instead.

def glonass_freqs(k):
    return {"1": (1602.0 + k*0.5625)*1e6, "2": (1246.0 + k*0.4375)*1e6}


def detect_rinex_type(path: str) -> str:
    """
    Returns 'nav' or 'obs' by reading the 'RINEX VERSION / TYPE' header
    line -- the first line of every RINEX file -- which states the file
    type explicitly. This is used to route incoming files to the right
    pipeline (obs vs nav) instead of guessing from the filename, since
    naming conventions (e.g. '_MO' vs '_MN') aren't guaranteed.

    Handles plain .rnx and gzip-compressed .rnx.gz transparently.
    """
    opener = gzip.open if path.endswith(".gz") else open
    with opener(path, "rt", errors="ignore") as f:
        first_line = f.readline()
    if "NAVIGATION DATA" in first_line:
        return "nav"
    if "OBSERVATION DATA" in first_line:
        return "obs"
    raise ValueError(f"Could not determine RINEX file type from header line: {first_line.strip()!r}")


def quality_label(pct):
    if pct >= 95: return "Excellent"
    if pct >= 70: return "Good"
    if pct >= 40: return "Partial (rise/set or blocked)"
    return "Poor / low elevation"


def rms_after_mean_removal(vals):
    if not vals:
        return None
    m = sum(vals) / len(vals)
    return math.sqrt(sum((v - m) ** 2 for v in vals) / len(vals))


def mean(vals):
    return sum(vals) / len(vals) if vals else None


def parse_header(lines):
    """Parses station/receiver metadata AND each system's own observation-type
    layout (SYS / # / OBS TYPES), dynamically, from this specific file."""
    meta, glo_slots = {}, {}
    sys_obs = {}
    current_sys = None

    for l in lines:
        if "MARKER NAME" in l:
            meta["marker"] = l[:60].strip()
        elif "APPROX POSITION XYZ" in l:
            vals = l[:60].split()
            meta["x"], meta["y"], meta["z"] = map(float, vals[:3])
        elif "REC # / TYPE / VERS" in l:
            meta["receiver"] = l[20:40].strip()
        elif "ANT # / TYPE" in l:
            meta["antenna"] = l[20:40].strip()
        elif "TIME OF FIRST OBS" in l:
            p = l.split()
            meta["start"] = datetime(int(p[0]), int(p[1]), int(p[2]), int(p[3]), int(p[4]), int(float(p[5])))
        elif "GLONASS SLOT / FRQ" in l:
            toks = l[:60].split()
            vals = toks[1:] if toks[0].isdigit() else toks
            for i in range(0, len(vals) - 1, 2):
                prn, chan = vals[i], vals[i+1]
                if re.match(r"R\d\d$", prn):
                    try:
                        glo_slots[prn] = int(chan)
                    except ValueError:
                        pass
        elif "SYS / # / OBS TYPES" in l:
            content = l[:60]
            sys_char = content[0]
            if sys_char.strip():
                current_sys = sys_char
                sys_obs[current_sys] = []
                codes_part = content[7:]
            else:
                codes_part = content[7:]
            sys_obs[current_sys].extend(codes_part.split())
        elif "END OF HEADER" in l:
            break

    meta["glo_slots"] = glo_slots
    meta["sys_obs"] = sys_obs
    return meta


def _build_dual_freq_pair(sys, codes):
    """
    From this file's actual observation codes for one system, find the
    first two distinct frequency bands that each have both a Code (C*) and
    Phase (L*) observation -- whatever the specific attribute letter
    (Q/L/S/W/X/I/C...) happens to be in THIS file.
    Returns (c1, l1, c2, l2, band1, band2) or None if fewer than 2 usable bands.
    """
    band_codes = {}
    for code in codes:
        if len(code) < 2:
            continue
        typ, band = code[0], code[1]
        if typ not in ("C", "L"):
            continue
        band_codes.setdefault(band, {})
        band_codes[band].setdefault(typ, code)  # keep first occurrence only

    usable_bands = [b for b, d in band_codes.items() if "C" in d and "L" in d]
    # Prefer band '1' first if present (primary frequency), then any other in order found
    usable_bands.sort(key=lambda b: (b != "1", b))
    if len(usable_bands) < 2:
        return None
    b1, b2 = usable_bands[0], usable_bands[1]
    return (band_codes[b1]["C"], band_codes[b1]["L"], band_codes[b2]["C"], band_codes[b2]["L"], b1, b2)


def parse_rinex_file(path: str) -> dict:
    """
    Parse a single decompressed RINEX 3.x mixed-observation file.
    Returns a dict with: meta, satellites (list of dicts), epochs (list of dicts).
    This is the single function the ingestion job calls per file.
    """
    sat_total = defaultdict(int)
    sat_snr_sum = defaultdict(float)
    sat_snr_n = defaultdict(int)
    sat_slips = defaultdict(int)
    sat_sys = {}
    sat_mp1 = defaultdict(list)
    sat_mp2 = defaultdict(list)
    sat_iono = defaultdict(list)
    epoch_rows = []

    header_lines = []
    with open(path, "r", errors="ignore") as f:
        while True:
            line = f.readline()
            header_lines.append(line)
            if "END OF HEADER" in line or line == "":
                break
        meta = parse_header(header_lines)
        glo_slots = meta["glo_slots"]
        sys_obs = meta["sys_obs"]  # dynamic, from THIS file's own header
        expected = 3600

        # Precompute per-system field layout from this file's actual codes
        primary_c_idx, s_fields, l_fields, dual_pair = {}, {}, {}, {}
        for sys, codes in sys_obs.items():
            c_idxs = [i for i, c in enumerate(codes) if c.startswith("C")]
            if c_idxs:
                primary_c_idx[sys] = c_idxs[0]
            s_fields[sys] = [i for i, c in enumerate(codes) if c.startswith("S")]
            l_fields[sys] = [i for i, c in enumerate(codes) if c.startswith("L")]
            dual_pair[sys] = _build_dual_freq_pair(sys, codes)

        epoch_time = None
        epoch_sys_count = None
        epoch_sys_snr_sum = None
        epoch_sys_snr_n = None
        epoch_total = 0

        def flush_epoch():
            if epoch_time is None:
                return
            row = {"time": epoch_time, "total": epoch_total}
            for sys in ["G", "R", "E", "C", "S"]:
                n = epoch_sys_snr_n[sys]
                row[f"{sys}_count"] = epoch_sys_count[sys]
                row[f"{sys}_avg_snr"] = round(epoch_sys_snr_sum[sys] / n, 2) if n else None
            epoch_rows.append(row)

        for line in f:
            if line.startswith(">"):
                flush_epoch()
                parts = line.split()
                y, mo, d, h, mi = parts[1:6]
                sec = float(parts[6])
                epoch_time = datetime(int(y), int(mo), int(d), int(h), int(mi), int(sec))
                epoch_total = 0
                epoch_sys_count = defaultdict(int)
                epoch_sys_snr_sum = defaultdict(float)
                epoch_sys_snr_n = defaultdict(int)
                continue
            if epoch_time is None:
                continue
            sys = line[0]
            if sys not in sys_obs:
                continue
            prn = line[0:3]
            sat_sys[prn] = sys
            codes = sys_obs[sys]
            nfields = len(codes)
            body = line[3:].rstrip("\r\n")
            needed_len = nfields * 16
            if len(body) < needed_len:
                body = body.ljust(needed_len)
            fields = [body[i*16:(i+1)*16] for i in range(nfields)]

            def getval_by_idx(i):
                if i is None:
                    return None
                v = fields[i][0:14].strip()
                return float(v) if v else None

            def getlli_by_idx(i):
                if i is None:
                    return 0
                c = fields[i][14:15]
                return int(c) if c.strip().isdigit() else 0

            epoch_total += 1
            epoch_sys_count[sys] += 1

            pc_idx = primary_c_idx.get(sys)
            if pc_idx is not None and fields[pc_idx][0:14].strip():
                sat_total[prn] += 1

            s_vals = []
            for si in s_fields.get(sys, []):
                v = fields[si][0:14].strip()
                if v:
                    try:
                        s_vals.append(float(v))
                    except ValueError:
                        pass
            if s_vals:
                avg_s = sum(s_vals) / len(s_vals)
                sat_snr_sum[prn] += avg_s
                sat_snr_n[prn] += 1
                epoch_sys_snr_sum[sys] += avg_s
                epoch_sys_snr_n[sys] += 1

            for li in l_fields.get(sys, []):
                if getlli_by_idx(li) & 1:
                    sat_slips[prn] += 1

            pair = dual_pair.get(sys)
            if pair:
                c1, l1, c2, l2, b1, b2 = pair
                f1 = f2 = None
                if sys == "R":
                    if prn in glo_slots and b1 in ("1", "2") and b2 in ("1", "2"):
                        gf = glonass_freqs(glo_slots[prn])
                        f1, f2 = gf.get(b1), gf.get(b2)
                else:
                    f1, f2 = BAND_FREQ.get((sys, b1)), BAND_FREQ.get((sys, b2))

                if f1 and f2:
                    i_c1, i_l1 = codes.index(c1), codes.index(l1)
                    i_c2, i_l2 = codes.index(c2), codes.index(l2)
                    P1, Phi1c = getval_by_idx(i_c1), getval_by_idx(i_l1)
                    P2, Phi2c = getval_by_idx(i_c2), getval_by_idx(i_l2)
                    if None not in (P1, Phi1c, P2, Phi2c):
                        lam1, lam2 = CLIGHT / f1, CLIGHT / f2
                        Phi1_m, Phi2_m = Phi1c * lam1, Phi2c * lam2
                        alpha = (f1 / f2) ** 2
                        denom = alpha - 1
                        if abs(denom) > 1e-6:
                            MP1 = P1 - Phi1_m * (1 + 2/denom) + Phi2_m * (2/denom)
                            MP2 = P2 - Phi1_m * (2*alpha/denom) + Phi2_m * (2*alpha/denom - 1)
                            I1 = (P2 - P1) / denom
                            sat_mp1[prn].append(MP1)
                            sat_mp2[prn].append(MP2)
                            sat_iono[prn].append(I1)
        flush_epoch()

    satellites = []
    for prn, cnt in sat_total.items():
        sys = sat_sys[prn]
        completeness = cnt / expected * 100
        n = sat_snr_n[prn]
        avg_snr = sat_snr_sum[prn] / n if n else None
        satellites.append({
            "prn": prn, "system": SYS_NAME[sys],
            "valid_epochs": cnt, "completeness_pct": round(completeness, 1),
            "avg_snr": round(avg_snr, 1) if avg_snr is not None else None,
            "cycle_slips": sat_slips[prn],
            "quality": quality_label(completeness),
            "multipath_mp1": round(rms_after_mean_removal(sat_mp1[prn]), 3) if sat_mp1[prn] else None,
            "multipath_mp2": round(rms_after_mean_removal(sat_mp2[prn]), 3) if sat_mp2[prn] else None,
            "iono_delay_l1": round(mean(sat_iono[prn]), 2) if sat_iono[prn] else None,
        })

    return {
        "meta": {
            "marker": meta.get("marker"), "receiver": meta.get("receiver"),
            "antenna": meta.get("antenna"), "x": meta.get("x"), "y": meta.get("y"), "z": meta.get("z"),
            "start": meta.get("start"),
        },
        "satellites": satellites,
        "epochs": epoch_rows,
        "expected_epochs": expected,
    }