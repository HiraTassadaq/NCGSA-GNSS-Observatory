import math

# WGS84 Constants for GPS
MU = 3.986005e14  # Earth's universal gravitational parameter (m^3/s^2)
OMEGA_E = 7.2921151467e-5  # Earth rotation rate (rad/s)

def compute_satellite_ecef(ephemeris, target_time_sec, toc_sec):
    """
    Calculates Satellite ECEF X, Y, Z coordinates from broadcast ephemeris.
    ephemeris: dictionary of navigation records (sqrtA, e, M0, omega, i0, etc.)
    target_time_sec: Time of week for the calculation
    toc_sec: Time of clock (reference time)
    """
    # 1. Semi-major axis and computed mean motion
    A = ephemeris['sqrtA'] ** 2
    n0 = math.sqrt(MU / (A ** 3))
    n = n0 + ephemeris['delta_n']
    
    # 2. Time elapsed since reference epoch
    tk = target_time_sec - ephemeris['toe']
    
    # Account for end-of-week crossovers
    if tk > 302400: tk -= 604800
    elif tk < -302400: tk += 604800
        
    # 3. Mean Anomaly
    Mk = ephemeris['M0'] + n * tk
    
    # 4. Iteratively solve Kepler's Equation for Eccentric Anomaly (Ek)
    Ek = Mk
    for _ in range(10):
        Ek_next = Mk + ephemeris['e'] * math.sin(Ek)
        if abs(Ek_next - Ek) < 1e-12:
            break
        Ek = Ek_next
        
    # 5. True Anomaly (vk)
    vk = math.atan2(
        math.sqrt(1 - ephemeris['e']**2) * math.sin(Ek), 
        math.cos(Ek) - ephemeris['e']
    )
    
    # 6. Argument of Latitude (Phik)
    Phik = vk + ephemeris['omega']
    
    # 7. Second Harmonic Perturbations
    sin2Phi = math.sin(2 * Phik)
    cos2Phi = math.cos(2 * Phik)
    
    duk = ephemeris['Cus'] * sin2Phi + ephemeris['Cuc'] * cos2Phi
    drk = ephemeris['Crs'] * sin2Phi + ephemeris['Crc'] * cos2Phi
    dik = ephemeris['Cis'] * sin2Phi + ephemeris['Cic'] * cos2Phi
    
    # 8. Corrected orbital parameters
    uk = Phik + duk
    rk = A * (1 - ephemeris['e'] * math.cos(Ek)) + drk
    ik = ephemeris['i0'] + ephemeris['idot'] * tk + dik
    
    # 9. Positions in orbital plane
    xk_prime = rk * math.cos(uk)
    yk_prime = rk * math.sin(uk)
    
    # 10. Corrected longitude of ascending node
    Omegak = ephemeris['Omega0'] + (ephemeris['Omega_dot'] - OMEGA_E) * tk - OMEGA_E * ephemeris['toe']
    
    # 11. Final ECEF Coordinates
    X = xk_prime * math.cos(Omegak) - yk_prime * math.cos(ik) * math.sin(Omegak)
    Y = xk_prime * math.sin(Omegak) + yk_prime * math.cos(ik) * math.cos(Omegak)
    Z = yk_prime * math.sin(ik)
    
    return {"X": X, "Y": Y, "Z": Z}