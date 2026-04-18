import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../controllers/AuthController";
import { useReports } from "../../controllers/ReportsController";
import { useToast } from "../../controllers/ToastController";
import { CATEGORIES, STATUSES } from "../../data/mockReports";
import MapPicker from "../../components/MapPicker/MapPicker";
import { toggle as toggleSeguir, getByUsuario as getSeguidos } from "../../models/seguimientoModel";
import { getHistorial } from "../../models/reporteModel";
import { getEmpleados, asignar, getAsignacionesReporte, validarCierre, rechazarCierre } from "../../models/asignacionModel";
import { getNovedades, responderNovedad } from "../../models/novedadModel";
import { getPrioridad } from "../../utils/prioridad";
import "./ReportDetail.scss";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getReport, toggleVote, deleteReport, updateStatus, addComment, deleteComment, updateReport } = useReports();

  const { addToast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [siguiendo, setSiguiendo] = useState(false);
  const [loadingSeguir, setLoadingSeguir] = useState(false);
  const [historial, setHistorial] = useState([]);

  // Asignaciones (admin)
  const [empleados, setEmpleados] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");
  const [loadingAsignar, setLoadingAsignar] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // Novedades
  const [novedades, setNovedades] = useState([]);
  const [respuestas, setRespuestas] = useState({});

  const report = getReport(id);

  useEffect(() => {
    if (!currentUser || !report) return;
    getSeguidos(currentUser.id)
      .then((ids) => setSiguiendo(ids.includes(report.id)))
      .catch(() => {});
    getHistorial(report.id)
      .then(setHistorial)
      .catch(() => {});

    if (currentUser?.role === "admin") {
      getEmpleados().then(setEmpleados).catch(() => {});
      getAsignacionesReporte(report.id).then(setAsignaciones).catch(() => {});
      getNovedades(report.id).then(setNovedades).catch(() => {});
    }
  }, [currentUser?.id, report?.id]);

  if (!report) {
    return (
      <div className="report-detail report-detail--not-found">
        <p>Reporte no encontrado.</p>
        <button onClick={() => navigate("/")}>← Volver al inicio</button>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === report.category);
  const statusInfo = STATUSES.find((s) => s.id === report.status) ?? STATUSES[0];
  const prioridad = getPrioridad(report.votes);
  const hasVoted = currentUser ? report.votes.includes(currentUser.id) : false;
  const isOwner = currentUser?.id === report.authorId;
  const isAdmin = currentUser?.role === "admin";
  const canChangeStatus = isAdmin;
  const canVote = currentUser && report.status === "pendiente";

  function handleVote() {
    if (!canVote) return;
    toggleVote(report.id, currentUser.id);
    addToast(hasVoted ? "Voto eliminado" : "¡Reporte apoyado!", hasVoted ? "info" : "success");
  }

  function handleDelete() {
    if (window.confirm("¿Eliminar este reporte?")) {
      deleteReport(report.id);
      addToast("Reporte eliminado", "info");
      navigate("/");
    }
  }

  function handleStatusChange(e) {
    updateStatus(report.id, e.target.value);
    addToast("Estado actualizado", "success");
  }

  function handleMarkDuplicate() {
    if (window.confirm("¿Marcar este reporte como duplicado?")) {
      updateStatus(report.id, "duplicado");
      addToast("Reporte marcado como duplicado", "warning");
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      addToast("¡Enlace copiado al portapapeles!", "success");
    });
  }

  function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(report.id, {
      id: `c${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    });
    setCommentText("");
    addToast("Comentario publicado", "success");
  }

  function handleDeleteComment(commentId) {
    deleteComment(report.id, commentId);
  }

  async function handleAsignar() {
    if (!empleadoSeleccionado) return;
    setLoadingAsignar(true);
    try {
      await asignar(report.id, empleadoSeleccionado);
      const nuevas = await getAsignacionesReporte(report.id);
      setAsignaciones(nuevas);
      addToast("Empleado asignado correctamente", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingAsignar(false);
    }
  }

  async function handleValidarCierre() {
    try {
      await validarCierre(report.id);
      addToast("Reporte validado como resuelto", "success");
      updateStatus(report.id, "resuelto");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleResponderNovedad(novedadId) {
    const respuesta = respuestas[novedadId];
    if (!respuesta?.trim()) return;
    try {
      await responderNovedad(novedadId, respuesta.trim());
      setNovedades((prev) =>
        prev.map((n) => n.id === novedadId ? { ...n, respuesta_admin: respuesta.trim() } : n)
      );
      setRespuestas((prev) => ({ ...prev, [novedadId]: "" }));
      addToast("Respuesta enviada. El empleado fue notificado.", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleRechazarCierre() {
    try {
      await rechazarCierre(report.id, motivoRechazo);
      addToast("Cierre rechazado. Se notificó al empleado.", "warning");
      setMotivoRechazo("");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleToggleSeguir() {
    if (!currentUser || loadingSeguir) return;
    setLoadingSeguir(true);
    try {
      const res = await toggleSeguir(report.id, currentUser.id);
      setSiguiendo(res.siguiendo);
      addToast(res.siguiendo ? "Ahora seguís este reporte" : "Dejaste de seguir este reporte", res.siguiendo ? "success" : "info");
    } catch {
      addToast("Error al actualizar seguimiento", "error");
    } finally {
      setLoadingSeguir(false);
    }
  }

  return (
    <div className="report-detail">
      <div className="report-detail__container">
        <button className="report-detail__back" onClick={() => navigate(-1)}>
          ← Volver
        </button>

        {report.photo && (
          <div className="report-detail__photo">
            <img src={report.photo} alt={report.title} />
          </div>
        )}

        <div className="report-detail__card">
          {/* Meta: categoría + estado */}
          <div className="report-detail__meta">
            {category && (
              <span className="report-detail__category">
                {category.icon} {category.label}
              </span>
            )}
            <span
              className="report-detail__status-badge"
              style={{ color: statusInfo.color, borderColor: statusInfo.color, background: `${statusInfo.color}14` }}
            >
              {statusInfo.label}
            </span>
          </div>

          {prioridad.label && (
            <span className="report-detail__prioridad-badge" style={{ color: prioridad.color, background: prioridad.bg, borderColor: prioridad.border }}>
              🔥 Prioridad {prioridad.label}
            </span>
          )}

          <div className="report-detail__top-row">
            <h1 className="report-detail__title">{report.title}</h1>
            {isOwner && (
              <Link to={`/editar/${report.id}`} className="report-detail__edit-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </Link>
            )}
          </div>

          <div className="report-detail__author">
            <div className="report-detail__author-avatar">
              {report.authorName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="report-detail__author-name">{report.authorName}</span>
              <span className="report-detail__author-label">{formatDate(report.createdAt)}</span>
            </div>
          </div>

          <p className="report-detail__description">{report.description}</p>

          {/* Ubicación */}
          {report.location && (
            <div className="report-detail__location-block">
              <h3 className="report-detail__section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Ubicación
              </h3>
              {report.location.address && (
                <p className="report-detail__address">{report.location.address}</p>
              )}
              <MapPicker value={report.location} readOnly height="280px" />
            </div>
          )}

          {/* Acciones: votar + estado + duplicado + eliminar */}
          <div className="report-detail__footer">
            <button className="report-detail__share-btn" onClick={handleShare}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Compartir
            </button>

            {currentUser && !isOwner && !isAdmin && (
              <button
                className={`report-detail__seguir-btn ${siguiendo ? "report-detail__seguir-btn--active" : ""}`}
                onClick={handleToggleSeguir}
                disabled={loadingSeguir}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={siguiendo ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {siguiendo ? "Siguiendo" : "Seguir"}
              </button>
            )}
            <div className="report-detail__vote-block">
              <button
                className={`report-detail__vote-btn ${hasVoted ? "report-detail__vote-btn--active" : ""}`}
                onClick={handleVote}
                disabled={!canVote}
                title={report.status !== "pendiente" ? "Solo se puede votar reportes pendientes" : ""}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                <span>{report.votes.length} {report.votes.length === 1 ? "apoyo" : "apoyos"}</span>
              </button>
              {!currentUser && <span className="report-detail__vote-hint">Iniciá sesión para votar</span>}
              {currentUser && report.status !== "pendiente" && (
                <span className="report-detail__vote-hint">Solo se vota en reportes pendientes</span>
              )}
            </div>

            <div className="report-detail__manage">
              {canChangeStatus && (
                <select
                  className="report-detail__status-select"
                  value={report.status}
                  onChange={handleStatusChange}
                  style={{ borderColor: statusInfo.color, color: statusInfo.color }}
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              )}

              {!isOwner && currentUser && report.status !== "duplicado" && (
                <button className="report-detail__duplicate-btn" onClick={handleMarkDuplicate}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Duplicado
                </button>
              )}

              {isOwner && (
                <button className="report-detail__delete-btn" onClick={handleDelete}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Historial de estados */}
        {historial.length > 0 && (
          <div className="report-detail__historial">
            <h2 className="report-detail__comments-title">Historial de estados</h2>
            <div className="report-detail__historial-list">
              {historial.map((h, i) => {
                const estadoInfo = STATUSES.find((s) => s.id === h.estado_nuevo);
                return (
                  <div key={h.id} className="historial-item">
                    <div className="historial-item__line">
                      {i < historial.length - 1 && <span className="historial-item__connector" />}
                    </div>
                    <div className="historial-item__dot" style={{ background: estadoInfo?.color ?? "#94a3b8" }} />
                    <div className="historial-item__content">
                      <span className="historial-item__estado" style={{ color: estadoInfo?.color ?? "#94a3b8" }}>
                        {estadoInfo?.label ?? h.estado_nuevo}
                      </span>
                      {h.estado_anterior && (
                        <span className="historial-item__anterior">
                          desde {STATUSES.find((s) => s.id === h.estado_anterior)?.label ?? h.estado_anterior}
                        </span>
                      )}
                      <span className="historial-item__meta">
                        por {h.cambiadoPorNombre} · {formatDateShort(h.cambiado_en)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fotos de campo y resolución */}
        {(report.fotoCampo || report.fotoResolucion) && (
          <div className="report-detail__fotos">
            {report.fotoCampo && (
              <div className="report-detail__foto-bloque">
                <h3 className="report-detail__foto-label">📸 Estado antes de la intervención</h3>
                <img src={report.fotoCampo} alt="Estado campo" className="report-detail__foto-img" />
              </div>
            )}
            {report.fotoResolucion && (
              <div className="report-detail__foto-bloque">
                <h3 className="report-detail__foto-label">✅ Cómo quedó resuelto</h3>
                <img src={report.fotoResolucion} alt="Resolución" className="report-detail__foto-img" />
              </div>
            )}
          </div>
        )}

        {/* Novedades (solo admin) */}
        {isAdmin && novedades.length > 0 && (
          <div className="report-detail__novedades">
            <h2 className="report-detail__comments-title">
              Novedades del empleado
              <span className="report-detail__comments-count">{novedades.length}</span>
            </h2>
            <div className="novedades-list">
              {novedades.map((n) => (
                <div key={n.id} className={`novedad-item ${n.tipo === "bloqueante" ? "novedad-item--bloqueante" : "novedad-item--informativa"}`}>
                  <div className="novedad-item__header">
                    <span className="novedad-item__tipo">
                      {n.tipo === "bloqueante" ? "🚨 Bloqueante" : "📝 Informativa"}
                    </span>
                    <span className="novedad-item__meta">
                      {n.empleado_nombre} · {formatDateShort(n.creado_en)}
                    </span>
                  </div>
                  <p className="novedad-item__desc">{n.descripcion}</p>
                  {n.foto && <img src={n.foto} alt="novedad" className="novedad-item__foto" />}

                  {n.respuesta_admin ? (
                    <div className="novedad-item__respuesta">
                      <p className="novedad-item__respuesta-label">✅ Respuesta del admin:</p>
                      <p className="novedad-item__respuesta-texto">{n.respuesta_admin}</p>
                      <span className="novedad-item__respuesta-meta">{n.respondido_por_nombre} · {formatDateShort(n.respondido_en)}</span>
                    </div>
                  ) : (
                    <div className="novedad-item__reply">
                      <input
                        className="novedad-item__reply-input"
                        placeholder="Escribí tu respuesta al empleado..."
                        value={respuestas[n.id] || ""}
                        onChange={(e) => setRespuestas((prev) => ({ ...prev, [n.id]: e.target.value }))}
                      />
                      <button
                        className="novedad-item__reply-btn"
                        onClick={() => handleResponderNovedad(n.id)}
                        disabled={!respuestas[n.id]?.trim()}
                      >
                        Responder
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel de asignación (solo admin) */}
        {isAdmin && (
          <div className="report-detail__asignacion">
            <h2 className="report-detail__comments-title">Asignación de empleado</h2>

            {/* Empleado asignado actual */}
            {asignaciones.length > 0 ? (
              <div className="asignacion-actual">
                {asignaciones.map((a) => (
                  <div key={a.id} className="asignacion-actual__item">
                    <div className="asignacion-actual__avatar">{a.empleado_avatar}</div>
                    <div>
                      <p className="asignacion-actual__nombre">{a.empleado_nombre}</p>
                      <p className="asignacion-actual__fecha">Asignado el {formatDateShort(a.asignado_en)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="report-detail__no-comments">Sin empleado asignado aún.</p>
            )}

            {/* Selector para asignar/reasignar */}
            {report.status !== "resuelto" && (
              <div className="asignacion-form">
                <select
                  className="asignacion-form__select"
                  value={empleadoSeleccionado}
                  onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                >
                  <option value="">Seleccioná un empleado...</option>
                  {empleados.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} (@{e.username})</option>
                  ))}
                </select>
                <button
                  className="asignacion-form__btn"
                  onClick={handleAsignar}
                  disabled={!empleadoSeleccionado || loadingAsignar}
                >
                  {asignaciones.length > 0 ? "Reasignar" : "Asignar"}
                </button>
              </div>
            )}

            {/* Validación de cierre */}
            {report.estadoInterno === "pendiente_validacion" && (
              <div className="asignacion-validacion">
                <p className="asignacion-validacion__aviso">
                  ⚠️ El empleado propuso cerrar este reporte. Revisá la foto de resolución y validá o rechazá el cierre.
                </p>
                <div className="asignacion-validacion__actions">
                  <button className="asignacion-validacion__btn--validar" onClick={handleValidarCierre}>
                    ✅ Validar cierre
                  </button>
                  <div className="asignacion-validacion__rechazo">
                    <input
                      className="asignacion-validacion__input"
                      placeholder="Motivo del rechazo (opcional)"
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                    />
                    <button className="asignacion-validacion__btn--rechazar" onClick={handleRechazarCierre}>
                      ❌ Rechazar cierre
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección de comentarios */}
        <div className="report-detail__comments">
          <h2 className="report-detail__comments-title">
            Comentarios
            <span className="report-detail__comments-count">{report.comments?.length ?? 0}</span>
          </h2>

          {currentUser && (
            <form className="report-detail__comment-form" onSubmit={handleAddComment}>
              <div className="report-detail__comment-input-row">
                <div className="report-detail__comment-avatar">
                  {currentUser.avatar}
                </div>
                <input
                  className="report-detail__comment-input"
                  placeholder="Escribí un comentario..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={400}
                />
                <button
                  className="report-detail__comment-submit"
                  type="submit"
                  disabled={!commentText.trim()}
                >
                  Enviar
                </button>
              </div>
            </form>
          )}

          <div className="report-detail__comment-list">
            {(!report.comments || report.comments.length === 0) ? (
              <p className="report-detail__no-comments">Todavía no hay comentarios. ¡Sé el primero!</p>
            ) : (
              report.comments.map((comment) => (
                <div key={comment.id} className={`comment ${comment.esOficial ? "comment--oficial" : ""}`}>
                  <div className={`comment__avatar ${comment.esOficial ? "comment__avatar--oficial" : ""}`}>
                    {comment.authorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="comment__body">
                    <div className="comment__header">
                      <span className="comment__author">{comment.authorName}</span>
                      {comment.esOficial && (
                        <span className="comment__badge-oficial">
                          🏛️ Respuesta oficial
                        </span>
                      )}
                      <span className="comment__date">{formatDateShort(comment.createdAt)}</span>
                    </div>
                    <p className="comment__text">{comment.text}</p>
                  </div>
                  {(currentUser?.id === comment.authorId || isAdmin) && (
                    <button
                      className="comment__delete"
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Eliminar comentario"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
