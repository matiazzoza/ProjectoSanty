import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({ value, onChange, readOnly = false, height = "250px" }) {
  const defaultCenter = value
    ? [value.lat, value.lng]
    : [-34.6037, -58.3816];

  return (
    <div style={{ height, borderRadius: "8px", overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={!readOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readOnly && <ClickHandler onSelect={onChange} />}
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
}
