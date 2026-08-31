"""
Standalone RINEX 3.x NAVIGATION file parser. Does NOT modify or depend on
anything in the existing obs pipeline (parser.py, database.py, etc.) --
this is step 1 only: read the nav file and produce structured orbital
data, so we can inspect it before deciding how (or whether) to wire it
into the rest of the project.

Two different record layouts, per RINEX 3 spec:
  - GPS / Galileo / BeiDou / QZSS / IRNSS: Keplerian orbital elements,
    8 lines per record (1 header + 7 continuation), 28 data values.
  - GLONASS / SBAS: position/velocity/acceleration, 4 lines per record
    (1 header + 3 continuation), 12 data values.

All numeric fields are FIXED-WIDTH (19 characters each) with no
guaranteed spacing between adjacent values (a negative sign can sit
directly against the previous field) -- so this deliberately slices by
column position rather than splitting on whitespace, which would
silently misread values in many rows.
"""
from datetime import datetime

KEPLER_SYSTEMS = {"G", "E", "C", "J", "I"}  # GPS, Galileo, BeiDou, QZSS, IRNSS
PVA_SYSTEMS = {"R", "S"}                     # GLONASS, SBAS

KEPLER_FIELD_NAMES = [
    "IODE_or_IODNav", "Crs", "DeltaN", "M0",
    "Cuc", "Eccentricity", "Cus", "sqrtA",
    "Toe", "Cic", "OMEGA0", "Cis",
    "i0", "Crc", "omega", "OMEGA_DOT",
    "IDOT", "CodesOnL2_or_spare", "GPSWeek_or_NavWeek", "L2Pflag_or_spare",
    "SVaccuracy", "SVhealth", "TGD_or_BGD_E5a", "IODC_or_BGD_E5b",
    "TransmissionTime", "FitInterval_or_spare", "spare1", "spare2",
]

PVA_FIELD_NAMES = [
    "X_km", "X_vel_km_s", "X_accel_km_s2", "health_or_spare",
    "Y_km", "Y_vel_km_s", "Y_accel_km_s2", "freq_num_or_spare",
    "Z_km", "Z_vel_km_s", "Z_accel_km_s2", "age_or_spare",
]


def _parse_float(s):
    s = s.strip()
    if not s:
        return None
    return float(s)


def parse_nav_file(path: str) -> dict:
    """
    Returns: { "G": [record, record, ...], "E": [...], ... }
    Each record: {
        "prn": "G01", "epoch": datetime(...),
        "clock_bias": float, "clock_drift": float, "clock_drift_rate": float,
        "fields": {name: value, ...}   # 28 (kepler) or 12 (pva) named values
    }
    """
    results = {}
    with open(path, "r", errors="ignore") as f:
        lines = f.readlines()

    # skip header
    i = 0
    while i < len(lines) and "END OF HEADER" not in lines[i]:
        i += 1
    i += 1

    while i < len(lines):
        line = lines[i]
        if len(line) < 23 or not line[0].isalpha():
            i += 1
            continue

        sys = line[0]
        prn = line[0:3].strip()
        try:
            year = int(line[4:8])
            month = int(line[9:11])
            day = int(line[12:14])
            hour = int(line[15:17])
            minute = int(line[18:20])
            second = int(line[21:23])
            epoch = datetime(year, month, day, hour, minute, second)
        except (ValueError, IndexError):
            i += 1
            continue

        clock_bias = _parse_float(line[23:42])
        clock_drift = _parse_float(line[42:61])
        clock_drift_rate = _parse_float(line[61:80])

        if sys in KEPLER_SYSTEMS:
            n_cont_lines, field_names = 7, KEPLER_FIELD_NAMES
        elif sys in PVA_SYSTEMS:
            n_cont_lines, field_names = 3, PVA_FIELD_NAMES
        else:
            i += 1
            continue  # unknown system, skip

        values = []
        for j in range(1, n_cont_lines + 1):
            if i + j >= len(lines):
                break
            cont = lines[i + j]
            for col_start in (4, 23, 42, 61):
                chunk = cont[col_start:col_start + 19]
                values.append(_parse_float(chunk))

        record = {
            "prn": prn,
            "epoch": epoch,
            "clock_bias": clock_bias,
            "clock_drift": clock_drift,
            "clock_drift_rate": clock_drift_rate,
            "fields": dict(zip(field_names, values)),
        }
        results.setdefault(sys, []).append(record)
        i += 1 + n_cont_lines

    return results


if __name__ == "__main__":
    import sys as _sys
    path = _sys.argv[1] if len(_sys.argv) > 1 else "BRDM00DLR_S_20262040000_01D_MN.rnx"
    data = parse_nav_file(path)

    print("Satellite systems found and record counts:")
    for sys, records in sorted(data.items()):
        prns = sorted(set(r["prn"] for r in records))
        print(f"  {sys}: {len(records)} total broadcasts, {len(prns)} unique satellites")

    print("\n--- Example: first GPS record (G01 or whichever comes first) ---")
    if "G" in data:
        r = data["G"][0]
        print(f"PRN: {r['prn']}  Epoch: {r['epoch']}")
        print(f"Clock bias/drift/drift-rate: {r['clock_bias']}, {r['clock_drift']}, {r['clock_drift_rate']}")
        for k, v in r["fields"].items():
            print(f"  {k}: {v}")

    print("\n--- Example: first Galileo record ---")
    if "E" in data:
        r = data["E"][0]
        print(f"PRN: {r['prn']}  Epoch: {r['epoch']}")
        for k, v in list(r["fields"].items())[:6]:
            print(f"  {k}: {v}")
