"""
port_finder.py
Auto-detects which serial port the Septentrio receiver is streaming SBF on,
instead of hardcoding a fixed COM port (e.g. COM6). Useful because Windows
can reassign COM numbers after a reboot, USB replug, or driver refresh.

Usage:
    from port_finder import find_septentrio_port
    port = find_septentrio_port()
    if port:
        stream = Serial(port, 115200, timeout=3)
"""

import serial
import serial.tools.list_ports
import time

SBF_SYNC = b"$@"          # every SBF block starts with this 2-byte sync marker
BAUD = 115200
READ_TIMEOUT = 2           # seconds to wait for data on each candidate port
BYTES_TO_CHECK = 4096       # how many bytes to sniff before giving up on a port


def _looks_like_sbf(raw: bytes) -> bool:
    """Return True if the sync marker shows up anywhere in the sample."""
    return SBF_SYNC in raw


def find_septentrio_port(known_good_first: str | None = None) -> str | None:
    """
    Scan all serial ports, return the name of the first one streaming real
    SBF data, or None if nothing is found.

    known_good_first: optional port name (e.g. "COM6") to try first, as a
    fast path when yesterday's port is still likely correct.
    """
    candidates = [p.device for p in serial.tools.list_ports.comports()]

    if known_good_first and known_good_first in candidates:
        candidates.remove(known_good_first)
        candidates.insert(0, known_good_first)

    print(f"Scanning ports: {candidates}")

    for port_name in candidates:
        print(f"  Trying {port_name} ...")
        try:
            with serial.Serial(port_name, BAUD, timeout=READ_TIMEOUT) as ser:
                start = time.time()
                buf = b""
                while time.time() - start < READ_TIMEOUT:
                    chunk = ser.read(256)
                    if chunk:
                        buf += chunk
                    if len(buf) >= BYTES_TO_CHECK or _looks_like_sbf(buf):
                        break

                if _looks_like_sbf(buf):
                    print(f"  -> SBF sync found on {port_name}")
                    return port_name
                else:
                    print(f"  -> no SBF data on {port_name} (got {len(buf)} bytes)")

        except (serial.SerialException, OSError) as e:
            # port busy (e.g. RxControl has it open) or doesn't exist anymore
            print(f"  -> could not open {port_name}: {e}")
            continue

    return None


if __name__ == "__main__":
    found = find_septentrio_port(known_good_first="COM6")
    if found:
        print(f"\nSeptentrio receiver found on: {found}")
    else:
        print("\nNo port streaming SBF data was found. "
              "Check that the receiver is powered on, USB output stream is "
              "configured (see SBF Output dialog), and no other program "
              "(e.g. RxControl) is holding the port open.")
