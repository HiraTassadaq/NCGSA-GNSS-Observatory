"""
Generates 3 plots to visually compare Excel-derived vs RINEX-derived data.
Run from inside gnss_backend/verification/

USAGE:
    python make_comparison_plots.py <rnx_filename_in_batch> <xlsx_path> <label>

Example:
    python make_comparison_plots.py GRAL00PAK_R_20262040600_01H_01S_MO.rnx ../GRAL_GNSS_Dashboard_Data_0600.xlsx "23 July 2026, 06:00-06:59 UTC"
"""
import sys, os
import openpyxl
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from datetime import datetime

BATCH_DIR = os.path.join(os.path.dirname(__file__), "..", "batch")

if len(sys.argv) < 3:
    print('Usage: python make_comparison_plots.py <rnx_filename_in_batch> <xlsx_path> ["label"]')
    sys.exit(1)

RNX_PATH = os.path.join(BATCH_DIR, sys.argv[1])
XLSX_PATH = sys.argv[2]
LABEL = sys.argv[3] if len(sys.argv) > 3 else ""
TAG = os.path.splitext(sys.argv[1])[0]

if not os.path.exists(RNX_PATH):
    print(f"ERROR: RNX file not found at {RNX_PATH}")
    sys.exit(1)
if not os.path.exists(XLSX_PATH):
    print(f"ERROR: Excel file not found at {XLSX_PATH}")
    sys.exit(1)

# ---- From Excel ----
wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
ws = wb["Epoch Time Series"]
excel_times, excel_totals = [], []
for row in ws.iter_rows(min_row=4, values_only=True):
    if row[0] is None:
        continue
    excel_times.append(datetime.strptime(row[0], "%Y-%m-%d %H:%M:%S"))
    excel_totals.append(row[1])

# ---- From raw RINEX (independent re-parse) ----
rinex_times, rinex_totals = [], []
with open(RNX_PATH, "r", errors="ignore") as f:
    in_header = True
    current_time = None
    current_nsat = None
    for line in f:
        if in_header:
            if "END OF HEADER" in line:
                in_header = False
            continue
        if line.startswith(">"):
            if current_time is not None:
                rinex_times.append(current_time)
                rinex_totals.append(current_nsat)
            parts = line.split()
            y, mo, d, h, mi = parts[1:6]
            sec = float(parts[6])
            current_time = datetime(int(y), int(mo), int(d), int(h), int(mi), int(sec))
            current_nsat = int(parts[8])
    if current_time is not None:
        rinex_times.append(current_time)
        rinex_totals.append(current_nsat)

suffix = f"\nGRAL, {LABEL}" if LABEL else ""

plt.figure(figsize=(11, 4.5))
plt.plot(excel_times, excel_totals, color="#2E5395", linewidth=1)
plt.title(f"Total Satellites Tracked per Epoch — derived from EXCEL output{suffix}")
plt.xlabel("Time (UTC)"); plt.ylabel("Satellites tracked"); plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(f"plot_from_excel_{TAG}.png", dpi=130)
plt.close()

plt.figure(figsize=(11, 4.5))
plt.plot(rinex_times, rinex_totals, color="#EB6834", linewidth=1)
plt.title(f"Total Satellites Tracked per Epoch — derived DIRECTLY from RINEX{suffix}")
plt.xlabel("Time (UTC)"); plt.ylabel("Satellites tracked"); plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(f"plot_from_rinex_{TAG}.png", dpi=130)
plt.close()

plt.figure(figsize=(11, 4.5))
plt.plot(excel_times, excel_totals, color="#2E5395", linewidth=2.5, label="From Excel", alpha=0.8)
plt.plot(rinex_times, rinex_totals, color="#EB6834", linewidth=1, linestyle="--", label="From raw RINEX (direct)")
plt.title(f"Comparison: Excel-derived vs RINEX-derived (should overlap exactly){suffix}")
plt.xlabel("Time (UTC)"); plt.ylabel("Satellites tracked"); plt.legend(); plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(f"plot_comparison_overlay_{TAG}.png", dpi=130)
plt.close()

print(f"Saved: plot_from_excel_{TAG}.png, plot_from_rinex_{TAG}.png, plot_comparison_overlay_{TAG}.png")
print(f"Max value Excel: {max(excel_totals)}, Max value RINEX: {max(rinex_totals)}")
print(f"Identical arrays: {excel_totals == rinex_totals}")
