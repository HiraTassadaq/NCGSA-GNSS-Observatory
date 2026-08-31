export const getConstellationColor = (constellation) => {
  switch (constellation) {
    case 'GPS': return '#06b6d4'; // Cyan
    case 'GLONASS': return '#10b981'; // Emerald
    case 'Galileo': return '#3b82f6'; // Blue
    case 'BeiDou': return '#f59e0b'; // Amber
    case 'IRNSS': return '#8b5cf6'; // Purple
    case 'QZSS': return '#ec4899'; // Pink
    case 'SBAS': return '#eab308'; // Yellow
    default: return '#6b7280'; // Grey
  }
};

export const getHealthColor = (status) => {
  switch (status) {
    case 'active': return '#22c55e'; // Green
    case 'standby': return '#eab308'; // Yellow
    case 'inactive': return '#ef4444'; // Red
    default: return '#6b7280'; // Grey - unknown
  }
};
