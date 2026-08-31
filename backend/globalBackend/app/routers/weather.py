import requests
from fastapi import APIRouter

router = APIRouter(prefix="/api")

@router.get("/space-weather")
def get_space_weather():
    """Normalize and return NOAA space weather scales."""
    url = "https://services.swpc.noaa.gov/products/noaa-scales.json"
    data = None
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            data = r.json()
    except Exception:
        pass
        
    g_scale, g_text = "0", "none"
    s_scale, s_text = "0", "none"
    r_scale, r_text = "0", "none"
    
    day_zero = (data or {}).get("0") if isinstance(data, dict) else None
    if day_zero:
        g_obj = day_zero.get("G") or {}
        g_scale, g_text = str(g_obj.get("Scale") or "0"), str(g_obj.get("Text") or "none")
        s_obj = day_zero.get("S") or {}
        s_scale, s_text = str(s_obj.get("Scale") or "0"), str(s_obj.get("Text") or "none")
        r_obj = day_zero.get("R") or {}
        r_scale, r_text = str(r_obj.get("Scale") or "0"), str(r_obj.get("Text") or "none")
        
    def clean_text(scale, text):
        if not scale or scale == "0" or text.lower() in ("none", "null"):
            return "Quiet"
        return f"{text.title()} (Scale {scale})"
        
    geomag_alert = "Quiet. GNSS signal delay is normal."
    if g_scale != "0":
        geomag_alert = f"Active Geomagnetic Storm ({g_text.upper()}). Ionosphere delays may increase."

    return {
        "G": {"Scale": f"G{g_scale}" if g_scale != "0" else "G0", "Condition": clean_text(g_scale, g_text), "Text": geomag_alert},
        "S": {"Scale": f"S{s_scale}" if s_scale != "0" else "S0", "Condition": clean_text(s_scale, s_text)},
        "R": {"Scale": f"R{r_scale}" if r_scale != "0" else "R0", "Condition": clean_text(r_scale, r_text)}
    }
