import re


# SBAS (Satellite-Based Augmentation Systems) — regional augmentation constellations
# that broadcast GPS/GNSS correction & integrity data from geostationary orbit.
SBAS_KEYWORDS = (
    "WAAS", "EGNOS", "GAGAN", "MSAS", "SDCM", "SBAS",
    "INMARSAT", "ASTRA", "ANIK", "PANAMSAT", "GALAXY 15", "INTELSAT"
)


def get_constellation(sat_name: str) -> str:
    name = sat_name.upper()
    # SBAS check runs first: GAGAN satellites are named "GSAT-8", "GSAT-10", etc. (ISRO
    # naming), which would otherwise collide with Galileo's "GSAT0101"-style names below.
    # The presence of an explicit SBAS marker (WAAS/EGNOS/GAGAN/SDCM/...) is unambiguous,
    # so it takes priority over the looser "GSAT" substring match used for Galileo.
    if any(kw in name for kw in SBAS_KEYWORDS):
        return "SBAS"
    elif "GPS" in name:
        return "GPS"
    elif "GLONASS" in name or "COSMOS" in name:
        return "GLONASS"
    elif "GALILEO" in name or "GSAT" in name:
        return "Galileo"
    elif "BEIDOU" in name or "COMPASS" in name:
        return "BeiDou"
    elif "IRNSS" in name or "NAVIC" in name:
        return "IRNSS"
    elif "QZS" in name or "MICHIBIKI" in name:
        return "QZSS"
    return "Other"

def get_prn(sat_name: str, catalog_num: int) -> str:
    name = sat_name.upper()
    match = re.search(r"PRN\s+([A-Z0-9]+)", name)
    if match:
        return match.group(1)
    
    const = get_constellation(sat_name)
    num = str(catalog_num % 100).zfill(2)
    mapping = {"GPS": "G", "GLONASS": "R", "Galileo": "E", "BeiDou": "C", "IRNSS": "I", "QZSS": "J", "SBAS": "S"}
    return f"{mapping.get(const, 'S')}{num}"
