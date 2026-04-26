import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import { getMiPerfilEmpleado } from "../../models/asignacionModel";
import { CATEGORIES } from "../../data/mockReports";
import "./PerfilEmpleado.scss";

function ReporteResuelto({ r }) {
  const [abierto, setAbierto] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === r.category);
  const tieneDetalle = r.avances.length > 0 || r.novedades.length > 0;

  return (
    <div className="perfil-emp__item">
      {/* Cabecera siempre visible */}
      <div className="perfil-emp__item-header" onClick={() => tieneDetalle && setAbierto((v) => !v)}>
        <div className="perfil-emp__item-left">
          {cat && <span className="perfil-emp__item-cat">{cat.icon} {cat.label}</span>}
          <h3 className="perfil-emp__item-title">{r.title}</h3>
          {r.barrioNombre && <p className="perfil-emp__item-barrio">📍 {r.barrioNombre}</p>}
          {tieneDetalle && (
            <span className="perfil-emp__item-hint">
              {r.avances.length > 0 && `${r.avances.length} avance${r.avances.length > 1 ? "s" : ""}`}
              {r.avances.length > 0 && r.novedades.length > 0 && " · "}
              {r.novedades.length > 0 && `${r.novedades.length} novedad${r.novedades.length > 1 ? "es" : ""}`}
            </span>
          )}
        </div>
        <div className="perfil-emp__item-right">
          <span className="perfil-emp__item-dias">
            {r.diasResolucion !== null ? `${r.diasResolucion} días` : "—"}
          </span>
          <span className="perfil-emp__item-fecha">
            {new Date(r.resueltaEn).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <Link
            to={`/reporte/${r.id}`}
            className="perfil-emp__item-ver"
            onClick={(e) => e.stopPropagation()}
          >
            Ver →
          </Link>
          {tieneDetalle && (
            <span className="perfil-emp__item-chevron">{abierto ? "▲" : "▼"}</span>
          )}
        </div>
      </div>

      {/* Detalle expandible */}
      {abierto && (
        <div className="perfil-emp__item-detalle">
          {r.avances.length > 0 && (
            <div className="perfil-emp__detalle-seccion">
              <h4 className="perfil-emp__detalle-titulo">📊 Avances</h4>
              {r.avances.map((av, i) => (
                <div key={i} className="perfil-emp__detalle-avance">
                  <div className="perfil-emp__detalle-avance-top">
                    <p className="perfil-emp__detalle-desc">{av.descripcion}</p>
                    {av.porcentaje !== null && (
                      <span className="perfil-emp__detalle-pct">{av.porcentaje}%</span>
                    )}
                  </div>
                  {av.porcentaje !== null && (
                    <div className="perfil-emp__detalle-barra-wrap">
                      <div className="perfil-emp__detalle-barra" style={{ width: `${av.porcentaje}%` }} />
                    </div>
                  )}
                  <span className="perfil-emp__detalle-fecha">
                    {new Date(av.creadoEn).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {r.novedades.length > 0 && (
            <div className="perfil-emp__detalle-seccion">
              <h4 className="perfil-emp__detalle-titulo">⚠️ Novedades</h4>
              {r.novedades.map((n, i) => (
                <div key={i} className={`perfil-emp__detalle-novedad perfil-emp__detalle-novedad--${n.tipo}`}>
                  <div className="perfil-emp__detalle-novedad-header">
                    <span className="perfil-emp__detalle-novedad-tipo">
                      {n.tipo === "bloqueante" ? "🚨 Bloqueante" : "📝 Informativa"}
                    </span>
                    <span className="perfil-emp__detalle-fecha">
                      {new Date(n.creadoEn).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="perfil-emp__detalle-desc">{n.descripcion}</p>
                  {n.respuestaAdmin ? (
                    <div className="perfil-emp__detalle-respuesta">
                      <span className="perfil-emp__detalle-respuesta-label">✅ Respuesta del admin:</span>
                      <p className="perfil-emp__detalle-desc">{n.respuestaAdmin}</p>
                    </div>
                  ) : (
                    <p className="perfil-emp__detalle-sin-respuesta">Sin respuesta del admin</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PerfilEmpleado() {
  const { currentUser } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMiPerfilEmpleado()
      .then(setPerfil)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="perfil-emp__loading">Cargando perfil...</div>;
  if (!perfil) return <div className="perfil-emp__loading">Error al cargar el perfil.</div>;

  const { emp, resueltos, stats } = perfil;

  return (
    <div className="perfil-emp">
      <div className="perfil-emp__container">

        {/* Card principal */}
        <div className="perfil-emp__card">
          <div className="perfil-emp__avatar">
            {currentUser.photo
              ? <img src={currentUser.photo} alt="perfil" />
              : <span className="perfil-emp__avatar-initials">{emp.avatar}</span>
            }
          </div>
          <div className="perfil-emp__info">
            <h1 className="perfil-emp__name">{emp.name}</h1>
            <p className="perfil-emp__username">@{emp.username}</p>
            <span className="perfil-emp__rol">Empleado municipal</span>
          </div>

          <div className="perfil-emp__stats">
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">{stats.totalResueltos}</span>
              <span className="perfil-emp__stat-label">Resueltos</span>
            </div>
            <div className="perfil-emp__stat-divider" />
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">{stats.tasaResolucion}%</span>
              <span className="perfil-emp__stat-label">Tasa de resolución</span>
            </div>
            <div className="perfil-emp__stat-divider" />
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">
                {stats.promedioResolucion !== null ? `${stats.promedioResolucion}d` : "—"}
              </span>
              <span className="perfil-emp__stat-label">Promedio resolución</span>
            </div>
            <div className="perfil-emp__stat-divider" />
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">{stats.totalNovedades}</span>
              <span className="perfil-emp__stat-label">Novedades</span>
            </div>
            <div className="perfil-emp__stat-divider" />
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">{stats.totalAvances}</span>
              <span className="perfil-emp__stat-label">Avances</span>
            </div>
          </div>
        </div>

        {/* Historial de resueltos */}
        <div className="perfil-emp__section">
          <h2 className="perfil-emp__section-title">✅ Historial de reportes resueltos</h2>
          {resueltos.length === 0 ? (
            <div className="perfil-emp__empty">
              <p>Todavía no resolviste ningún reporte.</p>
            </div>
          ) : (
            <div className="perfil-emp__list">
              {resueltos.map((r) => <ReporteResuelto key={r.id} r={r} />)}
            </div>
          )}
        </div>

        <div className="perfil-emp__back">
          <Link to="/panel-empleado" className="perfil-emp__back-link">← Volver al panel</Link>
        </div>

      </div>
    </div>
  );
}
