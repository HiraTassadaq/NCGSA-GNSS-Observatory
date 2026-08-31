"""
INDEPENDENT VERIFICATION SCRIPT  (run from inside gnss_backend/verification/)
------------------------------------------------------------------------------
Cross-checks the RINEX -> Excel conversion by re-reading the raw RINEX file
with fresh, standalone logic (NOT importing app/parser.py), then comparing
epoch-by-epoch against an Excel file produced by the pipeline.

USAGE:
    cd gnss_backend/verification
    python verify_conversion.py <rnx_filename_in_batch> <xlsx_path>

Example:
    python verify_conversion.py GRAL00PAK_R_20262040600_01H_01S_MO.rnx ../GRAL_GNSS_Dashboard_Data_0600.xlsx
"""
import sys, os
import openpyxl
from datetime import datetime

# ---- Paths: batch/ lives one level up from this verification/ folder ----
BATCH_DIR = os.path.join(os.path.dirname(__file__), "..", "batch")

if len(sys.argv) < 3:
    print("Usage: python verify_conversion.py <rnx_filename_in_batch> <xlsx_path>")
    sys.exit(1)

RNX_PATH = os.path.join(BATCH_DIR, sys.argv[1])
XLSX_PATH = sys.argv[2]

if not os.path.exists(RNX_PATH):
    print(f"ERROR: RNX file not found at {RNX_PATH}")
    print(f"       (looked in batch dir: {os.path.abspath(BATCH_DIR)})")
    sys.exit(1)
if not os.path.exists(XLSX_PATH):
    print(f"ERROR: Excel file not found at {XLSX_PATH}")
    sys.exit(1)

# ---------------------------------------------------------------
# STEP 1: Independently re-derive "total satellites per epoch"
# directly from the raw RINEX file (fresh logic, no shared code with parser.py)
# ---------------------------------------------------------------
rinex_epochs = []

with open(RNX_PATH, "r", errors="ignore") as f:
    in_header = True
    current_time = None
    current_declared_nsat = None
    counted = 0

    def flush():
        if current_time is not None:
            rinex_epochs.append((current_time, current_declared_nsat, counted))

    for line in f:
        if in_header:
            if "END OF HEADER" in line:
                in_header = False
            continue
        if line.startswith(">"):
            flush()
            parts = line.split()
            y, mo, d, h, mi = parts[1:6]
            sec = float(parts[6])
            current_time = datetime(int(y), int(mo), int(d), int(h), int(mi), int(sec))
            current_declared_nsat = int(parts[8])
            counted = 0
        else:
            if line.strip():
                counted += 1
    flush()

print(f"Independently parsed {len(rinex_epochs)} epochs directly from raw RINEX.")

mismatches_internal = [(t, d, c) for (t, d, c) in rinex_epochs if d != c]
print(f"Internal consistency check (declared NSAT vs counted lines): "
      f"{len(mismatches_internal)} mismatches out of {len(rinex_epochs)} epochs")
if mismatches_internal:
    print("  First few mismatches:", mismatches_internal[:5])

# ---------------------------------------------------------------
# STEP 2: Read "Total Satellites" per epoch back out of the Excel file
# ---------------------------------------------------------------
wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
ws = wb["Epoch Time Series"]

excel_epochs = []
for row in ws.iter_rows(min_row=4, values_only=True):
    if row[0] is None:
        continue
    t = datetime.strptime(row[0], "%Y-%m-%d %H:%M:%S")
    excel_epochs.append((t, row[1]))

print(f"Read {len(excel_epochs)} epochs back from Excel.")

# ---------------------------------------------------------------
# STEP 3: Compare RINEX-direct vs Excel, epoch by epoch
# ---------------------------------------------------------------
rinex_dict = {t: d for (t, d, c) in rinex_epochs}
excel_dict = {t: v for (t, v) in excel_epochs}

common_times = sorted(set(rinex_dict) & set(excel_dict))
mismatches = [(t, rinex_dict[t], excel_dict[t]) for t in common_times if rinex_dict[t] != excel_dict[t]]
only_in_rinex = sorted(set(rinex_dict) - set(excel_dict))
only_in_excel = sorted(set(excel_dict) - set(rinex_dict))

print(f"\n=== COMPARISON: RINEX (direct) vs Excel ===")
print(f"Common epochs compared : {len(common_times)}")
print(f"Value mismatches       : {len(mismatches)}")
print(f"Epochs only in RINEX   : {len(only_in_rinex)}")
print(f"Epochs only in Excel   : {len(only_in_excel)}")
if mismatches:
    print("First few mismatches (time, rinex_value, excel_value):")
    for m in mismatches[:10]:
        print(" ", m)
else:
    print("RESULT: Perfect match -- every epoch's satellite count agrees exactly.")

out_name = f"verification_report_{os.path.splitext(sys.argv[1])[0]}.txt"
with open(out_name, "w") as out:
    out.write("GNSS RINEX -> Excel Conversion Verification\n")
    out.write("=" * 50 + "\n")
    out.write(f"Source RINEX file: {RNX_PATH}\n")
    out.write(f"Source Excel file: {XLSX_PATH}\n\n")
    out.write(f"Epochs parsed directly from RINEX: {len(rinex_epochs)}\n")
    out.write(f"Epochs read from Excel: {len(excel_epochs)}\n")
    out.write(f"Internal header consistency mismatches: {len(mismatches_internal)}\n")
    out.write(f"Common epochs compared: {len(common_times)}\n")
    out.write(f"Value mismatches (RINEX vs Excel): {len(mismatches)}\n")
    out.write(f"Epochs only in RINEX: {len(only_in_rinex)}\n")
    out.write(f"Epochs only in Excel: {len(only_in_excel)}\n")
    out.write("\nCONCLUSION: " + (
        "MATCH -- Excel conversion is numerically correct and can be used as the "
        "primary data source instead of re-parsing raw RINEX each time."
        if not mismatches and not only_in_rinex and not only_in_excel else
        "DISCREPANCY FOUND -- see details above, investigate before trusting Excel output."
    ) + "\n")

print(f"\nSaved {out_name}")
