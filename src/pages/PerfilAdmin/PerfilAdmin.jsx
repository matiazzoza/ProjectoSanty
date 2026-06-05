import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getPerfilAdmin, getMiPerfilAdmin } from "../../models/usuarioModel";
import { CATEGORIES } from "../../data/mockReports";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import CambiarContrasena from "../../components/CambiarContrasena/CambiarContrasena";
import "./PerfilAdmin.scss";

const ROL_LABEL = { admin: "Administrador", superadmin: "Super Admin" };

const ESTADO_LABEL = {
  pendiente:  "Pendiente",
  en_proceso: "En proceso",
  resuelto:   "Resuelto",
  duplicado:  "Duplicado",
};

function fmtFecha(iso) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PerfilAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState(null);
  const [modalPwd, setModalPwd] = useState(false);

  useEffect(() => {
    const fetch = id ? getPerfilAdmin(id) : getMiPerfilAdmin();
    fetch
      .then(setPerfil)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="perfil-admin__loading">Cargando perfil...</div>;
  if (!perfil)  return <div className="perfil-admin__loading">Error al cargar el perfil.</div>;

  const { admin, stats, actividadReciente, listaAtendidos, listaReasignaciones, listaNovedades } = perfil;

  function toggleMetric(key) {
    setActiveMetric((prev) => (prev === key ? null : key));
  }

  return (
    <div className="perfil-admin">
      <div className="perfil-admin__container">

        {/* Card principal */}
        <div className="perfil-admin__card">
          <UserAvatar avatar={admin.avatar} size="xl" />
          <div className="perfil-admin__info">
            <div className="perfil-admin__name-row">
              <h1 className="perfil-admin__name">{admin.name}</h1>
              {!id && (
                <button className="perfil-admin__pwd-btn" onClick={() => setModalPwd(true)} title="Cambiar contraseña">🔒</button>
              )}
            </div>
            <p className="perfil-admin__username">@{admin.username}</p>
            <span className="perfil-admin__rol">{ROL_LABEL[admin.rol] ?? admin.rol}</span>
          </div>

          <div className="perfil-admin__stats">

            <button
              className={`perfil-admin__stat perfil-admin__stat--btn ${activeMetric === "atendidos" ? "perfil-admin__stat--active" : ""}`}
              onClick={() => toggleMetric("atendidos")}
            >
              <span className="perfil-admin__stat-value">{stats.reportesAtendidos}</span>
              <span className="perfil-admin__stat-label">📋 Reportes atendidos</span>
              <span className="perfil-admin__stat-hint">ver detalle {activeMetric === "atendidos" ? "▲" : "▼"}</span>
            </button>

            <div className="perfil-admin__stat-divider" />

            <button
              className={`perfil-admin__stat perfil-admin__stat--btn ${activeMetric === "reasignaciones" ? "perfil-admin__stat--active" : ""}`}
              onClick={() => toggleMetric("reasignaciones")}
            >
              <span className="perfil-admin__stat-value">{stats.reasignaciones}</span>
              <span className="perfil-admin__stat-label">🔁 Reasignaciones</span>
              <span className="perfil-admin__stat-hint">ver detalle {activeMetric === "reasignaciones" ? "▲" : "▼"}</span>
            </button>

            <div className="perfil-admin__stat-divider" />

            <button
              className={`perfil-admin__stat perfil-admin__stat--btn ${activeMetric === "novedades" ? "perfil-admin__stat--active" : ""}`}
              onClick={() => toggleMetric("novedades")}
            >
              <span className="perfil-admin__stat-value">{stats.novedadesRespondidas}</span>
              <span className="perfil-admin__stat-label">💬 Novedades respondidas</span>
              <span className="perfil-admin__stat-hint">ver detalle {activeMetric === "novedades" ? "▲" : "▼"}</span>
            </button>

            <div className="perfil-admin__stat-divider" />

            <div className="perfil-admin__stat">
              <span className="perfil-admin__stat-value">
                {stats.promedioRespuesta !== null ? `${stats.promedioRespuesta}d` : "—"}
              </span>
              <span className="perfil-admin__stat-label">⏱ Promedio respuesta</span>
            </div>

          </div>

          {/* Detalle expandible de métricas */}
          {activeMetric === "atendidos" && (
            <div className="perfil-admin__detalle">
              <h3 className="perfil-admin__detalle-titulo">📋 Reportes atendidos</h3>
              {listaAtendidos.length === 0
                ? <p className="perfil-admin__detalle-vacio">Sin registros.</p>
                : listaAtendidos.map((r) => {
                    const cat = CATEGORIES.find((c) => c.id === r.category);
                    return (
                      <div key={r.id} className="perfil-admin__detalle-item">
                        <div className="perfil-admin__detalle-item-left">
                          {cat && <span className="perfil-admin__item-cat">{cat.icon} {cat.label}</span>}
                          <span className="perfil-admin__detalle-item-title">{r.title}</span>
                          {r.barrioNombre && <span className="perfil-admin__detalle-item-meta">📍 {r.barrioNombre}</span>}
                        </div>
                        <div className="perfil-admin__detalle-item-right">
                          {r.status === "pendiente"
                            ? <span className="perfil-admin__estado perfil-admin__estado--volvio">⚠️ Volvió a pendiente</span>
                            : <span className="perfil-admin__estado perfil-admin__estado--nuevo">{ESTADO_LABEL[r.status] ?? r.status}</span>
                          }
                          <span className="perfil-admin__detalle-item-meta">{fmtFecha(r.fechaAsignacion)}</span>
                          <Link to={`/reporte/${r.id}`} className="perfil-admin__item-ver">Ver →</Link>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {activeMetric === "reasignaciones" && (
            <div className="perfil-admin__detalle">
              <h3 className="perfil-admin__detalle-titulo">🔁 Reportes reasignados</h3>
              {listaReasignaciones.length === 0
                ? <p className="perfil-admin__detalle-vacio">Ningún reporte fue reasignado.</p>
                : listaReasignaciones.map((r) => {
                    const cat = CATEGORIES.find((c) => c.id === r.category);
                    return (
                      <div key={r.id} className="perfil-admin__detalle-item">
                        <div className="perfil-admin__detalle-item-left">
                          {cat && <span className="perfil-admin__item-cat">{cat.icon} {cat.label}</span>}
                          <span className="perfil-admin__detalle-item-title">{r.title}</span>
                          {r.barrioNombre && <span className="perfil-admin__detalle-item-meta">📍 {r.barrioNombre}</span>}
                        </div>
                        <div className="perfil-admin__detalle-item-right">
                          <span className="perfil-admin__reasig-badge">{r.vecesAsignado}x asignado</span>
                          <Link to={`/reporte/${r.id}`} className="perfil-admin__item-ver">Ver →</Link>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {activeMetric === "novedades" && (
            <div className="perfil-admin__detalle">
              <h3 className="perfil-admin__detalle-titulo">💬 Novedades respondidas</h3>
              {listaNovedades.length === 0
                ? <p className="perfil-admin__detalle-vacio">Sin novedades respondidas.</p>
                : listaNovedades.map((n) => (
                    <div key={n.id} className="perfil-admin__detalle-novedad">
                      <div className="perfil-admin__detalle-novedad-header">
                        <span className={`perfil-admin__novedad-tipo perfil-admin__novedad-tipo--${n.tipo}`}>
                          {n.tipo === "bloqueante" ? "🚨 Bloqueante" : "📝 Informativa"}
                        </span>
                        <span className="perfil-admin__detalle-item-meta">
                          {n.diasRespuesta !== null ? `Respondida en ${n.diasRespuesta}d` : "—"}
                        </span>
                        <Link to={`/reporte/${n.reporteId}`} className="perfil-admin__item-ver">Ver →</Link>
                      </div>
                      <p className="perfil-admin__detalle-novedad-reporte">{n.reporteTitulo}</p>
                      <p className="perfil-admin__detalle-novedad-desc">"{n.descripcion}"</p>
                      <p className="perfil-admin__detalle-novedad-resp">↩ {n.respuesta}</p>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="perfil-admin__section">
          <h2 className="perfil-admin__section-title">🕒 Actividad reciente</h2>
          {actividadReciente.length === 0 ? (
            <div className="perfil-admin__empty"><p>Sin actividad registrada.</p></div>
          ) : (
            <div className="perfil-admin__list">
              {actividadReciente.map((h) => {
                const cat = CATEGORIES.find((c) => c.id === h.reporteCategoria);
                return (
                  <div key={h.id} className="perfil-admin__item">
                    <div className="perfil-admin__item-left">
                      {cat && <span className="perfil-admin__item-cat">{cat.icon} {cat.label}</span>}
                      <h3 className="perfil-admin__item-title">{h.reporteTitulo}</h3>
                      <p className="perfil-admin__item-cambio">
                        <span className="perfil-admin__estado perfil-admin__estado--anterior">{ESTADO_LABEL[h.estado_anterior] ?? h.estado_anterior}</span>
                        <span className="perfil-admin__flecha">→</span>
                        <span className="perfil-admin__estado perfil-admin__estado--nuevo">{ESTADO_LABEL[h.estado_nuevo] ?? h.estado_nuevo}</span>
                      </p>
                    </div>
                    <div className="perfil-admin__item-right">
                      <span className="perfil-admin__item-fecha">{fmtFecha(h.cambiado_en)}</span>
                      <Link to={`/reporte/${h.reporteId}`} className="perfil-admin__item-ver">Ver →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {modalPwd && (
          <div className="perfil-admin__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalPwd(false)}>
            <div className="perfil-admin__modal-pwd">
              <CambiarContrasena onClose={() => setModalPwd(false)} />
              <button className="perfil-admin__modal-pwd-cerrar" onClick={() => setModalPwd(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {id && (
          <div className="perfil-admin__back">
            <button className="perfil-admin__back-link" onClick={() => navigate(-1)}>← Volver</button>
          </div>
        )}

      </div>
    </div>
  );
}
