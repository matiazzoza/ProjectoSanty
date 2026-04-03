import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { useReports } from "../../context/ReportsContext";
import { CATEGORIES } from "../../data/mockReports";
import "leaflet/dist/leaflet.css";
import "./Dashboard.scss";

const CATEGORY_COLORS = {
  baches:         "#f59e0b",
  iluminacion:    "#3b82f6",
  basura:         "#22c55e",
  seguridad:      "#ef4444",
  espacios_verdes:"#10b981",
  agua:           "#06b6d4",
  otros:          "#8b5cf6",
};

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon">{icon}</span>
      <div className="stat-card__info">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
        {sub && <span className="stat-card__sub">{sub}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { reports } = useReports();

  // --- Cálculos generales ---
  const totalVotes = useMemo(
    () => reports.reduce((acc, r) => acc + r.votes.length, 0),
    [reports]
  );

  const mostVoted = useMemo(
    () => [...reports].sort((a, b) => b.votes.length - a.votes.length)[0],
    [reports]
  );

  const resolvedCount = useMemo(
    () => reports.filter((r) => r.status === "resuelto").length,
    [reports]
  );

  // --- Ranking de categorías ---
  const categoryStats = useMemo(() => {
    const counts = {};
    reports.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return CATEGORIES.map((cat) => ({
      ...cat,
      count: counts[cat.id] || 0,
      votes: reports
        .filter((r) => r.category === cat.id)
        .reduce((acc, r) => acc + r.votes.length, 0),
    })).sort((a, b) => b.count - a.count);
  }, [reports]);

  const maxCategoryCount = categoryStats[0]?.count || 1;

  // --- Reportes por mes ---
  const reportsByMonth = useMemo(() => {
    const counts = {};
    reports.forEach((r) => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts[key] = (counts[key] || { month: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), count: 0 });
      counts[key].count += 1;
    });
    return Object.values(counts)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month);
      })
      .map((d) => ({ name: `${d.month} ${d.year}`, reportes: d.count }));
  }, [reports]);

  // --- Reportes con ubicación para el mapa ---
  const reportsWithLocation = useMemo(
    () => reports.filter((r) => r.location?.lat),
    [reports]
  );

  const mapCenter = reportsWithLocation.length > 0
    ? [reportsWithLocation[0].location.lat, reportsWithLocation[0].location.lng]
    : [-34.6037, -58.3816];

  return (
    <div className="dashboard">
      <div className="dashboard__container">

        {/* Header */}
        <div className="dashboard__header">
          <h1 className="dashboard__title">Dashboard</h1>
          <p className="dashboard__subtitle">Estadísticas generales de los reportes municipales.</p>
        </div>

        {/* Stat cards */}
        <div className="dashboard__cards">
          <StatCard icon="📋" label="Reportes totales" value={reports.length} />
          <StatCard icon="👍" label="Votos totales" value={totalVotes} />
          <StatCard
            icon="🏆"
            label="Reporte más votado"
            value={mostVoted?.votes.length ?? 0}
            sub={mostVoted?.title}
          />
          <StatCard
            icon="📊"
            label="Categorías activas"
            value={categoryStats.filter((c) => c.count > 0).length}
            sub={`de ${CATEGORIES.length} totales`}
          />
        </div>

        {/* Grid de secciones */}
        <div className="dashboard__grid">

          {/* Ranking de categorías */}
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Ranking de categorías</h2>
            <div className="dashboard__category-list">
              {categoryStats.map((cat) => (
                <div key={cat.id} className="cat-row">
                  <div className="cat-row__label">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  <div className="cat-row__bar-wrap">
                    <div
                      className="cat-row__bar"
                      style={{
                        width: `${(cat.count / maxCategoryCount) * 100}%`,
                        background: CATEGORY_COLORS[cat.id] || "#8b5cf6",
                      }}
                    />
                  </div>
                  <div className="cat-row__stats">
                    <span className="cat-row__count">{cat.count} rep.</span>
                    <span className="cat-row__votes">👍 {cat.votes}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reportes por mes */}
          <section className="dashboard__section">
            <h2 className="dashboard__section-title">Reportes por mes</h2>
            {reportsByMonth.length === 0 ? (
              <p className="dashboard__empty">No hay datos suficientes.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reportsByMonth} barSize={28}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid #e2e8f0" }}
                    cursor={{ fill: "rgba(37,99,235,0.06)" }}
                  />
                  <Bar dataKey="reportes" radius={[6, 6, 0, 0]}>
                    {reportsByMonth.map((_, i) => (
                      <Cell key={i} fill="#2563eb" fillOpacity={0.75 + (i % 3) * 0.08} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Mapa global */}
          <section className="dashboard__section dashboard__section--full">
            <h2 className="dashboard__section-title">Mapa de reportes</h2>
            <p className="dashboard__section-sub">
              {reportsWithLocation.length} de {reports.length} reportes tienen ubicación marcada.
            </p>
            <div className="dashboard__map">
              <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {reportsWithLocation.map((r) => (
                  <CircleMarker
                    key={r.id}
                    center={[r.location.lat, r.location.lng]}
                    radius={8 + r.votes.length * 2}
                    pathOptions={{
                      color: CATEGORY_COLORS[r.category] || "#8b5cf6",
                      fillColor: CATEGORY_COLORS[r.category] || "#8b5cf6",
                      fillOpacity: 0.75,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                        <strong>{r.title}</strong><br />
                        {CATEGORIES.find((c) => c.id === r.category)?.icon}{" "}
                        {CATEGORIES.find((c) => c.id === r.category)?.label}<br />
                        👍 {r.votes.length} {r.votes.length === 1 ? "apoyo" : "apoyos"}<br />
                        <Link to={`/reporte/${r.id}`} style={{ color: "#2563eb" }}>Ver reporte →</Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
            <p className="dashboard__map-hint">
              El tamaño del círculo indica la cantidad de votos. El color representa la categoría.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
