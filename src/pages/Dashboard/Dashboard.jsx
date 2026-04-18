import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { useReports } from "../../controllers/ReportsController";
import { CATEGORIES } from "../../data/mockReports";
import { getPrioridad } from "../../utils/prioridad";
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

  // --- Estado del mapa ampliado ---
  const [mapaAbierto, setMapaAbierto]   = useState(false);
  const [mapFiltroCat, setMapFiltrocat] = useState("");
  const [mapFiltroEst, setMapFiltroEst] = useState("");

  // --- Filtro por período ---
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const reportsFiltrados = useMemo(() => {
    return reports.filter((r) => {
      const fecha = new Date(r.createdAt);
      if (fechaDesde && fecha < new Date(fechaDesde)) return false;
      if (fechaHasta && fecha > new Date(fechaHasta + "T23:59:59")) return false;
      return true;
    });
  }, [reports, fechaDesde, fechaHasta]);

  const hayFiltroFecha = fechaDesde || fechaHasta;

  // --- Requieren atención ---
  const ahora = new Date();
  const atencionUrgente = useMemo(() =>
    reports.filter((r) => {
      const p = getPrioridad(r.votes);
      return (p.id === "alta" || p.id === "critica") && r.status !== "resuelto" && r.status !== "duplicado";
    }).sort((a, b) => b.votes.length - a.votes.length),
  [reports]);

  const atencionRiesgo = useMemo(() =>
    reports.filter((r) => {
      if (r.status !== "pendiente") return false;
      const dias = (ahora - new Date(r.createdAt)) / (1000 * 60 * 60 * 24);
      return dias >= 15 && dias < 30;
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  [reports]);

  const atencionAbandonado = useMemo(() =>
    reports.filter((r) => {
      if (r.status !== "pendiente") return false;
      const dias = (ahora - new Date(r.createdAt)) / (1000 * 60 * 60 * 24);
      return dias >= 30;
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  [reports]);

  // --- Cálculos generales ---
  const totalVotes = useMemo(
    () => reportsFiltrados.reduce((acc, r) => acc + r.votes.length, 0),
    [reportsFiltrados]
  );

  const mostVoted = useMemo(
    () => [...reportsFiltrados].sort((a, b) => b.votes.length - a.votes.length)[0],
    [reportsFiltrados]
  );

  const resolvedReports = useMemo(
    () => reportsFiltrados.filter((r) => r.status === "resuelto"),
    [reportsFiltrados]
  );
  const resolvedCount = resolvedReports.length;

  // --- Ranking de categorías ---
  const categoryStats = useMemo(() => {
    const counts = {};
    reportsFiltrados.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return CATEGORIES.map((cat) => ({
      ...cat,
      count: counts[cat.id] || 0,
      votes: reportsFiltrados
        .filter((r) => r.category === cat.id)
        .reduce((acc, r) => acc + r.votes.length, 0),
    })).sort((a, b) => b.count - a.count);
  }, [reportsFiltrados]);

  const maxCategoryCount = categoryStats[0]?.count || 1;

  // --- Reportes por mes ---
  const reportsByMonth = useMemo(() => {
    const counts = {};
    reportsFiltrados.forEach((r) => {
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
  }, [reportsFiltrados]);

  // --- Estadísticas por barrio ---
  const barrioStats = useMemo(() => {
    const map = {};
    reportsFiltrados.forEach((r) => {
      if (!r.barrio) return;
      const key = r.barrio.nombre;
      if (!map[key]) map[key] = { nombre: key, count: 0, votes: 0, resueltos: 0, enProceso: 0 };
      map[key].count++;
      map[key].votes += r.votes.length;
      if (r.status === "resuelto")   map[key].resueltos++;
      if (r.status === "en_proceso") map[key].enProceso++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [reportsFiltrados]);

  const maxBarrioCount = barrioStats[0]?.count || 1;

  // --- Reportes con ubicación para el mapa ---
  const reportsWithLocation = useMemo(
    () => reportsFiltrados.filter((r) => r.location?.lat),
    [reportsFiltrados]
  );

  const mapCenter = reportsWithLocation.length > 0
    ? [reportsWithLocation[0].location.lat, reportsWithLocation[0].location.lng]
    : [-26.1775, -58.1781];

  return (
    <>
    <div className="dashboard">
      <div className="dashboard__container">

        {/* Header */}
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__subtitle">Estadísticas generales de los reportes municipales.</p>
          </div>
          <div className="dashboard__periodo">
            <label className="dashboard__periodo-label">Período:</label>
            <input
              type="date"
              className="dashboard__periodo-input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <span className="dashboard__periodo-sep">→</span>
            <input
              type="date"
              className="dashboard__periodo-input"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
            {hayFiltroFecha && (
              <button className="dashboard__periodo-clear" onClick={() => { setFechaDesde(""); setFechaHasta(""); }}>
                Limpiar
              </button>
            )}
            {hayFiltroFecha && (
              <span className="dashboard__periodo-hint">{reportsFiltrados.length} de {reports.length} reportes</span>
            )}
          </div>
        </div>

        {/* Requieren atención hoy */}
        {(atencionUrgente.length > 0 || atencionRiesgo.length > 0 || atencionAbandonado.length > 0) && (
          <div className="dashboard__atencion">
            <h2 className="dashboard__atencion-title">⚠️ Requieren atención hoy</h2>
            <div className="dashboard__atencion-grid">

              {/* Urgentes */}
              <div className="atencion-panel atencion-panel--urgente">
                <div className="atencion-panel__header">
                  <span className="atencion-panel__icon">🔴</span>
                  <span className="atencion-panel__label">Prioridad urgente</span>
                  <span className="atencion-panel__count">{atencionUrgente.length}</span>
                </div>
                {atencionUrgente.length === 0 ? (
                  <p className="atencion-panel__empty">Sin reportes urgentes</p>
                ) : (
                  <ul className="atencion-panel__list">
                    {atencionUrgente.slice(0, 5).map((r) => {
                      const p = getPrioridad(r.votes);
                      return (
                        <li key={r.id} className="atencion-panel__item">
                          <Link to={`/reporte/${r.id}`} className="atencion-panel__link">
                            <span className="atencion-panel__item-title">{r.title}</span>
                            <span className="atencion-panel__item-meta" style={{ color: p.color }}>
                              🔥 {p.label} · 👍 {r.votes.length}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* En riesgo */}
              <div className="atencion-panel atencion-panel--riesgo">
                <div className="atencion-panel__header">
                  <span className="atencion-panel__icon">⏳</span>
                  <span className="atencion-panel__label">En riesgo de abandono</span>
                  <span className="atencion-panel__count">{atencionRiesgo.length}</span>
                </div>
                {atencionRiesgo.length === 0 ? (
                  <p className="atencion-panel__empty">Sin reportes en riesgo</p>
                ) : (
                  <ul className="atencion-panel__list">
                    {atencionRiesgo.slice(0, 5).map((r) => {
                      const dias = Math.floor((ahora - new Date(r.createdAt)) / (1000 * 60 * 60 * 24));
                      return (
                        <li key={r.id} className="atencion-panel__item">
                          <Link to={`/reporte/${r.id}`} className="atencion-panel__link">
                            <span className="atencion-panel__item-title">{r.title}</span>
                            <span className="atencion-panel__item-meta">{dias} días sin respuesta</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Abandonados */}
              <div className="atencion-panel atencion-panel--abandonado">
                <div className="atencion-panel__header">
                  <span className="atencion-panel__icon">🚨</span>
                  <span className="atencion-panel__label">Abandonados</span>
                  <span className="atencion-panel__count">{atencionAbandonado.length}</span>
                </div>
                {atencionAbandonado.length === 0 ? (
                  <p className="atencion-panel__empty">Sin reportes abandonados</p>
                ) : (
                  <ul className="atencion-panel__list">
                    {atencionAbandonado.slice(0, 5).map((r) => {
                      const dias = Math.floor((ahora - new Date(r.createdAt)) / (1000 * 60 * 60 * 24));
                      return (
                        <li key={r.id} className="atencion-panel__item">
                          <Link to={`/reporte/${r.id}`} className="atencion-panel__link">
                            <span className="atencion-panel__item-title">{r.title}</span>
                            <span className="atencion-panel__item-meta atencion-panel__item-meta--danger">{dias} días sin respuesta</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="dashboard__cards">
          <StatCard icon="📋" label="Reportes totales" value={reports.length} />
          <StatCard icon="✅" label="Obras realizadas" value={resolvedCount} sub="reportes resueltos" />
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

          {/* Estadísticas por barrio */}
          <section className="dashboard__section dashboard__section--full">
            <h2 className="dashboard__section-title">Reportes por barrio</h2>
            {barrioStats.length === 0 ? (
              <p className="dashboard__empty">Ningún reporte tiene barrio asignado aún.</p>
            ) : (
              <div className="dashboard__barrio-list">
                {barrioStats.map((b, i) => (
                  <div key={b.nombre} className="barrio-row">
                    <div className="barrio-row__rank">#{i + 1}</div>
                    <div className="barrio-row__info">
                      <div className="barrio-row__header">
                        <span className="barrio-row__nombre">{b.nombre}</span>
                        <div className="barrio-row__badges">
                          {b.resueltos > 0 && (
                            <span className="barrio-row__badge barrio-row__badge--resuelto">✅ {b.resueltos} resueltos</span>
                          )}
                          {b.enProceso > 0 && (
                            <span className="barrio-row__badge barrio-row__badge--proceso">🔧 {b.enProceso} en proceso</span>
                          )}
                          <span className="barrio-row__badge barrio-row__badge--votos">👍 {b.votes}</span>
                        </div>
                      </div>
                      <div className="barrio-row__bar-wrap">
                        <div
                          className="barrio-row__bar"
                          style={{ width: `${(b.count / maxBarrioCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="barrio-row__count">{b.count} rep.</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mapa global */}
          <section className="dashboard__section dashboard__section--full">
            <div className="dashboard__map-header">
              <div>
                <h2 className="dashboard__section-title">Mapa de reportes</h2>
                <p className="dashboard__section-sub">
                  {reportsWithLocation.length} de {reports.length} reportes tienen ubicación marcada.
                </p>
              </div>
              <button className="dashboard__map-expand-btn" onClick={() => setMapaAbierto(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                Ampliar mapa
              </button>
            </div>
            <div className="dashboard__map">
              <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {reportsWithLocation.map((r) => {
                  const p = getPrioridad(r.votes);
                  const color = p.color || CATEGORY_COLORS[r.category] || "#8b5cf6";
                  return (
                    <CircleMarker
                      key={r.id}
                      center={[r.location.lat, r.location.lng]}
                      radius={8}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 2 }}
                    >
                      <Popup>
                        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                          <strong>{r.title}</strong><br />
                          {CATEGORIES.find((c) => c.id === r.category)?.icon}{" "}
                          {CATEGORIES.find((c) => c.id === r.category)?.label}<br />
                          {p.label && <><span style={{ color: p.color, fontWeight: 700 }}>🔥 Prioridad {p.label}</span><br /></>}
                          👍 {r.votes.length} {r.votes.length === 1 ? "apoyo" : "apoyos"}<br />
                          <Link to={`/reporte/${r.id}`} style={{ color: "#2563eb" }}>Ver reporte →</Link>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
            <p className="dashboard__map-hint">
              El color representa la categoría del reporte.
            </p>
          </section>

        </div>

      </div>
    </div>

    {/* Modal mapa ampliado */}
    {mapaAbierto && (
      <div className="mapa-modal" onClick={(e) => e.target === e.currentTarget && setMapaAbierto(false)}>
        <div className="mapa-modal__box">
          <div className="mapa-modal__header">
            <div className="mapa-modal__header-left">
              <h2 className="mapa-modal__title">🗺️ Mapa global de reportes</h2>
              <span className="mapa-modal__count">{reportsWithLocation.length} reportes con ubicación</span>
            </div>
            <div className="mapa-modal__controls">
              <select
                className="mapa-modal__select"
                value={mapFiltroCat}
                onChange={(e) => setMapFiltrocat(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
              <select
                className="mapa-modal__select"
                value={mapFiltroEst}
                onChange={(e) => setMapFiltroEst(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="resuelto">Resuelto</option>
              </select>
              <button className="mapa-modal__close" onClick={() => setMapaAbierto(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="mapa-modal__map">
            <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {reportsWithLocation
                .filter((r) => (!mapFiltroCat || r.category === mapFiltroCat) && (!mapFiltroEst || r.status === mapFiltroEst))
                .map((r) => {
                  const p = getPrioridad(r.votes);
                  const color = p.color || CATEGORY_COLORS[r.category] || "#8b5cf6";
                  return (
                    <CircleMarker
                      key={r.id}
                      center={[r.location.lat, r.location.lng]}
                      radius={9}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
                    >
                      <Popup>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                          <strong>{r.title}</strong><br />
                          {CATEGORIES.find((c) => c.id === r.category)?.icon}{" "}
                          {CATEGORIES.find((c) => c.id === r.category)?.label}<br />
                          {r.barrio && <>🏘️ {r.barrio.nombre}<br /></>}
                          {p.label && <><span style={{ color: p.color, fontWeight: 700 }}>🔥 Prioridad {p.label}</span><br /></>}
                          👍 {r.votes.length} {r.votes.length === 1 ? "apoyo" : "apoyos"}<br />
                          <Link to={`/reporte/${r.id}`} style={{ color: "#2563eb" }}>Ver reporte →</Link>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </MapContainer>
          </div>
          <div className="mapa-modal__legend">
            {CATEGORIES.map((c) => (
              <span key={c.id} className="mapa-modal__legend-item">
                <span className="mapa-modal__legend-dot" style={{ background: CATEGORY_COLORS[c.id] || "#8b5cf6" }} />
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
