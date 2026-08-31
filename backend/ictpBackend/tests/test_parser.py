"""
Automated test: verifies app/parser.py's satellite-count-per-epoch output
matches an independent, from-scratch count of the raw RINEX file.

Run from gnss_backend/:
    pytest tests/test_parser.py -v

This turns the one-time manual verification (done for the ma'am's task)
into a permanent, re-runnable check -- if anyone edits parser.py later and
breaks something, this test will fail and say so immediately.
"""
import os
import sys
import pytest
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.parser import parse_rinex_file

BATCH_DIR = os.path.join(os.path.dirname(__file__), "..", "batch")


def independent_epoch_counts(rnx_path):
    """Fresh, standalone re-parse of just the epoch header lines (no shared code with parser.py)."""
    counts = {}
    with open(rnx_path, "r", errors="ignore") as f:
        in_header = True
        for line in f:
            if in_header:
                if "END OF HEADER" in line:
                    in_header = False
                continue
            if line.startswith(">"):
                parts = line.split()
                y, mo, d, h, mi = parts[1:6]
                sec = float(parts[6])
                t = datetime(int(y), int(mo), int(d), int(h), int(mi), int(sec))
                counts[t] = int(parts[8])
    return counts


def get_test_files():
    if not os.path.isdir(BATCH_DIR):
        return []
    return [f for f in os.listdir(BATCH_DIR) if f.endswith(".rnx")]


@pytest.mark.parametrize("rnx_filename", get_test_files())
def test_epoch_satellite_counts_match_raw_rinex(rnx_filename):
    """For every .rnx file in batch/, parser.py's epoch satellite counts
    must exactly match an independent count taken straight from the file."""
    path = os.path.join(BATCH_DIR, rnx_filename)
    expected = independent_epoch_counts(path)

    result = parse_rinex_file(path)
    actual = {e["time"]: e["total"] for e in result["epochs"]}

    assert set(actual.keys()) == set(expected.keys()), (
        f"{rnx_filename}: epoch timestamps differ between parser and raw file"
    )
    mismatches = [(t, expected[t], actual[t]) for t in expected if expected[t] != actual[t]]
    assert not mismatches, (
        f"{rnx_filename}: {len(mismatches)} epoch(s) mismatched, e.g. {mismatches[:3]}"
    )


def test_batch_folder_has_files():
    """Sanity check: make sure there's actually something to test against."""
    files = get_test_files()
    assert len(files) > 0, "No .rnx files found in batch/ -- add some test files first"
