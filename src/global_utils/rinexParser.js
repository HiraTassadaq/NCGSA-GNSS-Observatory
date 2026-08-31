/**
 * RINEX Broadcast Navigation File Parser (v2.xx and v3.xx)
 * Supports GPS (G), GLONASS (R), Galileo (E), BeiDou (C), QZSS (J), SBAS (S), IRNSS (I).
 */

export function parseRinexNav(fileContent) {
  const lines = fileContent.split(/\r?\n/);
  
  let version = 2.11;
  let fileType = 'N'; // N = NAV
  let ionoParams = {
    alpha: [0.1118e-07, 0.2235e-07, -0.5960e-07, -0.1192e-06],
    beta: [0.9830e+05, 0.6554e+05, -0.1966e+06, -0.6554e+05]
  };
  let headerEndIndex = -1;

  // 1. Parse Header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const label = line.substring(60).trim();

    if (label.includes('RINEX VERSION / TYPE')) {
      version = parseFloat(line.substring(0, 20).trim());
      fileType = line.substring(20, 40).trim();
    } else if (label.includes('IONALPHA') || label.includes('IONOSPHERIC CORR')) {
      if (line.includes('GPSA') || label.includes('IONALPHA')) {
        const parts = line.trim().split(/\s+/);
        const vals = parts.filter(p => !isNaN(parseFloat(p))).map(Number);
        if (vals.length >= 4) {
          ionoParams.alpha = vals.slice(0, 4);
        }
      } else if (line.includes('GPSB')) {
        const parts = line.trim().split(/\s+/);
        const vals = parts.filter(p => !isNaN(parseFloat(p))).map(Number);
        if (vals.length >= 4) {
          ionoParams.beta = vals.slice(0, 4);
        }
      }
    } else if (label.includes('IONBETA')) {
      const parts = line.trim().split(/\s+/);
      const vals = parts.filter(p => !isNaN(parseFloat(p))).map(Number);
      if (vals.length >= 4) {
        ionoParams.beta = vals.slice(0, 4);
      }
    } else if (label.includes('END OF HEADER')) {
      headerEndIndex = i;
      break;
    }
  }

  if (headerEndIndex === -1) {
    headerEndIndex = lines.findIndex(l => l.includes('END OF HEADER'));
    if (headerEndIndex === -1) headerEndIndex = 0;
  }

  // Helper to parse floating numbers with D or E scientific notation (e.g., 0.123D-04)
  const parseNum = (str) => {
    if (!str) return 0;
    const clean = str.trim().replace(/[D]/g, 'E');
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  };

  const satellitesMap = new Map(); // satKey -> Ephemeris Object

  // 2. Parse Ephemeris Data Blocks
  let i = headerEndIndex + 1;
  while (i < lines.length) {
    const line = lines[i];
    if (!line || line.trim() === '') {
      i++;
      continue;
    }

    let prn = '';
    let constellation = 'GPS';
    let year = 2026, month = 1, day = 1, hour = 0, minute = 0, second = 0;
    let af0 = 0, af1 = 0, af2 = 0;

    if (version >= 3.0) {
      // RINEX 3 format: Line starts with Sat ID e.g. G01, E05, C14, R02, J01, S27
      const satId = line.substring(0, 3).trim();
      if (!satId || satId.length < 2) {
        i++;
        continue;
      }
      
      const constChar = satId.charAt(0);
      switch (constChar) {
        case 'G': constellation = 'GPS'; break;
        case 'R': constellation = 'GLONASS'; break;
        case 'E': constellation = 'Galileo'; break;
        case 'C': constellation = 'BeiDou'; break;
        case 'J': constellation = 'QZSS'; break;
        case 'S': constellation = 'SBAS'; break;
        case 'I': constellation = 'IRNSS'; break;
        default: constellation = 'GPS'; break;
      }
      prn = satId;

      year = parseInt(line.substring(4, 8).trim(), 10) || 2026;
      month = parseInt(line.substring(9, 11).trim(), 10) || 1;
      day = parseInt(line.substring(12, 14).trim(), 10) || 1;
      hour = parseInt(line.substring(15, 17).trim(), 10) || 0;
      minute = parseInt(line.substring(18, 20).trim(), 10) || 0;
      second = parseFloat(line.substring(21, 23).trim()) || 0;

      af0 = parseNum(line.substring(23, 42));
      af1 = parseNum(line.substring(42, 61));
      af2 = parseNum(line.substring(61, 80));
    } else {
      // RINEX 2 format: Line starts with PRN number (1-32 or padded)
      const prnNum = parseInt(line.substring(0, 2).trim(), 10);
      if (isNaN(prnNum) || prnNum <= 0) {
        i++;
        continue;
      }
      constellation = 'GPS'; // RINEX 2 .N is default GPS
      prn = 'G' + (prnNum < 10 ? '0' + prnNum : prnNum);

      let yr = parseInt(line.substring(3, 5).trim(), 10);
      year = yr < 80 ? 2000 + yr : 1900 + yr;
      month = parseInt(line.substring(6, 8).trim(), 10) || 1;
      day = parseInt(line.substring(9, 11).trim(), 10) || 1;
      hour = parseInt(line.substring(12, 14).trim(), 10) || 0;
      minute = parseInt(line.substring(15, 17).trim(), 10) || 0;
      second = parseFloat(line.substring(18, 22).trim()) || 0;

      af0 = parseNum(line.substring(22, 41));
      af1 = parseNum(line.substring(41, 60));
      af2 = parseNum(line.substring(60, 79));
    }

    const epochDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // Parse Broadcast Lines 1..7 (4 fields per line of length 19 chars)
    const broadcastFields = [];
    let linesToRead = 7;
    for (let l = 1; l <= linesToRead; l++) {
      if (i + l >= lines.length) break;
      const bLine = lines[i + l];
      const startOffset = version >= 3.0 ? 4 : 3;
      const f1 = parseNum(bLine.substring(startOffset, startOffset + 19));
      const f2 = parseNum(bLine.substring(startOffset + 19, startOffset + 38));
      const f3 = parseNum(bLine.substring(startOffset + 38, startOffset + 57));
      const f4 = parseNum(bLine.substring(startOffset + 57, startOffset + 76));
      broadcastFields.push(f1, f2, f3, f4);
    }

    i += (linesToRead + 1);

    // Extract Keplerian parameters
    const ephemeris = {
      prn,
      constellation,
      epoch: epochDate,
      af0, af1, af2,
      iode: broadcastFields[0] || 0,
      crs: broadcastFields[1] || 0,
      deltaN: broadcastFields[2] || 0,
      m0: broadcastFields[3] || 0,
      cuc: broadcastFields[4] || 0,
      e: broadcastFields[5] || 0, // Eccentricity
      cus: broadcastFields[6] || 0,
      sqrtA: broadcastFields[7] || 0, // sqrt(A) in sqrt(meters)
      toe: broadcastFields[8] || 0, // Time of Ephemeris (seconds of GPS week)
      cic: broadcastFields[9] || 0,
      omega0: broadcastFields[10] || 0, // Longitude of Ascending Node (rad)
      cis: broadcastFields[11] || 0,
      i0: broadcastFields[12] || 0, // Inclination (rad)
      crc: broadcastFields[13] || 0,
      omega: broadcastFields[14] || 0, // Argument of Perigee (rad)
      omegaDot: broadcastFields[15] || 0, // Rate of Right Ascension (rad/s)
      idot: broadcastFields[16] || 0, // Rate of Inclination (rad/s)
      codesL2: broadcastFields[17] || 0,
      gpsWeek: broadcastFields[18] || 0,
      l2PFlag: broadcastFields[19] || 0,
      svAccuracy: broadcastFields[20] || 0,
      svHealth: broadcastFields[21] || 0, // Health status (0 = healthy)
      tgd: broadcastFields[22] || 0, // Total Group Delay
      iodc: broadcastFields[23] || 0,
      transmissionTime: broadcastFields[24] || 0
    };

    // Determine health status
    let isHealthy = true;
    let healthText = 'Healthy';

    if (constellation === 'GPS' || constellation === 'QZSS') {
      const healthBit = Math.floor(ephemeris.svHealth) & 0x3F;
      if (healthBit !== 0) {
        isHealthy = false;
        healthText = healthBit === 1 ? 'Degraded / Unhealthy' : `Unhealthy (Code ${healthBit})`;
      }
    } else if (constellation === 'Galileo') {
      const healthBit = Math.floor(ephemeris.svHealth) & 0x07;
      if (healthBit !== 0) {
        isHealthy = false;
        healthText = `Degraded (Code ${healthBit})`;
      }
    } else if (constellation === 'BeiDou') {
      const healthBit = Math.floor(ephemeris.svHealth) & 0x01;
      if (healthBit !== 0) {
        isHealthy = false;
        healthText = 'Unhealthy';
      }
    } else if (constellation === 'GLONASS') {
      const healthBit = Math.floor(ephemeris.svHealth) & 0x01;
      if (healthBit !== 0) {
        isHealthy = false;
        healthText = 'Unhealthy';
      }
    }

    ephemeris.isHealthy = isHealthy;
    ephemeris.healthText = healthText;

    if (!satellitesMap.has(prn) || satellitesMap.get(prn).epoch < epochDate) {
      satellitesMap.set(prn, ephemeris);
    }
  }

  const satellitesList = Array.from(satellitesMap.values());

  return {
    version,
    fileType,
    ionoParams,
    satellites: satellitesList,
    satellitesMap,
    totalCount: satellitesList.length,
    healthyCount: satellitesList.filter(s => s.isHealthy).length,
    degradedCount: satellitesList.filter(s => !s.isHealthy).length
  };
}
