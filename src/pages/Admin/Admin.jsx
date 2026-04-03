import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportsContext";
import { useToast } from "../../context/ToastContext";
import { CATEGORIES, STATUSES } from "../../data/mockReports";
import "./Admin.scss";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function Admin() {
  const { currentUser } = useAuth();
  const { reports, updateStatus, deleteReport } = useReports();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  if (currentUser?.id !== "u1") {
    return (
      <div className="admin admin--forbidden">
        <span>🚫</span>
        <h2>Acceso denegado</h2>
        <p>Solo el administrador puede acceder a este panel.</p>
        <button onClick={() => navigate("/")}>← Volver al inicio</button>
      </div>
    );
  }

  const totalVotes = reports.reduce((a, r) => a + r.votes.length, 0);
  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s.id] = reports.filter((r) => r.status === s.id).length;
    return acc;
  }, {});

  const filtered = reports.filter((r) => {
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleStatusChange(reportId, status) {
    updateStatus(reportId, status);
    addToast("Estado actualizado", "success");
  }

  function handleDelete(reportId, title) {
    if (window.confirm(`¿Eliminar "${title}"?`)) {
      deleteReport(reportId);
      addToast("Reporte eliminado", "info");
    }
  }

  return (
    <div className="admin">
      <div className="admin__container">

        <div className="admin__header">
          <div>
            <h1 className="admin__title">Panel de administración</h1>
            <p className="admin__subtitle">Gestioná todos los reportes de la plataforma.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin__stats">
          <div className="admin__stat">
            <span className="admin__stat-value">{reports.length}</span>
            <span className="admin__stat-label">Total reportes</span>
          </div>
          <div className="admin__stat">
            <span className="admin__stat-value">{totalVotes}</span>
            <span className="admin__stat-label">Total votos</span>
          </div>
          {STATUSES.map((s) => (
            <div key={s.id} className="admin__stat">
              <span className="admin__stat-value" style={{ color: s.color }}>{statusCounts[s.id] ?? 0}</span>
              <span className="admin__stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="admin__filters">
          <input
            className="admin__search"
            type="text"
            placeholder="🔍 Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="admin__select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <select className="admin__select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Reporte</th>
                <th>Categoría</th>
                <th>Autor</th>
                <th>Votos</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin__empty-row">No hay reportes que coincidan.</td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const cat = CATEGORIES.find((c) => c.id === r.category);
                  const statusInfo = STATUSES.find((s) => s.id === r.status);
                  return (
                    <tr key={r.id}>
                      <td>
                        <a
                          className="admin__report-link"
                          href={`/reporte/${r.id}`}
                          onClick={(e) => { e.preventDefault(); navigate(`/reporte/${r.id}`); }}
                        >
                          {r.title}
                        </a>
                      </td>
                      <td>
                        <span className="admin__category">
                          {cat?.icon} {cat?.label}
                        </span>
                      </td>
                      <td className="admin__author">{r.authorName}</td>
                      <td className="admin__votes">👍 {r.votes.length}</td>
                      <td className="admin__date">{formatDate(r.createdAt)}</td>
                      <td>
                        <select
                          className="admin__status-select"
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          style={{ color: statusInfo?.color, borderColor: statusInfo?.color }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="admin__delete-btn"
                          onClick={() => handleDelete(r.id, r.title)}
                          title="Eliminar reporte"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
