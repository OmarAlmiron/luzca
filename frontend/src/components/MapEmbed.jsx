import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapEmbed({ lat = -34.6037, lng = -58.3816, label = 'Luzca — Depósito y showroom' }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-soft h-80">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{label}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
