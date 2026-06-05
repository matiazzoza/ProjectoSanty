import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import { getMiPerfilEmpleado, getPerfilEmpleadoCompleto } from "../../models/asignacionModel";
import { CATEGORIES } from "../../data/mockReports";
import { ESPECIALIDADES } from "../../data/especialidades";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import CambiarContrasena from "../../components/CambiarContrasena/CambiarContrasena";
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalPwd, setModalPwd] = useState(false);

  useEffect(() => {
    const fetch = id ? getPerfilEmpleadoCompleto(id) : getMiPerfilEmpleado();
    fetch
      .then(setPerfil)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="perfil-emp__loading">Cargando perfil...</div>;
  if (!perfil) return <div className="perfil-emp__loading">Error al cargar el perfil.</div>;

  const { emp, resueltos, enCurso = [], historial = [], stats } = perfil;

  return (
    <div className="perfil-emp">
      <div className="perfil-emp__container">

        {/* Card principal */}
        <div className="perfil-emp__card">
          <UserAvatar avatar={emp.avatar} size="xl" />
          <div className="perfil-emp__info">
            <div className="perfil-emp__name-row">
              <h1 className="perfil-emp__name">{emp.name}</h1>
              {!id && (
                <button className="perfil-emp__pwd-btn" onClick={() => setModalPwd(true)} title="Cambiar contraseña">🔒</button>
              )}
            </div>
            <p className="perfil-emp__username">@{emp.username}</p>
            <span className="perfil-emp__rol">Empleado municipal</span>
            {emp.especialidades?.length > 0 && (
              <div className="perfil-emp__esp-badges">
                {emp.especialidades.map((id) => {
                  const esp = ESPECIALIDADES.find((x) => x.id === id);
                  return esp ? <span key={id} className="perfil-emp__esp-badge">{esp.icon} {esp.label}</span> : null;
                })}
              </div>
            )}
          </div>

          <div className="perfil-emp__stats">
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">{stats.resueltosComoLider}</span>
              <span className="perfil-emp__stat-label">👑 Como líder</span>
            </div>
            <div className="perfil-emp__stat-divider" />
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">{stats.participacionesComoMiembro}</span>
              <span className="perfil-emp__stat-label">👤 Como miembro</span>
            </div>
            <div className="perfil-emp__stat-divider" />
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">{stats.tasaResolucion}%</span>
              <span className="perfil-emp__stat-label">Tasa resolución</span>
            </div>
            <div className="perfil-emp__stat-divider" />
            <div className="perfil-emp__stat">
              <span className="perfil-emp__stat-value">
                {stats.promedioResolucion !== null ? `${stats.promedioResolucion}d` : "—"}
              </span>
              <span className="perfil-emp__stat-label">Promedio</span>
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

        {/* Reportes en curso — solo vista admin */}
        {id && (
          <div className="perfil-emp__section">
            <h2 className="perfil-emp__section-title">🔧 Reportes en curso ({enCurso.length})</h2>
            {enCurso.length === 0 ? (
              <div className="perfil-emp__empty"><p>No tiene reportes activos asignados.</p></div>
            ) : (
              <div className="perfil-emp__list">
                {enCurso.map((r) => {
                  const cat = CATEGORIES.find((c) => c.id === r.category);
                  return (
                    <div key={r.id} className="perfil-emp__activo">
                      <div className="perfil-emp__activo-left">
                        <div className="perfil-emp__activo-top">
                          {cat && <span className="perfil-emp__item-cat">{cat.icon} {cat.label}</span>}
                          <span className="perfil-emp__activo-rol">
                            {r.esLider ? "👑 Líder" : "👤 Miembro"}
                          </span>
                        </div>
                        <h3 className="perfil-emp__item-title">{r.title}</h3>
                        {r.barrioNombre && <p className="perfil-emp__item-barrio">📍 {r.barrioNombre}</p>}
                        {r.ultimoAvance && (
                          <p className="perfil-emp__activo-avance">
                            {r.ultimoPorcentaje !== null && (
                              <span className="perfil-emp__activo-pct">{r.ultimoPorcentaje}%</span>
                            )}
                            {r.ultimoAvance}
                          </p>
                        )}
                      </div>
                      <div className="perfil-emp__item-right">
                        <span className="perfil-emp__item-dias">{r.diasTranscurridos}d</span>
                        <Link to={`/reporte/${r.id}`} className="perfil-emp__item-ver">Ver →</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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

        {/* Historial — reportes donde participó pero volvieron a pendiente */}
        {id && historial.length > 0 && (
          <div className="perfil-emp__section">
            <h2 className="perfil-emp__section-title">📂 Historial ({historial.length})</h2>
            <div className="perfil-emp__list">
              {historial.map((r) => {
                const cat = CATEGORIES.find((c) => c.id === r.category);
                return (
                  <div key={r.id + r.asignadoEn} className="perfil-emp__item perfil-emp__item--historial">
                    <div className="perfil-emp__item-header">
                      <div className="perfil-emp__item-left">
                        {cat && <span className="perfil-emp__item-cat">{cat.icon} {cat.label}</span>}
                        <h3 className="perfil-emp__item-title">{r.title}</h3>
                        {r.barrioNombre && <span className="perfil-emp__item-meta">📍 {r.barrioNombre}</span>}
                      </div>
                      <div className="perfil-emp__item-right">
                        <span className="perfil-emp__historial-rol">
                          {r.esLider ? "👑 Líder" : "👤 Miembro"}
                        </span>
                        <span className="perfil-emp__historial-badge">⚠️ Volvió a pendiente</span>
                        <Link to={`/reporte/${r.id}`} className="perfil-emp__item-ver">Ver →</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {modalPwd && (
          <div className="perfil-emp__modal-bg" onClick={(e) => e.target === e.currentTarget && setModalPwd(false)}>
            <div className="perfil-emp__modal-pwd">
              <CambiarContrasena onClose={() => setModalPwd(false)} />
              <button className="perfil-emp__modal-pwd-cerrar" onClick={() => setModalPwd(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="perfil-emp__back">
          {id
            ? <button className="perfil-emp__back-link" onClick={() => navigate(-1)}>← Volver</button>
            : <Link to="/panel-empleado" className="perfil-emp__back-link">← Volver al panel</Link>
          }
        </div>

      </div>
    </div>
  );
}
