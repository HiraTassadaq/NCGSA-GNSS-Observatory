import math

def klobuchar_iono_delay(lat_deg, lon_deg, elevation_deg, azimuth_deg, time_of_week_sec, alpha, beta):
    """
    Estimates Ionospheric delay using the Klobuchar model.
    alpha: list of 4 alpha coefficients [a0, a1, a2, a3]
    beta: list of 4 beta coefficients [b0, b1, b2, b3]
    Returns delay in seconds.
    """
    # Convert inputs to semi-circles
    lat = lat_deg / 180.0
    lon = lon_deg / 180.0
    ele = elevation_deg / 180.0
    azi = azimuth_deg / 180.0
    
    # 1. Calculate Earth-centered angle
    psi = 0.0137 / (ele + 0.11) - 0.022
    
    # 2. Sub-ionospheric latitude
    lat_i = lat + psi * math.cos(azi * math.pi)
    if lat_i > 0.416: lat_i = 0.416
    elif lat_i < -0.416: lat_i = -0.416
        
    # 3. Sub-ionospheric longitude
    lon_i = lon + (psi * math.sin(azi * math.pi)) / math.cos(lat_i * math.pi)
    
    # 4. Geomagnetic latitude
    lat_m = lat_i + 0.064 * math.cos((lon_i - 1.617) * math.pi)
    
    # 5. Local time at sub-ionospheric point
    t = 43200 * lon_i + time_of_week_sec
    t = t % 86400
    if t < 0: t += 86400
        
    # 6. Calculate Amplitude and Period
    A = sum([alpha[n] * (lat_m ** n) for n in range(4)])
    if A < 0: A = 0
        
    P = sum([beta[n] * (lat_m ** n) for n in range(4)])
    if P < 7200: P = 7200
        
    # 7. Phase of the delay
    x = (2 * math.pi * (t - 50400)) / P
    
    # 8. Compute final ionospheric delay
    F = 1.0 + 16.0 * ((0.53 - ele) ** 3)
    
    if abs(x) < 1.57:
        delay = F * (5e-9 + A * (1 - (x**2)/2 + (x**4)/24))
    else:
        delay = F * 5e-9
        
    return delay