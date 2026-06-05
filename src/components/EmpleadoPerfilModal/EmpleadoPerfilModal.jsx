import { Link } from "react-router-dom";
import "./EmpleadoPerfilModal.scss";

export default function EmpleadoPerfilModal({ perfil, loading, onClose }) {
  if (!perfil && !loading) return null;

  return (
    <div className="emp-modal-backdrop" onClick={onClose}>
      <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emp-modal__header">
          <h3 className="emp-modal__title">
            {perfil ? `Perfil — ${perfil.emp.name}` : "Cargando..."}
          </h3>
          <div className="emp-modal__header-actions">
            {perfil && (
              <Link to={`/perfil-empleado/${perfil.emp.id}`} className="emp-modal__ver-completo" onClick={onClose}>
                Ver perfil completo →
              </Link>
            )}
            <button className="emp-modal__close" onClick={onClose}>✕</button>
          </div>
        </div>

        {loading && <p className="emp-modal__empty">Cargando perfil...</p>}

        {perfil && (
          <div className="emp-modal__body">

            {/* Stats resumen */}
            <div className="emp-modal__stats">
              <div className="emp-modal__stat">
                <span className="emp-modal__stat-val emp-modal__stat-val--green">{perfil.stats.resueltos}</span>
                <span className="emp-modal__stat-label">Resueltos</span>
              </div>
              <div className="emp-modal__stat">
                <span className="emp-modal__stat-val emp-modal__stat-val--blue">{perfil.stats.enCurso}</span>
                <span className="emp-modal__stat-label">En curso</span>
              </div>
              <div className="emp-modal__stat">
                <span className="emp-modal__stat-val emp-modal__stat-val--orange">{perfil.stats.totalNovedades}</span>
                <span className="emp-modal__stat-label">Novedades</span>
              </div>
            </div>

            {/* Reportes asignados */}
            <h4 className="emp-modal__section">Reportes asignados</h4>
            {perfil.reportes.length === 0 ? (
              <p className="emp-modal__empty">Sin reportes asignados.</p>
            ) : (
              <div className="emp-modal__reportes">
                {perfil.reportes.map((r) => (
                  <Link key={r.id} to={`/reporte/${r.id}`} className="emp-modal__reporte" onClick={onClose}>
                    <div className="emp-modal__reporte-info">
                      <span className="emp-modal__reporte-title">{r.title}</span>
                      <span className="emp-modal__reporte-meta">
                        {r.barrioNombre ?? "Sin barrio"} · {r.totalAvances} avance{r.totalAvances !== 1 ? "s" : ""}
                      </span>
                      {r.ultimoAvance && (
                        <span className="emp-modal__reporte-avance">"{r.ultimoAvance}"</span>
                      )}
                    </div>
                    <div className="emp-modal__reporte-right">
                      {r.ultimoPorcentaje !== null && (
                        <div className="emp-modal__progress">
                          <div className="emp-modal__progress-bar" style={{ width: `${r.ultimoPorcentaje}%` }} />
                          <span className="emp-modal__progress-label">{r.ultimoPorcentaje}%</span>
                        </div>
                      )}
                      <span className={`emp-modal__estado emp-modal__estado--${r.status}`}>
                        {r.estadoInterno?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Novedades recientes */}
            {perfil.novedades.length > 0 && (
              <>
                <h4 className="emp-modal__section">Novedades recientes</h4>
                <div className="emp-modal__novedades">
                  {perfil.novedades.map((n) => (
                    <Link key={n.id} to={`/reporte/${n.reporteId}`} className={`emp-modal__novedad emp-modal__novedad--${n.tipo}`} onClick={onClose}>
                      <span className="emp-modal__novedad-tipo">
                        {n.tipo === "bloqueante" ? "🔴 Bloqueante" : "🟡 Informativa"}
                      </span>
                      <span className="emp-modal__novedad-text">{n.descripcion}</span>
                      <span className="emp-modal__novedad-rep">— {n.reporteTitulo}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
