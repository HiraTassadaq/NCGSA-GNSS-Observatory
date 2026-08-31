import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
const icon = L.divIcon({ className: 'receiver-marker', 
    html: '<span>⌖</span>', iconSize: [35, 35], iconAnchor: [17, 17] });
export default function GNSSMap({ receiver })
 { const pos = [receiver.latitude, receiver.longitude]; 
    return <article className="map-card">
        <div className="card-heading"><div>
            <span className="eyebrow">LIVE GNSS POSITION</span>
            <h3>Receiver Position</h3>
            </div><span className="good">● {receiver.status}</span>
            </div><div className="map">
                <MapContainer center={pos} zoom={15} scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <Marker position={pos} icon={icon}><Popup>NCGSA {receiver.short} receiver</Popup>
                    </Marker><Circle center={pos} radius={receiver.accuracy * 25} 
                    pathOptions={{ color: receiver.color, fillColor: receiver.color, fillOpacity: .2 }}/>
                    </MapContainer>
                    </div>
                    </article>; }
